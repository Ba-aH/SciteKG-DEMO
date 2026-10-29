import { api } from '../shared/api.js';

export function apiPredict(body){
  return api('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }); // {results: [{rank, score, uri, title}, ...]}
}
