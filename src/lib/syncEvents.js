var EVENT = "sinapse-sync";

export function emitSync(table) {
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { table: table || "*", at: Date.now() } }));
  } catch (e) {}
}

export function onSync(fn) {
  function handler(e) { fn(e && e.detail ? e.detail : { table: "*" }); }
  window.addEventListener(EVENT, handler);
  return function() { window.removeEventListener(EVENT, handler); };
}
