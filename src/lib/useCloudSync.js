import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

/** Recarrega dados da nuvem ao entrar na página e ao voltar à app (outro dispositivo). */
export function useCloudSync(loadFn) {
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var syncingRef = useRef(false);
  var readyRef = useRef(false);
  var loadRef = useRef(loadFn);
  loadRef.current = loadFn;

  useEffect(
    function() {
      if (!userId) return;
      syncingRef.current = true;
      Promise.resolve()
        .then(function() { return loadRef.current(); })
        .catch(function() {})
        .finally(function() {
          syncingRef.current = false;
          readyRef.current = true;
        });
    },
    [userId]
  );

  useEffect(
    function() {
      if (!userId) return;
      function refresh() {
        if (!readyRef.current) return;
        if (document.visibilityState && document.visibilityState !== "visible") return;
        syncingRef.current = true;
        Promise.resolve()
          .then(function() { return loadRef.current(); })
          .catch(function() {})
          .finally(function() {
            syncingRef.current = false;
          });
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

  return syncingRef;
}
