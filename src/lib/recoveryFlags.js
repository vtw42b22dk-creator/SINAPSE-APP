var SKIP_KEY = "sinapse-skip-sync-until";
var EVENT = "sinapse-data-recovered";

export function markJustRecovered() {
  try {
    sessionStorage.setItem(SKIP_KEY, String(Date.now() + 120000));
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {}
}

export function shouldSkipCloudSync() {
  try {
    var until = Number(sessionStorage.getItem(SKIP_KEY) || 0);
    return Date.now() < until;
  } catch (e) {
    return false;
  }
}

export { EVENT as RECOVERY_EVENT };
