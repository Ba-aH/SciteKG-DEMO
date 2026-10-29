// The only place that talks to the backend directly, plus paper metadata used by several areas.
import { API_BASE } from './config.js';

export async function api(path, options){
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

/* ---------------------------------------------------------
   LIGHTWEIGHT LOCAL CACHE
   In-memory cache of paper metadata so we don't re-fetch the
   same node twice while browsing the graph. The data itself
   now comes from the API, not from local JSON files.
--------------------------------------------------------- */
const paperCache = new Map(); // uri -> {uri, title, authors, abstract, year, venue}

export async function apiPaperDetail(uri){
  if (!paperCache.has(uri)){
    paperCache.set(uri, await api(`/paper?uri=${encodeURIComponent(uri)}`));
  }
  return paperCache.get(uri);
}
