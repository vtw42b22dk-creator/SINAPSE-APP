var pauses = {};

/** Evita que um pull da nuvem apague alterações locais recentes. */
export function pauseCloudPull(ms, scope) {
  pauses[scope || "*"] = Date.now() + (ms || 5000);
}

export function isCloudPullPaused(scope) {
  var now = Date.now();
  if (scope) return now < (pauses[scope] || 0);
  return now < (pauses["*"] || 0);
}
