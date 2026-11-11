import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";

/**
 * Sincronização entre dispositivos sem descarregar a conta em ciclo curto.
 * O tempo real avisa quando outra sessão grava. O intervalo é só uma rede
 * de segurança: 3 min com o canal ligado, nunca abaixo de 45 s se cair.
 * onPull ao abrir, ao voltar ao separador, ao ganhar foco e ao repor a rede.
 * O merge protegido fica nos stores (shouldSkip).
 */
var SAFETY_MS = 180000;
var FALLBACK_MS = 45000;

export function useCloudSync(opts) {
  opts = opts || {};
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;
  var optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(
    function() {
      if (!userId) return;
      var pullTimer = 0;
      var pollTimer = 0;
      var realtimeUp = false;

      function pull() {
        clearTimeout(pullTimer);
        pullTimer = setTimeout(function() {
          var o = optsRef.current;
          if (o.onPull && !(o.shouldSkip && o.shouldSkip())) {
            Promise.resolve().then(function() { return o.onPull(); }).catch(function() {});
          }
        }, 500);
      }

      function nextDelay() {
        if (realtimeUp) return SAFETY_MS;
        var asked = Number(optsRef.current.intervalMs);
        if (!isFinite(asked) || asked < FALLBACK_MS) return FALLBACK_MS;
        return asked;
      }

      function schedule() {
        clearTimeout(pollTimer);
        pollTimer = setTimeout(function() {
          if (document.visibilityState === "visible") pull();
          schedule();
        }, nextDelay());
      }

      function push() {
        var o = optsRef.current;
        if (o.onPush) {
          Promise.resolve().then(function() { return o.onPush(); }).catch(function() {});
        }
      }

      function onVisibility() {
        if (document.visibilityState === "hidden") {
          push();
          return;
        }
        pull();
      }

      function onOnline() {
        pull();
      }

      function onFocus() {
        pull();
      }

      function onPageShow() { pull(); }

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("online", onOnline);
      window.addEventListener("focus", onFocus);
      window.addEventListener("pageshow", onPageShow);

      pull();
      schedule();

      var channel = null;
      var tables = optsRef.current.tables;
      if (supabase && tables && tables.length) {
        channel = supabase.channel("sync-" + tables.join("-") + "-" + userId.slice(0, 8));
        tables.forEach(function(table) {
          var filter = { event: "*", schema: "public", table: table, filter: "user_id=eq." + userId };
          channel.on("postgres_changes", filter, function() {
            pull();
          });
        });
        channel.subscribe(function(status) {
          var up = status === "SUBSCRIBED";
          if (up === realtimeUp) return;
          realtimeUp = up;
          schedule();
        });
      }

      return function() {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("pageshow", onPageShow);
        clearTimeout(pollTimer);
        clearTimeout(pullTimer);
        if (channel) {
          try { supabase.removeChannel(channel); } catch (e) {}
        }
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
