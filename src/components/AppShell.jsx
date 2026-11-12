/* eslint-disable react-refresh/only-export-components, no-unused-vars, no-empty */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { HomeIcon, NAV_EVENT, navActive, visibleModules } from "../lib/navModules.jsx";
import { VINTED_SECTIONS, vintedSectionFromPath } from "../lib/vintedNav";

var ShellContext = createContext(null);
var COLLAPSE_KEY = "sinapse-shell-collapsed-v1";

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
  var projectNavRef = useRef(null);
  var navTickS = useState(0);
  var setNavTick = navTickS[1];

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
    setProjectNav: setProjectNav,
  };
  var projectNav = projectNavRef.current;

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
              var openProject = mod.id === "projects" && projectNav;
              var openVinted = mod.id === "vinted" && loc.pathname.indexOf("/vinted") === 0;
              var vintedSec = openVinted ? vintedSectionFromPath(loc.pathname) : "";
              return (
                <div key={mod.id} className={openProject || openVinted ? "sh-block" : undefined}>
                  <NavLink
                    to={mod.path}
                    className={"sh-link" + (openProject || openVinted ? " is-parent" : on ? " is-on" : "")}
                    style={{ "--nc": mod.color }}
                    title={mod.name}
                  >
                    <span className="sh-ic"><mod.Icon /></span>
                    {mini ? null : <span className="sh-lbl">{mod.name}</span>}
                  </NavLink>
                  {openVinted ? (
                    <div className="sh-sub">
                      {VINTED_SECTIONS.map(function(sec) {
                        var active = vintedSec === sec.id;
                        return (
                          <div key={sec.id} className={"sh-sub-row" + (active ? " is-on" : "")}>
                            <NavLink
                              to={sec.path}
                              end={sec.id === "overview"}
                              className={"sh-sub-link" + (active ? " is-on" : "")}
                              style={{ "--nc": mod.color }}
                              title={sec.label}
                            >
                              <span className="sh-sub-ic" aria-hidden="true">{sec.icon}</span>
                              {mini ? null : <span className="sh-sub-lbl">{sec.label}</span>}
                            </NavLink>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {openProject ? (
                    <div className="sh-sub">
                      {mini ? null : (
                        <p className="sh-sub-name" title={projectNav.name}>{projectNav.name}</p>
                      )}
                      {(projectNav.modules || []).map(function(m) {
                        var active = projectNav.moduleId === m.id;
                        return (
                          <div key={m.id} className={"sh-sub-row" + (active ? " is-on" : "")}>
                            <button
                              type="button"
                              className={"sh-sub-link" + (active ? " is-on" : "")}
                              style={{ "--nc": m.color || mod.color }}
                              title={m.label}
                              onClick={function() {
                                var nav = projectNavRef.current;
                                if (nav && nav.goModule) nav.goModule(m.id);
                              }}
                            >
                              <span className="sh-sub-ic" aria-hidden="true">{m.icon || "·"}</span>
                              {mini ? null : <span className="sh-sub-lbl">{m.label}</span>}
                            </button>
                            {!mini && (projectNav.modules || []).length > 1 ? (
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
                          </div>
                        );
                      })}
                      {!mini && (projectNav.extras || []).length > 0 ? (
                        <div className="sh-sub-add">
                          <button
                            type="button"
                            className={"sh-sub-link" + (projectNav.addOpen ? " is-on" : "")}
                            title="Adicionar módulo"
                            onClick={function() {
                              var nav = projectNavRef.current;
                              if (nav && nav.toggleAdd) nav.toggleAdd();
                            }}
                          >
                            <span className="sh-sub-ic" aria-hidden="true">+</span>
                            <span className="sh-sub-lbl">Adicionar</span>
                          </button>
                          {projectNav.addOpen ? (projectNav.extras || []).map(function(m) {
                            return (
                              <button
                                key={m.id}
                                type="button"
                                className="sh-sub-link is-extra"
                                title={"Adicionar " + m.label}
                                onClick={function() {
                                  var nav = projectNavRef.current;
                                  if (nav && nav.enableModule) nav.enableModule(m.id);
                                }}
                              >
                                <span className="sh-sub-ic" aria-hidden="true">{m.icon || "·"}</span>
                                <span className="sh-sub-lbl">{m.label}</span>
                              </button>
                            );
                          }) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
  ".shell{display:flex;gap:0;height:100vh;height:100dvh;max-height:100dvh;width:100%;max-width:100%;background:transparent;color:var(--page-text,#F4F2EF);overflow:hidden;position:relative;overscroll-behavior:none;touch-action:manipulation;padding:12px 12px 12px 0;box-sizing:border-box}",
  ".sh-aurora{position:absolute;inset:-22%;pointer-events:none;z-index:0;background-repeat:no-repeat;background-size:150% 150%,140% 140%,160% 160%,120% 120%;background-image:radial-gradient(ellipse 55% 45% at 6% 10%,rgba(79,109,255,.5),transparent 60%),radial-gradient(ellipse 48% 40% at 96% 20%,rgba(180,76,255,.38),transparent 58%),radial-gradient(ellipse 50% 42% at 80% 92%,rgba(255,90,122,.34),transparent 56%),radial-gradient(ellipse 40% 34% at 20% 88%,rgba(196,165,124,.28),transparent 60%)}",
  ".shell-stage{position:relative;flex:1;min-width:0;min-height:0;height:100%;max-width:100%;overflow-x:hidden;overflow-y:auto;overscroll-behavior:none;-webkit-overflow-scrolling:touch;touch-action:pan-y;border-radius:28px;isolation:isolate}",
  ".shell-stage>.ch-root,.shell-stage>.pj-page,.shell-stage>.pw,.shell-stage>.fs-root,.shell-stage>.hub-scroll,.shell-stage>.tk-page,.shell-stage>.nt-root,.shell-stage>.vin-root{height:100%!important;max-height:100%!important;min-height:0!important}",
  ".shell-stage>.wl-page{min-height:100%!important;height:auto}",

  /* Floating Liquid Glass dock */
  ".sh-side{display:flex;flex-direction:column;width:228px;flex-shrink:0;height:calc(100% - 8px);margin:4px 10px 4px 12px;position:relative;isolation:isolate;background:linear-gradient(168deg,rgba(255,255,255,.14),rgba(255,255,255,.04) 36%,rgba(8,8,14,.48));border:1px solid transparent;border-radius:36px;padding:16px 12px 12px;z-index:40;backdrop-filter:blur(48px) saturate(1.9);-webkit-backdrop-filter:blur(48px) saturate(1.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.62),inset 0 -1px 1px rgba(0,0,0,.42),inset 0 0 28px rgba(255,255,255,.04),0 18px 48px rgba(0,0,0,.4),0 4px 14px rgba(0,0,0,.2);overflow:hidden}",
  ".sh-side::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:3;background:linear-gradient(155deg,rgba(255,255,255,.7) 0%,rgba(255,255,255,.18) 28%,rgba(255,255,255,.04) 52%,rgba(255,255,255,.26) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}",
  ".sh-side::after{content:'';position:absolute;inset:1px 1px auto 1px;height:38%;border-radius:inherit;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 75%);opacity:.9}",
  ".sh-side > *{position:relative;z-index:4}",
  ".sh-side.is-mini{width:72px;padding:14px 8px 10px;align-items:center;border-radius:40px}",

  ".sh-brand{display:flex;align-items:center;gap:12px;padding:4px 8px 14px;color:inherit;text-decoration:none;min-width:0}",
  ".sh-side.is-mini .sh-brand{padding:2px 0 12px;justify-content:center;width:44px}",
  ".sh-mark{color:#fff;flex-shrink:0;filter:drop-shadow(0 0 10px rgba(255,255,255,.25))}",
  ".sh-brand-txt{display:flex;flex-direction:column;min-width:0;line-height:1.15}",
  ".sh-brand-txt strong{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;letter-spacing:-.04em;color:#fff}",
  ".sh-brand-txt em{font-style:normal;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.4px;color:rgba(255,255,255,.45);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

  ".sh-nav{display:flex;flex-direction:column;gap:4px;flex:1;min-height:0;overflow-y:auto;padding:2px 0;scrollbar-width:none}",
  ".sh-nav::-webkit-scrollbar{display:none}",
  ".sh-side.is-mini .sh-nav{align-items:center;width:100%;gap:6px}",
  ".sh-block{display:flex;flex-direction:column;min-width:0}",
  ".sh-side.is-mini .sh-block{align-items:center}",

  ".sh-link{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:none;background:transparent;color:rgba(255,255,255,.55);text-decoration:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:13.5px;font-weight:500;letter-spacing:-.01em;text-align:left;border-radius:18px;position:relative;transition:background .22s var(--ease,cubic-bezier(.22,1,.36,1)),color .22s ease,box-shadow .22s ease}",
  ".sh-link::before{content:'';position:absolute;left:0;top:50%;width:3px;height:0;border-radius:999px;background:#fff;opacity:0;transform:translateY(-50%);transition:height .22s ease,opacity .22s ease}",
  ".sh-link:hover{color:#fff;background:rgba(255,255,255,.1)}",
  ".sh-link.is-on{color:#fff;background:rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -1px 1px rgba(0,0,0,.2)}",
  ".sh-link.is-on::before{opacity:1;height:18px}",
  ".sh-link.is-on .sh-ic{color:#fff}",
  ".sh-link.is-parent{color:#fff}",
  ".sh-link.is-parent .sh-ic{color:#fff}",
  ".sh-ic{display:flex;width:20px;height:20px;flex-shrink:0;align-items:center;justify-content:center}",
  ".sh-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",

  /* Mini = icon dock with circular glass bubble */
  ".sh-side.is-mini .sh-link{width:44px;height:44px;padding:0;justify-content:center;gap:0;border-radius:50%}",
  ".sh-side.is-mini .sh-link::before{display:none}",
  ".sh-side.is-mini .sh-link.is-on{background:rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(0,0,0,.25),0 6px 18px rgba(0,0,0,.25)}",
  ".sh-side.is-mini .sh-link:hover{background:rgba(255,255,255,.12)}",

  ".sh-sub{display:flex;flex-direction:column;gap:2px;margin:6px 0 8px 14px;padding:4px 0 4px 10px;border-left:1px solid rgba(255,255,255,.14)}",
  ".sh-sub-name{margin:0 0 4px;padding:0 8px;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-sub-row{display:flex;align-items:center;gap:2px;min-width:0}",
  ".sh-sub-link{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:8px 10px;border:none;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;font-family:'Manrope',sans-serif;font-size:12.5px;text-align:left;border-radius:14px;text-decoration:none}",
  ".sh-sub-link:hover,.sh-sub-rm:hover{color:#fff;background:rgba(255,255,255,.1)}",
  ".sh-sub-link.is-on{color:#fff;background:rgba(255,255,255,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.35)}",
  ".sh-sub-link.is-on .sh-sub-ic{color:#fff}",
  ".sh-sub-ic{width:16px;flex-shrink:0;text-align:center;font-size:13px;line-height:1}",
  ".sh-sub-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-sub-rm{width:24px;height:24px;flex-shrink:0;border:none;border-radius:50%;background:transparent;color:rgba(255,255,255,.35);cursor:pointer;font-size:15px;line-height:1}",
  ".sh-sub-rm:hover{background:rgba(192,140,140,.22);color:#C08C8C}",
  ".sh-sub-add{display:flex;flex-direction:column;gap:1px;margin-top:4px}",
  ".sh-sub-link.is-extra{color:rgba(255,255,255,.35);padding-left:12px}",
  ".sh-side.is-mini .sh-sub{margin:6px 0 4px;padding:0;border:none;align-items:center;gap:4px}",
  ".sh-side.is-mini .sh-sub-name,.sh-side.is-mini .sh-sub-lbl,.sh-side.is-mini .sh-sub-rm,.sh-side.is-mini .sh-sub-add{display:none}",
  ".sh-side.is-mini .sh-sub-row{width:40px}",
  ".sh-side.is-mini .sh-sub-link{width:40px;height:40px;padding:0;flex:none;justify-content:center;border-radius:50%}",
  ".sh-side.is-mini .sh-sub-link.is-on{background:rgba(255,255,255,.18)}",

  ".sh-foot{display:flex;flex-direction:column;gap:4px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12)}",
  ".sh-side.is-mini .sh-foot{align-items:center;width:100%}",
  ".sh-btn{font-family:inherit}",
  ".sh-out{margin-top:4px;padding:8px 10px;border:none;background:transparent;color:rgba(255,255,255,.38);cursor:pointer;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;text-align:left}",
  ".sh-out:hover{color:#fff}",
  ".sh-collapse{margin-top:6px;width:100%;height:30px;border:1px solid transparent;border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);cursor:pointer;font-size:16px;line-height:1;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}",
  ".sh-collapse:hover{color:#fff;background:rgba(255,255,255,.12)}",
  ".sh-side.is-mini .sh-collapse{width:40px;height:28px;border-radius:50%}",

  ".sh-burger{display:none}",
  ".sh-scrim{display:none}",
  "@media(max-width:719px){",
  ".shell{padding:0;overflow:hidden;overscroll-behavior:none;touch-action:manipulation}",
  ".shell-stage{border-radius:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:none;touch-action:pan-y}",
  ".shell-stage>.vin-root{overflow-x:hidden!important;overscroll-behavior:none!important}",
  ".sh-burger{display:flex;position:fixed;top:max(10px,env(safe-area-inset-top));left:10px;z-index:80;width:44px;height:44px;align-items:center;justify-content:center;border:1px solid transparent;border-radius:50%!important;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;backdrop-filter:blur(36px) saturate(1.8);-webkit-backdrop-filter:blur(36px) saturate(1.8);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(0,0,0,.3),0 10px 28px rgba(0,0,0,.35);overflow:hidden}",
  ".sh-burger::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;background:linear-gradient(145deg,rgba(255,255,255,.65),rgba(255,255,255,.1) 45%,rgba(255,255,255,.25));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}",
  ".sh-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:85}",
  ".sh-side{position:fixed;inset:max(10px,env(safe-area-inset-top)) auto max(10px,env(safe-area-inset-bottom)) 10px;width:min(82vw,300px);height:auto;max-height:calc(100dvh - 20px);margin:0;transform:translateX(-110%);transition:transform 300ms cubic-bezier(.22,1,.36,1);z-index:90;padding:max(16px,env(safe-area-inset-top)) 14px 14px;overflow-x:hidden;border-radius:32px}",
  ".sh-brand{padding:6px 12px 16px}",
  ".sh-nav{gap:4px;padding:4px 0 8px}",
  ".sh-link{min-height:48px;padding:0 14px;border-radius:18px}",
  ".sh-out{min-height:44px;padding:8px 12px;text-align:left}",
  ".sh-foot{padding-top:12px}",
  ".sh-side.is-open{transform:none}",
  ".shell-stage .ch-head,.shell-stage .tk-head,.shell-stage .pj-top,.shell-stage .pw-head,.shell-stage .fs-headwrap,.shell-stage .gn-header,.shell-stage .nt-head,.shell-stage .wl-head,.shell-stage .hub-top,.shell-stage>* > header{padding-left:56px!important}",
  "}",
].join("");
