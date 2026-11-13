/* eslint-disable react-refresh/only-export-components, no-unused-vars, no-empty */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { HomeIcon, NAV_EVENT, navActive, visibleModules } from "../lib/navModules.jsx";
import { VINTED_SECTIONS, vintedSectionFromPath } from "../lib/vintedNav";

var ShellContext = createContext(null);

export function useShell() {
  return useContext(ShellContext);
}

function projectNavKey(nav) {
  if (!nav) return "";
  var mods = (nav.modules || []).map(function(m) { return m.id; }).join(".");
  var extra = (nav.extras || []).map(function(m) { return m.id; }).join(".");
  return [nav.projectId, nav.moduleId, nav.name, nav.addOpen ? "1" : "0", mods, extra].join("|");
}

export function useProjectNav(payload) {
  var shell = useShell();
  var setRef = useRef(shell && shell.setProjectNav);
  setRef.current = shell && shell.setProjectNav;
  useEffect(function() {
    if (setRef.current) setRef.current(payload || null);
  });
  useEffect(function() {
    return function() {
      if (setRef.current) setRef.current(null);
    };
  }, []);
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.5 V6 M12 18 v2.5 M3.5 12 H6 M18 12 h2.5 M6.2 6.2 l1.8 1.8 M16 16 l1.8 1.8 M17.8 6.2 l-1.8 1.8 M8 16 l-1.8 1.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M18 12 H14 V36 H18" stroke="currentColor" strokeWidth="2.2" />
      <path d="M22 24 H36" stroke="currentColor" strokeWidth="2.2" />
      <path d="M30 18 L36 24 L30 30" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

function wheelScroll(e) {
  var el = e.currentTarget;
  if (!el || el.scrollWidth <= el.clientWidth + 2) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  var dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= el.clientWidth;
  el.scrollLeft += dy;
  e.preventDefault();
}

function bindWheel(el) {
  if (!el || el._shWheel) return;
  el._shWheel = wheelScroll;
  el.addEventListener("wheel", wheelScroll, { passive: false });
}

function unbindWheel(el) {
  if (!el || !el._shWheel) return;
  el.removeEventListener("wheel", el._shWheel);
  el._shWheel = null;
}

function DockIconLink(props) {
  var className = "sh-link" + (props.on ? " is-on" : "");
  var icon = <span className="sh-ic">{props.icon}</span>;
  if (props.to) {
    return (
      <NavLink to={props.to} end={props.end} className={className} title={props.label} aria-label={props.label} aria-current={props.on ? "page" : undefined}>{icon}</NavLink>
    );
  }
  return (
    <button type="button" className={className} title={props.label} aria-label={props.label} aria-current={props.on ? "page" : undefined} onClick={props.onClick}>{icon}</button>
  );
}

export default function AppShell(props) {
  var loc = useLocation();
  var navigate = useNavigate();
  var auth = useAuth();
  var modsS = useState(visibleModules);
  var mods = modsS[0], setMods = modsS[1];
  var vwS = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  var isMobile = vwS[0] < 720;
  var projectNavRef = useRef(null);
  var navTickS = useState(0);
  var navTick = navTickS[0], setNavTick = navTickS[1];
  var dockRef = useRef(null);
  var trackRef = useRef(null);

  var setProjectNav = useCallback(function(payload) {
    var nextKey = projectNavKey(payload);
    var prevKey = projectNavKey(projectNavRef.current);
    projectNavRef.current = payload || null;
    if (nextKey !== prevKey) setNavTick(function(n) { return n + 1; });
  }, []);

  useEffect(function() {
    function refresh() { setMods(visibleModules()); }
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener(NAV_EVENT, refresh);
    window.addEventListener("resize", onResize);
    return function() {
      window.removeEventListener(NAV_EVENT, refresh);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  var bindTrack = useCallback(function(el) {
    if (trackRef.current && trackRef.current !== el) unbindWheel(trackRef.current);
    trackRef.current = el;
    bindWheel(el);
  }, []);

  useEffect(function() {
    return function() { unbindWheel(trackRef.current); };
  }, []);

  useEffect(function() {
    var track = trackRef.current;
    if (!track) return;
    var active = track.querySelector(".sh-link.is-on");
    if (!active) return;
    var left = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
    var max = Math.max(0, track.scrollWidth - track.clientWidth);
    if (left < 0) left = 0;
    if (left > max) left = max;
    if (Math.abs(track.scrollLeft - left) < 4) return;
    track.scrollTo({ left: left, behavior: "smooth" });
  }, [loc.pathname, loc.search, mods, navTick]);

  useEffect(function() {
    var el = dockRef.current;
    if (!el) return;
    function apply() {
      var rect = el.getBoundingClientRect();
      var space = Math.max(72, Math.ceil(window.innerHeight - rect.top));
      var shell = el.closest(".shell");
      if (shell) shell.style.setProperty("--sh-dock", space + "px");
    }
    apply();
    var ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(apply);
    if (ro) ro.observe(el);
    window.addEventListener("resize", apply);
    return function() {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [loc.pathname, navTick]);

  var settingsOn = loc.pathname === "/" && /view=settings/.test(loc.search || "");
  var homeOn = loc.pathname === "/" && !settingsOn;
  var projectNav = projectNavRef.current;
  var vintedOn = loc.pathname.indexOf("/vinted") === 0;
  var vintedSec = vintedOn ? vintedSectionFromPath(loc.pathname) : "";
  var projectOn = projectNav && loc.pathname.indexOf("/projects/") === 0;

  var ctx = {
    openNav: function() {},
    closeNav: function() {},
    navOpen: false,
    isMobile: isMobile,
    setProjectNav: setProjectNav,
  };

  function renderContext() {
    if (vintedOn) {
      return (
        <div className="sh-subtrack" data-dock-scroll aria-label="Secções da Vinted" ref={bindWheel}>
          {VINTED_SECTIONS.map(function(sec) {
            var active = vintedSec === sec.id;
            return (
              <NavLink
                key={sec.id}
                to={sec.path}
                end={sec.id === "overview"}
                className={"sh-chip" + (active ? " is-on" : "")}
                title={sec.label}
                aria-current={active ? "page" : undefined}
              >
                <span className="sh-sub-ic" aria-hidden="true">{sec.icon}</span>
                <span>{sec.label}</span>
              </NavLink>
            );
          })}
        </div>
      );
    }
    if (!projectOn) return null;
    var list = projectNav.modules || [];
    return (
      <div className="sh-subtrack" data-dock-scroll aria-label="Módulos do projeto" ref={bindWheel}>
        <span className="sh-sub-name" title={projectNav.name}>{projectNav.name}</span>
        {list.map(function(m) {
          var active = projectNav.moduleId === m.id;
          return (
            <span key={m.id} className="sh-chipwrap">
              <button
                type="button"
                className={"sh-chip" + (active ? " is-on" : "")}
                title={m.label}
                aria-current={active ? "page" : undefined}
                onClick={function() {
                  var nav = projectNavRef.current;
                  if (nav && nav.goModule) nav.goModule(m.id);
                }}
              >
                <span className="sh-sub-ic" aria-hidden="true">{m.icon || "·"}</span>
                <span>{m.label}</span>
              </button>
              {list.length > 1 ? (
                <button
                  type="button"
                  className="sh-sub-rm"
                  title={"Remover " + m.label}
                  aria-label={"Remover " + m.label}
                  onClick={function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var nav = projectNavRef.current;
                    if (nav && nav.disableModule) nav.disableModule(e, m.id);
                  }}
                >×</button>
              ) : null}
            </span>
          );
        })}
        {(projectNav.extras || []).length > 0 ? (
          <button
            type="button"
            className={"sh-chip" + (projectNav.addOpen ? " is-on" : "")}
            title="Adicionar módulo"
            onClick={function() {
              var nav = projectNavRef.current;
              if (nav && nav.toggleAdd) nav.toggleAdd();
            }}
          >
            <span className="sh-sub-ic" aria-hidden="true">+</span>
            <span>Adicionar</span>
          </button>
        ) : null}
        {projectNav.addOpen ? (projectNav.extras || []).map(function(m) {
          return (
            <button
              key={m.id}
              type="button"
              className="sh-chip"
              title={"Adicionar " + m.label}
              onClick={function() {
                var nav = projectNavRef.current;
                if (nav && nav.enableModule) nav.enableModule(m.id);
              }}
            >
              <span className="sh-sub-ic" aria-hidden="true">{m.icon || "·"}</span>
              <span>{m.label}</span>
            </button>
          );
        }) : null}
      </div>
    );
  }

  return (
    <ShellContext.Provider value={ctx}>
      <div className="shell">
        <style>{SHELL_CSS}</style>
        <div className="sh-aurora" aria-hidden="true" />
        <div className="shell-stage">{props.children}</div>
        <nav className="sh-dock sh-side" aria-label="Navegação" ref={dockRef}>
          {renderContext()}
          <div className="sh-track" data-dock-scroll ref={bindTrack}>
            <DockIconLink to="/" end on={homeOn} label="Início" icon={<HomeIcon />} />
            {mods.map(function(mod) {
              var on = navActive(mod.path, loc.pathname);
              return (
                <DockIconLink key={mod.id} to={mod.path} on={on} label={mod.name} icon={<mod.Icon />} />
              );
            })}
            <span className="sh-sep" aria-hidden="true" />
            <DockIconLink
              on={settingsOn}
              label="Definições"
              icon={<GearIcon />}
              onClick={function() { navigate({ pathname: "/", search: "?view=settings" }); }}
            />
            <DockIconLink
              label="Sair"
              icon={<ExitIcon />}
              onClick={function() { auth.signOut(); }}
            />
          </div>
        </nav>
      </div>
    </ShellContext.Provider>
  );
}

var SHELL_CSS = [
  ".shell{--sh-dock:96px;display:flex;flex-direction:column;gap:0;isolation:isolate;height:100vh;height:100dvh;max-height:100dvh;width:100%;max-width:100%;background:transparent;color:var(--page-text,#F4F2EF);overflow:clip;position:relative;overscroll-behavior:none;touch-action:manipulation;padding:10px 10px 0;box-sizing:border-box}",
  ".sh-aurora{position:absolute;inset:-22%;pointer-events:none;z-index:0;background-repeat:no-repeat;background-size:150% 150%,140% 140%,160% 160%,120% 120%;background-image:radial-gradient(ellipse 55% 45% at 6% 10%,rgba(79,109,255,.5),transparent 60%),radial-gradient(ellipse 48% 40% at 96% 20%,rgba(180,76,255,.38),transparent 58%),radial-gradient(ellipse 50% 42% at 80% 92%,rgba(255,90,122,.34),transparent 56%),radial-gradient(ellipse 40% 34% at 20% 88%,rgba(196,165,124,.28),transparent 60%)}",
  ".shell-stage{position:relative;z-index:2;flex:1;min-width:0;min-height:0;width:100%;max-width:100%;overflow-x:clip;overflow-y:auto;overscroll-behavior:none;-webkit-overflow-scrolling:touch;touch-action:pan-y;border-radius:28px;isolation:isolate}",
  ".shell-stage>.ch-root,.shell-stage>.pj-page,.shell-stage>.pw,.shell-stage>.fs-root,.shell-stage>.hub-scroll,.shell-stage>.tk-page,.shell-stage>.nt-root,.shell-stage>.vin-root,.shell-stage>.wl-page{box-sizing:border-box!important;padding-bottom:18px!important}",
  ".shell-stage>.ch-root,.shell-stage>.pj-page,.shell-stage>.pw,.shell-stage>.fs-root,.shell-stage>.hub-scroll,.shell-stage>.tk-page,.shell-stage>.nt-root,.shell-stage>.vin-root{height:100%!important;max-height:100%!important;min-height:0!important}",
  ".shell-stage>.wl-page{min-height:100%!important;height:auto!important}",
  ".shell .shell-stage>*{box-sizing:border-box;padding-bottom:18px;scroll-padding-bottom:18px}",

  /* Barra inferior de ícones */
  ".sh-dock{position:relative;z-index:1;isolation:isolate;flex:0 0 auto;align-self:stretch;width:auto;min-width:0;max-width:none;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;margin:10px 14px max(14px,env(safe-area-inset-bottom));min-height:56px;border-radius:999px;padding:6px 10px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05) 42%,rgba(8,8,14,.55));border:1px solid transparent;backdrop-filter:blur(48px) saturate(1.9);-webkit-backdrop-filter:blur(48px) saturate(1.9);overflow:hidden;user-select:none;-webkit-user-select:none}",
  ".sh-dock::after{content:'';position:absolute;inset:1px 1px auto 1px;height:42%;border-radius:inherit;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 75%)}",
  ".sh-dock>*{position:relative;z-index:4;min-width:0}",

  ".sh-track,.sh-subtrack{display:flex;flex-wrap:nowrap;align-items:center;min-width:0;width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-x;scrollbar-width:none}",
  ".sh-track::-webkit-scrollbar,.sh-subtrack::-webkit-scrollbar{display:none;height:0}",
  ".sh-track{justify-content:safe center;gap:2px;padding:2px 4px 4px}",
  ".sh-subtrack{align-items:center;gap:4px;padding:4px 6px 6px;border-bottom:1px solid rgba(255,255,255,.12)}",

  ".sh-link{appearance:none;-webkit-appearance:none;display:flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;height:44px;min-height:44px;margin:0;padding:0;border:none;background:transparent;color:rgba(255,255,255,.72);text-decoration:none;cursor:pointer;border-radius:50%;position:relative;scroll-margin-inline:8px}",
  ".sh-link:hover{color:#fff;background:rgba(255,255,255,.1)}",
  ".sh-link.is-on{color:#fff;background:rgba(255,255,255,.24)}",
  ".sh-link:focus-visible,.sh-chip:focus-visible{outline:1px solid rgba(255,255,255,.75);outline-offset:2px}",
  ".sh-ic{display:flex;width:22px;height:22px;flex-shrink:0;align-items:center;justify-content:center}",
  ".sh-ic svg{width:20px;height:20px}",
  ".sh-lbl{display:none!important}",
  ".sh-sep{flex:0 0 1px;width:1px;height:18px;align-self:center;margin:0 6px;background:rgba(255,255,255,.2)}",

  ".sh-chipwrap{display:inline-flex;align-items:center;flex:0 0 auto;gap:1px}",
  ".sh-chip{appearance:none;-webkit-appearance:none;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;height:32px;margin:0;padding:0 10px;border:none;background:transparent;color:rgba(255,255,255,.66);cursor:pointer;font-family:'Manrope',sans-serif;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;border-radius:999px}",
  ".sh-chip:hover{color:#fff;background:rgba(255,255,255,.08)}",
  ".sh-chip.is-on{color:#fff;background:rgba(255,255,255,.16)}",
  ".sh-sub-ic{width:16px;flex-shrink:0;text-align:center;font-size:13px;line-height:1}",
  ".sh-sub-name{flex:0 1 auto;max-width:148px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.45px;text-transform:uppercase;color:rgba(255,255,255,.42);padding:0 6px}",
  ".sh-sub-rm{width:28px;height:28px;flex:0 0 auto;border:none;border-radius:50%;background:transparent;color:rgba(255,255,255,.4);cursor:pointer;font-size:16px;line-height:1;padding:0}",
  ".sh-sub-rm:hover{background:rgba(192,140,140,.22);color:#C08C8C}",

  "#root .sh-dock{border-radius:999px!important}",
  "#root .sh-dock .sh-link{border-radius:50%!important}",
  "#root .sh-dock .sh-chip{border-radius:999px!important}",
  "#root .sh-dock .sh-sub-rm{border-radius:50%!important}",

  ".ch-fab,.tk-fab{bottom:calc(var(--sh-dock,112px) + 12px)!important}",
  ".fs-immersive-bar{bottom:var(--sh-dock,112px)!important}",

  "@media(max-width:719px){",
  ".shell{padding:0}",
  ".shell-stage{border-radius:0}",
  ".sh-dock{margin:8px 12px max(12px,env(safe-area-inset-bottom));border-radius:999px!important}",
  ".shell .hub-scroll .hub-inner{padding-top:max(18px,env(safe-area-inset-top))!important}",
  ".shell .pw-head{padding-left:12px!important}",
  "}",
].join("");
