export function PageLoader(props) {
  var lines = props.lines || 5;
  return (
    <div style={{ padding: props.compact ? "16px 0" : "28px 0" }} aria-busy="true" aria-label="A carregar">
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#6E6E76", letterSpacing: 2.2 }}>
          {props.label || "A CARREGAR"}
        </span>
        <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      </div>
      {Array.from({ length: lines }).map(function(_, i) {
        return (
          <div
            key={i}
            className="skel"
            style={{
              height: 1,
              width: i === 0 ? "42%" : i % 2 === 0 ? "100%" : "72%",
              marginBottom: i % 3 === 0 ? 28 : 14,
              background: "rgba(255,255,255,0.12)",
              animationDelay: (i * 0.12) + "s",
            }}
          />
        );
      })}
    </div>
  );
}
