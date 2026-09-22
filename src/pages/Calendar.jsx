/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as calendarStore from "../lib/calendarStore";
import { MICRO_CSS, attachSwipe } from "../lib/microUi";
import { PageLoader } from "../components/PageLoader";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";
import { useCloudSync } from "../lib/useCloudSync";
import { isCloudPullPaused } from "../lib/cloudSyncGuard";
import { hasTouchPrimary } from "../lib/mobileUi";

var ACCENT = moduleColor("calendar");
var WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
var COLORS = ["#E6E6E9", "#A0A0A8", "#8FB39B", "#C4A57C", "#C08C8C", "#8FA8C4"];
var HOUR_H = 52;
var WK_HOUR_H = 42;
var HOURS = 24;
var WK_START = 6;
var SNAP = 15;
var MIN_DURS = [15, 30, 45, 60, 90, 120, 180];

var CHRO_CSS = [
  MICRO_CSS,
  MODULE_GLOW_CSS,
  "@keyframes chIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  "@keyframes chSlideL{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:none}}",
  "@keyframes chSlideR{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:none}}",
  "@keyframes chNow{0%,100%{opacity:1}50%{opacity:.6}}",
  "@keyframes chDrift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-4%,4%) scale(1.08)}}",
  ".ch-root{height:100vh;height:100dvh;display:flex;flex-direction:column;background:#070708;color:#EDEDEF;font-family:'IBM Plex Sans',sans-serif;overflow:hidden;position:relative}",
  ".ch-glow{position:fixed;border-radius:50%;pointer-events:none;filter:blur(90px);opacity:.55;z-index:0;animation:chDrift 20s ease-in-out infinite;transition:background 1s var(--ease)}",
  ".ch-glow--a{width:440px;height:440px;top:-10%;right:-8%}",
  ".ch-glow--b{width:320px;height:320px;bottom:6%;left:-6%;opacity:.32;animation-delay:-9s}",
  ".ch-head{flex-shrink:0;padding:16px 22px 14px;display:flex;flex-direction:column;gap:18px;border-bottom:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(7,7,8,.97),rgba(7,7,8,.82));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:30;position:relative}",
  ".ch-head::after{content:'';position:absolute;left:12%;right:12%;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--mc) 50%,transparent),transparent)}",
  ".ch-head-top{display:flex;align-items:center;justify-content:space-between;gap:12px}",
  ".ch-head-tools{display:flex;align-items:center;gap:10px;flex-shrink:0}",
  ".ch-new{padding:8px 2px;border:none;border-bottom:1px solid color-mix(in srgb,var(--mc) 55%,transparent);background:transparent;color:var(--mc);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4px;cursor:pointer}",
  ".ch-hero{min-width:0;animation:chIn var(--dur-slow) var(--ease) both}",
  ".ch-day-num,.ch-month-title{display:block;width:auto;max-width:100%;padding:0;border:none;background:transparent;cursor:pointer;text-align:left;font-family:'JetBrains Mono',monospace;font-weight:300;line-height:.85;letter-spacing:-0.055em;margin:0;background-image:linear-gradient(135deg,#EDEDEF 48%,var(--mc));-webkit-background-clip:text;background-clip:text;color:transparent}",
  ".ch-day-num{font-size:clamp(52px,10vw,76px)}",
  ".ch-month-title{font-size:clamp(34px,8vw,58px);text-transform:capitalize}",
  ".ch-day-meta{margin:10px 0 0;font-size:13px;color:#8A8A92;text-transform:capitalize;letter-spacing:.15px}",
  ".ch-day-meta em{font-style:normal;color:var(--mc);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;margin-right:8px}",
  ".ch-hero-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
  ".ch-nav{display:inline-flex;align-items:center;gap:6px;flex-shrink:0}",
  ".ch-nav-btn{width:34px;height:34px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#A0A0A8;border-radius:50%;cursor:pointer;font-size:17px;line-height:1;padding:0;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".ch-nav-btn:hover{color:#EDEDEF;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)}",
  ".ch-nav-today{padding:6px 12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#A0A0A8;border-radius:999px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.5px;text-transform:uppercase}",
  ".ch-nav-today:hover{color:var(--mc);border-color:color-mix(in srgb,var(--mc) 45%,transparent)}",
  ".ch-modes{display:flex;gap:3px;padding:3px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-radius:999px}",
  ".ch-mode{padding:8px 14px;border:none;background:transparent;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.6px;cursor:pointer;border-radius:999px;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".ch-mode:hover{color:#A0A0A8}",
  ".ch-mode.is-on{color:#0C0C0E;background:var(--mc)}",
  ".ch-mode:active{transform:scale(.96)}",
  ".ch-btn{padding:11px 16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#A0A0A8;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.2px;cursor:pointer;border-radius:var(--radius-sm)}",
  ".ch-rail{flex-shrink:0;display:flex;gap:2px;overflow-x:auto;padding:10px 16px 14px;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
  ".ch-rail::-webkit-scrollbar{display:none}",
  ".ch-rail-day{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 8px;border:none;background:transparent;color:#6E6E76;cursor:pointer;font-family:'JetBrains Mono',monospace}",
  ".ch-rail-day:hover{color:#A0A0A8}",
  ".ch-rail-day.is-on{color:var(--mc)}",
  ".ch-rail-day.is-today .ch-rail-n{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--mc) 55%,transparent)}",
  ".ch-rail-dow{font-size:9px;letter-spacing:1.2px;opacity:.5}",
  ".ch-rail-n{width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:400;line-height:1;border-radius:50%;transition:background var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".ch-rail-day.is-on .ch-rail-n{background:var(--mc);color:#0C0C0E}",
  ".ch-rail-dot{width:4px;height:4px;border-radius:50%;background:var(--mc);opacity:0}",
  ".ch-rail-day.has-ev .ch-rail-dot{opacity:.7}",
  ".ch-rail-day.is-on .ch-rail-dot{opacity:0}",
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
  ".ch-hour{position:absolute;left:-48px;right:0;height:" + HOUR_H + "px;border-top:1px solid rgba(255,255,255,.05);cursor:ns-resize;transition:background var(--dur) var(--ease);pointer-events:none}",
  ".ch-hour-lbl{position:absolute;left:-48px;top:-7px;width:40px;text-align:right;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76;pointer-events:none}",
  ".ch-track{touch-action:pan-y}",
  ".ch-track.is-paint{cursor:ns-resize;user-select:none;touch-action:none}",
  ".ch-draft{position:absolute;left:0;right:0;z-index:12;pointer-events:none;border-radius:5px;overflow:hidden;border:1px dashed color-mix(in srgb,var(--mc) 55%,transparent);background:color-mix(in srgb,var(--mc) 16%,transparent)}",
  ".ch-draft-lbl{margin:0;padding:6px 10px;font-size:11px;font-family:'IBM Plex Sans',sans-serif;font-weight:500;color:var(--mc)}",
  ".ch-now{position:absolute;left:-52px;right:0;height:2px;background:var(--mc);z-index:20;pointer-events:none;animation:chNow 2.4s ease infinite;filter:drop-shadow(0 0 6px var(--mc))}",
  ".ch-now-dot{position:absolute;left:0;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--mc)}",
  ".ch-now-time{position:absolute;left:-48px;top:-8px;font-size:9px;font-family:'JetBrains Mono',monospace;color:var(--mc);font-weight:500}",
  ".ch-ev{position:absolute;left:0;right:auto;z-index:10;display:flex;align-items:stretch;min-height:28px;cursor:grab;touch-action:pan-y;border-radius:5px;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;transition:filter .2s}",
  ".ch-ev.is-drag{touch-action:none;cursor:grabbing}",
  ".ch-ev:hover{filter:brightness(1.1);z-index:15}",
  ".ch-ev.is-edit{outline:1px solid var(--mc);outline-offset:2px;z-index:25}",
  ".ch-ev--open{min-height:32px}",
  ".ch-ev--open .ch-ev-body{background:linear-gradient(180deg,color-mix(in srgb,var(--ec) 18%,transparent),color-mix(in srgb,var(--ec) 4%,transparent))}",
  ".ch-ev-bar{width:3px;flex-shrink:0;background:var(--ec);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--ec) 55%,transparent))}",
  ".ch-ev-body{flex:1;min-width:0;padding:7px 11px 8px;border-bottom:none;background:color-mix(in srgb,var(--ec) 12%,rgba(255,255,255,.03))}",
  ".ch-ev-time{margin:0;font-size:10.5px;font-family:'IBM Plex Sans',sans-serif;font-weight:500;color:var(--ec);letter-spacing:.04em}",
  ".ch-ev-title{margin:2px 0 0;font-size:13px;font-family:'IBM Plex Sans',sans-serif;font-weight:500;color:#EDEDEF;line-height:1.3;letter-spacing:-0.02em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
  ".ch-resize{position:absolute;left:0;right:0;bottom:0;height:9px;cursor:ns-resize;z-index:4}",
  ".ch-resize:hover{background:linear-gradient(transparent,color-mix(in srgb,var(--ec) 28%,transparent))}",
  ".ch-wk{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
  ".ch-wk-board{min-width:100%}",
  ".ch-wk-board--mob{min-width:640px}",
  ".ch-wk-strip-row{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));position:sticky;top:0;z-index:14;background:rgba(7,7,8,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08)}",
  ".ch-wk-strip-gap{grid-column:1}",
  ".ch-wk-strip-cell{grid-column:span 1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 2px 14px;border:none;border-left:1px solid rgba(255,255,255,.05);background:transparent;cursor:pointer;font-family:'JetBrains Mono',monospace;border-radius:var(--radius-sm);transition:background var(--dur) var(--ease),transform var(--dur-fast) var(--ease);position:relative}",
  ".ch-wk-strip-cell:first-of-type{border-left:none}",
  ".ch-wk-strip-cell:hover{background:rgba(255,255,255,.05)}",
  ".ch-wk-strip-cell.is-on{background:color-mix(in srgb,var(--mc) 12%,transparent)}",
  ".ch-wk-strip-cell.is-on::after{content:'';position:absolute;bottom:4px;left:16%;right:16%;height:2px;background:var(--mc);border-radius:var(--radius-pill)}",
  ".ch-wk-strip-dow{font-size:10px;color:#6E6E76;letter-spacing:.6px}",
  ".ch-wk-strip-num{font-size:17px;color:#A0A0A8;line-height:1;font-weight:400;transition:color var(--dur) var(--ease)}",
  ".ch-wk-strip-cell.is-on .ch-wk-strip-num,.ch-wk-strip-cell.is-today .ch-wk-strip-num{color:var(--mc)}",
  ".ch-wk-strip-cell.is-today .ch-wk-strip-num{outline:none;background:color-mix(in srgb,var(--mc) 14%,transparent);border-radius:var(--radius-sm);padding:4px 7px}",
  ".ch-wk-load{width:calc(100% - 8px);max-width:52px;height:2px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:2px}",
  ".ch-wk-load i{display:block;height:100%;background:linear-gradient(90deg,color-mix(in srgb,var(--mc) 35%,transparent),var(--mc));transition:width var(--dur-slow) var(--ease)}",
  ".ch-wk-scroll{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}",
  ".ch-wk-allday{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));gap:0;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}",
  ".ch-wk-allday-lbl{grid-column:1;font-size:9px;font-family:'JetBrains Mono',monospace;color:#6E6E76;text-align:right;padding:4px 8px 0 0;line-height:1.2;letter-spacing:.4px}",
  ".ch-wk-allday-col{padding:2px 4px;display:flex;flex-direction:column;gap:3px;min-width:0;border-left:1px solid rgba(255,255,255,.05)}",
  ".ch-wk-allday-col:first-of-type{border-left:none}",
  ".ch-wk-allday-chip{padding:5px 7px;border:none;border-left:3px solid var(--ec);background:rgba(255,255,255,.05);color:#EDEDEF;font-size:10px;text-align:left;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;border-radius:var(--radius-sm);transition:padding-left var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".ch-wk-allday-chip:hover{padding-left:10px;background:rgba(255,255,255,.08)}",
  ".ch-wk-grid{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));min-height:" + (HOURS * WK_HOUR_H) + "px}",
  ".ch-wk-gutter{position:relative;grid-column:1;border-right:1px solid rgba(255,255,255,.06)}",
  ".ch-wk-gutter-lbl{position:absolute;right:8px;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76}",
  ".ch-wk-cols{grid-column:2/-1;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));position:relative;min-width:0}",
  ".ch-wk-col{position:relative;border-left:1px solid rgba(255,255,255,.06);min-height:" + (HOURS * WK_HOUR_H) + "px}",
  ".ch-wk-col:first-child{border-left:none}",
  ".ch-wk-col.is-on{background:linear-gradient(180deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.01) 100%)}",
  ".ch-wk-col.is-today{background:linear-gradient(180deg,rgba(255,255,255,.03) 0%,transparent 40%)}",
  ".ch-wk-hour{position:absolute;left:0;right:0;border-top:1px solid rgba(255,255,255,.05);cursor:ns-resize;transition:background var(--dur) var(--ease);touch-action:pan-y}",
  ".ch-wk-col{touch-action:pan-y}",
  ".ch-wk-strip-row--plain{grid-template-columns:repeat(7,minmax(0,1fr))}",
  ".ch-dayfocus{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
  ".ch-dayfocus .ch-wk-strip-row{position:relative;top:auto;flex-shrink:0}",
  ".ch-dayfocus .ch-stream-wrap{flex:1}",
  ".ch-halves-wrap{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
  ".ch-halves{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr);overflow:auto}",
  ".ch-half{min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden;border-left:1px solid rgba(255,255,255,.08)}",
  ".ch-half:first-child{border-left:none}",
  ".ch-half-h{flex-shrink:0;display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 16px 8px}",
  ".ch-half-h b{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:1.4px;color:#EDEDEF}",
  ".ch-half-h span{font-family:'JetBrains Mono',monospace;font-size:11px;color:#6E6E76}",
  ".ch-half .ch-stream-wrap{flex:1;min-height:0;padding:14px 12px 28px 8px;overflow-x:hidden}",
  ".ch-half .ch-track{margin-left:46px}",
  ".ch-half .ch-hour{left:-46px}",
  ".ch-half .ch-hour-lbl{left:0;top:6px;width:40px;text-align:right}",
  ".ch-half .ch-now{left:0}",
  ".ch-half .ch-now-time{left:-44px;top:4px;width:40px;text-align:right}",
  ".ch-ev--cont{opacity:.72}",
  "@media(max-width:899px){.ch-halves{grid-template-columns:1fr;grid-template-rows:none}.ch-half{min-height:68vh;border-left:none;border-top:1px solid rgba(255,255,255,.08)}.ch-half:first-child{border-top:none}}",
  ".ch-root.is-pad .ch-wk-hour,.ch-root.is-pad .ch-wk-col,.ch-root.is-pad .ch-track{touch-action:none;-webkit-user-select:none;user-select:none}",
  ".ch-root.is-pad .ch-wk-gutter,.ch-root.is-pad .ch-wk-strip-row{touch-action:pan-y}",
  ".ch-wk-col.is-paint{cursor:ns-resize;user-select:none;touch-action:none}",
  ".ch-wk-now{position:absolute;left:0;right:0;height:2px;background:var(--mc);z-index:18;pointer-events:none;animation:chNow 2.4s ease infinite;filter:drop-shadow(0 0 6px var(--mc))}",
  ".ch-wk-now-dot{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--mc)}",
  ".ch-wk-ev{position:absolute;z-index:10;display:flex;min-height:24px;cursor:grab;touch-action:pan-y;overflow:hidden;border-radius:5px;font-family:'IBM Plex Sans',sans-serif;transition:filter .18s,z-index 0s}",
  ".ch-wk-ev.is-drag{touch-action:none;cursor:grabbing}",
  ".ch-wk-ev:hover{filter:brightness(1.1);z-index:16}",
  ".ch-wk-ev.is-edit{z-index:24;outline:1px solid var(--mc);outline-offset:1px}",
  ".ch-wk-ev-bar{width:3px;flex-shrink:0;background:var(--ec);filter:drop-shadow(0 0 5px color-mix(in srgb,var(--ec) 55%,transparent))}",
  ".ch-wk-ev-body{flex:1;min-width:0;padding:5px 7px;background:color-mix(in srgb,var(--ec) 14%,rgba(255,255,255,.03));border-bottom:none}",
  ".ch-wk-ev-t{margin:0;font-size:10px;font-family:'IBM Plex Sans',sans-serif;font-weight:500;color:var(--ec);line-height:1.2;letter-spacing:.03em}",
  ".ch-wk-ev-n{margin:2px 0 0;font-size:12px;font-family:'IBM Plex Sans',sans-serif;font-weight:500;color:#EDEDEF;line-height:1.25;letter-spacing:-0.02em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
  ".ch-wk-ev--open .ch-wk-ev-body{background:linear-gradient(180deg,color-mix(in srgb,var(--ec) 18%,transparent),color-mix(in srgb,var(--ec) 4%,transparent))}",
  ".ch-wk-resize{position:absolute;left:0;right:0;bottom:0;height:8px;cursor:ns-resize;z-index:4}",
  ".ch-wk-ev--ghost{opacity:.55;pointer-events:none;z-index:30}",
  ".ch-wk-scroll-h{overflow-x:auto;overflow-y:auto}",
  ".ch-week-hero{font-family:'JetBrains Mono',monospace;font-weight:300;font-size:clamp(30px,5vw,44px);line-height:1.05;letter-spacing:-0.03em;margin:0;background-image:linear-gradient(135deg,#EDEDEF 60%,var(--mc));-webkit-background-clip:text;background-clip:text;color:transparent}",
  ".ch-week-hero span{font-size:.5em;color:var(--mc);-webkit-background-clip:initial;background-clip:initial;background-image:none;font-weight:400;letter-spacing:1.2px;display:block;margin-bottom:8px;text-transform:uppercase}",
  ".ch-month{flex:1;overflow-y:auto;padding:8px 16px 80px;-webkit-overflow-scrolling:touch}",
  ".ch-month-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px}",
  ".ch-month-wd{text-align:center;font-size:9px;font-family:'JetBrains Mono',monospace;color:#5C5C64;padding:4px 0 8px;letter-spacing:1.4px;text-transform:uppercase}",
  ".ch-month-cell{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:none;background:transparent;color:#A0A0A8;font-family:'JetBrains Mono',monospace;cursor:pointer;border-radius:16px;position:relative}",
  ".ch-month-cell:hover{color:#EDEDEF;background:rgba(255,255,255,.04)}",
  ".ch-month-cell.is-out{opacity:.22}",
  ".ch-month-cell.is-today .ch-month-n{color:#EDEDEF}",
  ".ch-month-cell.is-on{background:color-mix(in srgb,var(--mc) 16%,transparent)}",
  ".ch-month-cell.is-on.is-today{background:var(--mc)}",
  ".ch-month-cell.is-on.is-today .ch-month-n{color:#0C0C0E}",
  ".ch-month-cell.is-on.is-today .ch-month-dot{background:#0C0C0E}",
  ".ch-month-n{font-size:14px;line-height:1;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%}",
  ".ch-month-dots{display:flex;gap:3px;height:4px;align-items:center;min-height:4px}",
  ".ch-month-dot{width:4px;height:4px;border-radius:50%;background:var(--ec);opacity:.85}",
  ".ch-month-bars{display:flex;gap:2px;height:3px;align-items:flex-end}",
  ".ch-month-bar{width:3px;background:var(--ec);opacity:.7}",
  ".ch-sheet-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;animation:chIn var(--dur-fast) var(--ease) both}",
  ".ch-sheet-bg--desk{align-items:center;padding:20px}",
  ".ch-sheet{width:100%;max-height:88vh;overflow-y:auto;background:#070708;border-top:2px solid var(--mc);padding:24px 20px max(24px,env(safe-area-inset-bottom));animation:uiSlideUp var(--dur-slow) var(--ease) both}",
  ".ch-sheet--desk{width:min(440px,94vw);max-height:90vh;border-top:none;border-bottom:2px solid var(--mc)}",
  ".ch-sheet-lbl{margin:0 0 18px;font-size:10px;font-family:'JetBrains Mono',monospace;letter-spacing:1.8px;color:#6E6E76;text-transform:uppercase}",
  ".ch-field{margin-bottom:16px}",
  ".ch-lbl{display:block;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:1.4px;color:#6E6E76;margin-bottom:8px;text-transform:uppercase}",
  ".ch-in{width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.12);color:#EDEDEF;padding:10px 2px;font-size:14px;font-family:inherit;outline:none;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".ch-in:focus{border-bottom-color:rgba(255,255,255,.4);padding-left:4px}",
  ".ch-row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}",
  ".ch-colors{display:flex;gap:12px;flex-wrap:wrap}",
  ".ch-color{width:24px;height:24px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;transition:transform var(--dur-fast) var(--ease),border-color var(--dur) var(--ease),filter var(--dur) var(--ease)}",
  ".ch-color:hover{transform:scale(1.14)}",
  ".ch-color.is-on{border-color:#EDEDEF;transform:scale(1.1);filter:drop-shadow(0 0 8px currentColor)}",
  ".ch-rep{display:flex;gap:6px;position:relative;z-index:2}",
  ".ch-rep-btn{flex:1;min-height:38px;padding:8px 4px;border:1px solid rgba(255,255,255,.14)!important;border-radius:var(--radius-sm)!important;background:rgba(255,255,255,.04)!important;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer;touch-action:manipulation;position:relative;z-index:2;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".ch-rep-btn:hover:not(.is-base){color:#A0A0A8;border-color:rgba(255,255,255,.24)!important;background:rgba(255,255,255,.07)!important}",
  ".ch-rep-btn.is-on{color:var(--rc)!important;border-color:color-mix(in srgb,var(--rc) 55%,transparent)!important;background:color-mix(in srgb,var(--rc) 18%,transparent)!important}",
  ".ch-rep-btn.is-base{color:var(--rc)!important;border-color:color-mix(in srgb,var(--rc) 70%,transparent)!important;background:color-mix(in srgb,var(--rc) 24%,transparent)!important;cursor:default!important;opacity:1!important}",
  ".ch-dup{padding:10px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.18);background:transparent;color:#A0A0A8;font-family:'JetBrains Mono',monospace;font-size:12px;cursor:pointer}",
  ".ch-dup:hover{color:var(--mc);border-bottom-color:var(--mc)}",
  ".ch-mins{display:flex;flex-wrap:wrap;gap:6px}",
  ".ch-min{padding:8px 10px;border:none;border-bottom:1px solid rgba(255,255,255,.1);background:transparent;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:11px;cursor:pointer}",
  ".ch-min.is-on{color:var(--mc);border-bottom-color:var(--mc)}",
  ".ch-sheet-actions{display:flex;gap:14px;margin-top:22px;flex-wrap:wrap}",
  ".ch-save{padding:10px 4px;border:none;border-bottom:2px solid var(--mc);background:transparent;color:var(--mc);font-family:'JetBrains Mono',monospace;font-size:12px;cursor:pointer;transition:filter var(--dur) var(--ease)}",
  ".ch-save:hover{filter:drop-shadow(0 0 6px color-mix(in srgb,var(--mc) 55%,transparent))}",
  ".ch-del{padding:10px 4px;border:none;border-bottom:1px solid rgba(192,140,140,.4);background:transparent;color:#C08C8C;font-size:12px;cursor:pointer;font-family:inherit}",
  ".ch-cancel{padding:10px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#6E6E76;font-size:12px;cursor:pointer;font-family:inherit}",
  ".ch-month-org{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column}",
  ".ch-month-org .ch-month{flex:none;overflow:visible;padding:4px 14px 0}",
  ".ch-month-org .ch-agenda{flex:none;overflow:visible;padding:6px 16px 110px}",
  ".ch-ag-daylbl{margin:18px 4px 12px;padding:0 2px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#6E6E76}",
  ".ch-agenda{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:8px 16px 100px}",
  ".ch-ag-empty{margin:8px 0 0;padding:28px 8px;text-align:left;border:none;color:#6E6E76;font-size:14px;line-height:1.55}",
  ".ch-ag-card{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:14px 4px;margin-bottom:0;border:none;border-bottom:1px solid rgba(255,255,255,.06);border-radius:0;background:transparent;cursor:pointer;color:inherit}",
  ".ch-ag-when{flex-shrink:0;width:44px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ec);letter-spacing:.2px;line-height:1.3}",
  ".ch-ag-bar{width:3px;align-self:stretch;min-height:28px;border-radius:3px;background:var(--ec);flex-shrink:0}",
  ".ch-ag-title{margin:0;font-size:16px;color:#EDEDEF;line-height:1.35}",
  ".ch-ag-notes{margin:4px 0 0;font-size:12px;color:#6E6E76;line-height:1.4}",
  ".ch-ag-add{width:100%;min-height:46px;margin-top:14px;border:none;border-radius:14px;background:color-mix(in srgb,var(--mc) 10%,transparent);color:var(--mc);font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.3px;cursor:pointer}",
  ".ch-fab{position:fixed;z-index:50;right:20px;bottom:max(20px,env(safe-area-inset-bottom));width:58px;height:58px;border:none;border-radius:50%;background:color-mix(in srgb,var(--mc) 22%,#111);color:var(--mc);font-size:28px;font-weight:300;line-height:1;box-shadow:0 10px 28px rgba(0,0,0,.45);cursor:pointer}",
  ".ch-fab:hover{transform:scale(1.1) rotate(90deg);filter:drop-shadow(0 0 10px color-mix(in srgb,var(--mc) 55%,transparent))}",
  ".ch-fab:active{transform:scale(.92) rotate(90deg)}",
  "@media(max-width:719px){.ch-head{padding:12px 16px 12px;padding-top:max(12px,env(safe-area-inset-top));gap:14px}.ch-day-num{font-size:56px}.ch-month-title{font-size:40px}.ch-mode{flex:1;text-align:center;padding:9px 10px;font-size:11px}.ch-modes{flex:1;max-width:220px}.ch-rail{padding:6px 12px 12px}.ch-month-cell{aspect-ratio:auto;min-height:48px;border-radius:14px}.ch-month-n{font-size:14px}.ch-ag-title{font-size:15.5px}}",
  "@media(pointer:coarse){",
  ".ch-nav-btn{width:44px;height:44px;font-size:20px}",
  ".ch-new{min-height:44px;font-size:13px;padding:10px 6px}",
  ".ch-mode{min-height:42px;padding:10px 16px;font-size:12px}",
  ".ch-resize,.ch-wk-resize{height:22px}",
  ".ch-ev,.ch-wk-ev{min-height:36px}",
  ".ch-fab{display:flex;align-items:center;justify-content:center}",
  "}",
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
function weekdayIndex(key) {
  var p = parseKey(key);
  return (new Date(p.y, p.m, p.d).getDay() + 6) % 7;
}
function emptyRepeatDays() {
  return [false, false, false, false, false, false, false];
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
function isOpenEnd(ev) { return !!(ev && !ev.allDay && (ev.openEnd || ev.duration === 0)); }
function evDuration(ev) {
  if (ev.allDay) return 1440;
  return Math.max(SNAP, Number(ev.duration) || (isOpenEnd(ev) ? 30 : 60));
}
function durationLabel(minutes) {
  if (minutes >= 60) {
    var h = Math.floor(minutes / 60), r = minutes % 60;
    return r ? h + "h " + r + "m" : h + "h";
  }
  return minutes + " min";
}
function addMinutes(t, minutes) { return minToTime(timeToMin(t) + minutes); }
function eventEndTime(ev) {
  if (ev.allDay || !ev.time || isOpenEnd(ev)) return null;
  return minToTime(timeToMin(ev.time) + evDuration(ev));
}
function durationFromTimes(start, end) {
  return Math.max(SNAP, snapMin(timeToMin(end) - timeToMin(start)));
}
function formatEventTime(ev) {
  if (ev.allDay) return "Dia todo";
  if (isOpenEnd(ev)) return (ev.time || "") + " →";
  return ev.time + " – " + eventEndTime(ev);
}
function layoutDayEvents(list) {
  var timed = (list || []).filter(function(ev) { return !ev.allDay && ev.time; }).map(function(ev) {
    var start = timeToMin(ev.time);
    var dur = evDuration(ev);
    return { ev: ev, start: start, end: start + dur, dur: dur };
  });
  timed.sort(function(a, b) {
    if (a.start !== b.start) return a.start - b.start;
    return b.dur - a.dur;
  });
  var colEnds = [];
  timed.forEach(function(item) {
    var col = 0;
    for (var i = 0; i < colEnds.length; i++) {
      if (colEnds[i] <= item.start) { col = i; break; }
      col = i + 1;
    }
    if (col >= colEnds.length) colEnds.push(item.end);
    else colEnds[col] = item.end;
    item.col = col;
  });
  var n = timed.length;
  var parent = timed.map(function(_, i) { return i; });
  function find(i) { return parent[i] === i ? i : (parent[i] = find(parent[i])); }
  function union(a, b) { a = find(a); b = find(b); if (a !== b) parent[a] = b; }
  function overlaps(a, b) { return a.start < b.end && b.start < a.end; }
  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n; j++) {
      if (overlaps(timed[i], timed[j])) union(i, j);
    }
  }
  var groupMax = {};
  timed.forEach(function(item, i) {
    var g = find(i);
    groupMax[g] = Math.max(groupMax[g] || 0, item.col + 1);
  });
  return timed.map(function(item, i) {
    var g = find(i);
    var cols = groupMax[g] || 1;
    var occupied = {};
    timed.forEach(function(other, j) {
      if (j === i || find(j) !== g || !overlaps(item, other)) return;
      occupied[other.col] = true;
    });
    var span = 1;
    for (var c = item.col + 1; c < cols; c++) {
      if (occupied[c]) break;
      span++;
    }
    return { ev: item.ev, start: item.start, dur: item.dur, col: item.col, cols: cols, span: span };
  });
}
function scrollToNow(el, dayKey, todayKey, smooth) {
  if (!el || dayKey !== todayKey) return;
  var t = new Date();
  var top = (t.getHours() * 60 + t.getMinutes()) / 60 * HOUR_H - el.clientHeight * 0.3;
  if (smooth && el.scrollTo) el.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  else el.scrollTop = Math.max(0, top);
}

function eventTimeLabel(ev, dur) {
  if (isOpenEnd(ev)) return (ev.time || "") + " →";
  return (ev.time || "") + " · " + durationLabel(dur);
}

function evBlockStyle(seg, hourH, gapPx) {
  var cols = Math.max(1, seg.cols);
  var span = Math.max(1, seg.span || 1);
  var gap = gapPx == null ? 2 : gapPx;
  return {
    left: (seg.col / cols * 100) + "%",
    width: "calc(" + (span / cols * 100) + "% - " + gap + "px)",
  };
}

var PAINT_HOLD_MS = 280;
var PAINT_SLOP = 14;

function pointerIsTouch(e) {
  return e.pointerType === "touch" || e.pointerType === "pen";
}

function listenWindowPointers(onMove, onUp, onCancel) {
  var moveOpts = { capture: true, passive: false };
  var upOpts = { capture: true };
  window.addEventListener("pointermove", onMove, moveOpts);
  window.addEventListener("pointerup", onUp, upOpts);
  window.addEventListener("pointercancel", onCancel, upOpts);
  return function() {
    window.removeEventListener("pointermove", onMove, moveOpts);
    window.removeEventListener("pointerup", onUp, upOpts);
    window.removeEventListener("pointercancel", onCancel, upOpts);
  };
}

function capturePointer(el, pointerId) {
  if (!el || pointerId == null || !el.setPointerCapture) return;
  try { el.setPointerCapture(pointerId); } catch (e) {}
}

function releasePointer(el, pointerId) {
  if (!el || pointerId == null || !el.releasePointerCapture) return;
  try { if (el.hasPointerCapture && el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId); } catch (e) {}
}

function detectPad(width) {
  try {
    if (!width || width < 720) return false;
    var touchPoints = navigator.maxTouchPoints || 0;
    if (touchPoints < 1) return false;
    var ua = navigator.userAgent || "";
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return true;
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  } catch (e) {
    return false;
  }
}

/**
 * Rato e iPad: pressionar e arrastar cria o intervalo logo.
 * Telemóvel: scroll livre; toque curto cria 1h; manter ~280ms e arrastar define a duração.
 */
function startSlotPaint(e, opts) {
  var origin = opts.origin;
  if (origin == null) return;
  var touch = pointerIsTouch(e);
  var direct = !touch || !!opts.directPaint;
  var pointerId = e.pointerId;
  var captureEl = opts.captureEl;
  var holdTimer = 0;
  var painting = direct;
  var aborted = false;
  var startY = e.clientY;
  var startX = e.clientX;
  var moved = false;
  var stopListen = null;

  if (direct) {
    e.preventDefault();
    capturePointer(captureEl, pointerId);
    if (opts.onDraft) opts.onDraft(origin, 60);
  } else {
    holdTimer = setTimeout(function() {
      holdTimer = 0;
      if (aborted) return;
      painting = true;
      capturePointer(captureEl, pointerId);
      if (opts.onDraft) opts.onDraft(origin, 60);
    }, PAINT_HOLD_MS);
  }

  function minsFrom(pe) {
    return opts.readMins(pe);
  }

  function onMove(pe) {
    if (aborted) return;
    var dx = pe.clientX - startX;
    var dy = pe.clientY - startY;
    if (!painting) {
      if (Math.abs(dx) > PAINT_SLOP || Math.abs(dy) > PAINT_SLOP) {
        aborted = true;
        clearTimeout(holdTimer);
        if (stopListen) stopListen();
        if (opts.onAbort) opts.onAbort();
      }
      return;
    }
    pe.preventDefault();
    if (Math.abs(dy) > 6) moved = true;
    var current = minsFrom(pe);
    if (current == null) return;
    var a = Math.min(origin, current);
    var b = Math.max(origin, current);
    var dur = Math.max(SNAP, b - a);
    if (!moved || dur < SNAP) dur = 60;
    if (opts.onDraft) opts.onDraft(a, dur);
  }

  function end(pe, fromCancel) {
    if (stopListen) stopListen();
    clearTimeout(holdTimer);
    releasePointer(captureEl, pointerId);
    if (opts.onClear) opts.onClear();
    if (aborted) return;
    if (fromCancel && !painting) return;
    var current = origin;
    if (moved && pe) {
      var read = minsFrom(pe);
      if (read != null) current = read;
    }
    if (opts.onCommit) opts.onCommit(origin, current, moved);
  }

  stopListen = listenWindowPointers(onMove, function(pe) { end(pe, false); }, function(pe) { end(pe, true); });
}

/* ── Timeline do dia ── */
function DayStream(props) {
  var scrollRef = useRef(null);
  var trackRef = useRef(null);
  var dragRef = useRef(null);
  var draftS = useState(null);
  var draftRange = draftS[0], setDraftRange = draftS[1];
  var tickS = useState(0);
  useEffect(function() {
    var id = setInterval(function() { tickS[1](Date.now()); }, 1000);
    return function() { clearInterval(id); };
  }, []);

  var dayKey = props.dayKey;
  var hourH = props.hourH || HOUR_H;
  var fromHour = props.fromHour == null ? 0 : props.fromHour;
  var toHour = props.toHour == null ? HOURS : props.toHour;
  var fromMin = fromHour * 60;
  var toMin = toHour * 60;
  var split = props.fromHour != null || props.toHour != null;
  var allDay = useMemo(function() {
    if (props.hideAllDay) return [];
    return sortEvents((props.events[dayKey] || []).filter(function(ev) { return ev.allDay; }));
  }, [dayKey, props.events, props.hideAllDay]);
  var laid = useMemo(function() {
    return layoutDayEvents(props.events[dayKey] || []).map(function(seg) {
      var end = seg.start + seg.dur;
      if (end <= fromMin || seg.start >= toMin) return null;
      var viewStart = Math.max(seg.start, fromMin);
      var viewEnd = Math.min(end, toMin);
      return Object.assign({}, seg, {
        viewStart: viewStart,
        viewDur: Math.max(1, viewEnd - viewStart),
        anchor: seg.start >= fromMin && seg.start < toMin,
      });
    }).filter(Boolean);
  }, [dayKey, props.events, fromMin, toMin]);

  var nowTop = useMemo(function() {
    if (dayKey !== props.todayKey) return null;
    var t = new Date();
    var mins = t.getHours() * 60 + t.getMinutes();
    if (mins < fromMin || mins >= toMin) return null;
    return ((mins - fromMin) / 60) * hourH;
  }, [dayKey, props.todayKey, tickS[0], fromMin, toMin, hourH]);

  useEffect(function() {
    var el = trackRef.current;
    if (!el || !props.directPaint) return;
    function onTouchStart(ev) {
      if (ev.target && ev.target.closest && ev.target.closest(".ch-ev, .ch-allday-row")) return;
      if (ev.cancelable) ev.preventDefault();
    }
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    return function() { el.removeEventListener("touchstart", onTouchStart); };
  }, [props.directPaint]);

  useEffect(function() {
    var el = scrollRef.current;
    if (!el) return;
    if (split) {
      var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      if (dayKey === props.todayKey && nowMin >= fromMin && nowMin < toMin) {
        el.scrollTop = Math.max(0, ((nowMin - fromMin) / 60) * hourH - el.clientHeight * 0.28);
        return;
      }
      var prefer = fromHour < 12 ? Math.max(fromHour, 7) : fromHour;
      el.scrollTop = Math.max(0, (prefer - fromHour) * hourH);
      return;
    }
    if (dayKey === props.todayKey) {
      scrollToNow(el, dayKey, props.todayKey, !!props.scrollNow);
      return;
    }
    if (props.anchorHour != null) el.scrollTop = props.anchorHour * hourH;
  }, [dayKey, props.todayKey, props.scrollNow, props.anchorHour, split, fromHour, fromMin, toMin, hourH]);

  function posFromY(clientY) {
    var el = trackRef.current;
    if (!el) return null;
    var r = el.getBoundingClientRect();
    var y = Math.max(0, Math.min(r.height, clientY - r.top));
    var mins = fromMin + Math.floor(y / hourH) * 60 + Math.round(((y % hourH) / hourH) * 60);
    return snapMin(Math.max(fromMin, Math.min(toMin, mins)));
  }

  function openRange(origin, current, moved) {
    var end = current == null ? origin : current;
    var a = Math.min(origin, end);
    var b = Math.max(origin, end);
    var dur = moved ? Math.max(SNAP, b - a) : 60;
    if (props.onSlotRange) props.onSlotRange(dayKey, a, a + dur);
    else props.onSlotClick(dayKey, a);
  }

  function onTrackPointerDown(e) {
    if (props.readOnly) return;
    if (e.button != null && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest(".ch-ev")) return;
    var origin = posFromY(e.clientY);
    if (origin == null) return;
    startSlotPaint(e, {
      origin: origin,
      directPaint: props.directPaint,
      captureEl: trackRef.current,
      readMins: function(pe) { return posFromY(pe.clientY); },
      onDraft: function(start, dur) { setDraftRange({ start: start, dur: dur }); },
      onClear: function() { setDraftRange(null); },
      onCommit: function(from, to, moved) { openRange(from, to, moved); },
    });
  }

  function onEvPointerDown(e, ev) {
    if (props.readOnly) return;
    e.stopPropagation();
    var startMin = timeToMin(ev.time);
    var dur = evDuration(ev);
    var touch = pointerIsTouch(e);
    var startY = e.clientY;
    var startX = e.clientX;
    var holdTimer = 0;
    var dragging = !touch;
    var aborted = false;
    var moved = false;
    var stopListen = null;
    if (!touch) e.preventDefault();
    dragRef.current = { kind: "move", id: ev.id, startMin: startMin, dur: dur, openEnd: isOpenEnd(ev) };
    if (touch) {
      holdTimer = setTimeout(function() {
        holdTimer = 0;
        if (aborted) return;
        dragging = true;
        capturePointer(trackRef.current, e.pointerId);
      }, PAINT_HOLD_MS);
    } else {
      capturePointer(trackRef.current, e.pointerId);
    }
    function onMove(pe) {
      if (aborted || !dragRef.current) return;
      var dx = pe.clientX - startX;
      var dy = pe.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) > PAINT_SLOP || Math.abs(dy) > PAINT_SLOP) {
          aborted = true;
          clearTimeout(holdTimer);
          if (stopListen) stopListen();
          dragRef.current = null;
        }
        return;
      }
      if (Math.abs(dy) > 8) moved = true;
    }
    function onUp(pe) {
      if (stopListen) stopListen();
      clearTimeout(holdTimer);
      releasePointer(trackRef.current, e.pointerId);
      if (aborted || !dragRef.current || dragRef.current.kind !== "move") return;
      var d = dragRef.current;
      dragRef.current = null;
      if (!moved) { props.onEventClick(ev, dayKey); return; }
      var mins = posFromY(pe.clientY);
      if (mins != null && props.onMove) {
        mins = Math.max(fromMin, Math.min(toMin - d.dur, mins));
        mins = Math.max(0, Math.min(1440 - d.dur, mins));
        props.onMove(ev.id, dayKey, dayKey, minToTime(mins), d.dur);
      }
    }
    stopListen = listenWindowPointers(onMove, onUp, function(pe) {
      if (!dragging) {
        aborted = true;
        clearTimeout(holdTimer);
        if (stopListen) stopListen();
        dragRef.current = null;
        return;
      }
      onUp(pe);
    });
  }

  function onResizePointerDown(e, ev) {
    if (props.readOnly || isOpenEnd(ev)) return;
    e.stopPropagation();
    e.preventDefault();
    var startDur = evDuration(ev);
    var startMin = timeToMin(ev.time);
    dragRef.current = { kind: "resize", id: ev.id, startDur: startDur, startMin: startMin, startY: e.clientY, dur: startDur };
    setDraftRange({ start: startMin, dur: startDur, live: true });
    function onMove(pe) {
      if (!dragRef.current || dragRef.current.kind !== "resize") return;
      var delta = snapMin(((pe.clientY - dragRef.current.startY) / hourH) * 60);
      var dur = Math.max(SNAP, Math.min(1440 - startMin, startDur + delta));
      dragRef.current.dur = dur;
      setDraftRange({ start: startMin, dur: dur, live: true });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      var d = dragRef.current;
      dragRef.current = null;
      setDraftRange(null);
      if (!d || d.kind !== "resize" || !props.onMove) return;
      props.onMove(ev.id, dayKey, dayKey, ev.time, d.dur);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
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
      <div ref={trackRef} className={"ch-track" + (draftRange ? " is-paint" : "")} style={{ minHeight: (toHour - fromHour) * hourH }} onPointerDown={onTrackPointerDown}>
        {Array.from({ length: toHour - fromHour }, function(_, i) {
          var h = fromHour + i;
          return (
            <div key={h} className="ch-hour" style={{ top: i * hourH, height: hourH }}>
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
          var top = ((seg.viewStart - fromMin) / 60) * hourH;
          var h = Math.max(28, (seg.viewDur / 60) * hourH - 2);
          var isEdit = props.editId === ev.id;
          var open = isOpenEnd(ev);
          var box = evBlockStyle(seg, hourH, 2);
          return (
            <div key={ev.id} className={"ch-ev" + (isEdit ? " is-edit" : "") + (open ? " ch-ev--open" : "") + (seg.anchor ? "" : " ch-ev--cont")} style={{
              "--ec": c, top: top, height: h, left: box.left, width: box.width,
            }} onPointerDown={function(e) {
              if (!seg.anchor) { e.stopPropagation(); props.onEventClick(ev, dayKey); return; }
              onEvPointerDown(e, ev);
            }}>
              <span className="ch-ev-bar" />
              <div className="ch-ev-body">
                <p className="ch-ev-time">{eventTimeLabel(ev, seg.dur)}</p>
                <p className="ch-ev-title">{ev.title || "Sem título"}</p>
              </div>
              {seg.anchor && !open ? <span className="ch-resize" onPointerDown={function(e) { onResizePointerDown(e, ev); }} /> : null}
            </div>
          );
        })}
        {draftRange ? (
          <div className="ch-draft" style={{
            top: ((draftRange.start - fromMin) / 60) * hourH,
            height: Math.max(24, (draftRange.dur / 60) * hourH - 2),
          }}>
            <p className="ch-draft-lbl">{minToTime(draftRange.start)} – {minToTime(draftRange.start + draftRange.dur)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DayHalves(props) {
  var allDay = sortEvents((props.events[props.dayKey] || []).filter(function(ev) { return ev.allDay; }));
  function countFrom(hour) {
    return (props.events[props.dayKey] || []).filter(function(ev) {
      if (ev.allDay || !ev.time) return false;
      var start = timeToMin(ev.time);
      return start >= hour * 60 && start < (hour < 12 ? 12 : 24) * 60;
    }).length;
  }
  var shared = {
    dayKey: props.dayKey,
    todayKey: props.todayKey,
    events: props.events,
    editId: props.editId,
    scrollNow: props.scrollNow,
    directPaint: props.directPaint,
    readOnly: props.readOnly,
    hideAllDay: true,
    onEventClick: props.onEventClick,
    onSlotClick: props.onSlotClick,
    onSlotRange: props.onSlotRange,
    onMove: props.onMove,
  };
  return (
    <div className="ch-halves-wrap">
      {allDay.length > 0 ? (
        <div className="ch-allday" style={{ margin: "0 16px" }}>
          <p className="ch-allday-lbl">Dia todo</p>
          {allDay.map(function(ev) {
            var c = ev.color || ACCENT;
            return (
              <button key={ev.id} type="button" className="ch-allday-row ui-tap" style={{ "--ec": c }}
                onClick={function() { props.onEventClick(ev, props.dayKey); }}>
                <span className="ch-allday-bar" />
                <span className="ch-allday-title">{ev.title || "Sem título"}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="ch-halves">
        <section className="ch-half">
          <header className="ch-half-h"><b>MANHÃ</b><span>até 12:00 · {countFrom(0)}</span></header>
          <DayStream {...shared} fromHour={0} toHour={12} />
        </section>
        <section className="ch-half">
          <header className="ch-half-h"><b>TARDE</b><span>desde 12:00 · {countFrom(12)}</span></header>
          <DayStream {...shared} fromHour={12} toHour={24} />
        </section>
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
  var tapRef = useRef({ key: "", at: 0 });
  var maxLoad = useMemo(function() {
    return Math.max(60, Math.max.apply(null, props.weekDays.map(function(k) { return dayLoadMinutes(k, props.events); })));
  }, [props.weekDays, props.events]);

  function openFocused(k) {
    tapRef.current = { key: "", at: 0 };
    if (props.onFocusDay) props.onFocusDay(k);
  }

  function onCellClick(k) {
    var now = Date.now();
    var last = tapRef.current;
    if (props.onFocusDay && last.key === k && now - last.at < 420) {
      openFocused(k);
      return;
    }
    tapRef.current = { key: k, at: now };
    props.onSelectDay(k);
  }

  return (
    <div className={"ch-wk-strip-row" + (props.plain ? " ch-wk-strip-row--plain" : "")} role="tablist" aria-label="Dias da semana">
      {props.plain ? null : <div className="ch-wk-strip-gap" aria-hidden="true" />}
      {props.weekDays.map(function(k, i) {
        var p = parseKey(k);
        var load = dayLoadMinutes(k, props.events);
        var isOn = k === props.selected;
        var isToday = k === props.todayKey;
        return (
          <button key={k} type="button" role="tab" aria-selected={isOn}
            className={"ch-wk-strip-cell ui-tap" + (isOn ? " is-on" : "") + (isToday ? " is-today" : "")}
            title="Duplo clique para organizar este dia"
            onClick={function() { onCellClick(k); }}
            onDoubleClick={function(e) { e.preventDefault(); openFocused(k); }}>
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

  useEffect(function() {
    var el = gridRef.current;
    if (!el || !props.directPaint) return;
    function onTouchStart(ev) {
      if (ev.target && ev.target.closest && ev.target.closest(".ch-wk-ev")) return;
      if (ev.cancelable) ev.preventDefault();
    }
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    return function() { el.removeEventListener("touchstart", onTouchStart); };
  }, [props.directPaint]);

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
    if (e.button != null && e.button !== 0) return;
    var p = posFromPointer(e.clientX, e.clientY, 15);
    if (!p) return;
    startSlotPaint(e, {
      origin: p.minutes,
      directPaint: props.directPaint,
      captureEl: gridRef.current,
      readMins: function(pe) {
        var np = posFromPointer(pe.clientX, pe.clientY, 15);
        return np ? np.minutes : null;
      },
      onDraft: function(start, dur) {
        setPreview({ kind: "create", dayIdx: dayIdx, minutes: start, dur: dur, color: ACCENT, title: minToTime(start) + " – " + minToTime(start + dur) });
      },
      onClear: function() { setPreview(null); },
      onCommit: function(from, to, moved) {
        var a = Math.min(from, to == null ? from : to);
        var b = Math.max(from, to == null ? from : to);
        var dur = moved ? Math.max(SNAP, b - a) : 60;
        var key = weekDays[dayIdx];
        if (props.onSlotRange) props.onSlotRange(key, a, a + dur);
        else props.onSlotClick(key, a);
      },
    });
  }

  function onEvPointerDown(e, ev, dayKey, dayIdx) {
    if (props.readOnly) return;
    e.stopPropagation();
    var touch = pointerIsTouch(e);
    var dur = evDuration(ev);
    var startMin = timeToMin(ev.time);
    var startX = e.clientX;
    var startY = e.clientY;
    var holdTimer = 0;
    var dragging = !touch;
    var aborted = false;
    var moved = false;
    var stopListen = null;
    if (!touch) e.preventDefault();
    dragRef.current = { kind: "move", id: ev.id, fromKey: dayKey, dayIdx: dayIdx, dur: dur, color: ev.color || ACCENT, title: ev.title };
    if (touch) {
      holdTimer = setTimeout(function() {
        holdTimer = 0;
        if (aborted) return;
        dragging = true;
        capturePointer(gridRef.current, e.pointerId);
        setPreview({ id: ev.id, dayIdx: dayIdx, minutes: startMin, dur: dur, color: ev.color || ACCENT, title: ev.title });
      }, PAINT_HOLD_MS);
    } else {
      capturePointer(gridRef.current, e.pointerId);
      setPreview({ id: ev.id, dayIdx: dayIdx, minutes: startMin, dur: dur, color: ev.color || ACCENT, title: ev.title });
    }

    function onMove(pe) {
      if (aborted || !dragRef.current) return;
      var dx = pe.clientX - startX;
      var dy = pe.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) > PAINT_SLOP || Math.abs(dy) > PAINT_SLOP) {
          aborted = true;
          clearTimeout(holdTimer);
          if (stopListen) stopListen();
          dragRef.current = null;
        }
        return;
      }
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      var np = posFromPointer(pe.clientX, pe.clientY, dragRef.current.dur);
      if (np) setPreview({ id: dragRef.current.id, dayIdx: np.dayIdx, minutes: np.minutes, dur: dragRef.current.dur, color: dragRef.current.color, title: dragRef.current.title });
    }
    function onUp(pe) {
      if (stopListen) stopListen();
      clearTimeout(holdTimer);
      releasePointer(gridRef.current, e.pointerId);
      if (aborted || !dragRef.current) return;
      var d = dragRef.current;
      dragRef.current = null;
      setPreview(null);
      if (!moved) { props.onEventClick(ev, dayKey); return; }
      var np = posFromPointer(pe.clientX, pe.clientY, d.dur);
      if (np && props.onMove) {
        var mins = Math.max(0, Math.min(1440 - d.dur, np.minutes));
        props.onMove(d.id, d.fromKey, np.key, minToTime(mins), d.dur);
        props.onSelectDay(np.key);
      }
    }
    stopListen = listenWindowPointers(onMove, onUp, function(pe) {
      if (!dragging) {
        aborted = true;
        clearTimeout(holdTimer);
        if (stopListen) stopListen();
        dragRef.current = null;
        setPreview(null);
        return;
      }
      onUp(pe);
    });
  }

  return (
    <div className="ch-wk">
      <div ref={scrollRef} className={"ch-wk-scroll" + (props.isMobile ? " ch-wk-scroll-h" : "")}>
        <div className={"ch-wk-board" + (props.isMobile ? " ch-wk-board--mob" : "")}>
          <WeekStrip weekDays={weekDays} selected={props.selected} todayKey={props.todayKey} events={props.events} onSelectDay={props.onSelectDay} onFocusDay={props.onFocusDay} />
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
                <div key={k} className={"ch-wk-col" + (isOn ? " is-on" : "") + (isToday ? " is-today" : "") + (preview && preview.kind === "create" && preview.dayIdx === dayIdx ? " is-paint" : "")}
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
                    var compact = h < 26;
                    var isEdit = props.editId === ev.id;
                    var open = isOpenEnd(ev);
                    var cols = Math.max(1, seg.cols);
                    var span = Math.max(1, seg.span || 1);
                    return (
                      <div key={ev.id} className={"ch-wk-ev" + (isEdit ? " is-edit" : "") + (open ? " ch-wk-ev--open" : "")} style={{
                        "--ec": c, top: top, height: h,
                        left: "calc(" + (seg.col / cols * 100) + "% + 1px)",
                        width: "calc(" + (span / cols * 100) + "% - 2px)",
                      }} onPointerDown={function(e) { onEvPointerDown(e, ev, k, dayIdx); }}>
                        <span className="ch-wk-ev-bar" />
                        <div className="ch-wk-ev-body">
                          {!compact ? <p className="ch-wk-ev-t">{open ? (ev.time + " →") : ev.time}</p> : null}
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
              <span className="ch-month-dots">
                {evs.slice(0, 3).map(function(ev, j) {
                  return <i key={j} className="ch-month-dot" style={{ "--ec": ev.color || ACCENT }} />;
                })}
              </span>
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

function MobileAgenda(props) {
  var list = sortEvents(props.events[props.dayKey] || []);
  return (
    <div className="ch-agenda">
      {list.length === 0 ? (
        <p className="ch-ag-empty">Nada neste dia.</p>
      ) : list.map(function(ev) {
        return (
          <button key={ev.id} type="button" className="ch-ag-card" style={{ "--ec": ev.color || ACCENT }}
            onClick={function() { props.onEventClick(ev, props.dayKey); }}>
            <span className="ch-ag-when">{ev.allDay ? "todo" : isOpenEnd(ev) ? ((ev.time || "") + " →") : (ev.time || "")}</span>
            <span className="ch-ag-bar" />
            <span>
              <p className="ch-ag-title">{ev.title || "Sem título"}</p>
              {ev.notes ? <p className="ch-ag-notes">{ev.notes}</p> : null}
            </span>
          </button>
        );
      })}
      <button type="button" className="ch-ag-add" onClick={function() { props.onAdd(); }}>+ Novo evento neste dia</button>
    </div>
  );
}

function EventSheet(props) {
  if (!props.open) return null;
  var p = props;
  var ev = p.draft;
  var baseDow = weekdayIndex(p.dayKey);
  var repeatDays = p.repeatDays || emptyRepeatDays();
  var accent = ev.color || ACCENT;

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
        <div className="ch-field" style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#A0A0A8", cursor: "pointer" }}>
            <input type="checkbox" checked={ev.allDay} onChange={function(e) {
              p.setDraft(Object.assign({}, ev, { allDay: e.target.checked, openEnd: e.target.checked ? false : ev.openEnd }));
            }} />
            Dia todo
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: ev.allDay ? "#6E6E76" : "#A0A0A8", cursor: ev.allDay ? "default" : "pointer" }}>
            <input type="checkbox" checked={!!ev.openEnd && !ev.allDay} disabled={ev.allDay} onChange={function(e) {
              var on = e.target.checked;
              var dur = Math.max(SNAP, Number(ev.duration) || durationFromTimes(ev.time, ev.endTime) || 30);
              p.setDraft(Object.assign({}, ev, {
                openEnd: on,
                allDay: false,
                duration: dur,
                endTime: on ? ev.endTime : addMinutes(ev.time || "09:00", dur),
              }));
            }} />
            Sem hora de fim
          </label>
        </div>
        {!ev.allDay ? (
          <div className={ev.openEnd ? "ch-field" : "ch-row2 ch-field"}>
            <div>
              <label className="ch-lbl">Início</label>
              <input type="time" className="ch-in ui-in" value={ev.time || "09:00"}
                onChange={function(e) { p.setDraft(Object.assign({}, ev, { time: e.target.value })); }} />
            </div>
            {!ev.openEnd ? (
              <div>
                <label className="ch-lbl">Fim</label>
                <input type="time" className="ch-in ui-in" value={ev.endTime || "10:00"}
                  onChange={function(e) { p.setDraft(Object.assign({}, ev, { endTime: e.target.value })); }} />
              </div>
            ) : (
              <div>
                <label className="ch-lbl">Duração mínima</label>
                <div className="ch-mins">
                  {MIN_DURS.map(function(m) {
                    var on = Math.max(SNAP, Number(ev.duration) || 30) === m;
                    return (
                      <button key={m} type="button" className={"ch-min ui-tap" + (on ? " is-on" : "")}
                        onClick={function() { p.setDraft(Object.assign({}, ev, { duration: m })); }}>
                        {durationLabel(m)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                  style={{ background: c, color: c }} onClick={function() { p.setDraft(Object.assign({}, ev, { color: c })); }} aria-label="Cor" />
              );
            })}
          </div>
        </div>
        <div className="ch-field">
          <label className="ch-lbl">Copiar para outros dias da semana</label>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6E6E76", lineHeight: 1.45 }}>
            O dia base fica marcado. Toca nos outros dias para duplicar o evento na mesma semana.
          </p>
          <div className="ch-rep" style={{ "--rc": accent }}>
            {WEEKDAYS.map(function(w, i) {
              var isBase = i === baseDow;
              var on = repeatDays[i];
              return (
                <button key={w} type="button" aria-pressed={isBase || on}
                  className={"ch-rep-btn ui-tap" + (isBase ? " is-base" : on ? " is-on" : "")}
                  title={isBase ? "Dia base" : "Copiar para " + w}
                  onPointerDown={function(e) { e.stopPropagation(); }}
                  onClick={function(e) {
                    e.stopPropagation();
                    if (!isBase) p.toggleRepeat(i);
                  }}>{w.slice(0, 1)}</button>
              );
            })}
          </div>
        </div>
        <div className="ch-sheet-actions">
          <button type="button" className="ch-save ui-tap" onClick={p.onSave}>{p.isEdit ? "Guardar" : "Criar"}</button>
          {p.isEdit ? <button type="button" className="ch-dup ui-tap" onClick={p.onDuplicate}>Duplicar neste dia</button> : null}
          {p.isEdit ? <button type="button" className="ch-del ui-tap" onClick={p.onDelete}>Apagar</button> : null}
          <button type="button" className="ch-cancel ui-tap" onClick={p.onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function freshTodayParts() {
  var t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate(), key: dateKey(t.getFullYear(), t.getMonth(), t.getDate()) };
}

export default function Calendar() {
  var vwS = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  var isMobile = vwS[0] < 720;
  var isTouch = hasTouchPrimary();
  var todayS = useState(freshTodayParts);
  var todayKey = todayS[0].key;

  var viewS = useState(function() {
    var t = freshTodayParts();
    return { y: t.y, m: t.m };
  });
  var view = viewS[0], setView = viewS[1];
  var selS = useState(todayKey);
  var selected = selS[0], setSelected = selS[1];
  var evS = useState({});
  var events = evS[0], setEvents = evS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var modeS = useState(function() {
    return (typeof window !== "undefined" && window.innerWidth < 720) ? "month" : "week";
  });
  var mode = modeS[0], setMode = modeS[1];
  var focusS = useState(null);
  var focusDay = focusS[0], setFocusDay = focusS[1];
  var isPad = detectPad(vwS[0]);
  var navDirS = useState(0);
  var navDir = navDirS[0], setNavDir = navDirS[1];
  var scrollNowS = useState(0);
  var scrollNow = scrollNowS[0], bumpScrollNow = scrollNowS[1];
  var sheetS = useState(null);
  var sheet = sheetS[0], setSheet = sheetS[1];
  var stageRef = useRef(null);
  var skipSaveRef = useRef(false);
  var didHydrateRef = useRef(false);
  var eventsRef = useRef(events);
  eventsRef.current = events;

  var weekDays = useMemo(function() { return weekKeys(selected); }, [selected]);
  var selParsed = parseKey(selected);
  var dayDate = new Date(selParsed.y, selParsed.m, selParsed.d);

  useEffect(function() {
    calendarStore.loadEvents().then(function(data) {
      skipSaveRef.current = true;
      setEvents(data);
      setLoaded(true);
    });
  }, []);

  useCloudSync({
    tables: ["calendar_events"],
    intervalMs: 4000,
    shouldSkip: function() { return !loaded || isCloudPullPaused("calendar_events"); },
    onPull: function() {
      return calendarStore.loadEvents().then(function(data) {
        skipSaveRef.current = true;
        setEvents(data);
      });
    },
    onPush: function() {
      if (!loaded || skipSaveRef.current) return Promise.resolve();
      return calendarStore.saveEvents(eventsRef.current);
    },
  });

  useEffect(function() {
    function tickToday() { todayS[1](freshTodayParts()); }
    tickToday();
    var id = setInterval(tickToday, 60000);
    return function() { clearInterval(id); };
  }, []);

  useEffect(function() {
    var p = parseKey(selected);
    setView(function(v) {
      if (v.y === p.y && v.m === p.m) return v;
      return { y: p.y, m: p.m };
    });
  }, [selected]);

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    if (isMobile && mode === "week") setMode("month");
    if (isMobile) setFocusDay(null);
  }, [isMobile]);

  useEffect(function() {
    if (!loaded) return;
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      skipSaveRef.current = false;
      return;
    }
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
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
    var key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    setSelected(key);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setFocusDay(function(cur) { return cur ? key : null; });
  }

  function goToday() {
    var t = freshTodayParts();
    todayS[1](t);
    setNavDir(0);
    setSelected(t.key);
    setView({ y: t.y, m: t.m });
    setFocusDay(function(cur) { return cur ? t.key : null; });
  }

  function jumpNow() {
    bumpScrollNow(function(n) { return n + 1; });
    if (mode === "week") {
      if (weekDays.indexOf(todayKey) < 0) goToday();
      else {
        if (selected !== todayKey) setSelected(todayKey);
        setFocusDay(function(cur) { return cur ? todayKey : null; });
      }
      return;
    }
    if (selected !== todayKey) goToday();
  }

  var weekRangeLabel = useMemo(function() { return formatWeekRange(weekDays); }, [weekDays]);

  function shiftMonth(delta) {
    setNavDir(delta > 0 ? 1 : -1);
    var m = view.m + delta;
    var y = view.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    var last = new Date(y, m + 1, 0).getDate();
    var d = Math.min(selParsed.d, last);
    setView({ y: y, m: m });
    setSelected(dateKey(y, m, d));
  }

  var onSwipePrev = useCallback(function() {
    if (mode === "week" && !focusDay) shiftWeek(-1);
    else if (mode === "month") shiftMonth(-1);
    else shiftDay(-1);
  }, [mode, selected, view, selParsed.d, focusDay]);
  var onSwipeNext = useCallback(function() {
    if (mode === "week" && !focusDay) shiftWeek(1);
    else if (mode === "month") shiftMonth(1);
    else shiftDay(1);
  }, [mode, selected, view, selParsed.d, focusDay]);

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
    setFocusDay(function(cur) { return cur ? k : null; });
    if (mode === "month" && !isMobile) setMode("line");
  }

  function openDayFocus(k) {
    var p = parseKey(k);
    setSelected(k);
    setView({ y: p.y, m: p.m });
    setFocusDay(k);
    setMode("week");
    setNavDir(0);
  }

  function closeDayFocus() {
    setFocusDay(null);
    setMode("week");
    setNavDir(0);
  }

  function openCreate(slotMin, endMin, dayKey) {
    var key = dayKey || selected;
    var t = slotMin != null ? minToTime(slotMin) : "09:00";
    var end = endMin != null ? minToTime(endMin) : addMinutes(t, 60);
    if (timeToMin(end) <= timeToMin(t)) end = addMinutes(t, 60);
    if (dayKey) setSelected(dayKey);
    setSheet({
      isEdit: false,
      dayKey: key,
      repeatDays: emptyRepeatDays(),
      draft: { id: uid(), title: "", notes: "", color: ACCENT, allDay: false, openEnd: false, time: t, endTime: end, duration: Math.max(SNAP, durationFromTimes(t, end)) },
    });
  }

  function openEdit(ev, dayKey) {
    setSelected(dayKey);
    var p = parseKey(dayKey);
    setView({ y: p.y, m: p.m });
    setSheet({
      isEdit: true,
      dayKey: dayKey,
      repeatDays: emptyRepeatDays(),
      draft: {
        id: ev.id, title: ev.title || "", notes: ev.notes || "", color: ev.color || ACCENT,
        allDay: !!ev.allDay, openEnd: isOpenEnd(ev), time: ev.time || "09:00",
        duration: Math.max(SNAP, Number(ev.duration) || 30),
        endTime: isOpenEnd(ev) ? addMinutes(ev.time || "09:00", Math.max(SNAP, Number(ev.duration) || 30)) : (eventEndTime(ev) || addMinutes(ev.time || "09:00", evDuration(ev))),
      },
    });
  }

  function closeSheet() { setSheet(null); }

  function saveSheet() {
    if (!sheet || !sheet.draft.title.trim()) return;
    var minDur = Math.max(SNAP, Number(sheet.draft.duration) || 30);
    var item = {
      id: sheet.draft.id,
      title: sheet.draft.title.trim(),
      notes: (sheet.draft.notes || "").trim(),
      color: sheet.draft.color || ACCENT,
      allDay: !!sheet.draft.allDay,
      openEnd: !sheet.draft.allDay && !!sheet.draft.openEnd,
      time: sheet.draft.allDay ? null : sheet.draft.time,
      duration: sheet.draft.allDay ? null : (sheet.draft.openEnd ? minDur : durationFromTimes(sheet.draft.time, sheet.draft.endTime)),
      updated: Date.now(),
    };
    var rep = sheet.repeatDays || emptyRepeatDays();
    var anchorWeek = weekKeys(sheet.dayKey);
    var targets = [sheet.dayKey];
    anchorWeek.forEach(function(k, i) {
      if (rep[i] && k !== sheet.dayKey) targets.push(k);
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

  function duplicateFromSheet() {
    if (!sheet || !sheet.isEdit) return;
    var dup = Object.assign({}, sheet.draft, { id: uid(), updated: Date.now() });
    var key = sheet.dayKey;
    setEvents(function(prev) {
      var next = Object.assign({}, prev);
      next[key] = sortEvents((next[key] || []).concat([dup]));
      return next;
    });
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
      var updated = Object.assign({}, ev, {
        time: newTime,
        duration: isOpenEnd(ev) ? Math.max(SNAP, Number(ev.duration) || dur || 30) : dur,
        openEnd: isOpenEnd(ev),
        allDay: false,
        updated: Date.now(),
      });
      next[toKey] = sortEvents((next[toKey] || []).concat([updated]));
      return next;
    });
    setSelected(toKey);
  }

  function onSlotClick(dayKey, mins) {
    openCreate(mins, null, dayKey);
  }

  function onSlotRange(dayKey, startMin, endMin) {
    openCreate(startMin, endMin, dayKey);
  }

  if (!loaded) {
    return (
      <div className="ch-root">
        <style>{HUB_BACK_CSS + CHRO_CSS}</style>
        <PageLoader accent={ACCENT} label="Calendário" />
      </div>
    );
  }

  var stageClass = "ch-stage" + (navDir > 0 ? " ch-stage--left" : navDir < 0 ? " ch-stage--right" : "");

  return (
    <div className={"ch-root" + (isPad ? " is-pad" : "")} data-scrollable style={{ "--mc": ACCENT }}>
      <style>{HUB_BACK_CSS + CHRO_CSS}</style>
      <div className="ch-glow ch-glow--a" style={{ background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <div className="ch-glow ch-glow--b" style={{ background: moduleGlow(ACCENT, "12") }} aria-hidden="true" />
      <div className="ch-glow ch-glow--c" style={{ width: 260, height: 260, top: "45%", left: "40%", opacity: 0.22, background: moduleGlow(ACCENT, "0e"), animationDelay: "-15s" }} aria-hidden="true" />

      <header className="ch-head">
        <div className="ch-head-top">
          <HubBack />
          <div className="ch-head-tools">
            <div className="ch-modes" role="tablist">
              {(isMobile
                ? [{ id: "line", label: "Dia" }, { id: "month", label: "Mês" }]
                : [{ id: "line", label: "Linha" }, { id: "week", label: "Semana" }, { id: "month", label: "Mês" }]
              ).map(function(m) {
                return (
                  <button key={m.id} type="button" role="tab" aria-selected={mode === m.id}
                    className={"ch-mode ui-tap ch-mode--" + m.id + (mode === m.id ? " is-on" : "")}
                    onClick={function() { setFocusDay(null); setMode(m.id); setNavDir(0); }}>{m.label}</button>
                );
              })}
            </div>
            {!isMobile ? (
              <button type="button" className="ch-new ui-tap" onClick={function() { openCreate(); }}>+ Evento</button>
            ) : null}
          </div>
        </div>
        <div className="ch-hero">
          {mode === "week" && !focusDay ? (
            <>
              <div className="ch-hero-nav">
                <div className="ch-nav" aria-label="Navegar semana">
                  <button type="button" className="ch-nav-btn ui-tap" onClick={function() { shiftWeek(-1); }} aria-label="Semana anterior">‹</button>
                  <button type="button" className="ch-nav-btn ui-tap" onClick={function() { shiftWeek(1); }} aria-label="Semana seguinte">›</button>
                  <button type="button" className="ch-nav-today ui-tap" onClick={goToday}>Hoje</button>
                </div>
                <h1 className="ch-week-hero" style={{ margin: 0 }}><span>Semana</span>{weekRangeLabel}</h1>
              </div>
              <p className="ch-day-meta">{dayDate.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })} · duplo clique num dia abre manhã e tarde</p>
            </>
          ) : mode === "month" ? (
            <>
              <div className="ch-hero-nav">
                <div className="ch-nav" aria-label="Navegar mês">
                  <button type="button" className="ch-nav-btn ui-tap" onClick={function() { shiftMonth(-1); }} aria-label="Mês anterior">‹</button>
                  <button type="button" className="ch-nav-btn ui-tap" onClick={function() { shiftMonth(1); }} aria-label="Mês seguinte">›</button>
                  <button type="button" className="ch-nav-today ui-tap" onClick={goToday}>Hoje</button>
                </div>
                <button type="button" className="ch-month-title" onClick={goToday}>
                  {new Date(view.y, view.m, 1).toLocaleDateString("pt-PT", { month: "long" })}
                </button>
              </div>
              <p className="ch-day-meta">
                {view.y}
                {selected === todayKey ? "  ·  hoje" : "  ·  " + dayDate.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric" })}
              </p>
            </>
          ) : (
            <>
              <div className="ch-hero-nav">
                <div className="ch-nav" aria-label="Navegar dia">
                  <button type="button" className="ch-nav-btn ui-tap" onClick={function() { shiftDay(-1); }} aria-label="Dia anterior">‹</button>
                  <button type="button" className="ch-nav-btn ui-tap" onClick={function() { shiftDay(1); }} aria-label="Dia seguinte">›</button>
                  <button type="button" className="ch-nav-today ui-tap" onClick={goToday}>Hoje</button>
                  {focusDay ? <button type="button" className="ch-nav-today ui-tap" onClick={closeDayFocus}>Semana</button> : null}
                </div>
                <button type="button" className="ch-day-num" onClick={goToday}>{selParsed.d}</button>
              </div>
              <p className="ch-day-meta">
                {selected === todayKey ? <em>hoje</em> : null}
                {dayDate.toLocaleDateString("pt-PT", { weekday: "long", month: "long" })}
              </p>
            </>
          )}
        </div>
      </header>

      {mode === "line" ? (
        <MonthRail view={view} selected={selected} todayKey={todayKey} events={events} onSelectDay={selectDay} />
      ) : null}

      <div className="ch-body">
        <div ref={stageRef} className={stageClass} key={mode}>
          {mode === "month" ? (
            isMobile ? (
              <div className="ch-month-org">
                <MonthBoard view={view} selected={selected} todayKey={todayKey} events={events} onSelectDay={selectDay} compactDots />
                <p className="ch-ag-daylbl">agenda</p>
                <MobileAgenda dayKey={selected} events={events} onEventClick={openEdit} onAdd={function() { openCreate(); }} />
              </div>
            ) : (
              <MonthBoard view={view} selected={selected} todayKey={todayKey} events={events} onSelectDay={selectDay} />
            )
          ) : mode === "week" && !isMobile && focusDay ? (
            <div className="ch-dayfocus">
              <WeekStrip plain weekDays={weekDays} selected={focusDay} todayKey={todayKey} events={events} onSelectDay={selectDay} onFocusDay={openDayFocus} />
              <DayHalves dayKey={focusDay} todayKey={todayKey} events={events} editId={sheet && sheet.isEdit ? sheet.draft.id : null}
                scrollNow={scrollNow} directPaint={isPad} readOnly={false}
                onEventClick={openEdit} onSlotClick={onSlotClick} onSlotRange={onSlotRange} onMove={moveEvent} />
            </div>
          ) : mode === "week" && !isMobile ? (
            <WeekPlanner weekDays={weekDays} selected={selected} todayKey={todayKey} events={events}
              isMobile={isMobile} directPaint={isPad} scrollNow={scrollNow} editId={sheet && sheet.isEdit ? sheet.draft.id : null}
              readOnly={false} onSelectDay={selectDay} onFocusDay={openDayFocus} onEventClick={openEdit} onSlotClick={onSlotClick} onSlotRange={onSlotRange} onMove={moveEvent} />
          ) : isMobile ? (
            <MobileAgenda dayKey={selected} events={events} onEventClick={openEdit} onAdd={function() { openCreate(); }} />
          ) : (
            <DayStream dayKey={selected} todayKey={todayKey} events={events} editId={sheet && sheet.isEdit ? sheet.draft.id : null}
              scrollNow={scrollNow} directPaint={isPad} readOnly={false}
              onEventClick={openEdit} onSlotClick={onSlotClick} onSlotRange={onSlotRange} onMove={moveEvent} />
          )}
        </div>
      </div>

      {isMobile || isTouch ? (
        <button type="button" className="ch-fab ui-tap" onClick={function() { openCreate(); }} aria-label="Novo evento">+</button>
      ) : null}

      {sheet ? (
        <EventSheet
          open={true}
          isMobile={isMobile || isTouch}
          isEdit={sheet.isEdit}
          dayKey={sheet.dayKey}
          draft={sheet.draft}
          setDraft={function(d) { setSheet(Object.assign({}, sheet, { draft: d })); }}
          repeatDays={sheet.repeatDays}
          toggleRepeat={function(i) {
            if (!sheet || i === weekdayIndex(sheet.dayKey)) return;
            setSheet(function(prev) {
              if (!prev) return prev;
              var n = (prev.repeatDays || emptyRepeatDays()).slice();
              n[i] = !n[i];
              return Object.assign({}, prev, { repeatDays: n });
            });
          }}
          onDayChange={function(k) {
            setSheet(Object.assign({}, sheet, { dayKey: k, repeatDays: emptyRepeatDays() }));
            setSelected(k);
            var p = parseKey(k);
            setView({ y: p.y, m: p.m });
          }}
          onSave={saveSheet}
          onDuplicate={duplicateFromSheet}
          onDelete={deleteFromSheet}
          onClose={closeSheet}
        />
      ) : null}
    </div>
  );
}
