/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as calendarStore from "../lib/calendarStore";
import * as taskStore from "../lib/tasksStore";

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
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
    e.preventDefault();
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
        props.onOpenPopup(ev, dayKey);
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
    if (e.pointerType === "touch") return;
    if (e.button && e.button !== 0) return;
    var p = posFromPointer(e.clientX, e.clientY, 15);
    if (!p) return;
    e.preventDefault();
    var startAbs = p.dayIdx * 1440 + p.minutes;
    createRef.current = { startAbs: startAbs, color: ACCENT };
    setCreatePreview({ startAbs: startAbs, endAbs: startAbs + 60, color: ACCENT });

    function onMove(pe) {
      if (!createRef.current) return;
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
      createRef.current = null;
      var n = posFromPointer(pe.clientX, pe.clientY, 15);
      var eAbs = n ? n.dayIdx * 1440 + n.minutes : s + 60;
      if (eAbs <= s) eAbs = s + 60;
      setCreatePreview(null);
      if (props.onRangeCreate) props.onRangeCreate(props.weekDays[Math.floor(s / 1440)], s % 1440, props.weekDays[Math.floor(eAbs / 1440)], eAbs % 1440, eAbs - s);
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
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label || "Novo evento"}</p>
        </div>
      );
    }
    return bits;
  }

  var nowLine = useMemo(function() {
    if (props.weekDays.indexOf(props.todayKey) < 0) return null;
    var t = new Date();
    return { dayIdx: props.weekDays.indexOf(props.todayKey), top: (t.getHours() * 60 + t.getMinutes()) / 60 * HOUR_H };
  }, [props.weekDays, props.todayKey]);

  return (
    <div className="week-wrap">
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
                    <button type="button" key={ev.id} onClick={function() { props.onSelectDay(props.weekDays[i]); props.onOpenPopup(ev, props.weekDays[i]); }}
                      style={{ fontSize: 9, padding: "4px 6px", borderRadius: 6, border: "none", background: c + "22", color: c, cursor: "pointer", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'IBM Plex Sans',sans-serif" }}>
                      {ev.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div className="week-scroll">
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
                    <div style={{ position: "absolute", top: nowLine.top, left: 0, right: 0, height: 2, background: "#FF3D8A", zIndex: 5, pointerEvents: "none" }}>
                      <span style={{ position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: "50%", background: "#FF3D8A" }} />
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
                    return (
                      <div key={seg.sourceKey + ev.id + dayIdx}
                        onPointerDown={function(e) { onBlockPointerDown(e, ev, seg.sourceKey); }}
                        onClick={function(e) { e.stopPropagation(); props.onSelectDay(seg.sourceKey); props.onOpenPopup(ev, seg.sourceKey); }}
                        style={{
                          position: "absolute",
                          left: "calc(" + (col / cols * 100) + "% + 3px)",
                          width: "calc(" + (100 / cols) + "% - 6px)",
                          top: top + 1, height: Math.max(h, 20),
                          background: c + "28", border: "1px solid " + c + "55", borderRadius: 8,
                          padding: "4px 6px", overflow: "hidden", cursor: props.readOnly ? "pointer" : "grab",
                          zIndex: 10, boxShadow: "0 4px 12px " + c + "18",
                          touchAction: "none", userSelect: "none",
                        }}>
                        <p style={{ margin: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: c }}>{seg.continuesBefore ? "↳ " : ""}{timeFromMinutes(seg.segmentStart)}-{timeFromMinutes(seg.segmentStart + seg.segmentDuration)} · {durationLabel(seg.segmentDuration)}{seg.continuesAfter ? " ↴" : ""}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</p>
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
      {!props.readOnly && (
        <p style={{ margin: "12px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
          Arrasta na grelha para criar um evento · Arrasta blocos para mudar dia e hora
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
        <p style={{margin:"4px 0 0",fontSize:13,color:"rgba(255,255,255,0.85)"}}>{ev.title}</p>
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

function EventPopup(props) {
  var ev = props.event;
  var tS = useState(ev.title || "");
  var title = tS[0], setTitle = tS[1];
  var nS = useState(ev.notes || "");
  var notes = nS[0], setNotes = nS[1];
  var adS = useState(!!ev.allDay);
  var allDay = adS[0], setAllDay = adS[1];
  var timeS = useState(ev.time || "09:00");
  var time = timeS[0], setTime = timeS[1];
  var durS = useState(evDuration(ev));
  var duration = durS[0], setDuration = durS[1];
  var endS = useState(eventEndTime(ev) || addMinutes(ev.time || "09:00", evDuration(ev)));
  var endTime = endS[0], setEndTime = endS[1];
  var cS = useState(ev.color || ACCENT);
  var color = cS[0], setColor = cS[1];
  var repS = useState([false, false, false, false, false, false, false]);
  var repeatDays = repS[0], setRepeatDays = repS[1];
  var taskS = useState(!!ev.task_id);
  var saveAsTask = taskS[0], setSaveAsTask = taskS[1];

  function toggleRepeat(i) {
    setRepeatDays(function(prev) {
      var next = prev.slice();
      next[i] = !next[i];
      return next;
    });
  }

  function save() {
    if (!title.trim()) return;
    var nextDuration = durationFromTimes(time, endTime);
    props.onSave(props.dayKey, Object.assign({}, ev, {
      title: title.trim(),
      notes: notes.trim(),
      allDay: allDay,
      time: allDay ? null : time,
      duration: allDay ? null : nextDuration,
      color: color,
    }), repeatDays, saveAsTask);
  }

  var p = parseKey(props.dayKey);
  var dow = (new Date(p.y, p.m, p.d).getDay() + 6) % 7;
  var cdS = useState(timeUntilLabel(props.dayKey, ev));
  var countdown = cdS[0], setCountdown = cdS[1];
  useEffect(function() {
    function tick() { setCountdown(timeUntilLabel(props.dayKey, ev)); }
    tick();
    var id = setInterval(tick, 30000);
    return function() { clearInterval(id); };
  }, [props.dayKey, ev.id, ev.time, ev.allDay, ev.duration]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={props.onClose}>
      <div style={{ width: "min(440px,94vw)", maxHeight: "90vh", overflow: "auto", background: "rgba(10,12,20,0.98)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.55)", padding: 18 }} onClick={function(e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: color, letterSpacing: 1 }}>EDITAR EVENTO</p>
          <button type="button" onClick={props.onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.45)", width: 34, height: 34, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: color + "12", border: "1px solid " + color + "30" }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>TEMPO ATÉ AO EVENTO</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontFamily: "'JetBrains Mono',monospace", color: color }}>{countdown}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="Título"
            style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          <textarea value={notes} onChange={function(e) { setNotes(e.target.value); }} placeholder="Notas..." rows={4}
            style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "10px 12px", fontSize: 12, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
            <input type="checkbox" checked={allDay} onChange={function(e) { setAllDay(e.target.checked); }} style={{ accentColor: color }} />
            Dia todo / sem hora
          </label>
          {!allDay && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="time" value={time} onChange={function(e) { setTime(e.target.value); setEndTime(addMinutes(e.target.value, duration)); }}
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: color, padding: "9px 10px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", outline: "none" }} />
              <input type="time" value={endTime} onChange={function(e) { setEndTime(e.target.value); setDuration(durationFromTimes(time, e.target.value)); }}
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "9px 10px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", outline: "none" }} />
              <p style={{gridColumn:"1 / -1",margin:0,fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"rgba(255,255,255,0.32)"}}>Duração: {durationLabel(durationFromTimes(time, endTime))}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COLORS.map(function(c) {
              return <button type="button" key={c} onClick={function() { setColor(c); }} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", opacity: color === c ? 1 : 0.6 }} />;
            })}
          </div>
          <div>
            <p style={{ margin: "2px 0 8px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)" }}>REPETIR NESTA SEMANA</p>
            <div style={{ display: "flex", gap: 6 }}>
              {WEEKDAYS.map(function(w, i) {
                var on = repeatDays[i], base = i === dow;
                return <button type="button" key={w} onClick={function() { if (!base) toggleRepeat(i); }} disabled={base}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid " + (base ? color + "60" : on ? color + "40" : "rgba(255,255,255,0.08)"), background: base ? color + "20" : on ? color + "12" : "transparent", color: base || on ? color : "rgba(255,255,255,0.35)", cursor: base ? "default" : "pointer", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{w[0]}</button>;
              })}
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
            <input type="checkbox" checked={saveAsTask} onChange={function(e) { setSaveAsTask(e.target.checked); }} style={{ accentColor: color }} />
            Guardar também em Tarefas (Inbox)
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={save} style={{ flex: 1, background: color + "1F", border: "1px solid " + color + "50", borderRadius: 10, color: color, padding: "11px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>Guardar</button>
          <button type="button" onClick={function() { props.onDelete(props.dayKey, ev.id); }} style={{ background: "rgba(255,61,90,0.08)", border: "1px solid rgba(255,61,90,0.25)", borderRadius: 10, color: "#FF3D5A", padding: "11px 14px", cursor: "pointer", fontSize: 12 }}>Apagar</button>
        </div>
      </div>
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

  var modeS = useState("month");
  var displayMode = modeS[0], setDisplayMode = modeS[1];
  var readOnly = false;
  var sideS = useState(true);
  var sidebarOpen = sideS[0], setSidebarOpen = sideS[1];
  var mobileCreateS = useState(false);
  var mobileCreateOpen = mobileCreateS[0], setMobileCreateOpen = mobileCreateS[1];
  var popS = useState(null);
  var popup = popS[0], setPopup = popS[1];

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
      return !mobileCreateOpen && !popup;
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
  }, [loaded, mobileCreateOpen, popup, refreshCalendar]);

  var weekDays = useMemo(function() { return weekKeys(selected); }, [selected]);

  var monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  var weekLabel = useMemo(function() {
    var a = parseKey(weekDays[0]), b = parseKey(weekDays[6]);
    var da = new Date(a.y, a.m, a.d), db = new Date(b.y, b.m, b.d);
    if (a.m === b.m) return da.getDate() + " – " + db.getDate() + " " + da.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    return da.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) + " – " + db.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
  }, [weekDays]);

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

  var dayEvents = sortEvents(events[selected] || []);

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
    var item = {
      id: uid(),
      title: "Novo evento",
      color: ACCENT,
      allDay: false,
      time: minToTime(startMin),
      notes: "",
      duration: Math.max(SNAP_MIN, dur || 60),
    };
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      next[startKey] = sortEvents((next[startKey] || []).concat([item]));
      return next;
    });
    setSelected(startKey);
    setView({ y: p.y, m: p.m });
    setTime(item.time);
    setEndTime(addMinutes(item.time, item.duration));
    setDuration(item.duration);
    setAllDay(false);
    setPopup({ dayKey: startKey, event: item });
  }

  function openPopup(ev, dayKey) {
    setSelected(dayKey);
    var p = parseKey(dayKey);
    setView({ y: p.y, m: p.m });
    setPopup({ dayKey: dayKey, event: ev });
  }

  async function savePopup(dayKey, updated, repeatDaysForPopup, saveAsTask) {
    var nextTaskId = updated.task_id || null;
    if (saveAsTask) {
      var tasks = await taskStore.loadTasks();
      var nextTasks = await taskStore.createLinkedTask(tasks, {
        title: updated.title,
        notes: updated.notes,
        due: dayKey,
        column: "inbox",
        source_type: "calendar",
        source_id: updated.id,
      });
      var linked = nextTasks.find(function(t) { return t.source_type === "calendar" && t.source_id === updated.id; });
      nextTaskId = linked ? linked.id : nextTaskId;
    }
    var finalEvent = Object.assign({}, updated, { task_id: nextTaskId });
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      next[dayKey] = sortEvents((next[dayKey] || []).map(function(e) {
        return e.id === finalEvent.id ? finalEvent : e;
      }));
      var keys = weekKeys(dayKey);
      (repeatDaysForPopup || []).forEach(function(on, i) {
        if (!on || keys[i] === dayKey) return;
        next[keys[i]] = sortEvents((next[keys[i]] || []).concat([Object.assign({}, finalEvent, { id: uid(), task_id: null })]));
      });
      return next;
    });
    setPopup(null);
  }

  function deletePopup(dayKey, id) {
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      next[dayKey] = (next[dayKey] || []).filter(function(e) { return e.id !== id; });
      if (!next[dayKey].length) delete next[dayKey];
      return next;
    });
    setPopup(null);
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
        var list = sortEvents((next[selected] || []).map(function(e) { return e.id === editId ? item : e; }));
        next[selected] = list;
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
    if (isMobile) setMobileCreateOpen(false);
  }

  function deleteEvent(id) {
    if (readOnly) return;
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      next[selected] = (next[selected] || []).filter(function(e) { return e.id !== id; });
      if (!next[selected].length) delete next[selected];
      return next;
    });
    if (editId === id) resetForm();
  }

  function startEdit(ev) {
    if (readOnly) return;
    setEditId(ev.id);
    setTitle(ev.title);
    setAllDay(!!ev.allDay);
    setTime(ev.time || "09:00");
    setDuration(evDuration(ev));
    setEndTime(eventEndTime(ev) || addMinutes(ev.time || "09:00", evDuration(ev)));
    setNotes(ev.notes || "");
    setColor(ev.color || ACCENT);
    setRepeatDays([false, false, false, false, false, false, false]);
    if (isMobile) setMobileCreateOpen(true);
  }

  function selectDay(k, cell) {
    setSelected(k);
    if (cell && cell.outside) setView({ y: cell.y, m: cell.m });
    else {
      var p = parseKey(k);
      setView({ y: p.y, m: p.m });
    }
    if (!readOnly) resetForm();
  }

  var selParsed = parseKey(selected);
  var selDateLabel = new Date(selParsed.y, selParsed.m, selParsed.d).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
  var selectedDow = (new Date(selParsed.y, selParsed.m, selParsed.d).getDay() + 6) % 7;

  function renderDayButton(cell, i, tall) {
    var k = cell ? dateKey(cell.y, cell.m, cell.d) : weekDays[i];
    var p = parseKey(k);
    var isSel = k === selected;
    var cellDate = new Date(p.y, p.m, p.d);
    var isToday = sameDay(cellDate, today);
    var outside = cell && cell.outside;
    var dayEv = sortEvents(events[k] || []);
    return (
      <button type="button" key={k + (i || 0)} onClick={function(){selectDay(k, cell);}}
        style={{
          minHeight: tall ? 120 : isMobile ? 42 : 44,
          aspectRatio: tall ? undefined : "1",
          borderRadius: isMobile ? 10 : 12,
          border: isSel ? "2px solid " + ACCENT : "1px solid rgba(255,255,255,0.04)",
          background: outside ? "transparent" : isSel ? ACCENT + "14" : isToday ? ACCENT + "08" : "rgba(255,255,255,0.02)",
          color: outside ? "rgba(255,255,255,0.12)" : isSel ? ACCENT : "rgba(255,255,255,0.75)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: tall ? "stretch" : "center",
          justifyContent: tall ? "flex-start" : "center",
          gap: isMobile ? 4 : 6,
          padding: tall ? 10 : isMobile ? 3 : 4,
          transition: "all 0.2s",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: isMobile ? 12 : 13,
          textAlign: tall ? "left" : "center",
          overflow: "hidden",
        }}>
        <span style={{ fontWeight: isToday ? 600 : 400, alignSelf: tall ? "flex-start" : "center" }}>{p.d}</span>
        {tall && dayEv.slice(0, 4).map(function(ev) {
          return (
            <span key={ev.id} style={{
              fontSize: 9, padding: "3px 6px", borderRadius: 6,
              background: (ev.color || ACCENT) + "18", color: ev.color || ACCENT,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'IBM Plex Sans',sans-serif",
            }}>{ev.title}</span>
          );
        })}
        {!tall && dayEv.length > 0 && (
          <span style={{ display: "flex", gap: 3, justifyContent: "center" }}>
            {dayEv.slice(0, 3).map(function(ev, j) {
              return <span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: ev.color || ACCENT }} />;
            })}
          </span>
        )}
      </button>
    );
  }

  return (
    <div data-scrollable style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0A0A0F 0%, #0D1218 45%, #0A0A0F 100%)", color: "#fff", fontFamily: "'IBM Plex Sans', sans-serif", position: "relative", overflow: isMobile ? "auto" : "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{"@keyframes calIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .cal-main{max-width:1100px;margin:0 auto;padding:24px 20px 48px;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,340px);gap:24px;animation:calIn .4s ease} .cal-main--week{max-width:min(1400px,98vw)} .week-scroll{max-height:min(72vh,1056px);overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,0.04);-webkit-overflow-scrolling:touch}.week-scroll::-webkit-scrollbar{width:6px;height:6px}.week-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}@media(max-width:800px){.cal-main,.cal-main--week{grid-template-columns:1fr!important;padding:14px 12px 130px;gap:14px}.week-wrap{min-width:760px}.cal-calendar-panel{overflow-x:auto;-webkit-overflow-scrolling:touch}.cal-mobile-actions{width:100%;justify-content:space-between}.cal-mobile-actions button{flex:1}.cal-main aside{order:2}.cal-main section{order:1}}"}</style>
      <div style={{ position: "fixed", top: "-15%", right: "-5%", width: 480, height: 480, background: "radial-gradient(circle,rgba(0,255,200,0.04),transparent 65%)", pointerEvents: "none" }} />

      <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: isMobile ? 10 : 12, padding: isMobile ? "12px" : "14px 20px", background: "linear-gradient(180deg,rgba(10,10,15,0.95),rgba(10,10,15,0.7))", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={function() { navigate("/"); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, color: "rgba(255,255,255,0.45)", padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Hub</button>
          <h1 style={{ margin: 0, fontSize: 16, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1 }}>Calendário</h1>
        </div>
        <div className="cal-mobile-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <ModePill label="Mês" active={displayMode === "month"} onClick={function() { setDisplayMode("month"); }} />
          <ModePill label="Semana" active={displayMode === "week"} onClick={function() { setDisplayMode("week"); }} />
          {!isMobile && <ModePill label={sidebarOpen ? "Minimizar menu" : "Abrir menu"} active={!sidebarOpen} onClick={function() { setSidebarOpen(!sidebarOpen); }} />}
          <button type="button" onClick={goToday} style={{ background: ACCENT + "12", border: "1px solid " + ACCENT + "35", borderRadius: 10, color: ACCENT, fontSize: 11, padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>Hoje</button>
        </div>
      </header>

      <main className={"cal-main" + (displayMode === "week" ? " cal-main--week" : "")} style={{ gridTemplateColumns: sidebarOpen ? undefined : "1fr" }}>
        <section className="cal-calendar-panel" data-scrollable style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: isMobile ? 18 : 20, padding: isMobile ? "14px 12px 18px" : "20px 18px 24px", backdropFilter: "blur(12px)", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(16px,4vw,22px)", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, textTransform: "capitalize", color: "rgba(255,255,255,0.9)" }}>
              {displayMode === "month" ? monthLabel : weekLabel}
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              {displayMode === "month" ? (
                <>
                  <NavBtn onClick={prevMonth} title="Mês anterior">‹</NavBtn>
                  <NavBtn onClick={nextMonth} title="Mês seguinte">›</NavBtn>
                </>
              ) : (
                <>
                  <NavBtn onClick={function() { shiftWeek(-1); }} title="Semana anterior">‹</NavBtn>
                  <NavBtn onClick={function() { shiftWeek(1); }} title="Semana seguinte">›</NavBtn>
                </>
              )}
            </div>
          </div>

          {displayMode === "month" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
              {WEEKDAYS.map(function(w) {
                return <div key={w} style={{ textAlign: "center", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.25)", letterSpacing: 1, padding: "4px 0" }}>{w}</div>;
              })}
            </div>
          )}

          {displayMode === "month" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: isMobile ? 4 : 6 }}>
              {grid.map(function(cell, i) { return renderDayButton(cell, i, false); })}
            </div>
          ) : (
            <WeekTimeGrid
              weekDays={weekDays}
              events={events}
              selected={selected}
              todayKey={todayKey}
              readOnly={isMobile || readOnly}
              onSelectDay={function(k) { selectDay(k, null); }}
              onEdit={startEdit}
              onOpenPopup={openPopup}
              onMove={moveTimedEvent}
              onSlotClick={isMobile ? null : onWeekSlotClick}
              onRangeCreate={isMobile ? null : createRangeEvent}
            />
          )}
        </section>

        {((!isMobile && sidebarOpen) || (isMobile && mobileCreateOpen)) && <aside data-scrollable style={isMobile ? { position:"fixed", left:10, right:10, bottom:10, zIndex:60, maxHeight:"78vh", overflow:"auto", display: "flex", flexDirection: "column", gap: 16, background:"rgba(8,10,16,0.94)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:22, padding:10, backdropFilter:"blur(22px)", boxShadow:"0 20px 80px rgba(0,0,0,0.65)" } : { display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: isMobile ? 18 : 20, padding: isMobile ? "16px 14px" : "18px 16px", backdropFilter: "blur(12px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1, textTransform: "uppercase" }}>Dia selecionado</p>
              {isMobile && <button type="button" onClick={function(){setMobileCreateOpen(false); resetForm();}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.45)",padding:"6px 10px",cursor:"pointer"}}>Fechar</button>}
            </div>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500, textTransform: "capitalize", color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{selDateLabel}</h3>

            {!readOnly && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <input value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="Título do evento..."
                  onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) addOrUpdateEvent(); }}
                  style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "11px 12px", fontSize: isMobile ? 16 : 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                <textarea value={notes} onChange={function(e) { setNotes(e.target.value); }} placeholder="Notas (opcional)..." rows={3}
                  style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "10px 12px", fontSize: isMobile ? 16 : 12, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                  <input type="checkbox" checked={allDay} onChange={function(e) { setAllDay(e.target.checked); }} style={{ accentColor: ACCENT }} />
                  Dia todo (sem hora)
                </label>
                {!allDay && (
                  <>
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Início</label>
                    <input type="time" value={time} onChange={function(e) { setTime(e.target.value); setEndTime(addMinutes(e.target.value, duration)); }}
                      style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: ACCENT, padding: "9px 12px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", outline: "none", boxSizing: "border-box" }} />
                    <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Fim</label>
                    <input type="time" value={endTime} onChange={function(e) { setEndTime(e.target.value); setDuration(durationFromTimes(time, e.target.value)); }}
                      style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "9px 12px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", outline: "none", boxSizing: "border-box" }} />
                    <p style={{margin:"-2px 0 0",fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"rgba(255,255,255,0.3)"}}>Duração: {durationLabel(durationFromTimes(time, endTime))}</p>
                  </>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {COLORS.map(function(c) {
                    return (
                      <button type="button" key={c} onClick={function() { setColor(c); }}
                        style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer", opacity: color === c ? 1 : 0.55 }} />
                    );
                  })}
                </div>
                {!editId && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>REPETIR NESTA SEMANA</p>
                    <div style={{ display: "flex", gap: 6 }}>
                      {WEEKDAYS.map(function(w, i) {
                        var isSelDay = i === selectedDow;
                        var on = repeatDays[i];
                        return (
                          <button type="button" key={w} onClick={function() { if (!isSelDay) toggleRepeat(i); }} disabled={isSelDay} title={isSelDay ? "Dia base" : "Copiar para " + w}
                            style={{
                              flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
                              border: "1px solid " + (isSelDay ? ACCENT + "60" : on ? ACCENT + "40" : "rgba(255,255,255,0.08)"),
                              background: isSelDay ? ACCENT + "20" : on ? ACCENT + "12" : "transparent",
                              color: isSelDay ? ACCENT : on ? ACCENT : "rgba(255,255,255,0.35)",
                              cursor: isSelDay ? "default" : "pointer", opacity: isSelDay ? 1 : 0.9,
                            }}>{w.slice(0, 1)}</button>
                        );
                      })}
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.4 }}>O dia selecionado é sempre incluído. Marca outros dias para criar o mesmo evento.</p>
                  </div>
                )}
                <button type="button" onClick={addOrUpdateEvent}
                  style={{ width: "100%", background: ACCENT + "18", border: "1px solid " + ACCENT + "40", borderRadius: 10, color: ACCENT, fontSize: 12, padding: "11px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>
                  {editId ? "Guardar alterações" : "Adicionar evento"}
                </button>
                {editId && (
                  <button type="button" onClick={resetForm} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "inherit" }}>Cancelar edição</button>
                )}
              </div>
            )}

            {readOnly && <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>Modo só visualização — ativa «Editar» no topo para alterar eventos.</p>}

            {dayEvents.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>{readOnly ? "Sem eventos neste dia." : "Sem eventos. Preenche o formulário acima."}</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, maxHeight: readOnly ? 420 : 280, overflow: "auto" }}>
                {dayEvents.map(function(ev) {
                  return <EventCard key={ev.id} ev={ev} readOnly={readOnly} onEdit={startEdit} onDelete={deleteEvent} />;
                })}
              </ul>
            )}
          </div>
        </aside>}
      </main>
      {isMobile && !mobileCreateOpen && (
        <div data-no-canvas-zoom style={{position:"fixed",left:10,right:76,bottom:12,zIndex:50,background:"rgba(8,10,16,0.88)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:"10px 12px",backdropFilter:"blur(18px)",boxShadow:"0 16px 60px rgba(0,0,0,0.45)"}}>
          <p style={{margin:"0 0 6px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:ACCENT,textTransform:"uppercase"}}>{selDateLabel}</p>
          {dayEvents.length ? <div data-scrollable style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>{dayEvents.map(function(ev){return <button key={ev.id} onClick={function(){openPopup(ev, selected);}} style={{flexShrink:0,maxWidth:180,background:(ev.color||ACCENT)+"18",border:"1px solid "+(ev.color||ACCENT)+"35",borderRadius:12,color:ev.color||ACCENT,padding:"8px 10px",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatEventTime(ev)} · {ev.title}</button>;})}</div> : <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.32)"}}>Sem eventos neste dia.</p>}
        </div>
      )}
      {isMobile && (
        <button type="button" onClick={function(){resetForm(); setMobileCreateOpen(true);}} style={{position:"fixed",right:14,bottom:16,zIndex:55,width:52,height:52,borderRadius:"50%",border:"1px solid "+ACCENT+"55",background:ACCENT+"20",color:ACCENT,fontSize:28,cursor:"pointer",boxShadow:"0 14px 50px rgba(0,255,200,0.22)",backdropFilter:"blur(14px)"}}>+</button>
      )}
      {popup && <EventPopup event={popup.event} dayKey={popup.dayKey} onClose={function() { setPopup(null); }} onSave={savePopup} onDelete={deletePopup} />}
    </div>
  );
}
