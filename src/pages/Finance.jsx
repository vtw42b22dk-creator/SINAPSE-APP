import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as financeStore from "../lib/financeStore";
import * as incomeStore from "../lib/incomeStore";
import FinanceLedger from "../components/FinanceLedger";
import { PageLoader } from "../components/PageLoader";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";
import {
  financeStats,
  monthKeyFromDate,
  sequenceLabel,
  shiftMonthKey,
} from "../lib/financeSequences";

var MODULE_ACCENT = moduleColor("finance");
var EXPENSE_ACCENT = "#C08C8C";
var INCOME_ACCENT = "#8FB39B";

var FIN_CSS = [
  MODULE_GLOW_CSS,
  ".fin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 2px;",
  "background:transparent;border:none;border-bottom:1px solid currentColor;color:var(--fin-fg,#A0A0A8);",
  "cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4px}",
  ".fin-btn:hover{color:#EDEDEF}",
  ".fin-lbl{margin:0;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76}",
  ".fin-num{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}",
  ".fin-seq{width:100%;text-align:left;padding:14px 0;border:none;border-bottom:1px solid rgba(255,255,255,.08);background:none;color:#A0A0A8;cursor:pointer}",
  ".fin-seq.on{color:#EDEDEF;border-bottom-color:rgba(255,255,255,.28)}",
  ".fin-seq h3{margin:0;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:.4px;text-transform:uppercase}",
  ".fin-seq p{margin:6px 0 0;font-size:12px;color:#6E6E76}",
  ".fin-line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px}",
  ".fin-line:last-child{border-bottom:none}",
  "@media(max-width:719px){.fin-btn{min-height:44px;font-size:12px}.fin-seq{min-height:72px}}",
].join("");

