/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { refreshSession } from "./cloudStore";
import { supabase } from "./supabase";

var AuthContext = createContext(null);

export function AuthProvider(props) {
  var sS = useState(null);
  var session = sS[0], setSession = sS[1];
  var lS = useState(true);
  var loading = lS[0], setLoading = lS[1];

  useEffect(function() {
    var mounted = true;
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(function(res) {
      if (!mounted) return;
      setSession(res.data.session || null);
      setLoading(false);
    });
    var sub = supabase.auth.onAuthStateChange(function(_event, nextSession) {
      setSession(nextSession || null);
      setLoading(false);
    });
    function onFocus() {
      refreshSession().then(function(s) {
        if (s && mounted) setSession(s);
      });
    }
    function onVisible() {
      if (document.visibilityState === "visible") onFocus();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    var interval = setInterval(onFocus, 45 * 60 * 1000);
    return function() {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    if (!supabase) throw new Error("Supabase não está configurado.");
    return supabase.auth.signInWithPassword({ email: email, password: password });
  }

  async function signUp(email, password) {
    if (!supabase) throw new Error("Supabase não está configurado.");
    return supabase.auth.signUp({ email: email, password: password });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  var value = useMemo(function() {
    return {
      session: session,
      user: session ? session.user : null,
      loading: loading,
      configured: !!supabase,
      signIn: signIn,
      signUp: signUp,
      signOut: signOut,
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
