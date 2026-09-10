import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";
import { FINANCE_SEQUENCES, sequenceLabel } from "../lib/financeSequences";
import {
  applyQuickCapture,
  canAutoSave,
  financeCaptureUrl,
  parseAmount,
  parseQuickSearch,
  quickBaseUrl,
} from "../lib/quickCapture";

var ACCENT = moduleColor("finance");

var CSS = [
  MODULE_GLOW_CSS,
  ".qa-kicker{margin:0 0 8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76}",
  ".qa-h{margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(22px,5vw,32px);font-weight:500;letter-spacing:-.03em;line-height:1.15}",
  ".qa-lead{margin:10px 0 0;font-size:14px;line-height:1.55;color:#A0A0A8;max-width:46ch}",
  ".qa-choice{display:flex;flex-direction:column;gap:10px;margin:22px 0 0}",
  ".qa-pick{min-height:64px;padding:16px 18px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#EDEDEF;text-align:left;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.6px}",
  ".qa-pick small{display:block;margin-top:6px;font-family:'IBM Plex Sans',sans-serif;font-size:12px;letter-spacing:0;color:#6E6E76}",
  ".qa-in{width:100%;box-sizing:border-box;min-height:52px;padding:12px 0;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.14);color:#EDEDEF;outline:none;font-size:18px;font-family:'IBM Plex Sans',sans-serif}",
  ".qa-in:focus{border-bottom-color:rgba(255,255,255,.4)}",
  ".qa-go{margin-top:18px;min-height:48px;padding:0 18px;border:1px solid rgba(255,255,255,.16);background:#1A1A1D;color:#EDEDEF;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.4px}",
  ".qa-ghost{min-height:44px;padding:0 4px;border:none;border-bottom:1px solid rgba(255,255,255,.2);background:none;color:#A0A0A8;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px}",
  ".qa-ok{margin:0;font-size:15px;line-height:1.5;color:#8FB39B}",
  ".qa-err{margin:8px 0 0;font-size:13px;color:#C08C8C;font-family:'JetBrains Mono',monospace}",
  ".qa-card{margin:32px 0 0;padding:22px 0 0;border-top:1px solid rgba(255,255,255,.08)}",
  ".qa-ol{margin:12px 0 0;padding:0 0 0 18px;color:#A0A0A8;font-size:14px;line-height:1.65}",
  ".qa-ol li{margin:0 0 10px}",
  ".qa-url{margin:10px 0 0;padding:12px 14px;background:#141416;border:1px solid rgba(255,255,255,.08);color:#EDEDEF;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5;word-break:break-all}",
  ".qa-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;align-items:center}",
  ".qa-step{margin:0 0 6px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#6E6E76}",
].join("");

function eur(n) {
  if (!isFinite(n)) return "";
  return n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return Promise.reject();
}