function eur(v) {
  return (Number(v) || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

var expenseAdapter = {
  loadCategories: financeStore.loadCategoriesLocal,
  saveCategories: financeStore.saveCategories,
  deleteCategory: financeStore.deleteCategory,
  loadRows: financeStore.loadExpenses,
  saveRows: financeStore.saveExpenses,
  deleteRow: financeStore.deleteExpense,
  pullCategories: financeStore.pullCategories,
  pullRows: financeStore.pullExpenses,
  newRow: financeStore.newExpense,
  newCategory: financeStore.newCategory,
  monthTotal: financeStore.monthTotal,
  todayKey: financeStore.todayKey,
};

var incomeAdapter = {
  loadCategories: incomeStore.loadCategoriesLocal,
  saveCategories: incomeStore.saveCategories,
  deleteCategory: incomeStore.deleteCategory,
  loadRows: incomeStore.loadIncomes,
  saveRows: incomeStore.saveIncomes,
  deleteRow: incomeStore.deleteIncome,
  pullCategories: incomeStore.pullCategories,
  pullRows: incomeStore.pullIncomes,
  newRow: incomeStore.newIncome,
  newCategory: incomeStore.newCategory,
  monthTotal: incomeStore.monthTotal,
  todayKey: financeStore.todayKey,
};

export default function Finance() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var viewS = useState("move");
  var view = viewS[0], setView = viewS[1];
  var seqS = useState("geral");
  var seq = seqS[0], setSeq = seqS[1];
  var tabS = useState("expense");
  var tab = tabS[0], setTab = tabS[1];
  var monthS = useState(monthKeyFromDate());
  var month = monthS[0], setMonth = monthS[1];
  var dataS = useState({ expenses: [], incomes: [], loading: true });
  var data = dataS[0], setData = dataS[1];
  var tickS = useState(0);
  var tick = tickS[0], setTick = tickS[1];

  var refreshData = useCallback(function() { setTick(function(t) { return t + 1; }); }, []);

  useEffect(function() {
    var alive = true;
    Promise.all([financeStore.loadExpenses(), incomeStore.loadIncomes()]).then(function(res) {
      if (!alive) return;
      setData({ expenses: res[0] || [], incomes: res[1] || [], loading: false });
    }).catch(function() {
      if (!alive) return;
      setData({ expenses: [], incomes: [], loading: false });
    });
    return function() { alive = false; };
  }, [tick]);

  useEffect(function() {
    function onFocus() { refreshData(); }
    window.addEventListener("focus", onFocus);
    return function() { window.removeEventListener("focus", onFocus); };
  }, [refreshData]);

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  var stats = useMemo(function() {
    return financeStats(data.expenses, data.incomes, month);
  }, [data, month]);

  var accent = tab === "income" ? INCOME_ACCENT : EXPENSE_ACCENT;
  var bg = pageBg();
  var text = pageText();
  var saldo = stats.saldo;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'IBM Plex Sans',sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{MODULE_ENTRY_CSS + HUB_BACK_CSS + FIN_CSS}</style>
      <div className="mod-glow" style={{ top: -90, right: "6%", background: moduleGlow(MODULE_ACCENT) }} aria-hidden="true" />
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0A0B", borderBottom: "1px solid var(--border-subtle)", padding: isMobile ? "12px" : "14px 20px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HubBack />
            <h1 className="mod-h1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: isMobile ? 18 : 16, fontWeight: 500, letterSpacing: 0.2, color: MODULE_ACCENT, margin: 0 }}>Financeiro</h1>
          </div>
          <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto", flexWrap: "wrap" }}>
            <button className="fin-btn" onClick={function() { setView("move"); }} style={Object.assign({}, tabBtn(view === "move", MODULE_ACCENT), isMobile ? { flex: 1 } : null)}>Movimentos</button>
            <button className="fin-btn" onClick={function() { setView("report"); }} style={Object.assign({}, tabBtn(view === "report", MODULE_ACCENT), isMobile ? { flex: 1 } : null)}>Relatório</button>
            <button className="fin-btn" onClick={function() { navigate("/quick"); }} style={Object.assign({}, tabBtn(false, MODULE_ACCENT), isMobile ? { flex: 1 } : null)}>Atalhos</button>
          </div>
        </div>
      </header>

      <main className="mod-main" data-scrollable style={{ maxWidth: 920, margin: "0 auto", padding: isMobile ? "16px 12px 88px" : "24px 20px 56px" }}>
        <div style={{ marginBottom: 28, padding: "4px 0 24px", borderBottom: "1px solid " + (saldo >= 0 ? "rgba(255,255,255,0.08)" : "rgba(192,140,140,0.35)") }}>
          <p className="fin-lbl">Saldo vivo</p>
          <p className="fin-num" style={{
            margin: "10px 0 0",
            fontSize: "clamp(34px, 8vw, 52px)",
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: data.loading ? "#6E6E76" : (saldo >= 0 ? "#EDEDEF" : "#C08C8C"),
          }}>
            {data.loading ? "…" : eur(saldo)}
          </p>
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "#6E6E76", maxWidth: 46ch }}>
            Nunca recomeça. Tudo o que entra e sai, para sempre — organizado em sequências.
          </p>
          {!data.loading && (
            <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span className="fin-num" style={{ fontSize: 12, color: INCOME_ACCENT }}>+{eur(stats.earned)}</span>
              <span className="fin-num" style={{ fontSize: 12, color: EXPENSE_ACCENT }}>−{eur(stats.spent)}</span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 0 : 28, marginBottom: 28 }}>
          {(stats.sequences || []).map(function(s) {
            var on = seq === s.id;
            return (
              <button key={s.id} type="button" className={on ? "fin-seq on" : "fin-seq"} onClick={function() { setSeq(s.id); setView("move"); }}>
                <h3>{s.name}</h3>
                <p>{s.hint}</p>
                <p className="fin-num" style={{ marginTop: 10, fontSize: 20, fontWeight: 600, color: s.net >= 0 ? "#EDEDEF" : EXPENSE_ACCENT }}>{eur(s.net)}</p>
              </button>
            );
          })}
        </div>

        {view === "move" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <button className="fin-btn" onClick={function() { setTab("expense"); }} style={tabBtn(tab === "expense", EXPENSE_ACCENT)}>Gastos · {sequenceLabel(seq)}</button>
              <button className="fin-btn" onClick={function() { setTab("income"); }} style={tabBtn(tab === "income", INCOME_ACCENT)}>Recursos · {sequenceLabel(seq)}</button>
            </div>
            <FinanceLedger
              key={tab + "-" + seq}
              store={tab === "income" ? incomeAdapter : expenseAdapter}
              kind={tab}
              sequence={seq}
              accent={accent}
              isMobile={isMobile}
              label={tab === "income" ? "Registar recurso" : "Registar gasto"}
              loader={<PageLoader accent={accent} lines={4} />}
              onDataChange={refreshData}
            />
          </div>
        )}

        {view === "report" && (
          <Report stats={stats} month={month} setMonth={setMonth} isMobile={isMobile} />
        )}
      </main>
    </div>
  );
}

