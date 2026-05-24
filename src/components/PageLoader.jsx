export function PageLoader(props) {
  var accent = props.accent || "#7B61FF";
  var lines = props.lines || 5;
  return (
    <div style={{ padding: props.compact ? "12px 0" : "24px 0", animation: "modIn .3s ease" }} aria-busy="true" aria-label="A carregar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + accent + "33", borderTopColor: accent, animation: "spin .8s linear infinite" }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: accent, letterSpacing: 1 }}>{props.label || "A CARREGAR…"}</span>
      </div>
      {Array.from({ length: lines }).map(function(_, i) {
        return (
          <div
            key={i}
            style={{
              height: i === 0 ? 28 : 52,
              marginBottom: 10,
              borderRadius: 12,
              background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s ease-in-out infinite",
              animationDelay: i * 0.08 + "s",
            }}
          />
        );
      })}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
