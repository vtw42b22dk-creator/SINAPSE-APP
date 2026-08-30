import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";

/**
 * Sincronização segura entre dispositivos:
 * - onPush ao sair do separador / ficar offline
 * - onPull ao voltar, ao ganhar foco, ao repor rede, em intervalo e via Realtime
 * - merge protegido fica nos stores (shouldSkip)
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
      var pullTimer = 0;

      function pull() {
        var o = optsRef.current;
        if (o.onPull && !(o.shouldSkip && o.shouldSkip())) {
          Promise.resolve().then(function() { return o.onPull(); }).catch(function() {});
        }
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

      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("online", onOnline);
      window.addEventListener("focus", onFocus);

      var intervalMs = optsRef.current.intervalMs || 12000;
      var interval = setInterval(function() {
        if (document.visibilityState === "visible") pull();
      }, intervalMs);

      var channel = null;
      var tables = optsRef.current.tables;
      if (supabase && tables && tables.length) {
        channel = supabase.channel("sync-" + tables.join("-") + "-" + userId.slice(0, 8));
        tables.forEach(function(table) {
          channel.on(
            "postgres_changes",
            { event: "*", schema: "public", table: table },
            function() {
              clearTimeout(pullTimer);
              pullTimer = setTimeout(pull, 400);
            }
          );
        });
        channel.subscribe();
      }

      return function() {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("focus", onFocus);
        clearInterval(interval);
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
