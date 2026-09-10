import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";
import {
  QUICK_KINDS,
  applyQuickCapture,
  canAutoSave,
  kindMeta,
  parseAmount,
  parseQuickSearch,
  parseShorthand,
  shortcutUrl,
} from "../lib/quickCapture";

var ACCENT = moduleColor("finance");

var CSS = [
  MODULE_GLOW_CSS,
  ".qa-kicker{margin:0 0 8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76}",
  ".qa-h{margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(22px,5vw,32px);font-weight:500;letter-spacing:-.03em;line-height:1.15}",
  ".qa-lead{margin:10px 0 0;font-size:14px;line-height:1.55;color:#A0A0A8;max-width:46ch}",
  ".qa-seg{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 18px}",
  ".qa-chip{min-height:40px;padding:8px 14px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#A0A0A8;border-radius:999px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.3px}",
  ".qa-chip.on{color:#EDEDEF;border-color:rgba(255,255,255,.28)}",
  ".qa-in{width:100%;box-sizing:border-box;min-height:48px;padding:12px 0;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.14);color:#EDEDEF;outline:none;font-size:16px;font-family:'IBM Plex Sans',sans-serif}",
  ".qa-in:focus{border-bottom-color:rgba(255,255,255,.4)}",
  ".qa-go{margin-top:18px;min-height:48px;padding:0 18px;border:1px solid rgba(255,255,255,.16);background:#1A1A1D;color:#EDEDEF;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.4px}",
  ".qa-ghost{min-height:44px;padding:0 4px;border:none;border-bottom:1px solid rgba(255,255,255,.2);background:none;color:#A0A0A8;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px}",
  ".qa-ok{margin:0;font-size:15px;line-height:1.5;color:#8FB39B}",
  ".qa-err{margin:8px 0 0;font-size:13px;color:#C08C8C;font-family:'JetBrains Mono',monospace}",
  ".qa-card{margin:28px 0 0;padding:20px 0 0;border-top:1px solid rgba(255,255,255,.08)}",
  ".qa-ol{margin:12px 0 0;padding:0 0 0 18px;color:#A0A0A8;font-size:14px;line-height:1.65}",
  ".qa-ol li{margin:0 0 8px}",
  ".qa-url{margin:10px 0 0;padding:12px 14px;background:#141416;border:1px solid rgba(255,255,255,.08);color:#EDEDEF;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5;word-break:break-all}",
  ".qa-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;align-items:center}",
  "@media(max-width:719px){.qa-chip,.qa-go{min-height:44px}}",
].join("");

function eur(n) {
  if (!isFinite(n)) return "";
  return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject();
}

