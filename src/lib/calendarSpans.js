/** Faixas de dia todo na semana: dias seguidos do mesmo bloco ficam numa barra. */

function groupKey(ev) {
  var stamp = ev && ev.updated ? String(ev.updated) : (ev && ev.id ? String(ev.id) : "");
  return [
    (ev && ev.title ? String(ev.title) : "").trim(),
    (ev && ev.color) || "",
    (ev && ev.notes ? String(ev.notes) : "").trim(),
    stamp,
  ].join("\u0001");
}

/**
 * weekDays: chaves YYYY-MM-DD de segunda a domingo.
 * eventsByDay: { [dayKey]: events[] }.
 * Dias consecutivos com o mesmo título, cor, notas e instante de criação
 * (cópias feitas de uma vez no formulário) fundem-se. Dias intercalados ficam à parte.
 */
export function layoutAllDaySpans(weekDays, eventsByDay) {
  var days = weekDays || [];
  var groups = {};
  days.forEach(function(day, index) {
    var list = ((eventsByDay || {})[day] || []).filter(function(ev) { return ev && ev.allDay; });
    list.forEach(function(ev) {
      var key = groupKey(ev);
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ev: ev, index: index, day: day });
    });
  });

  var placed = [];
  Object.keys(groups).forEach(function(key) {
    var items = groups[key].slice().sort(function(a, b) {
      if (a.index !== b.index) return a.index - b.index;
      return String(a.ev.id || "").localeCompare(String(b.ev.id || ""));
    });
    var run = [];
    function flush() {
      if (!run.length) return;
      placed.push({
        id: key + ":" + run[0].index + ":" + (run[0].ev.id || ""),
        start: run[0].index,
        end: run[run.length - 1].index,
        dayKey: run[0].day,
        ev: run[0].ev,
        ids: run.map(function(item) { return item.ev.id; }),
      });
      run = [];
    }
    items.forEach(function(item) {
      if (!run.length) {
        run = [item];
        return;
      }
      var prev = run[run.length - 1];
      if (item.index === prev.index + 1) run.push(item);
      else {
        flush();
        run = [item];
      }
    });
    flush();
  });

  placed.sort(function(a, b) {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  var laneEnd = [];
  placed.forEach(function(span) {
    var lane = 0;
    while (laneEnd[lane] != null && laneEnd[lane] >= span.start) lane += 1;
    laneEnd[lane] = span.end;
    span.lane = lane;
  });

  return { spans: placed, lanes: Math.max(1, laneEnd.length) };
}
