import { api } from '../shared/api.js';
import { PAGE_SIZE } from './state.js';

const authorCache = new Map(); // uri -> {uri, name, papers}

export function apiGraph(uri, offsets, full = false){
  const params = new URLSearchParams({
    uri,
    limit: PAGE_SIZE,
    references_offset: offsets.references,
    cited_by_offset: offsets.cited_by,
    authors_offset: offsets.authors,
    full
  });
  return api(`/graph?${params}`);
  // {uri, title, references: [{uri, title, context}], cited_by: [{uri, title, context}],
  //  authors: [{uri, name}], totals: {references, cited_by, authors}, offsets: {...}}
  // with full = true nothing is paged: every neighbor comes back
  // context: {uri, text, marker, type, before, after} | null
}

export async function apiAuthorDetail(uri){
  if (!authorCache.has(uri)){
    authorCache.set(uri, await api(`/author?uri=${encodeURIComponent(uri)}`));
  }
  return authorCache.get(uri); // {uri, name, papers: [{uri, title}]}
}
