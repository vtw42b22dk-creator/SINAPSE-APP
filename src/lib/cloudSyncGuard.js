var pauseUntil = 0;

/** Evita que um pull da nuvem apague alterações locais recentes. */
export function pauseCloudPull(ms) {
  pauseUntil = Date.now() + (ms || 5000);
}

export function isCloudPullPaused() {
  return Date.now() < pauseUntil;
}
