import { useEffect, useMemo, useState } from "react";
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
  var balanceS = useState({ income: 0, expense: 0, loading: true });
  var balance = balanceS[0], setBalance = balanceS[1];

  useEffect(function() {
    Promise.all([financeStore.loadExpenses(), incomeStore.loadIncomes()]).then(function(res) {
      var expenses = res[0] || [];
      var incomes = res[1] || [];
      var expenseTotal = expenses.reduce(function(s, r) { return s + (Number(r.amount) || 0); }, 0);
      var incomeTotal = incomes.reduce(function(s, r) { return s + (Number(r.amount) || 0); }, 0);
      setBalance({ income: incomeTotal, expense: expenseTotal, loading: false });
    }).catch(function() {
      setBalance({ income: 0, expense: 0, loading: false });
    });
  }, [tab]);

  var saldo = useMemo(function() {
    return balance.income - balance.expense;
  }, [balance]);

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
        <div style={{
          marginBottom: 22,
          padding: isMobile ? "18px 16px" : "22px 24px",
          borderRadius: 18,
          border: "1px solid " + (saldo >= 0 ? "rgba(0,255,200,0.35)" : "rgba(255,107,53,0.35)"),
          background: saldo >= 0
            ? "linear-gradient(145deg, rgba(0,255,200,0.12), rgba(0,255,200,0.03))"
            : "linear-gradient(145deg, rgba(255,107,53,0.14), rgba(255,61,90,0.04))",
          boxShadow: saldo >= 0 ? "0 12px 40px rgba(0,255,200,0.12)" : "0 12px 40px rgba(255,107,53,0.1)",
        }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Saldo Atual</p>
          <p style={{
            margin: "8px 0 0",
            fontSize: "clamp(28px, 6vw, 40px)",
            fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 600,
            color: balance.loading ? "rgba(255,255,255,0.3)" : (saldo >= 0 ? "#00FFC8" : "#FF6B35"),
            textShadow: balance.loading ? "none" : (saldo >= 0 ? "0 0 24px rgba(0,255,200,0.35)" : "0 0 20px rgba(255,107,53,0.25)"),
          }}>
            {balance.loading ? "…" : saldo.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
          </p>
          {!balance.loading && (
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" }}>
              Recursos {balance.income.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} − Gastos {balance.expense.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
            </p>
          )}
        </div>
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
