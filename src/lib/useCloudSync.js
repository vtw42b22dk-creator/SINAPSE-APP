import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { isCloudPullPaused } from "./cloudSyncGuard";

/** Carrega da nuvem ao abrir e ao voltar à app — sem polling que apaga o que escreves. */
export function useCloudSync(loadFn) {
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var loadRef = useRef(loadFn);
  loadRef.current = loadFn;

  function runLoad() {
    if (isCloudPullPaused()) return Promise.resolve();
    return Promise.resolve().then(function() {
      return loadRef.current();
    });
  }

  useEffect(
    function() {
      if (!userId) return;
      runLoad();
    },
    [userId]
  );

  useEffect(
    function() {
      if (!userId) return;
      function refresh() {
        if (document.visibilityState && document.visibilityState !== "visible") return;
        runLoad();
      }
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", refresh);
      return function() {
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", refresh);
      };
    },
    [userId]
  );

  return { refresh: runLoad };
}
