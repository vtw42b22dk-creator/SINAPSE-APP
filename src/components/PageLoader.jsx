export function PageLoader(props) {
  var lines = props.lines || 5;
  return (
    <div style={{ padding: props.compact ? "16px 0" : "28px 0" }} aria-busy="true" aria-label="A carregar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#E6E6E9",
          animation: "breathe 1.6s ease-in-out infinite",
        }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6E6E76", letterSpacing: 1.4 }}>
          {props.label || "A CARREGAR"}
        </span>
      </div>
      {Array.from({ length: lines }).map(function(_, i) {
        return (
          <div
            key={i}
            className="skel"
            style={{
              height: i === 0 ? 22 : i % 3 === 0 ? 44 : 56,
              width: i === 0 ? "42%" : i % 2 === 0 ? "100%" : "88%",
              marginBottom: 10,
              borderRadius: 12,
              background: "#141416",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              animationDelay: (i * 0.12) + "s",
            }}
          />
        );
      })}
    </div>
  );
}
