export var FINANCE_SEQUENCES = [
  { id: "geral", name: "Geral", kicker: "vida corrente", hint: "casa, comida, o dia a dia" },
  { id: "projeto", name: "Projeto pessoal", kicker: "o teu projecto", hint: "o que estás a construir" },
];

export function sequenceId(raw) {
  var s = String(raw || "").trim().toLowerCase();
  if (!s) return "geral";
  if (s === "projeto" || s === "projeto-pessoal" || s === "pessoal") return "projeto";
  if (/projeto|pessoal|project/.test(s)) return "projeto";
  if (s === "geral" || /geral|general|dia/.test(s)) return "geral";
  return "geral";
}

export function sequenceMeta(id) {
  var key = sequenceId(id);
  var i;
  for (i = 0; i < FINANCE_SEQUENCES.length; i++) {
    if (FINANCE_SEQUENCES[i].id === key) return FINANCE_SEQUENCES[i];
  }
  return FINANCE_SEQUENCES[0];
}

export function sequenceLabel(id) {
  return sequenceMeta(id).name;
}

export function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

export function monthKeyFromDate(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1);
}

export function monthLabel(monthKey) {
  var p = String(monthKey || "").split("-");
  if (p.length < 2) return "";
  var d = new Date(+p[0], +p[1] - 1, 1);
  return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

export function shiftMonthKey(monthKey, delta) {
  var p = String(monthKey || monthKeyFromDate()).split("-");
  var d = new Date(+p[0], +p[1] - 1 + (delta || 0), 1);
  return monthKeyFromDate(d);
}

export function inMonth(row, monthKey) {
  return !!(row && row.day && monthKey && row.day.indexOf(monthKey) === 0);
}

export function rowAmount(row) {
  return Number(row && row.amount) || 0;
}

export function sumRows(rows, pred) {
  var total = 0;
  (rows || []).forEach(function(r) {
    if (pred && !pred(r)) return;
    total += rowAmount(r);
  });
  return total;
}

export function bySequence(row, seqId) {
  return sequenceId(row && row.sequence) === sequenceId(seqId);
}

export function categoryBreakdown(rows) {
  var map = {};
  (rows || []).forEach(function(e) {
    var cats = e.categories && e.categories.length ? e.categories : [e.category || "Outro"];
    var share = cats.length > 1 ? 1 / cats.length : 1;
    cats.forEach(function(c) {
      var name = c || "Outro";
      map[name] = (map[name] || 0) + rowAmount(e) * share;
    });
  });
  return Object.keys(map).map(function(name) {
    return { name: name, total: map[name] };
  }).sort(function(a, b) { return b.total - a.total; });
}

export function financeStats(expenses, incomes, monthKey) {
  expenses = expenses || [];
  incomes = incomes || [];
  var month = monthKey || monthKeyFromDate();

  function pack(ex, inc) {
    var spent = sumRows(ex);
    var earned = sumRows(inc);
    return { spent: spent, earned: earned, net: earned - spent };
  }

  var all = pack(expenses, incomes);
  var monthEx = expenses.filter(function(r) { return inMonth(r, month); });
  var monthIn = incomes.filter(function(r) { return inMonth(r, month); });
  var monthPack = pack(monthEx, monthIn);

  var sequences = FINANCE_SEQUENCES.map(function(seq) {
    var ex = expenses.filter(function(r) { return bySequence(r, seq.id); });
    var inc = incomes.filter(function(r) { return bySequence(r, seq.id); });
    var forever = pack(ex, inc);
    var mEx = ex.filter(function(r) { return inMonth(r, month); });
    var mIn = inc.filter(function(r) { return inMonth(r, month); });
    return {
      id: seq.id,
      name: seq.name,
      kicker: seq.kicker,
      hint: seq.hint,
      spent: forever.spent,
      earned: forever.earned,
      net: forever.net,
      monthSpent: sumRows(mEx),
      monthEarned: sumRows(mIn),
      monthNet: sumRows(mIn) - sumRows(mEx),
    };
  });

  return {
    month: month,
    monthLabel: monthLabel(month),
    saldo: all.net,
    earned: all.earned,
    spent: all.spent,
    monthEarned: monthPack.earned,
    monthSpent: monthPack.spent,
    monthNet: monthPack.net,
    sequences: sequences,
    monthExpenseCats: categoryBreakdown(monthEx),
    monthIncomeCats: categoryBreakdown(monthIn),
    monthExpenses: monthEx.slice().sort(function(a, b) {
      return String(b.day).localeCompare(String(a.day)) || (b.created || 0) - (a.created || 0);
    }),
    monthIncomes: monthIn.slice().sort(function(a, b) {
      return String(b.day).localeCompare(String(a.day)) || (b.created || 0) - (a.created || 0);
    }),
  };
}
