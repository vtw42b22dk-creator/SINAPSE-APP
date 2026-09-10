import { useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { useCloudSync } from "../lib/useCloudSync";
import { bootstrapSync, pullAllCore, pushPendingSync } from "../lib/syncBootstrap";

var SYNC_TABLES = [
  "calendar_events",
  "tasks",
  "synapse_projects",
  "project_stock",
  "project_investments",
  "project_notes",
  "project_kpis",
  "project_inventory",
  "journal_spaces",
  "journal_blocks",
  "wishlist_items",
  "wishlist_groups",
  "expenses",
  "incomes",
];

export default function SyncRoot(props) {
  var auth = useAuth();
  var userId = auth && auth.user ? auth.user.id : null;

  useEffect(function() {
    if (!userId) return;
    bootstrapSync().catch(function() {});
  }, [userId]);

  useCloudSync({
    tables: SYNC_TABLES,
    intervalMs: 4000,
    shouldSkip: function() { return !userId; },
    onPull: pullAllCore,
    onPush: pushPendingSync,
  });

  return props.children || null;
}
