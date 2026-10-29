import { api } from '../shared/api.js';

export function apiExample(withDetails){
  return api(`/example?with_details=${withDetails}`); // {context, cited_uri, citing_uri, title, abstract}
}
