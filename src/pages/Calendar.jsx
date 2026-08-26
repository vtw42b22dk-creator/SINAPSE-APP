/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as calendarStore from "../lib/calendarStore";
import { MICRO_CSS, attachSwipe } from "../lib/microUi";
import { PageLoader } from "../components/PageLoader";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";

var ACCENT = moduleColor("calendar");
var WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
var COLORS = ["#E6E6E9", "#A0A0A8", "#8FB39B", "#C4A57C", "#C08C8C", "#8FA8C4"];
var HOUR_H = 52;
var WK_HOUR_H = 42;
var HOURS = 24;
var WK_START = 6;
var SNAP = 15;

var CHRO_CSS = [
  MICRO_CSS,
  MODULE_GLOW_CSS,
  "@keyframes chIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  "@keyframes chSlideL{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:none}}",
  "@keyframes chSlideR{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:none}}",
  "@keyframes chNow{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(230,230,233,.4)}50%{opacity:.7;box-shadow:0 0 14px 2px rgba(230,230,233,.25)}}",
  ".ch-root{height:100vh;height:100dvh;display:flex;flex-direction:column;background:#070708;color:#EDEDEF;font-family:'IBM Plex Sans',sans-serif;overflow:hidden;position:relative}",
  ".ch-glow{position:fixed;border-radius:50%;pointer-events:none;filter:blur(90px);opacity:.55;z-index:0;transition:background 1s var(--ease)}",
  ".ch-glow--a{width:420px;height:420px;top:-10%;right:-8%}",
  ".ch-glow--b{width:300px;height:300px;bottom:8%;left:-6%;opacity:.35}",
  ".ch-head{flex-shrink:0;padding:16px 20px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(7,7,8,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:30}",
  ".ch-back{padding:6px 2px;border:none;border-bottom:1px solid rgba(255,255,255,.14);background:transparent;color:#A0A0A8;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".ch-back:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".ch-hero{flex:1;min-width:0;animation:chIn var(--dur-slow) var(--ease) both}",
  ".ch-day-num{font-family:'JetBrains Mono',monospace;font-weight:300;font-size:clamp(52px,10vw,76px);line-height:.85;letter-spacing:-0.06em;color:#EDEDEF;margin:0}",
  ".ch-day-meta{margin:8px 0 0;font-size:13px;color:#A0A0A8;text-transform:capitalize;letter-spacing:.2px}",
  ".ch-day-meta strong{color:#EDEDEF;font-weight:500;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-right:8px}",
  ".ch-actions{display:flex;flex-direction:column;align-items:flex-end;gap:14px;flex-shrink:0}",
  ".ch-modes{display:flex;gap:0;padding:3px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}",
  ".ch-mode{padding:10px 16px;border:none;border-bottom:2px solid transparent;background:transparent;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.5px;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".ch-mode:hover{color:#A0A0A8;background:rgba(255,255,255,.03)}",
  ".ch-mode.is-on{color:#EDEDEF;border-bottom-color:#EDEDEF;background:rgba(255,255,255,.06)}",
  ".ch-mode:active{transform:scale(.96)}",
  ".ch-quick{display:flex;gap:6px;align-items:center;padding:5px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}",
  ".ch-btn{padding:11px 16px;border:1px solid rgba(255,255,255,.1);border-bottom:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#A0A0A8;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.2px;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".ch-btn:hover{color:#EDEDEF;background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.2)}",
  ".ch-btn:active{transform:scale(.97)}",
  ".ch-btn--accent{color:#EDEDEF;background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}",
  ".ch-btn--accent:hover{background:rgba(255,255,255,.14)}",
  ".ch-btn--nav{padding:11px 14px;font-size:15px;line-height:1;color:#EDEDEF}",
  ".ch-rail{flex-shrink:0;display:flex;gap:0;overflow-x:auto;padding:0 16px 12px;-webkit-overflow-scrolling:touch;scrollbar-width:none;border-bottom:1px solid rgba(255,255,255,.05)}",
  ".ch-rail::-webkit-scrollbar{display:none}",
  ".ch-rail-day{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px;border:none;background:transparent;color:#6E6E76;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease);position:relative}",
  ".ch-rail-day::after{content:'';position:absolute;bottom:0;left:20%;right:20%;height:2px;background:#EDEDEF;transform:scaleX(0);transition:transform var(--dur) var(--ease)}",
  ".ch-rail-day:hover{color:#A0A0A8}",
  ".ch-rail-day.is-on{color:#EDEDEF}",
  ".ch-rail-day.is-on::after{transform:scaleX(1)}",
  ".ch-rail-day.is-today .ch-rail-n{color:#EDEDEF}",
  ".ch-rail-dow{font-size:9px;letter-spacing:1px;opacity:.55}",
  ".ch-rail-n{font-size:18px;font-weight:400;line-height:1}",
  ".ch-rail-dot{width:4px;height:4px;border-radius:50%;background:#EDEDEF;opacity:0;transition:opacity var(--dur) var(--ease)}",
  ".ch-rail-day.has-ev .ch-rail-dot{opacity:.45}",
  ".ch-rail-day.is-on .ch-rail-dot{opacity:1}",
  ".ch-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
  ".ch-stage{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column}",
  ".ch-stage--left{animation:chSlideL .36s var(--ease) both}",
  ".ch-stage--right{animation:chSlideR .36s var(--ease) both}",
  ".ch-stream-wrap{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:0 16px 80px}",
  ".ch-allday{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:8px}",
  ".ch-allday-lbl{margin:0 0 10px;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:1.8px;color:#6E6E76;text-transform:uppercase}",
  ".ch-allday-row{display:flex;align-items:center;gap:12px;width:100%;padding:12px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:transparent;text-align:left;cursor:pointer;transition:padding-left var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".ch-allday-row:hover{padding-left:6px;border-bottom-color:rgba(255,255,255,.14)}",
  ".ch-allday-bar{width:3px;align-self:stretch;flex-shrink:0;background:var(--ec)}",
  ".ch-allday-title{margin:0;font-size:14px;color:#EDEDEF;line-height:1.4}",
  ".ch-track{position:relative;margin-left:48px;min-height:" + (HOURS * HOUR_H) + "px}",
  ".ch-hour{position:absolute;left:-48px;right:0;height:" + HOUR_H + "px;border-top:1px solid rgba(255,255,255,.05);cursor:pointer;transition:background var(--dur) var(--ease)}",
  ".ch-hour:hover{background:rgba(255,255,255,.02)}",
  ".ch-hour-lbl{position:absolute;left:-48px;top:-7px;width:40px;text-align:right;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76}",
  ".ch-now{position:absolute;left:-52px;right:0;height:2px;background:#EDEDEF;z-index:20;pointer-events:none;animation:chNow 2.4s ease infinite}",
  ".ch-now-dot{position:absolute;left:0;top:-4px;width:8px;height:8px;border-radius:50%;background:#EDEDEF}",
  ".ch-now-time{position:absolute;left:-48px;top:-8px;font-size:9px;font-family:'JetBrains Mono',monospace;color:#EDEDEF;font-weight:500}",
  ".ch-ev{position:absolute;left:0;right:8px;z-index:10;display:flex;align-items:stretch;min-height:28px;cursor:grab;touch-action:none;transition:transform .2s var(--ease),filter .2s}",
  ".ch-ev:hover{transform:translateX(4px);filter:brightness(1.1);z-index:15}",
  ".ch-ev.is-edit{outline:1px solid #EDEDEF;outline-offset:2px;z-index:25}",
  ".ch-ev-bar{width:3px;flex-shrink:0;background:var(--ec)}",
  ".ch-ev-body{flex:1;min-width:0;padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}",
  ".ch-ev-time{margin:0;font-size:9px;font-family:'JetBrains Mono',monospace;color:var(--ec);letter-spacing:.3px}",
  ".ch-ev-title{margin:3px 0 0;font-size:12px;color:#EDEDEF;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".ch-wk{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
  ".ch-wk-board{min-width:100%}",
  ".ch-wk-board--mob{min-width:640px}",
  ".ch-wk-strip-row{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));position:sticky;top:0;z-index:14;background:rgba(7,7,8,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08)}",
  ".ch-wk-strip-gap{grid-column:1}",
  ".ch-wk-strip-cell{grid-column:span 1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 2px 14px;border:none;border-left:1px solid rgba(255,255,255,.05);background:transparent;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:background var(--dur) var(--ease),transform var(--dur-fast) var(--ease);position:relative}",
  ".ch-wk-strip-cell:first-of-type{border-left:none}",
  ".ch-wk-strip-cell:hover{background:rgba(255,255,255,.04)}",
  ".ch-wk-strip-cell.is-on{background:rgba(255,255,255,.06)}",
  ".ch-wk-strip-cell.is-on::after{content:'';position:absolute;bottom:0;left:12%;right:12%;height:2px;background:#EDEDEF}",
  ".ch-wk-strip-dow{font-size:10px;color:#6E6E76;letter-spacing:.6px}",
  ".ch-wk-strip-num{font-size:17px;color:#A0A0A8;line-height:1;font-weight:400}",
  ".ch-wk-strip-cell.is-on .ch-wk-strip-num,.ch-wk-strip-cell.is-today .ch-wk-strip-num{color:#EDEDEF}",
  ".ch-wk-strip-cell.is-today .ch-wk-strip-num{box-shadow:0 0 0 1px rgba(255,255,255,.25);padding:4px 7px}",
  ".ch-wk-load{width:calc(100% - 8px);max-width:52px;height:2px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:2px}",
  ".ch-wk-load i{display:block;height:100%;background:linear-gradient(90deg,rgba(255,255,255,.35),#EDEDEF);transition:width var(--dur-slow) var(--ease)}",
  ".ch-wk-scroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}",
  ".ch-wk-allday{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));gap:0;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}",
  ".ch-wk-allday-lbl{grid-column:1;font-size:9px;font-family:'JetBrains Mono',monospace;color:#6E6E76;text-align:right;padding:4px 8px 0 0;line-height:1.2;letter-spacing:.4px}",
  ".ch-wk-allday-col{padding:2px 4px;display:flex;flex-direction:column;gap:3px;min-width:0;border-left:1px solid rgba(255,255,255,.05)}",
  ".ch-wk-allday-col:first-of-type{border-left:none}",
  ".ch-wk-allday-chip{padding:5px 7px;border:none;border-left:3px solid var(--ec);background:rgba(255,255,255,.05);color:#EDEDEF;font-size:10px;text-align:left;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;transition:padding-left var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".ch-wk-allday-chip:hover{padding-left:10px;background:rgba(255,255,255,.08)}",
  ".ch-wk-grid{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));min-height:" + (HOURS * WK_HOUR_H) + "px}",
  ".ch-wk-gutter{position:relative;grid-column:1;border-right:1px solid rgba(255,255,255,.06)}",
  ".ch-wk-gutter-lbl{position:absolute;right:8px;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76}",
  ".ch-wk-cols{grid-column:2/-1;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));position:relative;min-width:0}",
  ".ch-wk-col{position:relative;border-left:1px solid rgba(255,255,255,.06);min-height:" + (HOURS * WK_HOUR_H) + "px}",
  ".ch-wk-col:first-child{border-left:none}",
  ".ch-wk-col.is-on{background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.01) 100%)}",
  ".ch-wk-col.is-today{background:linear-gradient(180deg,rgba(255,255,255,.03) 0%,transparent 40%)}",
  ".ch-wk-hour{position:absolute;left:0;right:0;border-top:1px solid rgba(255,255,255,.05);cursor:pointer;transition:background var(--dur) var(--ease)}",
  ".ch-wk-hour:hover{background:rgba(255,255,255,.03)}",
  ".ch-wk-now{position:absolute;left:0;right:0;height:2px;background:#EDEDEF;z-index:18;pointer-events:none;animation:chNow 2.4s ease infinite;box-shadow:0 0 8px rgba(230,230,233,.35)}",
  ".ch-wk-now-dot{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:#EDEDEF}",
  ".ch-wk-ev{position:absolute;z-index:10;display:flex;min-height:24px;cursor:grab;touch-action:none;overflow:hidden;transition:transform .18s var(--ease),filter .18s,box-shadow .18s,z-index 0s}",
  ".ch-wk-ev:hover{transform:translateY(-1px);filter:brightness(1.1);z-index:16;box-shadow:0 4px 12px rgba(0,0,0,.25)}",
  ".ch-wk-ev.is-edit{z-index:24;outline:1px solid #EDEDEF;outline-offset:1px}",
  ".ch-wk-ev-bar{width:3px;flex-shrink:0;background:var(--ec);box-shadow:0 0 8px color-mix(in srgb,var(--ec) 40%,transparent)}",
  ".ch-wk-ev-body{flex:1;min-width:0;padding:4px 6px;background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border-bottom:1px solid rgba(255,255,255,.08)}",
  ".ch-wk-ev-t{margin:0;font-size:9px;font-family:'JetBrains Mono',monospace;color:var(--ec);line-height:1.2;opacity:.9}",
  ".ch-wk-ev-n{margin:2px 0 0;font-size:10px;color:#EDEDEF;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".ch-wk-ev--ghost{opacity:.55;pointer-events:none;z-index:30}",
  ".ch-wk-scroll-h{overflow-x:auto;overflow-y:auto}",
  ".ch-week-hero{font-family:'JetBrains Mono',monospace;font-weight:300;font-size:clamp(30px,5vw,44px);line-height:1.05;letter-spacing:-0.03em;color:#EDEDEF;margin:0}",
  ".ch-week-hero span{font-size:.5em;color:var(--mc);font-weight:400;letter-spacing:1.2px;display:block;margin-bottom:8px;text-transform:uppercase}",
  ".ch-month{flex:1;overflow-y:auto;padding:16px 20px 80px;-webkit-overflow-scrolling:touch}",
  ".ch-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:0;margin-bottom:8px}",
  ".ch-month-wd{text-align:center;font-size:9px;font-family:'JetBrains Mono',monospace;color:#6E6E76;padding:6px 0;letter-spacing:1px}",
  ".ch-month-cell{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:none;background:transparent;color:#A0A0A8;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease);position:relative}",
  ".ch-month-cell:hover{color:#EDEDEF;transform:scale(1.05)}",
  ".ch-month-cell.is-out{opacity:.25}",
  ".ch-month-cell.is-on{color:#EDEDEF}",
  ".ch-month-cell.is-on::after{content:'';position:absolute;bottom:8px;width:16px;height:2px;background:#EDEDEF}",
  ".ch-month-cell.is-today{font-weight:600;color:#EDEDEF}",
  ".ch-month-n{font-size:14px;line-height:1}",
  ".ch-month-bars{display:flex;gap:2px;height:3px;align-items:flex-end}",
  ".ch-month-bar{width:3px;background:var(--ec);opacity:.7}",
  ".ch-sheet-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;animation:chIn var(--dur-fast) var(--ease) both}",
  ".ch-sheet-bg--desk{align-items:center;padding:20px}",
  ".ch-sheet{width:100%;max-height:88vh;overflow-y:auto;background:#070708;border-top:1px solid rgba(255,255,255,.14);padding:24px 20px max(24px,env(safe-area-inset-bottom));animation:uiSlideUp var(--dur-slow) var(--ease) both}",
  ".ch-sheet--desk{width:min(440px,94vw);max-height:90vh;border-top:none;border-bottom:1px solid rgba(255,255,255,.14)}",
  ".ch-sheet-lbl{margin:0 0 18px;font-size:10px;font-family:'JetBrains Mono',monospace;letter-spacing:1.8px;color:#6E6E76;text-transform:uppercase}",
  ".ch-field{margin-bottom:16px}",
  ".ch-lbl{display:block;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:1.4px;color:#6E6E76;margin-bottom:8px;text-transform:uppercase}",
  ".ch-in{width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.12);color:#EDEDEF;padding:10px 2px;font-size:14px;font-family:inherit;outline:none;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".ch-in:focus{border-bottom-color:rgba(255,255,255,.4);padding-left:4px}",
  ".ch-row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}",
  ".ch-colors{display:flex;gap:12px;flex-wrap:wrap}",
  ".ch-color{width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:transform var(--dur-fast) var(--ease),border-color var(--dur) var(--ease)}",
  ".ch-color:hover{transform:scale(1.1)}",
  ".ch-color.is-on{border-color:#EDEDEF;transform:scale(1.08)}",
  ".ch-rep{display:flex;gap:4px}",
  ".ch-rep-btn{flex:1;padding:8px 0;border:none;border-bottom:1px solid rgba(255,255,255,.1);background:transparent;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:10px;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".ch-rep-btn.is-on,.ch-rep-btn.is-base{color:var(--rc);border-bottom-color:var(--rc)}",
  ".ch-sheet-actions{display:flex;gap:14px;margin-top:22px;flex-wrap:wrap}",
  ".ch-save{padding:10px 4px;border:none;border-bottom:2px solid #EDEDEF;background:transparent;color:#EDEDEF;font-family:'JetBrains Mono',monospace;font-size:12px;cursor:pointer}",
  ".ch-del{padding:10px 4px;border:none;border-bottom:1px solid rgba(192,140,140,.4);background:transparent;color:#C08C8C;font-size:12px;cursor:pointer;font-family:inherit}",
  ".ch-cancel{padding:10px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#6E6E76;font-size:12px;cursor:pointer;font-family:inherit}",
  ".ch-fab{position:fixed;z-index:50;right:20px;bottom:max(20px,env(safe-area-inset-bottom));padding:10px 4px;border:none;border-bottom:2px solid #EDEDEF;background:transparent;color:#EDEDEF;font-size:24px;font-weight:300;line-height:1;cursor:pointer;transition:transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease)}",
  ".ch-fab:hover{transform:scale(1.08)}",
  ".ch-fab:active{transform:scale(.92)}",
  "@media(max-width:719px){.ch-head{padding:14px 16px 12px;flex-wrap:wrap}.ch-actions{width:100%;flex-direction:column;align-items:stretch}.ch-modes{justify-content:center}.ch-quick{flex-wrap:wrap;justify-content:center}.ch-btn{flex:1;min-width:72px;text-align:center}.ch-track{margin-left:40px}.ch-hour-lbl{left:-40px;width:34px;font-size:9px}.ch-wk-board--mob{min-width:560px}}",
  "@media(min-width:720px){.ch-fab{display:none}}",
].join("");

function uid() { return "e" + Date.now() + Math.random().toString(36).slice(2, 7); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dateKey(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }
function parseKey(k) {
  var p = k.split("-");
  return { y: +p[0], m: +p[1] - 1, d: +p[2] };
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
function monthDayKeys(view) {
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
  return cells.map(function(c) {
    return Object.assign({}, c, { key: dateKey(c.y, c.m, c.d) });
  });
}
function sortEvents(list) {
  return list.slice().sort(function(a, b) {
    if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
    return (a.time || "").localeCompare(b.time || "");
  });
}
function timeToMin(t) {
  if (!t) return 0;
  var p = t.split(":");
  return (+p[0]) * 60 + (+p[1] || 0);
}
function minToTime(m) {
  m = Math.max(0, Math.min(1439, m));
  return pad(Math.floor(m / 60)) + ":" + pad(m % 60);
}
function snapMin(m) { return Math.round(m / SNAP) * SNAP; }
function evDuration(ev) { return ev.allDay ? 1440 : Math.max(SNAP, ev.duration || 60); }
function durationLabel(minutes) {
  if (minutes >= 60) {
    var h = Math.floor(minutes / 60), r = minutes % 60;
    return r ? h + "h " + r + "m" : h + "h";
  }
  return minutes + " min";
}
function addMinutes(t, minutes) { return minToTime(timeToMin(t) + minutes); }
function eventEndTime(ev) {
  if (ev.allDay || !ev.time) return null;
  return minToTime(timeToMin(ev.time) + evDuration(ev));
}
function durationFromTimes(start, end) {
  return Math.max(SNAP, snapMin(timeToMin(end) - timeToMin(start)));
}
function formatEventTime(ev) {
  if (ev.allDay) return "Dia todo";
  return ev.time + " – " + eventEndTime(ev);
}
function layoutDayEvents(list) {
  var timed = list.filter(function(ev) { return !ev.allDay && ev.time; });
  timed.sort(function(a, b) { return timeToMin(a.time) - timeToMin(b.time); });
  var colEnds = [];
  return timed.map(function(ev) {
    var start = timeToMin(ev.time);
    var dur = evDuration(ev);
    var col = 0;
    for (var i = 0; i < colEnds.length; i++) {
      if (colEnds[i] <= start) { col = i; break; }
      col = i + 1;
    }
    if (col >= colEnds.length) colEnds.push(start + dur);
    else colEnds[col] = start + dur;
    return { ev: ev, start: start, dur: dur, col: col, cols: colEnds.length };
  });
}
function scrollToNow(el, dayKey, todayKey, smooth) {
  if (!el || dayKey !== todayKey) return;
  var t = new Date();
  var top = (t.getHours() * 60 + t.getMinutes()) / 60 * HOUR_H - el.clientHeight * 0.3;
  if (smooth && el.scrollTo) el.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  else el.scrollTop = Math.max(0, top);
}

/* ── Timeline do dia ── */
function DayStream(props) {
  var scrollRef = useRef(null);
  var trackRef = useRef(null);
  var dragRef = useRef(null);
  var tickS = useState(0);
  useEffect(function() {
    var id = setInterval(function() { tickS[1](Date.now()); }, 1000);
    return function() { clearInterval(id); };
  }, []);

  var dayKey = props.dayKey;
  var allDay = useMemo(function() {
    return sortEvents((props.events[dayKey] || []).filter(function(ev) { return ev.allDay; }));
  }, [dayKey, props.events]);
  var laid = useMemo(function() {
    return layoutDayEvents(props.events[dayKey] || []);
  }, [dayKey, props.events]);

  var nowTop = useMemo(function() {
    if (dayKey !== props.todayKey) return null;
    var t = new Date();
    return (t.getHours() * 60 + t.getMinutes()) / 60 * HOUR_H;
  }, [dayKey, props.todayKey, tickS[0]]);

  useEffect(function() {
    scrollToNow(scrollRef.current, dayKey, props.todayKey, !!props.scrollNow);
  }, [dayKey, props.todayKey, props.scrollNow]);

  function posFromY(clientY) {
    var el = trackRef.current;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var y = clientY - r.top;
    return snapMin(Math.floor(y / HOUR_H) * 60 + Math.round(((y % HOUR_H) / HOUR_H) * 60));
  }

  function onHourClick(mins) {
    if (props.readOnly) return;
    props.onSlotClick(dayKey, mins);
  }

  function onEvPointerDown(e, ev) {
    if (props.readOnly) return;
    e.stopPropagation();
    var startMin = timeToMin(ev.time);
    var dur = evDuration(ev);
    dragRef.current = { id: ev.id, startMin: startMin, dur: dur, startY: e.clientY, moved: false };
    function onMove(pe) {
      if (!dragRef.current) return;
      if (Math.abs(pe.clientY - dragRef.current.startY) > 8) dragRef.current.moved = true;
    }
    function onUp(pe) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!dragRef.current) return;
      var d = dragRef.current;
      dragRef.current = null;
      if (!d.moved) { props.onEventClick(ev, dayKey); return; }
      var mins = posFromY(pe.clientY);
      if (mins != null && props.onMove) {
        mins = Math.max(0, Math.min(1440 - d.dur, mins));
        props.onMove(ev.id, dayKey, dayKey, minToTime(mins), d.dur);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div ref={scrollRef} className="ch-stream-wrap">
      {allDay.length > 0 ? (
        <div className="ch-allday">
          <p className="ch-allday-lbl">Dia todo</p>
          {allDay.map(function(ev) {
            var c = ev.color || ACCENT;
            return (
              <button key={ev.id} type="button" className="ch-allday-row ui-tap" style={{ "--ec": c }}
                onClick={function() { props.onEventClick(ev, dayKey); }}>
                <span className="ch-allday-bar" />
                <span className="ch-allday-title">{ev.title || "Sem título"}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div ref={trackRef} className="ch-track">
        {Array.from({ length: HOURS }, function(_, h) {
          return (
            <div key={h} className="ch-hour" style={{ top: h * HOUR_H }}
              onClick={function() { onHourClick(h * 60); }}>
              <span className="ch-hour-lbl">{pad(h)}:00</span>
            </div>
          );
        })}
        {nowTop != null ? (
          <div className="ch-now" style={{ top: nowTop }}>
            <span className="ch-now-dot" />
            <span className="ch-now-time">{pad(new Date().getHours())}:{pad(new Date().getMinutes())}</span>
          </div>
        ) : null}
        {laid.map(function(seg) {
          var ev = seg.ev;
          var c = ev.color || ACCENT;
          var top = (seg.start / 60) * HOUR_H;
          var h = Math.max(28, (seg.dur / 60) * HOUR_H - 2);
          var w = 100 / Math.max(1, seg.cols);
          var isEdit = props.editId === ev.id;
          return (
            <div key={ev.id} className={"ch-ev" + (isEdit ? " is-edit" : "")} style={{
              "--ec": c, top: top, height: h,
              left: (seg.col / seg.cols * 100) + "%",
              width: "calc(" + w + "% - 4px)",
            }} onPointerDown={function(e) { onEvPointerDown(e, ev); }}>
              <span className="ch-ev-bar" />
              <div className="ch-ev-body">
                <p className="ch-ev-time">{ev.time} · {durationLabel(seg.dur)}</p>
                <p className="ch-ev-title">{ev.title || "Sem título"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function dayLoadMinutes(dayKey, events) {
  return (events[dayKey] || []).reduce(function(sum, ev) {
    if (ev.allDay) return sum + 240;
    return sum + evDuration(ev);
  }, 0);
}

function formatWeekRange(weekDays) {
  var a = parseKey(weekDays[0]), b = parseKey(weekDays[6]);
  var da = new Date(a.y, a.m, a.d), db = new Date(b.y, b.m, b.d);
  if (a.m === b.m) return da.getDate() + "–" + db.getDate() + " " + da.toLocaleDateString("pt-PT", { month: "short" });
  return da.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }) + " – " + db.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function WeekStrip(props) {
  var maxLoad = useMemo(function() {
    return Math.max(60, Math.max.apply(null, props.weekDays.map(function(k) { return dayLoadMinutes(k, props.events); })));
  }, [props.weekDays, props.events]);
  return (
    <div className="ch-wk-strip-row" role="tablist" aria-label="Dias da semana">
      <div className="ch-wk-strip-gap" aria-hidden="true" />
      {props.weekDays.map(function(k, i) {
        var p = parseKey(k);
        var load = dayLoadMinutes(k, props.events);
        var isOn = k === props.selected;
        var isToday = k === props.todayKey;
        return (
          <button key={k} type="button" role="tab" aria-selected={isOn}
            className={"ch-wk-strip-cell ui-tap" + (isOn ? " is-on" : "") + (isToday ? " is-today" : "")}
            onClick={function() { props.onSelectDay(k); }}>
            <span className="ch-wk-strip-dow">{WEEKDAYS[i]}</span>
            <span className="ch-wk-strip-num">{p.d}</span>
            <span className="ch-wk-load"><i style={{ width: Math.round(load / maxLoad * 100) + "%", opacity: load ? 1 : 0.12 }} /></span>
          </button>
        );
      })}
    </div>
  );
}

function WeekPlanner(props) {
  var scrollRef = useRef(null);
  var gridRef = useRef(null);
  var dragRef = useRef(null);
  var previewS = useState(null);
  var preview = previewS[0], setPreview = previewS[1];
  var tickS = useState(0);
  useEffect(function() {
    var id = setInterval(function() { tickS[1](Date.now()); }, 1000);
    return function() { clearInterval(id); };
  }, []);

  var weekDays = props.weekDays;

  var allDayRows = useMemo(function() {
    return weekDays.map(function(k) {
      return sortEvents((props.events[k] || []).filter(function(ev) { return ev.allDay; }));
    });
  }, [weekDays, props.events]);
  var hasAllDay = allDayRows.some(function(l) { return l.length > 0; });

  var nowLine = useMemo(function() {
    var idx = weekDays.indexOf(props.todayKey);
    if (idx < 0) return null;
    var t = new Date();
    return { dayIdx: idx, top: (t.getHours() * 60 + t.getMinutes()) / 60 * WK_HOUR_H };
  }, [weekDays, props.todayKey, tickS[0]]);

  useEffect(function() {
    var el = scrollRef.current;
    if (!el) return;
    var head = el.querySelector(".ch-wk-strip-row");
    var allday = el.querySelector(".ch-wk-allday");
    var offset = (head ? head.offsetHeight : 0) + (allday ? allday.offsetHeight : 0);
    if (weekDays.indexOf(props.todayKey) >= 0) {
      var t = new Date();
      var top = offset + (t.getHours() * 60 + t.getMinutes()) / 60 * WK_HOUR_H - el.clientHeight * 0.25;
      if (props.scrollNow) el.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      else el.scrollTop = Math.max(0, top);
    } else {
      el.scrollTop = offset + WK_START * WK_HOUR_H;
    }
  }, [weekDays[0], props.todayKey, props.scrollNow, hasAllDay]);

  function posFromPointer(clientX, clientY, dur) {
    var el = gridRef.current;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var x = clientX - r.left;
    var y = clientY - r.top;
    var colW = r.width / 7;
    var dayIdx = Math.floor(x / colW);
    if (dayIdx < 0 || dayIdx > 6) return null;
    var mins = snapMin(Math.floor(y / WK_HOUR_H) * 60 + Math.round(((y % WK_HOUR_H) / WK_HOUR_H) * 60));
    mins = Math.max(0, Math.min(HOURS * 60 - (dur || 15), mins));
    return { dayIdx: dayIdx, minutes: mins, key: weekDays[dayIdx] };
  }

  function onColPointerDown(e, dayIdx) {
    if (props.readOnly || dragRef.current) return;
    var p = posFromPointer(e.clientX, e.clientY, 15);
    if (!p) return;
    var slotRef = { minutes: p.minutes, moved: false, startX: e.clientX, startY: e.clientY };
    function onMove(pe) {
      if (Math.abs(pe.clientX - slotRef.startX) + Math.abs(pe.clientY - slotRef.startY) > 10) slotRef.moved = true;
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!slotRef.moved) props.onSlotClick(weekDays[dayIdx], slotRef.minutes);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onEvPointerDown(e, ev, dayKey, dayIdx) {
    if (props.readOnly) return;
    e.stopPropagation();
    if (e.pointerType === "mouse") e.preventDefault();
    var dur = evDuration(ev);
    var startMin = timeToMin(ev.time);
    dragRef.current = { id: ev.id, fromKey: dayKey, dayIdx: dayIdx, dur: dur, startX: e.clientX, startY: e.clientY, moved: false, color: ev.color || ACCENT, title: ev.title };
    setPreview({ id: ev.id, dayIdx: dayIdx, minutes: startMin, dur: dur, color: ev.color || ACCENT, title: ev.title });

    function onMove(pe) {
      if (!dragRef.current) return;
      if (Math.abs(pe.clientX - dragRef.current.startX) + Math.abs(pe.clientY - dragRef.current.startY) > 6) dragRef.current.moved = true;
      var np = posFromPointer(pe.clientX, pe.clientY, dragRef.current.dur);
      if (np) setPreview({ id: dragRef.current.id, dayIdx: np.dayIdx, minutes: np.minutes, dur: dragRef.current.dur, color: dragRef.current.color, title: dragRef.current.title });
    }
    function onUp(pe) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!dragRef.current) return;
      var d = dragRef.current;
      dragRef.current = null;
      setPreview(null);
      if (!d.moved) { props.onEventClick(ev, dayKey); return; }
      var np = posFromPointer(pe.clientX, pe.clientY, d.dur);
      if (np && props.onMove) {
        var mins = Math.max(0, Math.min(1440 - d.dur, np.minutes));
        props.onMove(d.id, d.fromKey, np.key, minToTime(mins), d.dur);
        props.onSelectDay(np.key);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div className="ch-wk">
      <div ref={scrollRef} className={"ch-wk-scroll" + (props.isMobile ? " ch-wk-scroll-h" : "")}>
        <div className={"ch-wk-board" + (props.isMobile ? " ch-wk-board--mob" : "")}>
          <WeekStrip weekDays={weekDays} selected={props.selected} todayKey={props.todayKey} events={props.events} onSelectDay={props.onSelectDay} />
          {hasAllDay ? (
            <div className="ch-wk-allday">
              <span className="ch-wk-allday-lbl">dia</span>
              {allDayRows.map(function(list, i) {
                return (
                  <div key={weekDays[i]} className="ch-wk-allday-col">
                    {list.map(function(ev) {
                      return (
                        <button key={ev.id} type="button" className="ch-wk-allday-chip ui-tap" style={{ "--ec": ev.color || ACCENT }}
                          onClick={function() { props.onSelectDay(weekDays[i]); props.onEventClick(ev, weekDays[i]); }}>
                          {ev.title || "·"}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="ch-wk-grid">
            <div className="ch-wk-gutter">
              {Array.from({ length: HOURS }, function(_, h) {
                return (
                  <span key={h} className="ch-wk-gutter-lbl" style={{ top: h * WK_HOUR_H - 5 }}>{pad(h)}</span>
                );
              })}
            </div>
            <div ref={gridRef} className="ch-wk-cols">
            {weekDays.map(function(k, dayIdx) {
              var laid = layoutDayEvents(props.events[k] || []);
              var isOn = k === props.selected;
              var isToday = k === props.todayKey;
              return (
                <div key={k} className={"ch-wk-col" + (isOn ? " is-on" : "") + (isToday ? " is-today" : "")}
                  onPointerDown={function(e) {
                    if (e.target !== e.currentTarget && !e.target.classList.contains("ch-wk-hour")) return;
                    onColPointerDown(e, dayIdx);
                  }}>
                  {Array.from({ length: HOURS }, function(_, h) {
                    return (
                      <div key={h} className="ch-wk-hour" style={{ top: h * WK_HOUR_H, height: WK_HOUR_H }}
                        onPointerDown={function(e) { e.stopPropagation(); onColPointerDown(e, dayIdx); }} />
                    );
                  })}
                  {nowLine && nowLine.dayIdx === dayIdx ? (
                    <div className="ch-wk-now" style={{ top: nowLine.top }}><span className="ch-wk-now-dot" /></div>
                  ) : null}
                  {laid.map(function(seg) {
                    var ev = seg.ev;
                    if (preview && preview.id === ev.id) return null;
                    var c = ev.color || ACCENT;
                    var top = (seg.start / 60) * WK_HOUR_H;
                    var h = Math.max(20, (seg.dur / 60) * WK_HOUR_H - 1);
                    var w = 100 / Math.max(1, seg.cols);
                    var compact = h < 26;
                    var isEdit = props.editId === ev.id;
                    return (
                      <div key={ev.id} className={"ch-wk-ev" + (isEdit ? " is-edit" : "")} style={{
                        "--ec": c, top: top, height: h,
                        left: "calc(" + (seg.col / seg.cols * 100) + "% + 1px)",
                        width: "calc(" + w + "% - 2px)",
                      }} onPointerDown={function(e) { onEvPointerDown(e, ev, k, dayIdx); }}>
                        <span className="ch-wk-ev-bar" />
                        <div className="ch-wk-ev-body">
                          {!compact ? <p className="ch-wk-ev-t">{ev.time}</p> : null}
                          <p className="ch-wk-ev-n">{ev.title || "·"}</p>
                        </div>
                      </div>
                    );
                  })}
                  {preview && preview.dayIdx === dayIdx ? (
                    <div className="ch-wk-ev ch-wk-ev--ghost" style={{
                      "--ec": preview.color,
                      top: (preview.minutes / 60) * WK_HOUR_H,
                      height: Math.max(20, (preview.dur / 60) * WK_HOUR_H - 1),
                      left: 1, right: 1,
                    }}>
                      <span className="ch-wk-ev-bar" />
                      <div className="ch-wk-ev-body"><p className="ch-wk-ev-n">{preview.title || "Mover"}</p></div>
                    </div>
                  ) : null}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthBoard(props) {
  var cells = useMemo(function() { return monthDayKeys(props.view); }, [props.view]);
  return (
    <div className="ch-month">
      <div className="ch-month-grid">
        {WEEKDAYS.map(function(w) {
          return <div key={w} className="ch-month-wd">{w.slice(0, 1)}</div>;
        })}
        {cells.map(function(cell, i) {
          var k = cell.key;
          var evs = props.events[k] || [];
          var isOn = k === props.selected;
          var isToday = k === props.todayKey;
          return (
            <button key={k + i} type="button"
              className={"ch-month-cell" + (cell.outside ? " is-out" : "") + (isOn ? " is-on" : "") + (isToday ? " is-today" : "")}
              onClick={function() { props.onSelectDay(k, cell); }}>
              <span className="ch-month-n">{cell.d}</span>
              {evs.length > 0 ? (
                <span className="ch-month-bars">
                  {evs.slice(0, 4).map(function(ev, j) {
                    return <span key={j} className="ch-month-bar" style={{ "--ec": ev.color || ACCENT, height: (4 + j * 3) + "px" }} />;
                  })}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthRail(props) {
  var cells = useMemo(function() { return monthDayKeys(props.view); }, [props.view]);
  var railRef = useRef(null);
  useEffect(function() {
    var el = railRef.current;
    if (!el) return;
    var btn = el.querySelector("[data-sel='1']");
    if (btn && btn.scrollIntoView) btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [props.selected, props.view]);
  return (
    <div ref={railRef} className="ch-rail" role="tablist">
      {cells.filter(function(c) { return !c.outside; }).map(function(cell) {
        var k = cell.key;
        var hasEv = (props.events[k] || []).length > 0;
        var isOn = k === props.selected;
        var isToday = k === props.todayKey;
        var dow = WEEKDAYS[(new Date(cell.y, cell.m, cell.d).getDay() + 6) % 7];
        return (
          <button key={k} type="button" role="tab" aria-selected={isOn} data-sel={isOn ? "1" : "0"}
            className={"ch-rail-day ui-tap" + (isOn ? " is-on" : "") + (isToday ? " is-today" : "") + (hasEv ? " has-ev" : "")}
            onClick={function() { props.onSelectDay(k, cell); }}>
            <span className="ch-rail-dow">{dow}</span>
            <span className="ch-rail-n">{cell.d}</span>
            <span className="ch-rail-dot" />
          </button>
        );
      })}
    </div>
  );
}

function EventSheet(props) {
  if (!props.open) return null;
  var p = props;
  var ev = p.draft;
  var baseDow = (new Date(parseKey(p.dayKey).y, parseKey(p.dayKey).m, parseKey(p.dayKey).d).getDay() + 6) % 7;

  return (
    <div className={"ch-sheet-bg" + (p.isMobile ? "" : " ch-sheet-bg--desk")} onClick={p.onClose}>
      <div className={"ch-sheet" + (p.isMobile ? "" : " ch-sheet--desk")} onClick={function(e) { e.stopPropagation(); }}>
        <p className="ch-sheet-lbl">{p.isEdit ? "Editar evento" : "Novo evento"}</p>
        <div className="ch-field">
          <input className="ch-in ui-in" value={ev.title} onChange={function(e) { p.setDraft(Object.assign({}, ev, { title: e.target.value })); }}
            placeholder="Título" autoFocus onKeyDown={function(e) { if (e.key === "Enter") p.onSave(); if (e.key === "Escape") p.onClose(); }} />
        </div>
        <div className="ch-field">
          <label className="ch-lbl">Data</label>
          <input type="date" className="ch-in ui-in" value={p.dayKey}
            onChange={function(e) { if (e.target.value) p.onDayChange(e.target.value); }} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#A0A0A8", marginBottom: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={ev.allDay} onChange={function(e) { p.setDraft(Object.assign({}, ev, { allDay: e.target.checked })); }} />
          Dia todo
        </label>
        {!ev.allDay ? (
          <div className="ch-row2 ch-field">
            <div>
              <label className="ch-lbl">Início</label>
              <input type="time" className="ch-in ui-in" value={ev.time || "09:00"}
                onChange={function(e) { p.setDraft(Object.assign({}, ev, { time: e.target.value })); }} />
            </div>
            <div>
              <label className="ch-lbl">Fim</label>
              <input type="time" className="ch-in ui-in" value={ev.endTime || "10:00"}
                onChange={function(e) { p.setDraft(Object.assign({}, ev, { endTime: e.target.value })); }} />
            </div>
          </div>
        ) : null}
        <div className="ch-field">
          <label className="ch-lbl">Notas</label>
          <textarea className="ch-in ui-in" rows={3} value={ev.notes || ""} placeholder="Opcional…"
            onChange={function(e) { p.setDraft(Object.assign({}, ev, { notes: e.target.value })); }}
            style={{ resize: "vertical", lineHeight: 1.55 }} />
        </div>
        <div className="ch-field">
          <label className="ch-lbl">Cor</label>
          <div className="ch-colors">
            {COLORS.map(function(c) {
              return (
                <button key={c} type="button" className={"ch-color ui-tap" + (ev.color === c ? " is-on" : "")}
                  style={{ background: c }} onClick={function() { p.setDraft(Object.assign({}, ev, { color: c })); }} aria-label="Cor" />
              );
            })}
          </div>
        </div>
        <div className="ch-field">
          <label className="ch-lbl">Repetir na semana</label>
          <div className="ch-rep">
            {WEEKDAYS.map(function(w, i) {
              var isBase = i === baseDow;
              var on = p.repeatDays[i];
              return (
                <button key={w} type="button" disabled={isBase}
                  className={"ch-rep-btn ui-tap" + (isBase ? " is-base" : on ? " is-on" : "")}
                  style={{ "--rc": ev.color || ACCENT }}
                  onClick={function() { p.toggleRepeat(i); }}>{w.slice(0, 1)}</button>
              );
            })}
          </div>
        </div>
        <div className="ch-sheet-actions">
          <button type="button" className="ch-save ui-tap" onClick={p.onSave}>{p.isEdit ? "Guardar" : "Criar"}</button>
          {p.isEdit ? <button type="button" className="ch-del ui-tap" onClick={p.onDelete}>Apagar</button> : null}
          <button type="button" className="ch-cancel ui-tap" onClick={p.onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  var navigate = useNavigate();
  var vwS = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  var isMobile = vwS[0] < 720;
  var today = useMemo(function() { return new Date(); }, []);
  var todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  var viewS = useState({ y: today.getFullYear(), m: today.getMonth() });
  var view = viewS[0], setView = viewS[1];
  var selS = useState(todayKey);
  var selected = selS[0], setSelected = selS[1];
  var evS = useState({});
  var events = evS[0], setEvents = evS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var modeS = useState("week");
  var mode = modeS[0], setMode = modeS[1];
  var navDirS = useState(0);
  var navDir = navDirS[0], setNavDir = navDirS[1];
  var scrollNowS = useState(0);
  var scrollNow = scrollNowS[0], bumpScrollNow = scrollNowS[1];
  var sheetS = useState(null);
  var sheet = sheetS[0], setSheet = sheetS[1];
  var repS = useState([false, false, false, false, false, false, false]);
  var repeatDays = repS[0], setRepeatDays = repS[1];
  var stageRef = useRef(null);

  var weekDays = useMemo(function() { return weekKeys(selected); }, [selected]);
  var selParsed = parseKey(selected);
  var dayDate = new Date(selParsed.y, selParsed.m, selParsed.d);

  useEffect(function() {
    calendarStore.loadEvents().then(function(data) { setEvents(data); setLoaded(true); });
  }, []);

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    if (!loaded) return;
    calendarStore.saveEvents(events);
  }, [events, loaded]);

  function shiftWeek(delta) {
    setNavDir(delta > 0 ? 1 : -1);
    var p = parseKey(selected);
    var d = new Date(p.y, p.m, p.d + delta * 7);
    setSelected(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }

  function shiftDay(delta) {
    setNavDir(delta > 0 ? 1 : -1);
    var p = parseKey(selected);
    var d = new Date(p.y, p.m, p.d + delta);
    setSelected(dateKey(d.getFullYear(), d.getMonth(), d.getDate()));
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }

  function goToday() {
    setNavDir(0);
    setSelected(todayKey);
    setView({ y: today.getFullYear(), m: today.getMonth() });
  }

  function jumpNow() {
    bumpScrollNow(function(n) { return n + 1; });
    if (mode === "week") {
      if (weekDays.indexOf(todayKey) < 0) goToday();
      else if (selected !== todayKey) setSelected(todayKey);
      return;
    }
    if (selected !== todayKey) goToday();
  }

  var weekRangeLabel = useMemo(function() { return formatWeekRange(weekDays); }, [weekDays]);

  var onSwipePrev = useCallback(function() {
    if (mode === "week") shiftWeek(-1);
    else shiftDay(-1);
  }, [mode, selected]);
  var onSwipeNext = useCallback(function() {
    if (mode === "week") shiftWeek(1);
    else shiftDay(1);
  }, [mode, selected]);

  useEffect(function() {
    var el = stageRef.current;
    if (!el || mode === "week") return;
    return attachSwipe(el, { onSwipeLeft: onSwipeNext, onSwipeRight: onSwipePrev });
  }, [onSwipePrev, onSwipeNext, mode]);

  useEffect(function() {
    function onKey(e) {
      if (sheet) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); onSwipePrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); onSwipeNext(); }
      else if (e.key === "t" || e.key === "T") { e.preventDefault(); goToday(); }
      else if (e.key === "n" || e.key === "N") { e.preventDefault(); jumpNow(); }
      else if (e.key === "c" || e.key === "C") { e.preventDefault(); openCreate(); }
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, [sheet, onSwipePrev, onSwipeNext, selected]);

  function selectDay(k, cell) {
    setSelected(k);
    if (cell && cell.outside) setView({ y: cell.y, m: cell.m });
    else {
      var p = parseKey(k);
      setView({ y: p.y, m: p.m });
    }
    if (mode === "month") setMode("line");
  }

  function prevMonth() {
    setView(function(v) { return v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }; });
  }
  function nextMonth() {
    setView(function(v) { return v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }; });
  }

  function openCreate(slotMin) {
    var t = slotMin != null ? minToTime(slotMin) : "09:00";
    setRepeatDays([false, false, false, false, false, false, false]);
    setSheet({
      isEdit: false,
      dayKey: selected,
      draft: { id: uid(), title: "", notes: "", color: ACCENT, allDay: false, time: t, endTime: addMinutes(t, 60) },
    });
  }

  function openEdit(ev, dayKey) {
    setSelected(dayKey);
    var p = parseKey(dayKey);
    setView({ y: p.y, m: p.m });
    setRepeatDays([false, false, false, false, false, false, false]);
    setSheet({
      isEdit: true,
      dayKey: dayKey,
      draft: {
        id: ev.id, title: ev.title || "", notes: ev.notes || "", color: ev.color || ACCENT,
        allDay: !!ev.allDay, time: ev.time || "09:00",
        endTime: eventEndTime(ev) || addMinutes(ev.time || "09:00", evDuration(ev)),
      },
    });
  }

  function closeSheet() { setSheet(null); }

  function saveSheet() {
    if (!sheet || !sheet.draft.title.trim()) return;
    var item = {
      id: sheet.draft.id,
      title: sheet.draft.title.trim(),
      notes: (sheet.draft.notes || "").trim(),
      color: sheet.draft.color || ACCENT,
      allDay: !!sheet.draft.allDay,
      time: sheet.draft.allDay ? null : sheet.draft.time,
      duration: sheet.draft.allDay ? null : durationFromTimes(sheet.draft.time, sheet.draft.endTime),
    };
    var targets = [sheet.dayKey];
    weekDays.forEach(function(k, i) {
      if (repeatDays[i] && k !== sheet.dayKey) targets.push(k);
    });
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      if (sheet.isEdit) {
        Object.keys(next).forEach(function(k) {
          next[k] = (next[k] || []).filter(function(e) { return e.id !== item.id; });
          if (!next[k].length) delete next[k];
        });
      }
      targets.forEach(function(k) {
        var copy = Object.assign({}, item, { id: k === sheet.dayKey ? item.id : uid() });
        next[k] = sortEvents((next[k] || []).concat([copy]));
      });
      return next;
    });
    setSelected(sheet.dayKey);
    closeSheet();
  }

  function deleteFromSheet() {
    if (!sheet || !sheet.isEdit) return;
    var id = sheet.draft.id;
    var next = Object.assign({}, events);
    Object.keys(next).forEach(function(k) {
      next[k] = (next[k] || []).filter(function(e) { return e.id !== id; });
      if (!next[k].length) delete next[k];
    });
    setEvents(next);
    calendarStore.deleteEventById(next, id).catch(function() {});
    closeSheet();
  }

  function moveEvent(id, fromKey, toKey, newTime, dur) {
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
  }

  function onSlotClick(dayKey, mins) {
    setSelected(dayKey);
    openCreate(mins);
  }

  if (!loaded) {
    return (
      <div className="ch-root">
        <style>{CHRO_CSS}</style>
        <PageLoader accent={ACCENT} lines={5} />
      </div>
    );
  }

  var stageClass = "ch-stage" + (navDir > 0 ? " ch-stage--left" : navDir < 0 ? " ch-stage--right" : "");

  return (
    <div className="ch-root" data-scrollable style={{ "--mc": ACCENT }}>
      <style>{CHRO_CSS}</style>
      <div className="ch-glow ch-glow--a" style={{ background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <div className="ch-glow ch-glow--b" style={{ background: moduleGlow(ACCENT, "12") }} aria-hidden="true" />

      <header className="ch-head">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <button type="button" className="ch-back ui-tap" onClick={function() { navigate("/"); }}>← Hub</button>
          <div className="ch-hero">
            {mode === "week" ? (
              <>
                <h1 className="ch-week-hero"><span>Semana</span>{weekRangeLabel}</h1>
                <p className="ch-day-meta">{dayDate.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}</p>
              </>
            ) : (
              <>
                <h1 className="ch-day-num">{selParsed.d}</h1>
                <p className="ch-day-meta">
                  <strong>{selected === todayKey ? "Hoje" : WEEKDAYS[(dayDate.getDay() + 6) % 7]}</strong>
                  {dayDate.toLocaleDateString("pt-PT", { weekday: "long", month: "long", year: "numeric" })}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="ch-actions">
          <div className="ch-modes" role="tablist">
            {[{ id: "line", label: "Linha" }, { id: "week", label: "Semana" }, { id: "month", label: "Mês" }].map(function(m) {
              return (
                <button key={m.id} type="button" role="tab" aria-selected={mode === m.id}
                  className={"ch-mode ui-tap ch-mode--" + m.id + (mode === m.id ? " is-on" : "")}
                  onClick={function() { setMode(m.id); setNavDir(0); }}>{m.label}</button>
              );
            })}
          </div>
          <div className="ch-quick">
            <button type="button" className="ch-btn ch-btn--nav ui-tap" onClick={function() { mode === "week" ? shiftWeek(-1) : shiftDay(-1); }} title={mode === "week" ? "Semana anterior" : "Dia anterior"}>‹</button>
            <button type="button" className="ch-btn ch-btn--nav ui-tap" onClick={function() { mode === "week" ? shiftWeek(1) : shiftDay(1); }} title={mode === "week" ? "Semana seguinte" : "Dia seguinte"}>›</button>
            <button type="button" className="ch-btn ui-tap" onClick={jumpNow}>Agora</button>
            <button type="button" className={"ch-btn ui-tap" + (selected === todayKey ? " ch-btn--accent" : "")} onClick={goToday}>Hoje</button>
            {!isMobile ? <button type="button" className="ch-btn ui-tap ch-btn--accent" onClick={function() { openCreate(); }}>+ Evento</button> : null}
          </div>
        </div>
      </header>

      {mode === "line" ? (
        <MonthRail view={view} selected={selected} todayKey={todayKey} events={events} onSelectDay={selectDay} />
      ) : mode === "month" ? (
        <div className="ch-quick" style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,.05)", justifyContent: "center", display: "flex", gap: 16, alignItems: "center" }}>
          <button type="button" className="ch-btn ui-tap" onClick={prevMonth}>‹</button>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#A0A0A8", textTransform: "capitalize" }}>
            {new Date(view.y, view.m, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </span>
          <button type="button" className="ch-btn ui-tap" onClick={nextMonth}>›</button>
        </div>
      ) : null}

      <div className="ch-body">
        <div ref={stageRef} className={stageClass} key={mode + selected}>
          {mode === "month" ? (
            <MonthBoard view={view} selected={selected} todayKey={todayKey} events={events} onSelectDay={selectDay} />
          ) : mode === "week" ? (
            <WeekPlanner weekDays={weekDays} selected={selected} todayKey={todayKey} events={events}
              isMobile={isMobile} scrollNow={scrollNow} editId={sheet && sheet.isEdit ? sheet.draft.id : null}
              readOnly={false} onSelectDay={selectDay} onEventClick={openEdit} onSlotClick={onSlotClick} onMove={moveEvent} />
          ) : (
            <DayStream dayKey={selected} todayKey={todayKey} events={events} editId={sheet && sheet.isEdit ? sheet.draft.id : null}
              scrollNow={scrollNow} readOnly={false}
              onEventClick={openEdit} onSlotClick={onSlotClick} onMove={moveEvent} />
          )}
        </div>
      </div>

      {isMobile ? (
        <button type="button" className="ch-fab ui-tap" onClick={function() { openCreate(); }} aria-label="Novo evento">+</button>
      ) : null}

      {sheet ? (
        <EventSheet
          open={true}
          isMobile={isMobile}
          isEdit={sheet.isEdit}
          dayKey={sheet.dayKey}
          draft={sheet.draft}
          setDraft={function(d) { setSheet(Object.assign({}, sheet, { draft: d })); }}
          repeatDays={repeatDays}
          toggleRepeat={function(i) {
            setRepeatDays(function(prev) { var n = prev.slice(); n[i] = !n[i]; return n; });
          }}
          onDayChange={function(k) { setSheet(Object.assign({}, sheet, { dayKey: k })); setSelected(k); var p = parseKey(k); setView({ y: p.y, m: p.m }); }}
          onSave={saveSheet}
          onDelete={deleteFromSheet}
          onClose={closeSheet}
        />
      ) : null}
    </div>
  );
}
