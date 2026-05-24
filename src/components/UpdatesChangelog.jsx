import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as changelog from "../lib/changelog";

var MODULE_PATHS = {
  synapse: "/synapse",
  journal: "/journal",
  calendar: "/calendar",
  tasks: "/tasks",
  wishlist: "/wishlist",
  finance: "/finance",
};

function Tag(props) {
  return (
    <span style={{
      fontSize: 9,
      fontFamily: "'JetBrains Mono',monospace",
      letterSpacing: 0.6,
      padding: "3px 8px",
      borderRadius: 999,
      background: props.color + "18",
      border: "1px solid " + props.color + "40",
      color: props.color,
      flexShrink: 0,
    }}>{props.children}</span>
  );
}

export function UpdatesFloatingButton(props) {
  var isMobile = props.isMobile;
  var unread = props.unread;
  var onOpen = props.onOpen;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ver atualizações"
      style={{
        position: "fixed",
        zIndex: 50,
        left: isMobile ? 14 : "auto",
        right: isMobile ? "auto" : 18,
        bottom: isMobile ? 18 : 22,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: isMobile ? "12px 16px" : "12px 18px 12px 14px",
        borderRadius: 999,
        border: "1px solid rgba(0,255,200,0.35)",
        background: "linear-gradient(135deg, rgba(0,255,200,0.14), rgba(123,97,255,0.12))",
        backdropFilter: "blur(20px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45), 0 0 32px rgba(0,255,200,0.12)",
        cursor: "pointer",
        fontFamily: "'IBM Plex Sans',sans-serif",
        color: "#fff",
        animation: "floatBubble 4s ease-in-out infinite",
        maxWidth: isMobile ? "calc(100vw - 28px)" : "none",
      }}
    >
      <span style={{
        position: "relative",
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(0,255,200,0.12)",
        border: "1px solid rgba(0,255,200,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0,
      }}>
        ✦
        {unread ? (
          <span style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#FF3D8A",
            border: "2px solid #0A0A0F",
            animation: "pulseDot 1.8s ease-in-out infinite",
          }} />
        ) : null}
      </span>
      <span style={{ textAlign: "left", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "#00FFC8", letterSpacing: 1 }}>NOVIDADES</span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>Ver atualizações</span>
      </span>
      {unread && !isMobile ? (
        <span style={{
          fontSize: 9,
          fontFamily: "'JetBrains Mono',monospace",
          color: "#FF3D8A",
          background: "rgba(255,61,138,0.15)",
          border: "1px solid rgba(255,61,138,0.35)",
          borderRadius: 8,
          padding: "4px 8px",
        }}>NOVO</span>
      ) : null}
    </button>
  );
}

export default function UpdatesChangelog(props) {
  var open = props.open;
  var onClose = props.onClose;
  var isMobile = props.isMobile;
  var navigate = useNavigate();
  var data = changelog.CHANGELOG;
  var slideS = useState(false);
  var visible = slideS[0], setVisible = slideS[1];

  useEffect(function() {
    if (open) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return function() { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(function() {
    if (!open) {
      var t = setTimeout(function() { setVisible(false); }, 280);
      return function() { clearTimeout(t); };
    }
    setVisible(true);
  }, [open]);

  if (!open && !visible) return null;

  function closeAndSeen() {
    changelog.markChangelogSeen();
    if (props.onSeen) props.onSeen();
    onClose();
  }

  function goModule(mod) {
    var path = MODULE_PATHS[mod];
    if (path) {
      closeAndSeen();
      navigate(path);
    }
  }

  return (
    <div
      onClick={closeAndSeen}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 20,
        opacity: open ? 1 : 0,
        transition: "opacity 0.28s ease",
      }}
    >
      <style>{`
        @keyframes floatBubble{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:0.85}}
        @keyframes sheetUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes panelIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shimmer{0%{background-position:0% 50%}100%{background-position:200% 50%}}
      `}</style>

      <div
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          width: isMobile ? "100%" : "min(520px,94vw)",
          maxHeight: isMobile ? "88vh" : "min(640px,86vh)",
          borderRadius: isMobile ? "24px 24px 0 0" : 24,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(165deg, rgba(14,15,28,0.98), rgba(8,9,16,0.99))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 100px rgba(0,0,0,0.6)",
          animation: isMobile ? "sheetUp 0.38s cubic-bezier(0.16,1,0.3,1)" : "panelIn 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {isMobile ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.15)" }} />
          </div>
        ) : null}

        <div style={{
          padding: isMobile ? "16px 18px 18px" : "22px 24px 20px",
          background: "linear-gradient(120deg, rgba(0,255,200,0.08), rgba(123,97,255,0.06), rgba(255,61,138,0.05))",
          backgroundSize: "200% 200%",
          animation: "shimmer 8s ease infinite",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#00FFC8", letterSpacing: 2 }}>CHANGELOG · {data.dateLabel}</p>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, lineHeight: 1.2 }}>{data.title}</h2>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{data.subtitle}</p>
            </div>
            <button type="button" onClick={closeAndSeen} style={{
              width: 36, height: 36, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", fontSize: 18, cursor: "pointer", flexShrink: 0,
            }}>×</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {data.highlights.map(function(h) {
              return (
                <span key={h.label} style={{
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono',monospace",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid " + h.color + "35",
                  background: h.color + "10",
                  color: h.color,
                }}>{h.label}</span>
              );
            })}
          </div>
        </div>

        <div data-scrollable style={{
          flex: 1,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          padding: isMobile ? "14px 16px 8px" : "16px 20px 8px",
        }}>
          {data.sections.map(function(section, si) {
            return (
              <section key={section.id} style={{ marginBottom: si < data.sections.length - 1 ? 22 : 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: section.accent + "14",
                    border: "1px solid " + section.accent + "30",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: section.accent,
                  }}>{section.icon}</span>
                  <h3 style={{ margin: 0, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: section.accent, letterSpacing: 0.5 }}>{section.title}</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: isMobile ? 0 : 8 }}>
                  {section.items.map(function(item, ii) {
                    var canGo = item.module && MODULE_PATHS[item.module];
                    return (
                      <article
                        key={section.id + "-" + ii}
                        onClick={canGo ? function() { goModule(item.module); } : undefined}
                        style={{
                          borderRadius: 16,
                          padding: "14px 16px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "rgba(255,255,255,0.02)",
                          cursor: canGo ? "pointer" : "default",
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                        onMouseEnter={canGo ? function(e) {
                          e.currentTarget.style.borderColor = section.accent + "40";
                          e.currentTarget.style.background = section.accent + "08";
                        } : undefined}
                        onMouseLeave={canGo ? function(e) {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        } : undefined}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <Tag color={item.tagColor}>{item.tag}</Tag>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#fff" }}>{item.title}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.55 }}>{item.desc}</p>
                            {canGo ? (
                              <p style={{ margin: "8px 0 0", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: section.accent }}>Abrir módulo →</p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div style={{
          flexShrink: 0,
          padding: isMobile ? "14px 16px max(18px, env(safe-area-inset-bottom))" : "16px 20px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,0,0,0.25)",
        }}>
          <button
            type="button"
            onClick={closeAndSeen}
            style={{
              width: "100%",
              padding: "14px 20px",
              borderRadius: 14,
              border: "1px solid rgba(0,255,200,0.4)",
              background: "linear-gradient(90deg, rgba(0,255,200,0.15), rgba(123,97,255,0.12))",
              color: "#00FFC8",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12,
              letterSpacing: 1,
              cursor: "pointer",
            }}
          >
            Percebi — esconder até à próxima atualização
          </button>
        </div>
      </div>
    </div>
  );
}
