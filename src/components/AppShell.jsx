/* eslint-disable react-refresh/only-export-components, no-unused-vars, no-empty */
import { createContext, useContext, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { HomeIcon, NAV_EVENT, navActive, visibleModules } from "../lib/navModules.jsx";

var ShellContext = createContext(null);
var COLLAPSE_KEY = "sinapse-shell-collapsed-v1";

export function useShell() {
  return useContext(ShellContext);
}

function Mark() {
  return (
    <svg className="sh-mark" width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="8" cy="16" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="24" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="24" cy="22" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 15.2 L21 11.4 M11 16.8 L21 20.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12M3 9h12M3 13h8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.5 V6 M12 18 v2.5 M3.5 12 H6 M18 12 h2.5 M6.2 6.2 l1.8 1.8 M16 16 l1.8 1.8 M17.8 6.2 l-1.8 1.8 M8 16 l-1.8 1.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function loadCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch (e) { return false; }
}

export default function AppShell(props) {
  var loc = useLocation();
  var navigate = useNavigate();
  var auth = useAuth();
  var modsS = useState(visibleModules);
  var mods = modsS[0], setMods = modsS[1];
  var openS = useState(false);
  var navOpen = openS[0], setNavOpen = openS[1];
  var colS = useState(loadCollapsed);
  var collapsed = colS[0], setCollapsed = colS[1];
  var vwS = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  var isMobile = vwS[0] < 720;

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

  useEffect(function() {
    setNavOpen(false);
  }, [loc.pathname, loc.search]);

  useEffect(function() {
    if (!navOpen) return;
    function onKey(e) { if (e.key === "Escape") setNavOpen(false); }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, [navOpen]);

  function toggleCollapse() {
    setCollapsed(function(v) {
      var next = !v;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch (e) {}
      return next;
    });
  }

  var who = auth.user && auth.user.email ? auth.user.email.split("@")[0] : "Martim";
  var settingsOn = loc.pathname === "/" && /view=settings/.test(loc.search || "");
  var homeOn = loc.pathname === "/" && !settingsOn;
  var mini = collapsed && !isMobile;

  var ctx = {
    openNav: function() { setNavOpen(true); },
    closeNav: function() { setNavOpen(false); },
    navOpen: navOpen,
    isMobile: isMobile,
  };

  return (
    <ShellContext.Provider value={ctx}>
      <div className={"shell" + (mini ? " is-mini" : "") + (navOpen ? " is-open" : "")}>
        <style>{SHELL_CSS}</style>
        <div className="sh-aurora" aria-hidden="true" />
        {isMobile && !navOpen ? (
          <button type="button" className="sh-burger" onClick={function() { setNavOpen(true); }} aria-label="Abrir menu">
            <BurgerIcon />
          </button>
        ) : null}
        {isMobile && navOpen ? (
          <div className="sh-scrim" onClick={function() { setNavOpen(false); }} />
        ) : null}

        <aside className={"sh-side" + (mini ? " is-mini" : "") + (isMobile && navOpen ? " is-open" : "")} aria-label="Navegação">
          <NavLink to="/" end className={"sh-brand" + (homeOn ? " is-on" : "")} title="Início">
            <Mark />
            {mini ? null : (
              <span className="sh-brand-txt">
                <strong>Sinapse</strong>
                <em>{who}</em>
              </span>
            )}
          </NavLink>

          <nav className="sh-nav">
            <NavLink
              to="/"
              end
              className={"sh-link" + (homeOn ? " is-on" : "")}
              style={homeOn ? { "--nc": "var(--text, #EDE8DF)" } : undefined}
              title="Início"
            >
              <span className="sh-ic"><HomeIcon /></span>
              {mini ? null : <span className="sh-lbl">Início</span>}
            </NavLink>

            {mods.map(function(mod) {
              var on = navActive(mod.path, loc.pathname);
              return (
                <NavLink
                  key={mod.id}
                  to={mod.path}
                  className={"sh-link" + (on ? " is-on" : "")}
                  style={{ "--nc": mod.color }}
                  title={mod.name}
                >
                  <span className="sh-ic"><mod.Icon /></span>
                  {mini ? null : <span className="sh-lbl">{mod.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className="sh-foot">
            <button
              type="button"
              className={"sh-link sh-btn" + (settingsOn ? " is-on" : "")}
              onClick={function() { navigate({ pathname: "/", search: "?view=settings" }); }}
              title="Definições"
            >
              <span className="sh-ic"><GearIcon /></span>
              {mini ? null : <span className="sh-lbl">Definições</span>}
            </button>
            {mini ? null : (
              <button type="button" className="sh-out" onClick={function() { auth.signOut(); }}>
                Sair
              </button>
            )}
            {isMobile ? null : (
              <button type="button" className="sh-collapse" onClick={toggleCollapse} title={mini ? "Expandir" : "Recolher"}>
                {mini ? "›" : "‹"}
              </button>
            )}
          </div>
        </aside>

        <div className="shell-stage">{props.children}</div>
      </div>
    </ShellContext.Provider>
  );
}

var SHELL_CSS = [
  ".shell{display:flex;height:100vh;height:100dvh;background:transparent;color:var(--page-text,#EDE8DF);overflow:hidden;position:relative}",
  ".sh-aurora{position:absolute;inset:-18%;pointer-events:none;z-index:0;background-repeat:no-repeat;background-size:140% 140%,130% 130%,160% 160%;background-image:radial-gradient(ellipse 55% 42% at 8% 8%,rgba(196,165,124,.28),transparent 58%),radial-gradient(ellipse 42% 36% at 96% 92%,rgba(143,168,196,.22),transparent 55%),radial-gradient(ellipse 48% 38% at 48% 42%,rgba(255,255,255,.05),transparent 62%)}",
  ".shell-stage{position:relative;flex:1;min-width:0;min-height:0;height:100%;overflow:auto;z-index:1}",
  ".shell-stage>.ch-root,.shell-stage>.pj-page,.shell-stage>.pw,.shell-stage>.fs-root,.shell-stage>.hub-scroll,.shell-stage>.tk-page{height:100%!important;max-height:100%!important;min-height:0!important}",
  ".shell-stage>.wl-page{min-height:100%!important;height:auto}",
  ".sh-side{display:flex;flex-direction:column;width:232px;flex-shrink:0;height:100%;background:rgba(10,10,12,.28);border-right:1px solid rgba(255,255,255,.1);padding:18px 12px 14px;z-index:40;backdrop-filter:blur(36px) saturate(1.7);-webkit-backdrop-filter:blur(36px) saturate(1.7)}",
  ".sh-side.is-mini{width:76px;padding:18px 10px 14px;align-items:center}",
  ".sh-brand{display:flex;align-items:center;gap:12px;padding:6px 10px 18px;color:inherit;text-decoration:none;min-width:0}",
  ".sh-side.is-mini .sh-brand{padding:6px 0 18px;justify-content:center}",
  ".sh-mark{color:#EDE8DF;flex-shrink:0}",
  ".sh-brand-txt{display:flex;flex-direction:column;min-width:0;line-height:1.15}",
  ".sh-brand-txt strong{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;letter-spacing:-.04em}",
  ".sh-brand-txt em{font-style:normal;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.4px;color:#7A756C;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-nav{display:flex;flex-direction:column;gap:2px;flex:1;min-height:0;overflow-y:auto;padding:4px 0}",
  ".sh-link{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;border:none;background:transparent;color:#8A857C;text-decoration:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:13.5px;font-weight:500;letter-spacing:-.01em;text-align:left;border-radius:8px;position:relative}",
  ".sh-link::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--nc,#EDE8DF);opacity:0}",
  ".sh-link:hover{color:#EDE8DF;background:rgba(255,255,255,.06)}",
  ".sh-link.is-on{color:#EDE8DF;background:color-mix(in srgb,var(--nc,#EDE8DF) 22%,rgba(255,255,255,.05));backdrop-filter:blur(16px) saturate(1.5);-webkit-backdrop-filter:blur(16px) saturate(1.5)}",
  ".sh-link.is-on::before{opacity:1}",
  ".sh-link.is-on .sh-ic{color:var(--nc,#EDE8DF)}",
  ".sh-ic{display:flex;width:18px;height:18px;flex-shrink:0;align-items:center;justify-content:center}",
  ".sh-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-side.is-mini .sh-link{justify-content:center;padding:10px 0}",
  ".sh-foot{display:flex;flex-direction:column;gap:4px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}",
  ".sh-btn{font-family:inherit}",
  ".sh-out{margin-top:4px;padding:8px 10px;border:none;background:transparent;color:#6A655E;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;text-align:left}",
  ".sh-out:hover{color:#EDE8DF}",
  ".sh-collapse{margin-top:6px;width:100%;height:28px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#7A756C;cursor:pointer;font-size:16px;line-height:1}",
  ".sh-collapse:hover{color:#EDE8DF;border-color:rgba(255,255,255,.18)}",
  ".sh-side.is-mini .sh-collapse{width:32px}",
  ".sh-burger{display:none}",
  ".sh-scrim{display:none}",
  "@media(max-width:719px){",
  ".sh-burger{display:flex;position:fixed;top:max(10px,env(safe-area-inset-top));left:10px;z-index:80;width:42px;height:42px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.14);background:rgba(10,10,12,.45);color:#EDE8DF;cursor:pointer;backdrop-filter:blur(18px) saturate(1.3);-webkit-backdrop-filter:blur(18px) saturate(1.3)}",
  ".sh-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:85}",
  ".sh-side{position:fixed;inset:0 auto 0 0;width:min(82vw,280px);transform:translateX(-105%);transition:transform 280ms cubic-bezier(.22,1,.36,1);z-index:90;padding-top:max(18px,env(safe-area-inset-top))}",
  ".sh-side.is-open{transform:none}",
  ".shell-stage .ch-head,.shell-stage .tk-head,.shell-stage .pj-top,.shell-stage .pw-head,.shell-stage .fs-headwrap,.shell-stage .gn-header,.shell-stage .wl-head,.shell-stage .hub-top,.shell-stage>* > header{padding-left:56px!important}",
  "}",
].join("");
