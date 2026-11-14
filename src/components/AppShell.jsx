/* eslint-disable react-refresh/only-export-components, no-unused-vars, no-empty */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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

var COLLAPSE_KEY = "sinapse-shell-collapsed-v1";

function loadCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch (e) { return false; }
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
  var colS = useState(loadCollapsed);
  var collapsed = colS[0], setCollapsed = colS[1];
  var projectNavRef = useRef(null);
  var navTickS = useState(0);
  var navTick = navTickS[0], setNavTick = navTickS[1];
  var dockRef = useRef(null);
  var trackRef = useRef(null);
  var thumbRef = useRef(null);
  var thumbReady = useRef(false);

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
    if (!isMobile) return;
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
  }, [loc.pathname, loc.search, mods, navTick, isMobile]);

  useLayoutEffect(function() {
    if (!isMobile) {
      thumbReady.current = false;
      return;
    }
    var track = trackRef.current;
    var thumb = thumbRef.current;
    if (!track || !thumb) return;
    var active = track.querySelector(".sh-link.is-on");
    if (!active) {
      thumb.style.opacity = "0";
      return;
    }
    var x = active.offsetLeft;
    var y = active.offsetTop;
    var first = !thumbReady.current;
    thumb.style.width = active.offsetWidth + "px";
    thumb.style.height = active.offsetHeight + "px";
    thumb.style.opacity = "1";
    thumb.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    if (first) {
      void thumb.offsetWidth;
      thumb.classList.add("is-ready");
      thumbReady.current = true;
    }
  }, [loc.pathname, loc.search, mods, navTick, isMobile]);

  useEffect(function() {
    if (!isMobile) {
      var idle = document.querySelector(".shell");
      if (idle) idle.style.removeProperty("--sh-dock");
      return;
    }
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
  }, [loc.pathname, navTick, isMobile]);

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
            <button
              key={m.id}
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
      <div className={"shell" + (mini ? " is-mini" : "")}>
        <style>{SHELL_CSS}</style>
        <div className="sh-aurora" aria-hidden="true" />
        {isMobile ? null : (
          <aside className={"sh-side" + (mini ? " is-mini" : "")} aria-label="Navegação">
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
              <NavLink to="/" end className={"sh-link" + (homeOn ? " is-on" : "")} title="Início">
                <span className="sh-ic"><HomeIcon /></span>
                {mini ? null : <span className="sh-lbl">Início</span>}
              </NavLink>
              {mods.map(function(mod) {
                var on = navActive(mod.path, loc.pathname);
                var openProject = mod.id === "projects" && projectNav;
                var openVinted = mod.id === "vinted" && vintedOn;
                return (
                  <div key={mod.id} className={openProject || openVinted ? "sh-block" : undefined}>
                    <NavLink to={mod.path} className={"sh-link" + (openProject || openVinted ? " is-parent" : on ? " is-on" : "")} title={mod.name}>
                      <span className="sh-ic"><mod.Icon /></span>
                      {mini ? null : <span className="sh-lbl">{mod.name}</span>}
                    </NavLink>
                    {openVinted ? (
                      <div className="sh-sub">
                        {VINTED_SECTIONS.map(function(sec) {
                          var active = vintedSec === sec.id;
                          return (
                            <div key={sec.id} className={"sh-sub-row" + (active ? " is-on" : "")}>
                              <NavLink to={sec.path} end={sec.id === "overview"} className={"sh-sub-link" + (active ? " is-on" : "")} title={sec.label}>
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
                        {mini ? null : <p className="sh-sub-name" title={projectNav.name}>{projectNav.name}</p>}
                        {(projectNav.modules || []).map(function(m) {
                          var active = projectNav.moduleId === m.id;
                          return (
                            <div key={m.id} className={"sh-sub-row" + (active ? " is-on" : "")}>
                              <button type="button" className={"sh-sub-link" + (active ? " is-on" : "")} title={m.label} onClick={function() {
                                var nav = projectNavRef.current;
                                if (nav && nav.goModule) nav.goModule(m.id);
                              }}>
                                <span className="sh-sub-ic" aria-hidden="true">{m.icon || "·"}</span>
                                {mini ? null : <span className="sh-sub-lbl">{m.label}</span>}
                              </button>
                              {!mini && (projectNav.modules || []).length > 1 ? (
                                <button type="button" className="sh-sub-rm" title={"Remover " + m.label} aria-label={"Remover " + m.label} onClick={function(e) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  var nav = projectNavRef.current;
                                  if (nav && nav.disableModule) nav.disableModule(e, m.id);
                                }}>×</button>
                              ) : null}
                            </div>
                          );
                        })}
                        {!mini && (projectNav.extras || []).length > 0 ? (
                          <div className="sh-sub-add">
                            <button type="button" className={"sh-sub-link" + (projectNav.addOpen ? " is-on" : "")} title="Adicionar módulo" onClick={function() {
                              var nav = projectNavRef.current;
                              if (nav && nav.toggleAdd) nav.toggleAdd();
                            }}>
                              <span className="sh-sub-ic" aria-hidden="true">+</span>
                              <span className="sh-sub-lbl">Adicionar</span>
                            </button>
                            {projectNav.addOpen ? (projectNav.extras || []).map(function(m) {
                              return (
                                <button key={m.id} type="button" className="sh-sub-link is-extra" title={"Adicionar " + m.label} onClick={function() {
                                  var nav = projectNavRef.current;
                                  if (nav && nav.enableModule) nav.enableModule(m.id);
                                }}>
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
              <button type="button" className={"sh-link sh-btn" + (settingsOn ? " is-on" : "")} onClick={function() { navigate({ pathname: "/", search: "?view=settings" }); }} title="Definições">
                <span className="sh-ic"><GearIcon /></span>
                {mini ? null : <span className="sh-lbl">Definições</span>}
              </button>
              {mini ? null : (
                <button type="button" className="sh-out" onClick={function() { auth.signOut(); }}>Sair</button>
              )}
              <button type="button" className="sh-collapse" onClick={toggleCollapse} title={mini ? "Expandir" : "Recolher"}>{mini ? "›" : "‹"}</button>
            </div>
          </aside>
        )}
        <div className="shell-stage">{props.children}</div>
        {isMobile ? (
        <nav className="sh-dock" aria-label="Navegação" ref={dockRef}>
          {renderContext()}
          <div className="sh-track" data-dock-scroll ref={bindTrack}>
            <span className="sh-thumb" aria-hidden="true" ref={thumbRef} />
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
        ) : null}
      </div>
    </ShellContext.Provider>
  );
}

var SHELL_CSS = [
  ".shell{display:flex;flex-direction:row;gap:0;isolation:isolate;height:100vh;height:100dvh;max-height:100dvh;width:100%;max-width:100%;background:transparent;color:var(--page-text,#F4F2EF);overflow:hidden;position:relative;overscroll-behavior:none;touch-action:manipulation;padding:12px 12px 12px 0;box-sizing:border-box}",
  ".sh-aurora{position:absolute;inset:-22%;pointer-events:none;z-index:0;background-repeat:no-repeat;background-size:150% 150%,140% 140%,160% 160%,120% 120%;background-image:radial-gradient(ellipse 55% 45% at 6% 10%,rgba(79,109,255,.5),transparent 60%),radial-gradient(ellipse 48% 40% at 96% 20%,rgba(180,76,255,.38),transparent 58%),radial-gradient(ellipse 50% 42% at 80% 92%,rgba(255,90,122,.34),transparent 56%),radial-gradient(ellipse 40% 34% at 20% 88%,rgba(196,165,124,.28),transparent 60%)}",
  ".shell-stage{position:relative;flex:1;min-width:0;min-height:0;height:100%;max-width:100%;overflow-x:hidden;overflow-y:auto;overscroll-behavior:none;-webkit-overflow-scrolling:touch;touch-action:pan-y;border-radius:28px;isolation:isolate}",
  ".shell-stage>.ch-root,.shell-stage>.pj-page,.shell-stage>.pw,.shell-stage>.fs-root,.shell-stage>.hub-scroll,.shell-stage>.tk-page,.shell-stage>.nt-root,.shell-stage>.vin-root{height:100%!important;max-height:100%!important;min-height:0!important}",
  ".shell-stage>.wl-page{min-height:100%!important;height:auto!important}",

  ".sh-side{display:flex;flex-direction:column;width:228px;flex-shrink:0;height:calc(100% - 8px);margin:4px 10px 4px 12px;position:relative;isolation:isolate;background:linear-gradient(168deg,rgba(255,255,255,.14),rgba(255,255,255,.04) 36%,rgba(8,8,14,.48));border:1px solid transparent;border-radius:36px;padding:16px 12px 12px;z-index:40;backdrop-filter:blur(48px) saturate(1.9);-webkit-backdrop-filter:blur(48px) saturate(1.9);overflow:hidden}",
  ".sh-side > *{position:relative;z-index:4}",
  ".sh-side.is-mini{width:72px;padding:14px 8px 10px;align-items:center;border-radius:40px}",
  ".sh-brand{display:flex;align-items:center;gap:12px;padding:4px 8px 14px;color:inherit;text-decoration:none;min-width:0}",
  ".sh-side.is-mini .sh-brand{padding:2px 0 12px;justify-content:center;width:44px}",
  ".sh-mark{color:#fff;flex-shrink:0}",
  ".sh-brand-txt{display:flex;flex-direction:column;min-width:0;line-height:1.15}",
  ".sh-brand-txt strong{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;letter-spacing:-.04em;color:#fff}",
  ".sh-brand-txt em{font-style:normal;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.4px;color:rgba(255,255,255,.45);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-nav{display:flex;flex-direction:column;gap:4px;flex:1;min-height:0;overflow-y:auto;padding:2px 0;scrollbar-width:none}",
  ".sh-nav::-webkit-scrollbar{display:none}",
  ".sh-side.is-mini .sh-nav{align-items:center;width:100%;gap:6px}",
  ".sh-block{display:flex;flex-direction:column;min-width:0}",
  ".sh-side.is-mini .sh-block{align-items:center}",
  ".sh-side .sh-link{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:none;background:transparent;color:rgba(255,255,255,.55);text-decoration:none;cursor:pointer;font-family:'Manrope',sans-serif;font-size:13.5px;font-weight:500;text-align:left;border-radius:18px;position:relative}",
  ".sh-side .sh-link:hover{color:#fff;background:rgba(255,255,255,.1)}",
  ".sh-side .sh-link::before{content:'';position:absolute;left:0;top:50%;width:3px;height:0;border-radius:999px;background:#fff;opacity:0;transform:translateY(-50%)}",
  ".sh-side .sh-link.is-on{color:#fff;background:rgba(255,255,255,.16)}",
  ".sh-side .sh-link.is-on::before{opacity:1;height:18px}",
  ".sh-side.is-mini .sh-link::before{display:none}",
  ".sh-side .sh-link.is-parent{color:#fff}",
  ".sh-side .sh-ic{display:flex;width:20px;height:20px;flex-shrink:0;align-items:center;justify-content:center}",
  ".sh-side .sh-ic svg{width:18px;height:18px}",
  ".sh-side .sh-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-side.is-mini .sh-link{width:44px;height:44px;padding:0;justify-content:center;gap:0;border-radius:50%}",
  ".sh-sub{display:flex;flex-direction:column;gap:2px;margin:6px 0 8px 14px;padding:4px 0 4px 10px;border-left:1px solid rgba(255,255,255,.14)}",
  ".sh-side .sh-sub-name{margin:0 0 4px;padding:0 8px;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:rgba(255,255,255,.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-sub-row{display:flex;align-items:center;gap:2px;min-width:0}",
  ".sh-sub-link{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:8px 10px;border:none;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;font-family:'Manrope',sans-serif;font-size:12.5px;text-align:left;border-radius:14px;text-decoration:none}",
  ".sh-sub-link:hover{color:#fff;background:rgba(255,255,255,.1)}",
  ".sh-sub-link.is-on{color:#fff;background:rgba(255,255,255,.14)}",
  ".sh-side .sh-sub-ic{width:16px;flex-shrink:0;text-align:center;font-size:13px;line-height:1}",
  ".sh-sub-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".sh-side .sh-sub-rm{width:24px;height:24px;flex-shrink:0;border:none;border-radius:50%;background:transparent;color:rgba(255,255,255,.35);cursor:pointer;font-size:15px;line-height:1;padding:0}",
  ".sh-side .sh-sub-rm:hover{background:rgba(192,140,140,.22);color:#C08C8C}",
  ".sh-sub-add{display:flex;flex-direction:column;gap:1px;margin-top:4px}",
  ".sh-sub-link.is-extra{color:rgba(255,255,255,.35);padding-left:12px}",
  ".sh-side.is-mini .sh-sub{margin:6px 0 4px;padding:0;border:none;align-items:center;gap:4px}",
  ".sh-side.is-mini .sh-sub-name,.sh-side.is-mini .sh-sub-lbl,.sh-side.is-mini .sh-sub-rm,.sh-side.is-mini .sh-sub-add{display:none}",
  ".sh-side.is-mini .sh-sub-link{width:40px;height:40px;padding:0;flex:none;justify-content:center;border-radius:50%}",
  ".sh-foot{display:flex;flex-direction:column;gap:4px;padding-top:10px;border-top:1px solid rgba(255,255,255,.12)}",
  ".sh-side.is-mini .sh-foot{align-items:center;width:100%}",
  ".sh-out{margin-top:4px;padding:8px 10px;border:none;background:transparent;color:rgba(255,255,255,.38);cursor:pointer;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;text-align:left}",
  ".sh-out:hover{color:#fff}",
  ".sh-collapse{margin-top:6px;width:100%;height:30px;border:1px solid transparent;border-radius:999px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);cursor:pointer;font-size:16px;line-height:1}",
  ".sh-collapse:hover{color:#fff;background:rgba(255,255,255,.12)}",
  ".sh-side.is-mini .sh-collapse{width:40px;height:28px}",
  "#root .sh-side{border-radius:36px!important}",
  "#root .sh-side.is-mini{border-radius:40px!important}",
  "#root .sh-side .sh-link{border-radius:18px!important}",
  "#root .sh-side.is-mini .sh-link,#root .sh-side.is-mini .sh-sub-link{border-radius:50%!important}",
  "#root .sh-side .sh-sub-link{border-radius:14px!important}",
  "#root .sh-side .sh-sub-rm,#root .sh-side .sh-collapse{border-radius:999px!important}",

  "@media(max-width:719px){",
  ".shell{--sh-dock:96px;flex-direction:column;padding:0;overflow:clip}",
  ".shell-stage{z-index:2;height:auto;border-radius:0;overflow-x:clip}",
  ".sh-dock{position:relative;z-index:1;isolation:isolate;flex:0 0 auto;align-self:stretch;width:auto;min-width:0;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;margin:8px 12px max(12px,env(safe-area-inset-bottom));min-height:56px;border-radius:999px;padding:6px 10px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05) 42%,rgba(8,8,14,.55));border:1px solid transparent;backdrop-filter:blur(48px) saturate(1.9);-webkit-backdrop-filter:blur(48px) saturate(1.9);overflow:hidden}",
  ".sh-dock::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:3;background:linear-gradient(155deg,rgba(255,255,255,.7),rgba(255,255,255,.18) 28%,rgba(255,255,255,.04) 52%,rgba(255,255,255,.26));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}",
  ".sh-dock::after{content:'';position:absolute;inset:1px 1px auto 1px;height:42%;border-radius:inherit;pointer-events:none;z-index:1;background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 75%)}",
  ".sh-dock>*{position:relative;z-index:4;min-width:0}",
  ".sh-track,.sh-subtrack{display:flex;flex-wrap:nowrap;align-items:center;min-width:0;width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-x;scrollbar-width:none}",
  ".sh-track::-webkit-scrollbar,.sh-subtrack::-webkit-scrollbar{display:none;height:0}",
  ".sh-track{position:relative;justify-content:flex-start;gap:8px;width:min(100%,300px);margin:0 auto;padding:4px 6px;scroll-snap-type:x mandatory;scroll-padding-inline:8px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12px,#000 calc(100% - 18px),transparent);mask-image:linear-gradient(90deg,transparent,#000 12px,#000 calc(100% - 18px),transparent)}",
  ".sh-subtrack{align-items:center;gap:2px;padding:2px 4px 8px}",
  ".sh-thumb{position:absolute;left:0;top:0;width:64px;height:48px;border-radius:999px;pointer-events:none;z-index:0;opacity:0;background:rgba(0,0,0,.62);border:1px solid rgba(255,255,255,.34);transform:translate3d(0,0,0)}",
  ".sh-thumb.is-ready{transition:transform 480ms cubic-bezier(0.22,1,0.36,1)}",
  ".sh-dock .sh-link{appearance:none;-webkit-appearance:none;display:flex;align-items:center;justify-content:center;flex:0 0 64px;width:64px;height:48px;min-height:48px;margin:0;padding:0;border:none;background:transparent;color:rgba(255,255,255,.72);text-decoration:none;cursor:pointer;border-radius:18px;position:relative;z-index:1;scroll-snap-align:start}",
  ".sh-dock .sh-link:hover{color:#fff;background:rgba(255,255,255,.1)}",
  ".sh-dock .sh-link.is-on,.sh-dock .sh-link.is-on:hover{color:#fff;background:transparent}",
  ".sh-dock .sh-ic{display:flex;width:22px;height:22px;flex-shrink:0;align-items:center;justify-content:center}",
  ".sh-dock .sh-ic svg{width:20px;height:20px}",
  ".sh-dock .sh-lbl{display:none!important}",
  ".sh-sep{flex:0 0 1px;width:1px;height:18px;align-self:center;margin:0 6px;background:rgba(255,255,255,.2)}",
  ".sh-dock .sh-chip{appearance:none;display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;height:28px;margin:0;padding:0 8px;border:none;background:transparent;color:rgba(255,255,255,.58);cursor:pointer;font-family:'Manrope',sans-serif;font-size:12px;text-decoration:none;white-space:nowrap;border-radius:999px}",
  ".sh-dock .sh-chip:hover,.sh-dock .sh-chip.is-on{color:#fff}",
  ".sh-dock .sh-chip.is-on{background:rgba(255,255,255,.12)}",
  ".sh-dock .sh-sub-ic{width:14px;flex-shrink:0;text-align:center;font-size:12px;line-height:1;opacity:.8}",
  ".sh-dock .sh-sub-name{flex:0 1 auto;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Manrope',sans-serif;font-size:10px;color:rgba(255,255,255,.34);padding:0 6px 0 4px;text-transform:none;letter-spacing:.2px;margin:0}",
  "#root .sh-dock{border-radius:999px!important}",
  "#root .sh-dock .sh-link{border-radius:18px!important}",
  "#root .sh-dock .sh-link.is-on,#root .sh-dock .sh-link.is-on:hover{color:#fff!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important}",
  "#root .sh-dock .sh-thumb{border-radius:999px!important;background:rgba(0,0,0,.62)!important;border:1px solid rgba(255,255,255,.34)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 -1px 1px rgba(0,0,0,.45)!important;backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4)}",
  "#root .sh-dock .sh-thumb.is-ready{transition:transform 480ms cubic-bezier(0.22,1,0.36,1)!important}",
  "#root .sh-dock .sh-chip{border-radius:999px!important}",
  ".ch-fab,.tk-fab{bottom:calc(var(--sh-dock,112px) + 12px)!important}",
  ".fs-immersive-bar{bottom:var(--sh-dock,112px)!important}",
  ".shell .ps-sheet-bk,.shell .ch-sheet-bg,.shell .tk-sheet-bg,.shell .fs-modal-bg,.shell .pj-mbk,.shell .pw-bk{z-index:120!important;box-sizing:border-box;padding-bottom:calc(var(--sh-dock,96px) + 10px)!important}",
  ".shell .hub-scroll .hub-inner{padding-top:max(18px,env(safe-area-inset-top))!important}",
  ".shell .pw-head{padding-left:12px!important}",
  ".shell .pw-side{bottom:var(--sh-dock,96px)!important}",
  "}",
].join("");