function Report(props) {
  var stats = props.stats;
  var month = props.month;
  var setMonth = props.setMonth;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <button type="button" className="fin-btn" onClick={function() { setMonth(shiftMonthKey(month, -1)); }} style={tabBtn(false, "#A0A0A8")}>‹</button>
        <p className="fin-lbl" style={{ margin: 0, color: "#EDEDEF", letterSpacing: 0.8, textTransform: "capitalize" }}>{stats.monthLabel}</p>
        <button type="button" className="fin-btn" onClick={function() { setMonth(shiftMonthKey(month, 1)); }} style={tabBtn(false, "#A0A0A8")}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: props.isMobile ? "1fr" : "1fr 1fr 1fr", gap: 18, marginBottom: 28 }}>
        <div>
          <p className="fin-lbl">Ganhei</p>
          <p className="fin-num" style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 600, color: INCOME_ACCENT }}>{eur(stats.monthEarned)}</p>
        </div>
        <div>
          <p className="fin-lbl">Gastei</p>
          <p className="fin-num" style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 600, color: EXPENSE_ACCENT }}>{eur(stats.monthSpent)}</p>
        </div>
        <div>
          <p className="fin-lbl">Ficou</p>
          <p className="fin-num" style={{ margin: "8px 0 0", fontSize: 26, fontWeight: 600, color: stats.monthNet >= 0 ? "#EDEDEF" : EXPENSE_ACCENT }}>{eur(stats.monthNet)}</p>
        </div>
      </div>

      <p className="fin-lbl" style={{ marginBottom: 8 }}>Por sequência</p>
      {(stats.sequences || []).map(function(s) {
        return (
          <div key={s.id} className="fin-line">
            <span>{s.name}</span>
            <span className="fin-num" style={{ color: "#A0A0A8" }}>
              <span style={{ color: INCOME_ACCENT }}>+{eur(s.monthEarned)}</span>
              {"  "}
              <span style={{ color: EXPENSE_ACCENT }}>−{eur(s.monthSpent)}</span>
            </span>
          </div>
        );
      })}

      <p className="fin-lbl" style={{ margin: "28px 0 8px" }}>Gastos · com o quê</p>
      {(stats.monthExpenseCats || []).length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "#6E6E76" }}>Sem gastos neste mês.</p>
      ) : stats.monthExpenseCats.map(function(c) {
        return (
          <div key={c.name} className="fin-line">
            <span>{c.name}</span>
            <span className="fin-num" style={{ color: EXPENSE_ACCENT }}>{eur(c.total)}</span>
          </div>
        );
      })}

      <p className="fin-lbl" style={{ margin: "28px 0 8px" }}>Recursos · de onde</p>
      {(stats.monthIncomeCats || []).length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "#6E6E76" }}>Sem recursos neste mês.</p>
      ) : stats.monthIncomeCats.map(function(c) {
        return (
          <div key={c.name} className="fin-line">
            <span>{c.name}</span>
            <span className="fin-num" style={{ color: INCOME_ACCENT }}>{eur(c.total)}</span>
          </div>
        );
      })}

      <p className="fin-lbl" style={{ margin: "28px 0 8px" }}>Movimentos do mês</p>
      {!(stats.monthExpenses || []).length && !(stats.monthIncomes || []).length ? (
        <p style={{ margin: 0, fontSize: 13, color: "#6E6E76" }}>Ainda não registaste nada neste mês.</p>
      ) : (
        <div>
          {(stats.monthIncomes || []).map(function(r) {
            return (
              <div key={r.id} className="fin-line">
                <span>
                  <span style={{ color: INCOME_ACCENT, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, marginRight: 8 }}>RECURSO</span>
                  {r.title}
                  <span style={{ color: "#6E6E76", marginLeft: 8 }}>{sequenceLabel(r.sequence)}</span>
                </span>
                <span className="fin-num" style={{ color: INCOME_ACCENT }}>+{eur(r.amount)}</span>
              </div>
            );
          })}
          {(stats.monthExpenses || []).map(function(r) {
            return (
              <div key={r.id} className="fin-line">
                <span>
                  <span style={{ color: EXPENSE_ACCENT, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, marginRight: 8 }}>GASTO</span>
                  {r.title}
                  <span style={{ color: "#6E6E76", marginLeft: 8 }}>{sequenceLabel(r.sequence)}</span>
                </span>
                <span className="fin-num" style={{ color: EXPENSE_ACCENT }}>−{eur(r.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function tabBtn(active, color) {
  return {
    "--fin-fg": active ? color : "#A0A0A8",
    borderBottom: active ? "1px solid " + color : "1px solid rgba(255,255,255,0.12)",
  };
}
