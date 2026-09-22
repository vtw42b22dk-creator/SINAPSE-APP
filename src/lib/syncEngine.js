import {
  fetchRemoteState,
  applyMergedPull,
  readLocal,
} from "./cloudStore";

/**
 * Sincronização segura: merge com nuvem, proteção anti-perda, gravação local.
 * customMerge(local, remote, deletedIds, ctx) — ctx.droppedIds deve ser preenchido
 * quando o merge customizado descarta ids.
 */
export async function safePullMerge(localKey, table, normalizeFn, customMerge) {
  var local = await readLocal(localKey, []);
  var state = await fetchRemoteState(table, normalizeFn);
  if (!state.authoritative) return local;
  return applyMergedPull(localKey, table, local, state.rows, {
    authoritative: true,
    customMerge: customMerge,
  });
}
