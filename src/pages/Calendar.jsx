/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as calendarStore from "../lib/calendarStore";

var ACCENT = "#00FFC8";
var SK = "sinapse-calendar-v2";
var WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
var COLORS = ["#00FFC8", "#7B61FF", "#FF3D8A", "#FFB800", "#00AAFF", "#FF6B35"];

function uid() { return "e" + Date.now() + Math.random().toString(36).slice(2, 7); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dateKey(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }
function parseKey(k) {
  var p = k.split("-");
  return { y: +p[0], m: +p[1] - 1, d: +p[2] };
}

function loadEvents() {
  try {
    var raw = localStorage.getItem(SK);
    if (!raw) {
      var old = localStorage.getItem("sinapse-calendar-v1");
      if (old) {
        var parsed = JSON.parse(old);
        Object.keys(parsed).forEach(function(k) {
          parsed[k] = (parsed[k] || []).map(function(ev) {
            return { id: ev.id, title: ev.title, color: ev.color, time: ev.time || null, allDay: !ev.time, notes: "", duration: 60 };
          });
        });
        return parsed;
      }
      return {};
    }
    var data = JSON.parse(raw);
    Object.keys(data).forEach(function(k) {
      data[k] = (data[k] || []).map(function(ev) {
        return Object.assign({}, ev, { duration: ev.duration || 60, notes: ev.notes || "" });
      });
    });
    return data;
  } catch (e) { return {}; }
}
function saveEvents(data) {
  try { localStorage.setItem(SK, JSON.stringify(data)); } catch (e) {}
}
function weekKeys(anchorKey) {
  var p = parseKey(anchorKey);
  var d = new Date(p.y, p.m, p.d);
  var dow = (d.getDay() + 6) % 7;
  var mon = new Date(p.y, p.m, p.d - dow);
  var keys = [];
  for (var i = 0; i < 7; i++) {
    var x = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
    keys.push(dateKey(x.getFullYear(), x.getMonth(), x.getDate()));
  }
  return keys;
}
function sortEvents(list) {
  return list.slice().sort(function(a, b) {
    if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
    return (a.time || "").localeCompare(b.time || "");
  });
}
function formatEventTime(ev) {
  if (ev.allDay) return "Dia todo";
  return eventTimeLabel(ev);
}

var HOUR_H = 44;
var SNAP_MIN = 15;
var HOURS = 24;
var SCROLL_START_HOUR = 6;

var EVT_TRUNC = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  minWidth: 0,
  width: "100%",
};

function EventTitleLine(props) {
  var label = props.title || "";
  return (
    <span title={label} style={Object.assign({}, EVT_TRUNC, props.style || {})}>
      {label}
    </span>
  );
}

function timeToMin(t) {
  if (!t) return 0;
  var p = t.split(":");
  return (+p[0]) * 60 + (+p[1] || 0);
}
function minToTime(m) {
  m = Math.max(0, Math.min(HOURS * 60 - SNAP_MIN, m));
  var h = Math.floor(m / 60), mi = m % 60;
  return pad(h) + ":" + pad(mi);
}
function snapMin(m) {
  return Math.round(m / SNAP_MIN) * SNAP_MIN;
}
function evDuration(ev) {
  return ev.duration || 60;
}
function durationLabel(minutes) {
  minutes = Math.max(SNAP_MIN, minutes || 60);
  var h = Math.floor(minutes / 60), m = minutes % 60;
  if (!h) return m + " min";
  if (!m) return h + "h";
  return h + "h" + pad(m);
}
function timeFromMinutes(m) {
  m = ((m % (HOURS * 60)) + HOURS * 60) % (HOURS * 60);
  return pad(Math.floor(m / 60)) + ":" + pad(m % 60);
}
function addMinutes(t, minutes) {
  return timeFromMinutes(timeToMin(t) + (minutes || 0));
}
function eventEndTime(ev) {
  if (ev.allDay || !ev.time) return "";
  return addMinutes(ev.time, evDuration(ev));
}
function eventTimeLabel(ev) {
  if (!ev.time) return "—";
  var dur = evDuration(ev);
  return ev.time + "-" + eventEndTime(ev) + " · " + durationLabel(dur);
}
function eventTooltip(ev) {
  var title = (ev.title || "").trim() || "Sem título";
  if (ev.allDay || !ev.time) return title;
  return title + " [" + ev.time + " - " + eventEndTime(ev) + "]";
}

function timeUntilLabel(dayKey, ev) {
  var p = parseKey(dayKey);
  var now = new Date();
  var start;
  if (ev.allDay || !ev.time) {
    start = new Date(p.y, p.m, p.d, 0, 0, 0);
  } else {
    var parts = (ev.time || "09:00").split(":");
    start = new Date(p.y, p.m, p.d, +parts[0], +parts[1] || 0, 0);
  }
  var end;
  if (ev.allDay || !ev.time) {
    end = new Date(p.y, p.m, p.d + 1, 0, 0, 0);
  } else {
    var ep = eventEndTime(ev).split(":");
    end = new Date(p.y, p.m, p.d, +ep[0], +ep[1] || 0, 0);
  }
  var ms = start - now;
  if (ms > 0) {
    var mins = Math.floor(ms / 60000);
    if (mins < 60) return "Faltam " + mins + " min";
    var hrs = Math.floor(mins / 60);
    var rm = mins % 60;
    if (hrs < 48) return "Faltam " + hrs + "h" + (rm ? " " + rm + "min" : "");
    var days = Math.floor(hrs / 24);
    return "Faltam " + days + " dia" + (days !== 1 ? "s" : "");
  }
  if (now < end) return "A decorrer agora";
  return "Já passou";
}
function durationFromTimes(start, end) {
  var s = timeToMin(start || "09:00");
  var e = timeToMin(end || addMinutes(start || "09:00", 60));
  if (e <= s) e += HOURS * 60;
  return Math.max(SNAP_MIN, Math.min(HOURS * 60, snapMin(e - s)));
}
function layoutSegments(segments) {
  var sorted = segments.slice().sort(function(a, b) {
    return a.segmentStart - b.segmentStart || (b.segmentDuration - a.segmentDuration);
  });
  var i = 0;
  while (i < sorted.length) {
    var group = [];
    var maxEnd = sorted[i].segmentStart + sorted[i].segmentDuration;
    while (i < sorted.length && sorted[i].segmentStart < maxEnd) {
      group.push(sorted[i]);
      maxEnd = Math.max(maxEnd, sorted[i].segmentStart + sorted[i].segmentDuration);
      i++;
    }
    var colEnds = [];
    group.forEach(function(seg) {
      var placed = -1;
      for (var c = 0; c < colEnds.length; c++) {
        if (colEnds[c] <= seg.segmentStart) { placed = c; break; }
      }
      if (placed < 0) placed = colEnds.length;
      colEnds[placed] = seg.segmentStart + seg.segmentDuration;
      seg.column = placed;
      seg.columns = colEnds.length;
    });
    var cols = Math.max(1, colEnds.length);
    group.forEach(function(seg) { seg.columns = cols; });
  }
  return sorted;
}

