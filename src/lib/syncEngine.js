import {
  fetchRemoteRows,
  getLocalDeletedIds,
  mergePullFromRemote,
  readLocal,
  writeLocal,
} from "./cloudStore";
import { guardMergeResult } from "./dataGuard";

/**
 * Sincronização segura: merge com nuvem, proteção anti-perda, gravação local.
 */
export async function safePullMerge(localKey, table, normalizeFn, customMerge) {
  var local = await readLocal(localKey, []);
  var deletedIds = await getLocalDeletedIds(localKey);
  var remote = [];
  try {
    remote = await fetchRemoteRows(table, normalizeFn);
  } catch (e) {
    return local;
  }

  var merged;
  if (customMerge) {
    merged = customMerge(local, remote, deletedIds);
  } else {
    merged = mergePullFromRemote(local, remote, deletedIds);
  }

  merged = guardMergeResult(local, merged, deletedIds);
  await writeLocal(localKey, merged);
  return merged;
}
