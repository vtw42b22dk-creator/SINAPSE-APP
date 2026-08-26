export function PageLoader(props) {
  var accent = props.accent || "#E6E6E9";
  var lines = props.lines || 5;
  return (
    <div style={{ padding: props.compact ? "16px 0" : "28px 0", "--mc": accent }} aria-busy="true" aria-label="A carregar">
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 28 }}>
        <span className="skel-label" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 2.2 }}>
          {props.label || "A CARREGAR"}
        </span>
        <span className="skel-rule" style={{ flex: 1, height: 1 }} />
      </div>
      {Array.from({ length: lines }).map(function(_, i) {
        return (
          <div
            key={i}
            className="skel skel-accent"
            style={{
              height: 1,
              width: i === 0 ? "42%" : i % 2 === 0 ? "100%" : "72%",
              marginBottom: i % 3 === 0 ? 28 : 14,
              animationDelay: (i * 0.12) + "s",
            }}
          />
        );
      })}
    </div>
  );
}
