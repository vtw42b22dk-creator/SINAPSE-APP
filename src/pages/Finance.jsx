import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as financeStore from "../lib/financeStore";
import * as incomeStore from "../lib/incomeStore";
import FinanceLedger from "../components/FinanceLedger";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";

var EXPENSE_ACCENT = "#E6E6E9";
var INCOME_ACCENT = "#8FB39B";

var FIN_CSS = [
  ".fin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 2px;",
  "background:transparent;border:none;border-bottom:1px solid currentColor;color:var(--fin-fg,#A0A0A8);",
  "cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4px}",
  ".fin-btn:hover{color:#EDEDEF}",
  ".fin-lbl{margin:0;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76}",
  ".fin-bal{background:transparent}",
  ".fin-num{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}",
  "@media(max-width:719px){.fin-btn{min-height:44px;font-size:12px}}",
].join("");

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
function monthKeyFromDate(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1); }
function monthLabel(monthKey) {
  var p = monthKey.split("-");
  var d = new Date(+p[0], +p[1] - 1, 1);
  return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}
function eur(v) { return (Number(v) || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" }); }

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
  var tabS = useState("expense");
  var tab = tabS[0], setTab = tabS[1];
  var monthS = useState(monthKeyFromDate(new Date()));
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
  }, []);

  // Saldo por mês: cada mês começa do zero (não transita saldo entre meses).
  var stats = useMemo(function() {
    var monthExpense = 0, monthIncome = 0;
    (data.expenses || []).forEach(function(e) {
      if (e.day && e.day.indexOf(month) === 0) monthExpense += Number(e.amount) || 0;
    });
    (data.incomes || []).forEach(function(r) {
      if (r.day && r.day.indexOf(month) === 0) monthIncome += Number(r.amount) || 0;
    });
    var monthNet = monthIncome - monthExpense;
    return {
      monthExpense: monthExpense,
      monthIncome: monthIncome,
      monthNet: monthNet,
      saldo: monthNet, // saldo do mês (sem transitar)
    };
  }, [data, month]);

  var saldo = stats.saldo;

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  var accent = tab === "income" ? INCOME_ACCENT : EXPENSE_ACCENT;
  var bg = pageBg();
  var text = pageText();

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{MODULE_ENTRY_CSS + FIN_CSS}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0A0B", borderBottom: "1px solid var(--border-subtle)", padding: isMobile ? "12px" : "14px 20px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="fin-btn" onClick={function() { navigate("/"); }}>← Hub</button>
            <h1 className="mod-h1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: isMobile ? 18 : 16, fontWeight: 500, letterSpacing: 0.2, color: accent, margin: 0 }}>Financeiro</h1>
          </div>
          <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
            <button className="fin-btn" onClick={function() { setTab("expense"); }} style={Object.assign({}, tabBtn(tab === "expense", EXPENSE_ACCENT), isMobile ? { flex: 1 } : null)}>Gastos</button>
            <button className="fin-btn" onClick={function() { setTab("income"); }} style={Object.assign({}, tabBtn(tab === "income", INCOME_ACCENT), isMobile ? { flex: 1 } : null)}>Recursos</button>
          </div>
        </div>
      </header>
      <main className="mod-main" data-scrollable style={{ maxWidth: 920, margin: "0 auto", padding: isMobile ? "16px 12px 88px" : "24px 20px 56px" }}>
        <div className="fin-bal" style={{
          marginBottom: 32,
          padding: "8px 0 28px",
          borderBottom: "1px solid " + (saldo >= 0 ? "rgba(255,255,255,0.08)" : "rgba(192,140,140,0.35)"),
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p className="fin-lbl">Saldo de</p>
            <span className="fin-num" style={{ fontSize: 11, letterSpacing: 0.4, color: accent, textTransform: "capitalize" }}>{monthLabel(month)}</span>
          </div>
          <p className="fin-num" style={{
            margin: "12px 0 0",
            fontSize: "clamp(32px, 7vw, 46px)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: data.loading ? "#6E6E76" : (saldo >= 0 ? "#EDEDEF" : "#C08C8C"),
          }}>
            {data.loading ? "…" : eur(saldo)}
          </p>
          {!data.loading && (
            <div style={{ margin: "20px 0 0", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "baseline" }}>
                <span className="fin-lbl">Este mês:</span>
                <span className="fin-num" style={{ fontSize: 12, color: "#8FB39B" }}>+{eur(stats.monthIncome)} recursos</span>
                <span className="fin-num" style={{ fontSize: 12, color: "#C08C8C" }}>−{eur(stats.monthExpense)} gastos</span>
              </div>
            </div>
          )}
        </div>
        <FinanceLedger
          key={tab}
          store={tab === "income" ? incomeAdapter : expenseAdapter}
          kind={tab}
          accent={accent}
          isMobile={isMobile}
          label={tab === "income" ? "Registar entrada" : "Registar gasto"}
          loader={<PageLoader accent={accent} lines={4} />}
          month={month}
          onMonthChange={setMonth}
          onDataChange={refreshData}
        />
      </main>
    </div>
  );
}

function tabBtn(active, color) {
  return {
    "--fin-bg": "transparent",
    "--fin-bd": "transparent",
    "--fin-fg": active ? color : "#A0A0A8",
    borderBottom: active ? "1px solid " + color : "1px solid rgba(255,255,255,0.12)",
  };
}
