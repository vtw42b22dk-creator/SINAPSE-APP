export function PageLoader(props) {
  var accent = props.accent || "#E6E6E9";
  var lines = props.lines || 5;
  return (
    <div style={{ padding: props.compact ? "12px 0" : "24px 0", animation: "modIn .3s ease" }} aria-busy="true" aria-label="A carregar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + accent + "33", borderTopColor: accent, animation: "spin .8s linear infinite" }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#A0A0A8", letterSpacing: 1 }}>{props.label || "A CARREGAR…"}</span>
      </div>
      {Array.from({ length: lines }).map(function(_, i) {
        return (
          <div
            key={i}
            style={{
              height: i === 0 ? 28 : 52,
              marginBottom: 10,
              borderRadius: 12,
              background: "#141416",
              border: "1px solid rgba(255,255,255,0.07)",
              boxSizing: "border-box",
              animation: "modIn .3s ease " + (i * 0.04) + "s both",
            }}
          />
        );
      })}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
