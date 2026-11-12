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
  ".shell{display:flex;height:100vh;height:100dvh;max-height:100dvh;width:100%;max-width:100%;background:transparent;color:var(--page-text,#EDE8DF);overflow:hidden;position:relative;overscroll-behavior:none;touch-action:manipulation}",
  ".sh-aurora{position:absolute;inset:-18%;pointer-events:none;z-index:0;background-repeat:no-repeat;background-size:140% 140%,130% 130%,160% 160%;background-image:radial-gradient(ellipse 55% 42% at 8% 8%,rgba(196,165,124,.42),transparent 58%),radial-gradient(ellipse 42% 36% at 96% 92%,rgba(143,168,196,.34),transparent 55%),radial-gradient(ellipse 48% 38% at 48% 42%,rgba(143,179,155,.16),transparent 62%)}",
  ".shell-stage{position:relative;flex:1;min-width:0;min-height:0;height:100%;max-width:100%;overflow-x:hidden;overflow-y:auto;overscroll-behavior:none;-webkit-overflow-scrolling:touch;touch-action:pan-y}",
  ".shell-stage>.ch-root,.shell-stage>.pj-page,.shell-stage>.pw,.shell-stage>.fs-root,.shell-stage>.hub-scroll,.shell-stage>.tk-page,.shell-stage>.nt-root,.shell-stage>.vin-root{height:100%!important;max-height:100%!important;min-height:0!important}",
  ".shell-stage>.wl-page{min-height:100%!important;height:auto}",
  ".sh-side{display:flex;flex-direction:column;width:232px;flex-shrink:0;height:100%;position:relative;isolation:isolate;background:rgba(255,255,255,.05);border-right:1px solid transparent;padding:18px 12px 14px;z-index:40;backdrop-filter:blur(var(--glass-blur,40px)) saturate(var(--glass-sat,1.85));-webkit-backdrop-filter:blur(var(--glass-blur,40px)) saturate(var(--glass-sat,1.85));box-shadow:var(--glass-inset,inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(0,0,0,.32),inset 0 0 28px rgba(255,255,255,.045))}",
  ".sh-side::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:3;background:linear-gradient(160deg,rgba(255,255,255,.5) 0%,rgba(255,255,255,.08) 35%,rgba(255,255,255,.02) 55%,rgba(255,255,255,.18) 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}",
  ".sh-side > *{position:relative;z-index:4}",
  ".sh-side.is-mini{width:72px;padding:18px 0 14px;align-items:center}",
  ".sh-brand{display:flex;align-items:center;gap:12px;padding:6px 10px 18px;color:inherit;text-decoration:none;min-width:0}",
  ".sh-side.is-mini .sh-brand{padding:6px 0 18px;justify-content:center;width:40px}",
  ".sh-mark{color:#EDE8DF;flex-shrink:0}",
  ".sh-brand-txt{display:flex;flex-direction:column;min-width:0;line-height:1.15}",
  ".sh-brand-txt strong{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;letter-spacing:-.04em}",
  ".sh-brand-txt em{font-style:normal;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.4px;color:#7A756C;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-nav{display:flex;flex-direction:column;gap:2px;flex:1;min-height:0;overflow-y:auto;padding:4px 0}",
  ".sh-side.is-mini .sh-nav{align-items:center;width:100%;gap:4px}",
  ".sh-block{display:flex;flex-direction:column;min-width:0}",
  ".sh-side.is-mini .sh-block{align-items:center}",
  ".sh-link{display:flex;align-items:center;gap:12px;width:100%;padding:9px 10px;border:none;background:transparent;color:#8A857C;text-decoration:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:13.5px;font-weight:500;letter-spacing:-.01em;text-align:left;border-radius:8px;position:relative}",
  ".sh-link::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--nc,#EDE8DF);opacity:0}",
  ".sh-link:hover{color:#EDE8DF;background:rgba(255,255,255,.06)}",
  ".sh-link.is-on{color:#EDE8DF;background:color-mix(in srgb,var(--nc,#EDE8DF) 18%,rgba(255,255,255,.04))}",
  ".sh-link.is-on::before{opacity:1}",
  ".sh-link.is-on .sh-ic{color:var(--nc,#EDE8DF)}",
  ".sh-link.is-parent{color:#EDE8DF}",
  ".sh-link.is-parent .sh-ic{color:var(--nc,#EDE8DF)}",
  ".sh-ic{display:flex;width:18px;height:18px;flex-shrink:0;align-items:center;justify-content:center}",
  ".sh-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-side.is-mini .sh-link{width:40px;height:40px;padding:0;justify-content:center;gap:0;border-radius:10px}",
  ".sh-side.is-mini .sh-link::before{display:none}",
  ".sh-side.is-mini .sh-link.is-on{background:color-mix(in srgb,var(--nc,#EDE8DF) 22%,rgba(255,255,255,.08))}",
  ".sh-sub{display:flex;flex-direction:column;gap:1px;margin:4px 0 8px 18px;padding:2px 0 2px 8px;border-left:1px solid rgba(255,255,255,.1)}",
  ".sh-sub-name{margin:0 0 4px;padding:0 8px;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.4px;color:#7A756C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-sub-row{display:flex;align-items:center;gap:2px;min-width:0}",
  ".sh-sub-link{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:7px 8px;border:none;background:transparent;color:#8A857C;cursor:pointer;font-family:'Manrope',sans-serif;font-size:12.5px;text-align:left;border-radius:8px;text-decoration:none}",
  ".sh-sub-link:hover,.sh-sub-rm:hover{color:#EDE8DF;background:rgba(255,255,255,.06)}",
  ".sh-sub-link.is-on{color:#EDE8DF;background:color-mix(in srgb,var(--nc,#EDE8DF) 16%,rgba(255,255,255,.04))}",
  ".sh-sub-link.is-on .sh-sub-ic{color:var(--nc,#EDE8DF)}",
  ".sh-sub-ic{width:16px;flex-shrink:0;text-align:center;font-size:13px;line-height:1}",
  ".sh-sub-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-sub-rm{width:22px;height:22px;flex-shrink:0;border:none;border-radius:6px;background:transparent;color:#6A655E;cursor:pointer;font-size:15px;line-height:1}",
  ".sh-sub-rm:hover{background:rgba(192,140,140,.16);color:#C08C8C}",
  ".sh-sub-add{display:flex;flex-direction:column;gap:1px;margin-top:4px}",
  ".sh-sub-link.is-extra{color:#6A655E;padding-left:12px}",
  ".sh-side.is-mini .sh-sub{margin:6px 0 4px;padding:0;border:none;align-items:center;gap:4px}",
  ".sh-side.is-mini .sh-sub-name,.sh-side.is-mini .sh-sub-lbl,.sh-side.is-mini .sh-sub-rm,.sh-side.is-mini .sh-sub-add{display:none}",
  ".sh-side.is-mini .sh-sub-row{width:36px}",
  ".sh-side.is-mini .sh-sub-link{width:36px;height:36px;padding:0;flex:none;justify-content:center;border-radius:9px}",
  ".sh-side.is-mini .sh-sub-link.is-on{background:color-mix(in srgb,var(--nc,#EDE8DF) 22%,rgba(255,255,255,.08))}",
  ".sh-foot{display:flex;flex-direction:column;gap:4px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}",
  ".sh-side.is-mini .sh-foot{align-items:center;width:100%}",
  ".sh-btn{font-family:inherit}",
  ".sh-out{margin-top:4px;padding:8px 10px;border:none;background:transparent;color:#6A655E;cursor:pointer;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;text-align:left}",
  ".sh-out:hover{color:#EDE8DF}",
  ".sh-collapse{margin-top:6px;width:100%;height:28px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#7A756C;cursor:pointer;font-size:16px;line-height:1}",
  ".sh-collapse:hover{color:#EDE8DF;border-color:rgba(255,255,255,.18)}",
  ".sh-side.is-mini .sh-collapse{width:40px;height:28px}",
  ".sh-burger{display:none}",
  ".sh-scrim{display:none}",
  "@media(max-width:719px){",
  ".shell{overflow:hidden;overscroll-behavior:none;touch-action:manipulation}",
  ".shell-stage{overflow-x:hidden;overflow-y:auto;overscroll-behavior:none;touch-action:pan-y}",
  ".shell-stage>.vin-root{overflow-x:hidden!important;overscroll-behavior:none!important}",
  ".sh-burger{display:flex;position:fixed;top:max(10px,env(safe-area-inset-top));left:10px;z-index:80;width:42px;height:42px;align-items:center;justify-content:center;border:1px solid transparent;border-radius:14px!important;background:rgba(255,255,255,.06);color:#EDE8DF;cursor:pointer;backdrop-filter:blur(28px) saturate(1.8);-webkit-backdrop-filter:blur(28px) saturate(1.8);box-shadow:var(--glass-inset-soft,inset 0 1px 0 rgba(255,255,255,.4),inset 0 -1px 1px rgba(0,0,0,.25));overflow:hidden}",
  ".sh-burger::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;background:linear-gradient(145deg,rgba(255,255,255,.55),rgba(255,255,255,.08) 45%,rgba(255,255,255,.2));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}",
  ".sh-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:85}",
  ".sh-side{position:fixed;inset:0 auto 0 0;width:min(84vw,300px);max-width:100%;transform:translateX(-105%);transition:transform 280ms cubic-bezier(.22,1,.36,1);z-index:90;padding:max(18px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));overflow-x:hidden}",
  ".sh-brand{padding:6px 12px 16px}",
  ".sh-nav{gap:4px;padding:4px 0 8px}",
  ".sh-link{min-height:46px;padding:0 12px;border-radius:10px}",
  ".sh-out{min-height:44px;padding:8px 12px;text-align:left}",
  ".sh-foot{padding-top:12px}",
  ".sh-side.is-open{transform:none}",
  ".shell-stage .ch-head,.shell-stage .tk-head,.shell-stage .pj-top,.shell-stage .pw-head,.shell-stage .fs-headwrap,.shell-stage .gn-header,.shell-stage .nt-head,.shell-stage .wl-head,.shell-stage .hub-top,.shell-stage>* > header{padding-left:56px!important}",
  "}",
].join("");
