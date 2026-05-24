import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

/**
 * Sincronização segura:
 * - onPush ao sair do separador (grava na nuvem)
 * - onPull ao voltar (só se shouldSkip permitir) — merge protegido nos stores
 */
export function useCloudSync(opts) {
  opts = opts || {};
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(
    function() {
      if (!userId) return;

      function onVisibility() {
        var o = optsRef.current;
        if (document.visibilityState === "hidden") {
          if (o.onPush) {
            Promise.resolve().then(function() { return o.onPush(); }).catch(function() {});
          }
          return;
        }
        if (o.onPull && !(o.shouldSkip && o.shouldSkip())) {
          Promise.resolve().then(function() { return o.onPull(); }).catch(function() {});
        }
      }

      document.addEventListener("visibilitychange", onVisibility);
      return function() {
        document.removeEventListener("visibilitychange", onVisibility);
      };
    },
    [userId]
  );

  return {
    reload: function() {
      var o = optsRef.current;
      if (o.onPull) return o.onPull();
      return Promise.resolve();
    },
  };
}
