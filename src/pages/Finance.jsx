import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as financeStore from "../lib/financeStore";
import * as incomeStore from "../lib/incomeStore";
import FinanceLedger from "../components/FinanceLedger";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";

var EXPENSE_ACCENT = "#38BDF8";
var INCOME_ACCENT = "#34D399";

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
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--header-bg)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border-subtle)", padding: isMobile ? "12px" : "14px 20px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={function() { navigate("/"); }} style={backBtn()}>← Hub</button>
            <h1 style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: accent, margin: 0 }}>Financeiro</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={function() { setTab("expense"); }} style={tabBtn(tab === "expense", EXPENSE_ACCENT)}>Gastos</button>
            <button onClick={function() { setTab("income"); }} style={tabBtn(tab === "income", INCOME_ACCENT)}>Recursos</button>
          </div>
        </div>
      </header>
      <main className="mod-main" data-scrollable style={{ maxWidth: 920, margin: "0 auto", padding: isMobile ? "14px 12px 80px" : "22px 20px" }}>
        <FinanceLedger
          key={tab}
          store={tab === "income" ? incomeAdapter : expenseAdapter}
          accent={accent}
          isMobile={isMobile}
          label={tab === "income" ? "Registar entrada" : "Registar gasto"}
          loader={<PageLoader accent={accent} lines={4} />}
        />
      </main>
    </div>
  );
}

function tabBtn(active, color) {
  return {
    background: active ? color + "18" : "rgba(255,255,255,0.03)",
    border: "1px solid " + (active ? color + "45" : "rgba(255,255,255,0.08)"),
    borderRadius: 10,
    color: active ? color : "rgba(255,255,255,0.45)",
    padding: "7px 14px",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: 11,
  };
}
function backBtn() {
  return { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.45)", padding: "7px 12px", cursor: "pointer" };
}