export default function QuickAdd() {
  var loc = useLocation();
  var navigate = useNavigate();
  var parsed = useMemo(function() { return parseQuickSearch(loc.search); }, [loc.search]);
  var stepS = useState(1);
  var step = stepS[0], setStep = stepS[1];
  var kindS = useState(parsed.kind || "");
  var kind = kindS[0], setKind = kindS[1];
  var seqS = useState(parsed.sequence || "");
  var seq = seqS[0], setSeq = seqS[1];
  var titleS = useState(parsed.title || "");
  var title = titleS[0], setTitle = titleS[1];
  var amountS = useState(isFinite(parsed.amount) ? String(parsed.amount) : "");
  var amount = amountS[0], setAmount = amountS[1];
  var statusS = useState(canAutoSave(parsed) ? "saving" : "idle");
  var status = statusS[0], setStatus = statusS[1];
  var resultS = useState(null);
  var result = resultS[0], setResult = resultS[1];
  var copiedS = useState(false);
  var copied = copiedS[0], setCopied = copiedS[1];
  var bg = pageBg();
  var text = pageText();

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

  function saveNow(next) {
    setStatus("saving");
    applyQuickCapture(next).then(function(res) {
      setResult(res);
      setStatus(res.ok ? "ok" : "err");
      if (res.ok) {
        setTitle("");
        setAmount("");
      }
    }).catch(function() {
      setResult({ ok: false, error: "Não foi possível guardar." });
      setStatus("err");
    });
  }

  function submitAmount() {
    var val = parseAmount(amount);
    if (!title.trim()) { setResult({ ok: false, error: "Escreve o título." }); setStatus("err"); return; }
    if (!isFinite(val) || val < 0) { setResult({ ok: false, error: "Indica o valor." }); setStatus("err"); return; }
    saveNow({ kind: kind, sequence: seq, title: title.trim(), amount: val, day: parsed.day, notes: parsed.notes, category: parsed.category });
  }

  function resetWizard() {
    setStatus("idle");
    setResult(null);
    setKind("");
    setSeq("");
    setTitle("");
    setAmount("");
    setStep(1);
  }

  function copyTemplate() {
    copyText(quickBaseUrl() + "?kind=KIND&seq=SEQ&title=TITLE&amount=AMOUNT").then(function() {
      setCopied(true);
      setTimeout(function() { setCopied(false); }, 1800);
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
        <p className="qa-lead">Recurso ou gasto, depois a sequência, o título e o valor. Quatro toques — e entra no saldo vivo.</p>

        {status === "ok" && result && (
          <div className="qa-card" style={{ borderTop: "none", paddingTop: 8 }}>
            <p className="qa-ok">
              {result.duplicate ? "Já estava guardado · " : "Adicionado · "}
              {result.title}
              {isFinite(result.amount) ? " · " + eur(result.amount) : ""}
              {" → "}{result.label}
              {result.sequenceLabel ? " · " + result.sequenceLabel : ""}
            </p>
            <div className="qa-row">
              <button type="button" className="qa-go" onClick={function() { navigate("/finance"); }}>Abrir Financeiro</button>
              <button type="button" className="qa-ghost" onClick={resetWizard}>Adicionar outro</button>
            </div>
          </div>
        )}

        {status !== "ok" && (
          <div>
            {step === 1 && (
              <div>
                <p className="qa-step">1 / 4</p>
                <h2 className="qa-h" style={{ fontSize: 22 }}>O que é?</h2>
                <div className="qa-choice">
                  <button type="button" className="qa-pick" onClick={function() { setKind("income"); setStep(2); }}>
                    RECURSO
                    <small>Dinheiro a entrar</small>
                  </button>
                  <button type="button" className="qa-pick" onClick={function() { setKind("expense"); setStep(2); }}>
                    GASTOS
                    <small>Dinheiro a sair</small>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="qa-step">2 / 4 · {kind === "income" ? "Recurso" : "Gastos"}</p>
                <h2 className="qa-h" style={{ fontSize: 22 }}>Onde entra?</h2>
                <div className="qa-choice">
                  {FINANCE_SEQUENCES.map(function(s) {
                    return (
                      <button key={s.id} type="button" className="qa-pick" onClick={function() { setSeq(s.id); setStep(3); }}>
                        {s.name.toUpperCase()}
                        <small>{s.hint}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="qa-row">
                  <button type="button" className="qa-ghost" onClick={function() { setStep(1); }}>Voltar</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="qa-step">3 / 4 · {sequenceLabel(seq)}</p>
                <h2 className="qa-h" style={{ fontSize: 22 }}>Título</h2>
                <input className="qa-in" value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="Café, Vinted, almoço…" autoFocus
                  onKeyDown={function(e) { if (e.key === "Enter" && title.trim()) setStep(4); }} />
                <button type="button" className="qa-go" onClick={function() { if (title.trim()) setStep(4); }}>Seguinte</button>
                <div className="qa-row">
                  <button type="button" className="qa-ghost" onClick={function() { setStep(2); }}>Voltar</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <p className="qa-step">4 / 4 · {title}</p>
                <h2 className="qa-h" style={{ fontSize: 22 }}>Valor</h2>
                <input className="qa-in" value={amount} onChange={function(e) { setAmount(e.target.value); }} placeholder="12,50" inputMode="decimal" autoFocus
                  style={{ fontFamily: "'JetBrains Mono',monospace" }}
                  onKeyDown={function(e) { if (e.key === "Enter") submitAmount(); }} />
                {status === "err" && result && result.error ? <p className="qa-err">{result.error}</p> : null}
                <button type="button" className="qa-go" disabled={status === "saving"} onClick={submitAmount}>
                  {status === "saving" ? "A guardar…" : "Guardar"}
                </button>
                <div className="qa-row">
                  <button type="button" className="qa-ghost" onClick={function() { setStep(3); }}>Voltar</button>
                </div>
              </div>
            )}
          </div>
        )}

        <section className="qa-card">
          <p className="qa-kicker">Configurar no iPhone</p>
          <h2 className="qa-h" style={{ fontSize: 18 }}>Atalho a quatro perguntas</h2>
          <ol className="qa-ol">
            <li>App <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Atalhos</b> → <b style={{ color: "#EDEDEF", fontWeight: 500 }}>+</b>.</li>
            <li><b style={{ color: "#EDEDEF", fontWeight: 500 }}>Escolher de menu</b>: <i>RECURSO</i> e <i>GASTOS</i>.</li>
            <li>Dentro de cada um, outro menu: <i>PROJETO PESSOAL</i> e <i>GERAL</i>.</li>
            <li><b style={{ color: "#EDEDEF", fontWeight: 500 }}>Pedir entrada</b> (Texto) — o título.</li>
            <li><b style={{ color: "#EDEDEF", fontWeight: 500 }}>Pedir entrada</b> (Número) — o valor.</li>
            <li><b style={{ color: "#EDEDEF", fontWeight: 500 }}>URL</b> + <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Abrir URLs</b> com o modelo abaixo. Substitui KIND, SEQ, TITLE e AMOUNT pelas variáveis.</li>
            <li>Opcional: <b style={{ color: "#EDEDEF", fontWeight: 500 }}>Adicionar à Siri</b> — «Gastei» ou «Recebi».</li>
          </ol>
          <p className="qa-url">{quickBaseUrl()}?kind=<span style={{ color: "#8FB39B" }}>income</span>&seq=<span style={{ color: "#C4A57C" }}>projeto</span>&title=<span style={{ color: "#A0A0A8" }}>TITLE</span>&amount=<span style={{ color: "#A0A0A8" }}>AMOUNT</span></p>
          <p className="qa-lead" style={{ marginTop: 12, fontSize: 13 }}>
            KIND é <code>income</code> (recurso) ou <code>expense</code> (gastos). SEQ é <code>projeto</code> ou <code>geral</code>. Exemplo já montado: {financeCaptureUrl("expense", "geral", "café", "4.5")}
          </p>
          <div className="qa-row">
            <button type="button" className="qa-ghost" onClick={copyTemplate}>{copied ? "Copiado" : "Copiar modelo de URL"}</button>
          </div>
          <p className="qa-lead" style={{ marginTop: 16, fontSize: 13 }}>
            Precisas de sessão iniciada neste iPhone. Quando quiseres, pede-me outra vez os passos — deixo-tos iguais a isto.
          </p>
        </section>
      </main>
    </div>
  );
}