export default function QuickAdd() {
  var loc = useLocation();
  var navigate = useNavigate();
  var parsed = useMemo(function() { return parseQuickSearch(loc.search); }, [loc.search]);
  var kindS = useState(parsed.kind || "expense");
  var kind = kindS[0], setKind = kindS[1];
  var draftS = useState(parsed.title || "");
  var draft = draftS[0], setDraft = draftS[1];
  var statusS = useState(canAutoSave(parsed) ? "saving" : "idle");
  var status = statusS[0], setStatus = statusS[1];
  var resultS = useState(null);
  var result = resultS[0], setResult = resultS[1];
  var copiedS = useState("");
  var copied = copiedS[0], setCopied = copiedS[1];
  var bg = pageBg();
  var text = pageText();
  var meta = kindMeta(kind);
  var needsAmount = kind === "expense" || kind === "income";

  useEffect(function() {
    if (parsed.kind) setKind(parsed.kind);
    if (parsed.title || isFinite(parsed.amount)) {
      setDraft(needsAmount && isFinite(parsed.amount) && parsed.title
        ? String(parsed.amount).replace(".", ",") + " " + parsed.title
        : (parsed.title || ""));
    }
  }, [loc.search]);

  useEffect(function() {
    if (!canAutoSave(parsed)) return;
    var cancelled = false;
    setStatus("saving");
    applyQuickCapture(parsed).then(function(res) {
      if (cancelled) return;
      setResult(res);
      setStatus(res.ok ? "ok" : "err");
    }).catch(function() {
      if (cancelled) return;
      setResult({ ok: false, error: "Não foi possível guardar." });
      setStatus("err");
    });
    return function() { cancelled = true; };
  }, [loc.search]);

  function submit() {
    var parsedDraft = needsAmount ? parseShorthand(draft) : { title: draft.trim(), amount: parseAmount(draft) };
    var input = {
      kind: kind,
      title: parsedDraft.title || (needsAmount ? "" : draft.trim()),
      amount: parsedDraft.amount,
      category: parsed.category,
      day: parsed.day,
      notes: parsed.notes,
    };
    setStatus("saving");
    applyQuickCapture(input).then(function(res) {
      setResult(res);
      setStatus(res.ok ? "ok" : "err");
      if (res.ok) setDraft("");
    }).catch(function() {
      setResult({ ok: false, error: "Não foi possível guardar." });
      setStatus("err");
    });
  }

  function copyPrefix(id) {
    copyText(shortcutUrl(id, true)).then(function() {
      setCopied(id);
      setTimeout(function() { setCopied(""); }, 1800);
    }).catch(function() {});
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'IBM Plex Sans',sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{MODULE_ENTRY_CSS + HUB_BACK_CSS + CSS}</style>
      <div className="mod-glow" style={{ top: -90, right: "8%", background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0A0B", borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <HubBack />
        </div>
      </header>
      <main className="mod-main" style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px 88px" }}>
        <p className="qa-kicker">Atalhos iPhone</p>
        <h1 className="qa-h">Captura rápida</h1>
        <p className="qa-lead">
          Adiciona um gasto, recurso, tarefa ou desejo sem abrir o menu. No iPhone, um atalho pergunta e grava sozinho.
        </p>

        {status === "ok" && result && (
          <div className="qa-card" style={{ borderTop: "none", paddingTop: 8 }}>
            <p className="qa-ok">
              {result.duplicate ? "Já estava guardado · " : "Adicionado · "}
              {result.title}
              {isFinite(result.amount) ? " · " + eur(result.amount) : ""}
              {" → "}{result.label}
            </p>
            <div className="qa-row">
              <button type="button" className="qa-go" onClick={function() { navigate(result.dest); }}>Abrir {result.label}</button>
              <button type="button" className="qa-ghost" onClick={function() { setStatus("idle"); setResult(null); }}>Adicionar outro</button>
            </div>
          </div>
        )}

        {status !== "ok" && (
          <div>
            <div className="qa-seg">
              {QUICK_KINDS.map(function(k) {
                return (
                  <button key={k.id} type="button" className={kind === k.id ? "qa-chip on" : "qa-chip"} onClick={function() { setKind(k.id); }}>
                    {k.label}
                  </button>
                );
              })}
            </div>
            <input
              className="qa-in"
              value={draft}
              onChange={function(e) { setDraft(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") submit(); }}
              placeholder={meta.hint}
              autoCapitalize="sentences"
            />
            {status === "err" && result && result.error ? <p className="qa-err">{result.error}</p> : null}
            <button type="button" className="qa-go" disabled={status === "saving"} onClick={submit}>
              {status === "saving" ? "A guardar…" : "Adicionar ao " + meta.label}
            </button>
          </div>
        )}

        <section className="qa-card">
          <p className="qa-kicker">Configurar no iPhone</p>
          <h2 className="qa-h" style={{ fontSize: 18 }}>Atalho «Gastei»</h2>
          <ol className="qa-ol">
            <li>Abre <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Atalhos</b> → <b style={{ color: "#EDEDEF", fontWeight: 500 }}>+</b>.</li>
            <li>Adiciona <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Pedir entrada</b> (Texto). Prompt: <i>Quanto e o quê?</i> — escreves <i>4,50 café</i>.</li>
            <li>Adiciona <b style={{ color: "#EDEDEF", fontWeight: 500 }}>URL</b>. Cola o prefixo abaixo e junta a variável da pergunta (com «Codificar URL»).</li>
            <li>Adiciona <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Abrir URLs</b>.</li>
            <li>Opcional: <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Adicionar à Siri</b> com a frase «Gastei».</li>
          </ol>
          <p className="qa-url">{shortcutUrl("expense", true)}<span style={{ color: "#6E6E76" }}>4,50 café</span></p>
          <div className="qa-row">
            {QUICK_KINDS.map(function(k) {
              return (
                <button key={k.id} type="button" className="qa-ghost" onClick={function() { copyPrefix(k.id); }}>
                  {copied === k.id ? "Copiado" : "Copiar URL · " + k.label}
                </button>
              );
            })}
          </div>
          <p className="qa-lead" style={{ marginTop: 16, fontSize: 13 }}>
            Precisas de estar com sessão iniciada neste iPhone (abre a Sinapse uma vez no Safari ou na app do ecrã inicial). O atalho usa essa sessão e sincroniza com os outros dispositivos.
          </p>
        </section>
      </main>
    </div>
  );
}