function WeekTimeGrid(props) {
  var gridRef = useRef(null);
  var scrollRef = useRef(null);
  var dragRef = useRef(null);
  var previewS = useState(null);
  var preview = previewS[0], setPreview = previewS[1];
  var createRef = useRef(null);
  var createS = useState(null);
  var createPreview = createS[0], setCreatePreview = createS[1];

  var allDayByDay = useMemo(function() {
    return props.weekDays.map(function(k) {
      return sortEvents((props.events[k] || []).filter(function(ev) { return ev.allDay; }));
    });
  }, [props.weekDays, props.events]);

  function timedOnDay(k, dayIdx) {
    var dayStart = dayIdx * 1440;
    var out = [];
    props.weekDays.forEach(function(sourceKey, sourceIdx) {
      (props.events[sourceKey] || []).forEach(function(ev) {
        if (ev.allDay || !ev.time) return;
        var start = sourceIdx * 1440 + timeToMin(ev.time);
        var end = start + evDuration(ev);
        var segStart = Math.max(start, dayStart);
        var segEnd = Math.min(end, dayStart + 1440);
        if (segEnd <= segStart) return;
        out.push({
          ev: ev,
          sourceKey: sourceKey,
          segmentStart: segStart - dayStart,
          segmentDuration: segEnd - segStart,
          continuesBefore: segStart > start,
          continuesAfter: segEnd < end,
        });
      });
    });
    return layoutSegments(out);
  }

  function posFromPointer(clientX, clientY, duration) {
    var el = gridRef.current;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var x = clientX - r.left;
    var y = clientY - r.top;
    var colW = r.width / 7;
    var dayIdx = Math.floor(x / colW);
    if (dayIdx < 0 || dayIdx > 6) return null;
    var minutes = snapMin(Math.floor(y / HOUR_H) * 60 + Math.round(((y % HOUR_H) / HOUR_H) * 60));
    minutes = Math.max(0, Math.min(HOURS * 60 - (duration || 15), minutes));
    return { dayIdx: dayIdx, minutes: minutes, key: props.weekDays[dayIdx] };
  }

  function onBlockPointerDown(e, ev, dayKey) {
    if (props.readOnly) return;
    e.stopPropagation();
    if (!props.isMobile) e.preventDefault();
    if (props.isMobile) {
      var tapStartX = e.clientX, tapStartY = e.clientY, tapMoved = false;
      function onTapMove(pe) {
        if (Math.abs(pe.clientX - tapStartX) + Math.abs(pe.clientY - tapStartY) > 12) tapMoved = true;
      }
      function onTapUp() {
        window.removeEventListener("pointermove", onTapMove);
        window.removeEventListener("pointerup", onTapUp);
        if (!tapMoved) {
          props.onSelectDay(dayKey);
          if (props.onEventClick) props.onEventClick(ev, dayKey);
        }
      }
      window.addEventListener("pointermove", onTapMove);
      window.addEventListener("pointerup", onTapUp);
      return;
    }
    var startMin = timeToMin(ev.time);
    var dur = evDuration(ev);
    var c = ev.color || ACCENT;
    var startPos = posFromPointer(e.clientX, e.clientY, dur);
    var pointerAbs = startPos ? startPos.dayIdx * 1440 + startPos.minutes : props.weekDays.indexOf(dayKey) * 1440 + startMin;
    var eventAbs = props.weekDays.indexOf(dayKey) * 1440 + startMin;
    dragRef.current = { id: ev.id, fromKey: dayKey, duration: dur, title: ev.title, color: c, startX: e.clientX, startY: e.clientY, moved: false, offset: Math.max(0, pointerAbs - eventAbs) };
    setPreview({ id: ev.id, dayIdx: props.weekDays.indexOf(dayKey), minutes: startMin, duration: dur, title: ev.title, color: c });

    function onMove(pe) {
      if (!dragRef.current) return;
      if (Math.abs(pe.clientX - dragRef.current.startX) + Math.abs(pe.clientY - dragRef.current.startY) < 6) return;
      dragRef.current.moved = true;
      var p = posFromPointer(pe.clientX, pe.clientY, dragRef.current.duration);
      if (p) {
        var abs = Math.max(0, p.dayIdx * 1440 + p.minutes - dragRef.current.offset);
        var dayIdx = Math.max(0, Math.min(6, Math.floor(abs / 1440)));
        var minutes = Math.max(0, Math.min(1440 - dragRef.current.duration, snapMin(abs % 1440)));
        setPreview({ id: dragRef.current.id, dayIdx: dayIdx, minutes: minutes, duration: dragRef.current.duration, title: dragRef.current.title, color: dragRef.current.color });
      }
    }
    function onUp(pe) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!dragRef.current) return;
      var d = dragRef.current;
      dragRef.current = null;
      setPreview(null);
      if (!d.moved) {
        props.onSelectDay(dayKey);
        if (props.onEventClick) props.onEventClick(ev, dayKey);
        return;
      }
      var p = posFromPointer(pe.clientX, pe.clientY, d.duration);
      if (p && props.onMove) {
        var abs = Math.max(0, p.dayIdx * 1440 + p.minutes - d.offset);
        var dayIdx = Math.max(0, Math.min(6, Math.floor(abs / 1440)));
        var minutes = Math.max(0, Math.min(1440 - d.duration, snapMin(abs % 1440)));
        props.onMove(d.id, d.fromKey, props.weekDays[dayIdx], minToTime(minutes), d.duration);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onSlotPointerDown(e, dayIdx) {
    if (props.readOnly || dragRef.current) return;
    if (e.button && e.button !== 0) return;
    var p = posFromPointer(e.clientX, e.clientY, 15);
    if (!p) return;
    var startAbs = p.dayIdx * 1440 + p.minutes;
    var moveThreshold = props.isMobile ? 14 : 8;

    if (props.isMobile) {
      createRef.current = { startAbs: startAbs, moved: false, startX: e.clientX, startY: e.clientY };
      function onMove(pe) {
        if (!createRef.current) return;
        if (Math.abs(pe.clientX - createRef.current.startX) + Math.abs(pe.clientY - createRef.current.startY) > moveThreshold) {
          createRef.current.moved = true;
        }
      }
      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!createRef.current) return;
        var s = createRef.current.startAbs;
        var moved = createRef.current.moved;
        createRef.current = null;
        if (!moved && props.onSlotClick) {
          props.onSlotClick(props.weekDays[Math.floor(s / 1440)], s % 1440);
        }
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return;
    }

    createRef.current = { startAbs: startAbs, color: ACCENT, moved: false, startX: e.clientX, startY: e.clientY };
    setCreatePreview({ startAbs: startAbs, endAbs: startAbs + 60, color: ACCENT });

    function onMove(pe) {
      if (!createRef.current) return;
      if (Math.abs(pe.clientX - createRef.current.startX) + Math.abs(pe.clientY - createRef.current.startY) > moveThreshold) {
        createRef.current.moved = true;
        pe.preventDefault();
      }
      if (!createRef.current.moved) return;
      var n = posFromPointer(pe.clientX, pe.clientY, 15);
      if (!n) return;
      var endAbs = n.dayIdx * 1440 + n.minutes;
      if (endAbs <= createRef.current.startAbs) endAbs = createRef.current.startAbs + SNAP_MIN;
      setCreatePreview({ startAbs: createRef.current.startAbs, endAbs: endAbs, color: ACCENT });
    }
    function onUp(pe) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!createRef.current) return;
      var s = createRef.current.startAbs;
      var moved = createRef.current.moved;
      createRef.current = null;
      var n = posFromPointer(pe.clientX, pe.clientY, 15);
      var eAbs = n ? n.dayIdx * 1440 + n.minutes : s + 60;
      if (eAbs <= s) eAbs = s + 60;
      setCreatePreview(null);
      if (!moved && props.onSlotClick) {
        props.onSlotClick(props.weekDays[Math.floor(s / 1440)], s % 1440);
      } else if (moved && props.onRangeCreate) {
        props.onRangeCreate(props.weekDays[Math.floor(s / 1440)], s % 1440, props.weekDays[Math.floor(eAbs / 1440)], eAbs % 1440, eAbs - s);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function renderRangePreview(range, label) {
    if (!range) return null;
    var start = Math.min(range.startAbs, range.endAbs);
    var end = Math.max(range.startAbs + SNAP_MIN, range.endAbs);
    var bits = [];
    for (var di = 0; di < 7; di++) {
      var dayStart = di * 1440;
      var segStart = Math.max(start, dayStart);
      var segEnd = Math.min(end, dayStart + 1440);
      if (segEnd <= segStart) continue;
      bits.push(
        <div key={di} style={{
          position: "absolute",
          left: "calc(" + (di / 7 * 100) + "% + 3px)",
          width: "calc(" + (100 / 7) + "% - 6px)",
          top: ((segStart - dayStart) / 60) * HOUR_H + 1,
          height: Math.max(((segEnd - segStart) / 60) * HOUR_H - 2, 20),
          background: (range.color || ACCENT) + "36",
          border: "2px dashed " + (range.color || ACCENT),
          borderRadius: 8,
          pointerEvents: "none",
          zIndex: 20,
          padding: "4px 6px",
          overflow: "hidden",
        }}>
          <p style={{ margin: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: range.color || ACCENT }}>{minToTime(segStart - dayStart)}</p>
          <EventTitleLine title={label || "Novo evento"} style={{ margin: "2px 0 0", fontSize: 10, color: "#fff", fontWeight: 500 }} />
        </div>
      );
    }
    return bits;
  }

  var nowTickS = useState(0);
  var nowTick = nowTickS[0], setNowTick = nowTickS[1];
  useEffect(function() {
    var id = setInterval(function() { setNowTick(Date.now()); }, 60000);
    return function() { clearInterval(id); };
  }, []);

  var nowLine = useMemo(function() {
    if (props.weekDays.indexOf(props.todayKey) < 0) return null;
    var t = new Date();
    return { dayIdx: props.weekDays.indexOf(props.todayKey), top: (t.getHours() * 60 + t.getMinutes()) / 60 * HOUR_H };
  }, [props.weekDays, props.todayKey, nowTick]);

  useEffect(function() {
    var el = scrollRef.current;
    if (!el) return;
    el.scrollTop = SCROLL_START_HOUR * HOUR_H;
  }, [props.weekDays, props.todayKey]);

  return (
    <div className="week-wrap">
      <div className="week-header-sticky" style={{ flexShrink: 0 }}>
      <div style={{ display: "flex", marginLeft: 44, marginBottom: 6, gap: 0 }}>
        {props.weekDays.map(function(k, i) {
          var p = parseKey(k);
          var isSel = k === props.selected;
          var isToday = k === props.todayKey;
          return (
            <button type="button" key={k} onClick={function() { props.onSelectDay(k); }}
              style={{
                flex: 1, padding: "8px 4px", border: "none", borderRadius: 10, cursor: "pointer",
                background: isSel ? ACCENT + "18" : isToday ? ACCENT + "08" : "transparent",
                borderBottom: isSel ? "2px solid " + ACCENT : "2px solid transparent",
                fontFamily: "'JetBrains Mono',monospace", color: isSel ? ACCENT : "rgba(255,255,255,0.55)",
              }}>
              <div style={{ fontSize: 9, opacity: 0.5 }}>{WEEKDAYS[i]}</div>
              <div style={{ fontSize: 15, fontWeight: isToday ? 600 : 400 }}>{p.d}</div>
            </button>
          );
        })}
      </div>

      {allDayByDay.some(function(l) { return l.length > 0; }) && (
        <div style={{ display: "flex", marginLeft: 44, marginBottom: 8, minHeight: 32 }}>
          <div style={{ width: 44, marginLeft: -44, fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace", paddingTop: 6, textAlign: "right", paddingRight: 8 }}>dia</div>
          {allDayByDay.map(function(list, i) {
            return (
              <div key={props.weekDays[i]} style={{ flex: 1, padding: "2px 4px", display: "flex", flexDirection: "column", gap: 3, borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                {list.map(function(ev) {
                  var c = ev.color || ACCENT;
                  return (
                    <button type="button" key={ev.id} title={eventTooltip(ev)} onClick={function() { props.onSelectDay(props.weekDays[i]); if (props.onEventClick) props.onEventClick(ev, props.weekDays[i]); }}
                      style={{ fontSize: 9, padding: "4px 6px", borderRadius: 6, border: "none", background: c + "22", color: c, cursor: "pointer", textAlign: "left", overflow: "hidden", fontFamily: "'IBM Plex Sans',sans-serif", width: "100%", minWidth: 0, maxWidth: "100%" }}>
                      <EventTitleLine title={ev.title} style={{ fontSize: 9, color: c }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      </div>

      <div ref={scrollRef} className="week-scroll">
        <div style={{ display: "flex", position: "relative" }}>
          <div style={{ width: 44, flexShrink: 0, position: "relative", height: HOURS * HOUR_H }}>
            {Array.from({ length: HOURS }, function(_, h) {
              return (
                <div key={h} style={{
                  position: "absolute", top: h * HOUR_H - 7, right: 8, fontSize: 9,
                  fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.2)",
                }}>{pad(h) + ":00"}</div>
              );
            })}
          </div>
          <div ref={gridRef} style={{ flex: 1, display: "flex", position: "relative", height: HOURS * HOUR_H, minWidth: 0 }}>
            {props.weekDays.map(function(k, dayIdx) {
              var list = timedOnDay(k, dayIdx);
              var isSel = k === props.selected;
              return (
                <div key={k} style={{
                  flex: 1, position: "relative", borderLeft: "1px solid rgba(255,255,255,0.05)",
                  background: isSel ? ACCENT + "04" : "transparent",
                  touchAction: "pan-y",
                }} onPointerDown={function(e) { onSlotPointerDown(e, dayIdx); }}>
                  {Array.from({ length: HOURS }, function(_, h) {
                    return (
                      <div key={h} style={{
                        position: "absolute", top: h * HOUR_H, left: 0, right: 0, height: HOUR_H,
                        borderTop: h === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                        boxSizing: "border-box",
                      }} />
                    );
                  })}
                  {nowLine && nowLine.dayIdx === dayIdx && (
                    <div style={{ position: "absolute", top: nowLine.top, left: 0, right: 0, height: 2, background: ACCENT, boxShadow: "0 0 12px " + ACCENT + "88", zIndex: 5, pointerEvents: "none" }}>
                      <span style={{ position: "absolute", left: -4, top: -4, width: 8, height: 8, borderRadius: "50%", background: ACCENT, boxShadow: "0 0 8px " + ACCENT }} />
                    </div>
                  )}
                  {list.map(function(seg) {
                    var ev = seg.ev;
                    if (preview && preview.id === ev.id) return null;
                    var top = (seg.segmentStart / 60) * HOUR_H;
                    var h = (seg.segmentDuration / 60) * HOUR_H - 2;
                    var c = ev.color || ACCENT;
                    var cols = Math.max(1, seg.columns || 1);
                    var col = Math.min(cols - 1, seg.column || 0);
                    var blockH = Math.max(h, 20);
                    var compact = blockH < 34;
                    return (
                      <div key={seg.sourceKey + ev.id + dayIdx}
                        title={eventTooltip(ev)}
                        onPointerDown={function(e) { onBlockPointerDown(e, ev, seg.sourceKey); }}
                        onClick={function(e) { e.stopPropagation(); props.onSelectDay(seg.sourceKey); if (props.onEventClick) props.onEventClick(ev, seg.sourceKey); }}
                        style={{
                          position: "absolute",
                          left: "calc(" + (col / cols * 100) + "% + 3px)",
                          width: "calc(" + (100 / cols) + "% - 6px)",
                          top: top + 1, height: blockH,
                          background: c + "28", border: "1px solid " + c + "55", borderRadius: 8,
                          padding: compact ? "2px 4px" : "4px 6px", overflow: "hidden", cursor: props.readOnly ? "pointer" : "grab",
                          zIndex: 10, boxShadow: "0 4px 12px " + c + "18",
                          touchAction: "none", userSelect: "none",
                          display: "flex", flexDirection: "column", justifyContent: compact ? "center" : "flex-start", minWidth: 0,
                        }}>
                        {!compact && (
                          <p style={{ margin: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: c, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{seg.continuesBefore ? "↳ " : ""}{timeFromMinutes(seg.segmentStart)}-{timeFromMinutes(seg.segmentStart + seg.segmentDuration)} · {durationLabel(seg.segmentDuration)}{seg.continuesAfter ? " ↴" : ""}</p>
                        )}
                        <EventTitleLine title={ev.title} style={{ margin: compact ? 0 : "2px 0 0", fontSize: compact ? 9 : 10, color: "#fff", fontWeight: 500, flex: 1, minHeight: 0 }} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {preview && renderRangePreview({ startAbs: preview.dayIdx * 1440 + preview.minutes, endAbs: preview.dayIdx * 1440 + preview.minutes + preview.duration, color: preview.color }, preview.title)}
            {createPreview && renderRangePreview(createPreview, "Novo evento")}
          </div>
        </div>
      </div>
      {!props.readOnly && !props.isMobile && (
        <p style={{ margin: "12px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
          Arrasta na grelha para criar um evento · Arrasta blocos para mudar dia e hora
        </p>
      )}
      {!props.readOnly && props.isMobile && (
        <p style={{ margin: "8px 0 0", fontSize: 10, color: "rgba(255,255,255,0.22)", lineHeight: 1.5 }}>
          Toca num horário e larga para criar · Usa + em baixo à esquerda
        </p>
      )}
    </div>
  );
}

function NavBtn(props) {
  return (
    <button type="button" onClick={props.onClick} title={props.title} disabled={props.disabled}
      style={{width:36,height:36,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:props.disabled?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.5)",fontSize:props.large?18:14,cursor:props.disabled?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",fontFamily:"inherit",opacity:props.disabled?0.5:1}}
      onMouseEnter={function(e){if(props.disabled)return;e.currentTarget.style.borderColor=ACCENT+"50";e.currentTarget.style.color=ACCENT;}}
      onMouseLeave={function(e){e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.color=props.disabled?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.5)";}}>
      {props.children}
    </button>
  );
}

function ModePill(props) {
  var on = props.active;
  return (
    <button type="button" onClick={props.onClick}
      style={{padding:"7px 12px",borderRadius:10,border:"1px solid "+(on?ACCENT+"45":"rgba(255,255,255,0.08)"),background:on?ACCENT+"14":"transparent",color:on?ACCENT:"rgba(255,255,255,0.45)",fontSize:11,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",letterSpacing:0.3}}>
      {props.label}
    </button>
  );
}

function EventCard(props) {
  var ev = props.ev, c = ev.color || ACCENT;
  return (
    <li style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
      <span style={{width:4,alignSelf:"stretch",borderRadius:4,background:c,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:c}}>{formatEventTime(ev)}</p>
        <p title={ev.title || ""} style={{margin:"4px 0 0",fontSize:13,color:"rgba(255,255,255,0.85)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</p>
        {ev.notes && <p style={{margin:"6px 0 0",fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{ev.notes}</p>}
      </div>
      {!props.readOnly && (
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button type="button" onClick={function(){props.onEdit(ev);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",fontSize:12,padding:4}} title="Editar">✎</button>
          <button type="button" onClick={function(){props.onDelete(ev.id);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:12,padding:4}} title="Apagar">×</button>
        </div>
      )}
    </li>
  );
}

function MiniCalendar(props) {
  var view = props.view;
  var selected = props.selected;
  var todayKey = props.todayKey;
  var events = props.events;
  var isMobile = props.isMobile;

  var grid = useMemo(function() {
    var first = new Date(view.y, view.m, 1);
    var start = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    var cells = [];
    var prevDays = new Date(view.y, view.m, 0).getDate();
    for (var i = start - 1; i >= 0; i--) {
      cells.push({ d: prevDays - i, m: view.m - 1, y: view.m === 0 ? view.y - 1 : view.y, outside: true });
    }
    for (var d = 1; d <= daysInMonth; d++) {
      cells.push({ d: d, m: view.m, y: view.y, outside: false });
    }
    while (cells.length % 7 !== 0 || cells.length < 42) {
      var n = cells.length - start - daysInMonth + 1;
      cells.push({ d: n, m: view.m + 1, y: view.m === 11 ? view.y + 1 : view.y, outside: true });
    }
    return cells;
  }, [view.y, view.m]);

  var monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: isMobile ? 16 : 14, padding: "14px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <p style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.75)", textTransform: "capitalize", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{monthLabel}</p>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <NavBtn onClick={props.onPrevMonth} title="Mês anterior">‹</NavBtn>
          <NavBtn onClick={props.onNextMonth} title="Mês seguinte">›</NavBtn>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map(function(w) {
          return <div key={w} style={{ textAlign: "center", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.25)", padding: "2px 0" }}>{w.slice(0, 1)}</div>;
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {grid.map(function(cell, i) {
          var k = dateKey(cell.y, cell.m, cell.d);
          var isSel = k === selected;
          var isToday = k === todayKey;
          var outside = cell.outside;
          var hasEv = (events[k] || []).length > 0;
          return (
            <button type="button" key={k + i} onClick={function() { props.onSelectDay(k, cell); }}
              style={{
                aspectRatio: "1",
                minHeight: isMobile ? 36 : 28,
                borderRadius: 8,
                border: isSel ? "1px solid " + ACCENT : "1px solid transparent",
                background: isSel ? ACCENT + "18" : isToday ? ACCENT + "0A" : "transparent",
                color: outside ? "rgba(255,255,255,0.15)" : isSel ? ACCENT : isToday ? ACCENT : "rgba(255,255,255,0.65)",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: isMobile ? 12 : 10,
                fontWeight: isToday ? 600 : 400,
                padding: 0,
                position: "relative",
              }}>
              {cell.d}
              {hasEv && !outside && (
                <span style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: ACCENT, opacity: isSel ? 1 : 0.5 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarForm(props) {
  var p = props;
  var inputStyle = {
    width: "100%",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#fff",
    padding: p.isMobile ? "12px" : "10px 12px",
    fontSize: p.isMobile ? 16 : 13,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  var timeStyle = Object.assign({}, inputStyle, { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: ACCENT });

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: p.isMobile ? 16 : 14, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1, textTransform: "uppercase" }}>
          {p.editId ? "Editar evento" : "Novo evento"}
        </p>
        {p.isMobile && (
          <button type="button" onClick={p.onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.45)", padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>Fechar</button>
        )}
      </div>

      <input value={p.title} onChange={function(e) { p.setTitle(e.target.value); }} placeholder="Título do evento / tarefa"
        onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) p.onSubmit(); }}
        style={inputStyle} />

      <label style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 }}>DATA</label>
      <input type="date" value={p.formDate} onChange={function(e) { p.onDateChange(e.target.value); }} style={timeStyle} />

      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
        <input type="checkbox" checked={p.allDay} onChange={function(e) { p.setAllDay(e.target.checked); }} style={{ accentColor: p.color }} />
        Dia todo
      </label>

      {!p.allDay && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>INÍCIO</label>
            <input type="time" value={p.time} onChange={function(e) { p.setTime(e.target.value); p.setEndTime(addMinutes(e.target.value, p.duration)); }} style={timeStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>FIM</label>
            <input type="time" value={p.endTime} onChange={function(e) { p.setEndTime(e.target.value); p.setDuration(durationFromTimes(p.time, e.target.value)); }} style={Object.assign({}, timeStyle, { color: "#fff" })} />
          </div>
          <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)" }}>Duração: {durationLabel(durationFromTimes(p.time, p.endTime))}</p>
        </div>
      )}

      <label style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 }}>CATEGORIA</label>
      <select value={p.color} onChange={function(e) { p.setColor(e.target.value); }}
        style={Object.assign({}, inputStyle, { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, cursor: "pointer", appearance: "none", backgroundImage: "linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.35) 50%), linear-gradient(135deg, rgba(255,255,255,0.35) 50%, transparent 50%)", backgroundPosition: "calc(100% - 14px) calc(50% - 2px), calc(100% - 9px) calc(50% - 2px)", backgroundSize: "5px 5px, 5px 5px", backgroundRepeat: "no-repeat" })}>
        {COLORS.map(function(c, i) {
          var labels = ["Neon", "Roxo", "Rosa", "Âmbar", "Azul", "Laranja"];
          return <option key={c} value={c} style={{ background: "#0A0A0F", color: c }}>{labels[i] || c}</option>;
        })}
      </select>

      {!p.editId && (
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)" }}>REPETIR NESTA SEMANA</p>
          <div style={{ display: "flex", gap: 4 }}>
            {WEEKDAYS.map(function(w, i) {
              var isSelDay = i === p.selectedDow;
              var on = p.repeatDays[i];
              return (
                <button type="button" key={w} onClick={function() { if (!isSelDay) p.toggleRepeat(i); }} disabled={isSelDay} title={isSelDay ? "Dia base" : "Copiar para " + w}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 9, fontFamily: "'JetBrains Mono',monospace",
                    border: "1px solid " + (isSelDay ? p.color + "60" : on ? p.color + "40" : "rgba(255,255,255,0.08)"),
                    background: isSelDay ? p.color + "20" : on ? p.color + "12" : "transparent",
                    color: isSelDay ? p.color : on ? p.color : "rgba(255,255,255,0.35)",
                    cursor: isSelDay ? "default" : "pointer",
                  }}>{w.slice(0, 1)}</button>
              );
            })}
          </div>
        </div>
      )}

      <button type="button" onClick={p.onSubmit}
        style={{ width: "100%", background: p.color + "22", border: "1px solid " + p.color + "55", borderRadius: 10, color: p.color, fontSize: 12, padding: "12px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, boxShadow: "0 0 20px " + p.color + "18", marginTop: 4 }}>
        {p.editId ? "Guardar alterações" : "Adicionar evento"}
      </button>

      {p.editId && (
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={p.onCancelEdit} style={{ flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.4)", fontSize: 11, padding: "8px", cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
          <button type="button" onClick={function() { p.onDelete(p.editId); }} style={{ background: "rgba(255,61,90,0.08)", border: "1px solid rgba(255,61,90,0.25)", borderRadius: 8, color: "#FF3D5A", fontSize: 11, padding: "8px 12px", cursor: "pointer" }}>Apagar</button>
        </div>
      )}
    </div>
  );
}

export default function Calendar() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var today = useMemo(function() { return new Date(); }, []);
  var todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  var vS = useState({ y: today.getFullYear(), m: today.getMonth() });
  var view = vS[0], setView = vS[1];
  var selS = useState(todayKey);
  var selected = selS[0], setSelected = selS[1];
  var evS = useState(loadEvents);
  var events = evS[0], setEvents = evS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];

  var readOnly = false;
  var sideS = useState(!isMobile);
  var sidebarOpen = sideS[0], setSidebarOpen = sideS[1];

  var titleS = useState(""); var title = titleS[0], setTitle = titleS[1];
  var timeS = useState("09:00"); var time = timeS[0], setTime = timeS[1];
  var allDayS = useState(false); var allDay = allDayS[0], setAllDay = allDayS[1];
  var notesS = useState(""); var notes = notesS[0], setNotes = notesS[1];
  var colorS = useState(ACCENT); var color = colorS[0], setColor = colorS[1];
  var editIdS = useState(null); var editId = editIdS[0], setEditId = editIdS[1];
  var repS = useState([false, false, false, false, false, false, false]);
  var repeatDays = repS[0], setRepeatDays = repS[1];
  var durS = useState(60);
  var duration = durS[0], setDuration = durS[1];
  var endS = useState("10:00");
  var endTime = endS[0], setEndTime = endS[1];

  var refreshCalendar = useCallback(function() {
    return calendarStore.loadEvents().then(function(data) {
      setEvents(data);
      setLoaded(true);
    });
  }, []);

  useEffect(function() {
    refreshCalendar();
  }, []);

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  useEffect(function() {
    if (!loaded) return;
    saveEvents(events);
    calendarStore.saveEvents(events);
  }, [events, loaded]);

  useEffect(function() {
    if (!loaded) return;
    function shouldRefresh() {
      return !sidebarOpen || !isMobile;
    }
    function onVisible() {
      if (document.visibilityState === "visible" && shouldRefresh()) refreshCalendar();
    }
    function onFocus() {
      if (shouldRefresh()) refreshCalendar();
    }
    var timer = setInterval(function() {
      if (document.visibilityState === "visible" && shouldRefresh()) refreshCalendar();
    }, 15000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return function() {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [loaded, sidebarOpen, isMobile, refreshCalendar]);

  var weekDays = useMemo(function() { return weekKeys(selected); }, [selected]);

  var weekLabel = useMemo(function() {
    var a = parseKey(weekDays[0]), b = parseKey(weekDays[6]);
    var da = new Date(a.y, a.m, a.d), db = new Date(b.y, b.m, b.d);
    if (a.m === b.m) return da.getDate() + " – " + db.getDate() + " " + da.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return da.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) + " – " + db.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  }, [weekDays]);

  function shiftWeek(delta) {
    var p = parseKey(selected);
    var d = new Date(p.y, p.m, p.d + delta * 7);
    var k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    setSelected(k);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }
  function prevMonth() {
    setView(function(v) { return v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; });
  }
  function nextMonth() {
    setView(function(v) { return v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; });
  }
  function goToday() {
    setView({ y: today.getFullYear(), m: today.getMonth() });
    setSelected(todayKey);
  }

  var resetForm = useCallback(function() {
    setTitle(""); setTime("09:00"); setEndTime("10:00"); setAllDay(false); setNotes(""); setColor(ACCENT); setEditId(null); setDuration(60);
    setRepeatDays([false, false, false, false, false, false, false]);
  }, []);

  function moveTimedEvent(id, fromKey, toKey, newTime, dur) {
    if (readOnly) return;
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      var ev = null;
      next[fromKey] = (next[fromKey] || []).filter(function(e) {
        if (e.id === id) { ev = e; return false; }
        return true;
      });
      if (!ev) return prev;
      if (!next[fromKey] || !next[fromKey].length) delete next[fromKey];
      var updated = Object.assign({}, ev, { time: newTime, duration: dur, allDay: false });
      next[toKey] = sortEvents((next[toKey] || []).concat([updated]));
      return next;
    });
    setSelected(toKey);
    var p = parseKey(toKey);
    setView({ y: p.y, m: p.m });
    setTime(newTime);
    setEndTime(addMinutes(newTime, dur));
    setDuration(dur);
    setAllDay(false);
  }

  function createRangeEvent(startKey, startMin, endKey, endMin, dur) {
    if (readOnly) return;
    var p = parseKey(startKey);
    var d = Math.max(SNAP_MIN, dur || 60);
    setSelected(startKey);
    setView({ y: p.y, m: p.m });
    setAllDay(false);
    setTime(minToTime(startMin));
    setDuration(d);
    setEndTime(minToTime(startMin + d));
    setEditId(null);
    setTitle("");
    setSidebarOpen(true);
  }
  function onEventClick(ev, dayKey) {
    startEdit(ev, dayKey);
  }

  function onFormDateChange(val) {
    if (!val) return;
    setSelected(val);
    var p = parseKey(val);
    setView({ y: p.y, m: p.m });
  }

  function openCreateMenu() {
    resetForm();
    setSidebarOpen(true);
  }

  function onWeekSlotClick(key, minutes) {
    if (readOnly) return;
    setSelected(key);
    var p = parseKey(key);
    setView({ y: p.y, m: p.m });
    setAllDay(false);
    setTime(minToTime(minutes));
    setEndTime(addMinutes(minToTime(minutes), duration));
    setEditId(null);
    setTitle("");
    if (isMobile) openCreateMenu();
  }

  function toggleRepeat(i) {
    if (readOnly) return;
    setRepeatDays(function(prev) {
      var n = prev.slice();
      n[i] = !n[i];
      return n;
    });
  }

  function addOrUpdateEvent() {
    if (readOnly || !title.trim()) return;
    var item = {
      id: editId || uid(),
      title: title.trim(),
      color: color,
      allDay: allDay,
      time: allDay ? null : time,
      notes: notes.trim(),
      duration: allDay ? null : durationFromTimes(time, endTime),
    };
    var targets = [selected];
    if (!editId) {
      weekDays.forEach(function(k, i) {
        if (repeatDays[i] && k !== selected) targets.push(k);
      });
    }
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      if (editId) {
        Object.keys(next).forEach(function(k) {
          next[k] = (next[k] || []).filter(function(e) { return e.id !== editId; });
          if (!next[k].length) delete next[k];
        });
        next[selected] = sortEvents((next[selected] || []).concat([item]));
        return next;
      }
      targets.forEach(function(k) {
        var copy = Object.assign({}, item, { id: k === selected ? item.id : uid() });
        var list = sortEvents((next[k] || []).concat([copy]));
        next[k] = list;
      });
      return next;
    });
    resetForm();
    if (isMobile) setSidebarOpen(false);
  }

  function deleteEvent(id) {
    if (readOnly) return;
    var next = Object.assign({}, events);
    var found = false;
    Object.keys(next).forEach(function(k) {
      var before = (next[k] || []).length;
      next[k] = (next[k] || []).filter(function(e) { return e.id !== id; });
      if (next[k].length !== before) found = true;
      if (!next[k].length) delete next[k];
    });
    if (!found) {
      next[selected] = (next[selected] || []).filter(function(e) { return e.id !== id; });
      if (next[selected] && !next[selected].length) delete next[selected];
    }
    setEvents(next);
    calendarStore.deleteEventById(next, id).catch(function() {});
    if (editId === id) resetForm();
  }

  function startEdit(ev, dayKey) {
    if (readOnly) return;
    if (dayKey) {
      setSelected(dayKey);
      var dp = parseKey(dayKey);
      setView({ y: dp.y, m: dp.m });
    }
    setEditId(ev.id);
    setTitle(ev.title);
    setAllDay(!!ev.allDay);
    setTime(ev.time || "09:00");
    setDuration(evDuration(ev));
    setEndTime(eventEndTime(ev) || addMinutes(ev.time || "09:00", evDuration(ev)));
    setNotes(ev.notes || "");
    setColor(ev.color || ACCENT);
    setRepeatDays([false, false, false, false, false, false, false]);
    setSidebarOpen(true);
  }

  function selectDay(k, cell) {
    setSelected(k);
    if (cell && cell.outside) setView({ y: cell.y, m: cell.m });
    else {
      var p = parseKey(k);
      setView({ y: p.y, m: p.m });
    }
    if (!readOnly && !editId) resetForm();
  }

  var selectedDow = (new Date(parseKey(selected).y, parseKey(selected).m, parseKey(selected).d).getDay() + 6) % 7;

  return (
    <div className="cal-page" data-scrollable style={{ minHeight: "100vh", height: "100vh", background: "linear-gradient(160deg, #0A0A0F 0%, #0D1218 45%, #0A0A0F 100%)", color: "#fff", fontFamily: "'IBM Plex Sans', sans-serif", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{"@keyframes calIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes calSlide{from{transform:translateX(-100%)}to{transform:translateX(0)}}.cal-page{height:100vh;overflow:hidden;display:flex;flex-direction:column}.cal-top-sticky{flex-shrink:0;z-index:30;background:linear-gradient(180deg,rgba(10,10,15,0.98),rgba(10,10,15,0.92));backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.04)}.cal-shell{flex:1;display:flex;min-height:0;animation:calIn .35s ease;overflow:hidden}.cal-sidebar{width:clamp(240px,22vw,320px);flex-shrink:0;display:flex;flex-direction:column;gap:12px;padding:16px 14px;border-right:1px solid rgba(255,255,255,0.05);background:rgba(8,10,14,0.55);backdrop-filter:blur(14px);overflow-y:auto;-webkit-overflow-scrolling:touch}.cal-grid-area{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;padding:16px 18px 20px;overflow:hidden}.cal-grid-panel{flex:1;min-height:0;display:flex;flex-direction:column;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:16px;padding:16px 14px 18px;backdrop-filter:blur(12px);overflow:hidden}.cal-grid-scroll{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}.week-wrap{flex:1;min-height:0;min-width:0;display:flex;flex-direction:column}.week-header-sticky{flex-shrink:0;background:rgba(10,12,18,0.92)}.week-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;border-radius:10px;border:1px solid rgba(255,255,255,0.04);-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y}.week-scroll::-webkit-scrollbar,.cal-sidebar::-webkit-scrollbar{width:6px;height:6px}.week-scroll::-webkit-scrollbar-thumb,.cal-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}.cal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);z-index:45}.cal-fab-create{position:fixed;left:14px;bottom:16px;z-index:55;width:52px;height:52px;border-radius:50%;border:1px solid rgba(0,255,200,0.55);background:rgba(0,255,200,0.2);color:#00FFC8;font-size:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 14px 50px rgba(0,255,200,0.22);backdrop-filter:blur(14px)}@media(max-width:719px){.cal-shell{flex-direction:column}.cal-sidebar{position:fixed;top:0;left:0;bottom:0;width:min(92vw,360px);z-index:50;padding:14px 12px 24px;box-shadow:20px 0 80px rgba(0,0,0,0.55);animation:calSlide .28s ease;border-right:1px solid rgba(255,255,255,0.08)}.cal-grid-area{padding:0 10px 12px;min-height:0}.cal-grid-panel{border-radius:14px;padding:10px 8px 12px;min-height:0;border:none;background:transparent}.cal-week-label{margin:0;padding:10px 4px 8px;font-size:clamp(14px,3.5vw,18px)}.week-wrap{min-width:640px}.cal-grid-scroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}.cal-header-actions{flex:1;justify-content:flex-end}.cal-fab-create{bottom:max(16px,env(safe-area-inset-bottom))}}"}</style>
      <div style={{ position: "fixed", top: "-15%", right: "-5%", width: 480, height: 480, background: "radial-gradient(circle,rgba(0,255,200,0.04),transparent 65%)", pointerEvents: "none" }} />

      <div className="cal-top-sticky">
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: isMobile ? 8 : 12, padding: isMobile ? "10px 12px" : "12px 18px", background: "transparent", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button type="button" onClick={function() { navigate("/"); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, color: "rgba(255,255,255,0.45)", padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>← Hub</button>
          <h1 style={{ margin: 0, fontSize: isMobile ? 14 : 16, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1, whiteSpace: "nowrap" }}>Calendário</h1>
        </div>
        <div className="cal-header-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {isMobile && (
            <button type="button" onClick={function() { setSidebarOpen(!sidebarOpen); }} style={{ background: sidebarOpen ? ACCENT + "18" : "rgba(255,255,255,0.03)", border: "1px solid " + (sidebarOpen ? ACCENT + "45" : "rgba(255,255,255,0.08)"), borderRadius: 10, color: sidebarOpen ? ACCENT : "rgba(255,255,255,0.55)", fontSize: 11, padding: "8px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>☰ Menu</button>
          )}
          {!isMobile && (
            <ModePill label={sidebarOpen ? "Ocultar painel" : "Mostrar painel"} active={sidebarOpen} onClick={function() { setSidebarOpen(!sidebarOpen); }} />
          )}
          <NavBtn onClick={function() { shiftWeek(-1); }} title="Semana anterior">‹</NavBtn>
          <NavBtn onClick={function() { shiftWeek(1); }} title="Semana seguinte">›</NavBtn>
          <button type="button" onClick={goToday} style={{ background: ACCENT + "12", border: "1px solid " + ACCENT + "35", borderRadius: 10, color: ACCENT, fontSize: 11, padding: "8px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>Hoje</button>
        </div>
      </header>
      {isMobile && (
        <h2 className="cal-week-label" style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, textTransform: "capitalize", color: "rgba(255,255,255,0.9)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{weekLabel}</h2>
      )}
      </div>

      <main className="cal-shell">
        {sidebarOpen && isMobile && (
          <div className="cal-backdrop" onClick={function() { setSidebarOpen(false); }} />
        )}

        {sidebarOpen && (
          <aside className="cal-sidebar" data-scrollable>
            <MiniCalendar
              view={view}
              selected={selected}
              todayKey={todayKey}
              events={events}
              isMobile={isMobile}
              onSelectDay={selectDay}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
            <SidebarForm
              isMobile={isMobile}
              editId={editId}
              title={title}
              setTitle={setTitle}
              formDate={selected}
              onDateChange={onFormDateChange}
              allDay={allDay}
              setAllDay={setAllDay}
              time={time}
              setTime={setTime}
              endTime={endTime}
              setEndTime={setEndTime}
              duration={duration}
              setDuration={setDuration}
              color={color}
              setColor={setColor}
              repeatDays={repeatDays}
              selectedDow={selectedDow}
              toggleRepeat={toggleRepeat}
              onSubmit={addOrUpdateEvent}
              onCancelEdit={resetForm}
              onDelete={deleteEvent}
              onClose={function() { setSidebarOpen(false); resetForm(); }}
            />
          </aside>
        )}

        <section className="cal-grid-area">
          {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(14px,3.5vw,20px)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, textTransform: "capitalize", color: "rgba(255,255,255,0.9)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{weekLabel}</h2>
          </div>
          )}
          <div className="cal-grid-panel">
            <div className="cal-grid-scroll">
              <WeekTimeGrid
                weekDays={weekDays}
                events={events}
                selected={selected}
                todayKey={todayKey}
                readOnly={readOnly}
                isMobile={isMobile}
                onSelectDay={function(k) { selectDay(k, null); }}
                onEventClick={onEventClick}
                onMove={isMobile ? null : moveTimedEvent}
                onSlotClick={onWeekSlotClick}
                onRangeCreate={isMobile ? null : createRangeEvent}
              />
            </div>
          </div>
        </section>
      </main>
      {isMobile && (
        <button type="button" className="cal-fab-create" onClick={openCreateMenu} title="Novo evento" aria-label="Novo evento">+</button>
      )}
    </div>
  );
}
