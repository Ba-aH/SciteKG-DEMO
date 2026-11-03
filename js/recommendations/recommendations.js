// Recommendation list: runs the ranking and shows the cards. Selecting a card is reported through onSelect.
import { $, el, setStatus } from '../shared/ui.js';
import { citeButton } from '../shared/bibtex.js';
import { apiPredict } from './api.js';

const TOPK = 20;

let onSelect = () => {};
let onViewDetails = () => {};

// onSelect(result) selects a card or the top result; onViewDetails(result) opens its paper details.
export function initRecommendations(callbacks){
  onSelect = callbacks.onSelect;
  onViewDetails = callbacks.onViewDetails ?? (() => {});
  return { rank, highlight };
}

// query: {context, title, abstract, expectedUri} from the input area
async function rank({ context, title, abstract, expectedUri }){
  setStatus('Running inference…');

  try {
    const { results: ranked } = await apiPredict({
      context, topk: TOPK, title: title || null, abstract: abstract || null
    });
    if (!ranked.length){
      setStatus('No results');
      return;
    }
    renderResults(ranked, expectedUri);
    setStatus(resultSummary(ranked, expectedUri));
  } catch (err){
    console.error(err);
    setStatus('Inference failed — check console / backend logs', true);
  }
}

// marks the card of the paper the graph is showing
function highlight(uri){
  document.querySelectorAll('.rank-card').forEach(card =>
    card.classList.toggle('active', card.dataset.uri === uri));
}

function resultSummary(results, expectedUri){
  let summary = `${results.length} candidates`;
  if (expectedUri){
    const hit = results.find(r => r.uri === expectedUri);
    summary += hit ? ` · gold paper at rank ${hit.rank}` : ` · gold paper not in top ${results.length}`;
  }
  return summary;
}

function renderResults(ranked, expectedUri){
  $('empty-state').hidden = true;
  $('results-body').hidden = false;

  $('ranked-list').replaceChildren(
    ...ranked.map(r => resultCard(r, r.score * 100, r.uri === expectedUri))
  );
  onSelect(ranked[0]);
}

function resultCard(result, barPct, isExpected){
  const bar = el('i');
  bar.style.width = `${barPct}%`;

  const meta = el('span', { className: 'rank-meta' },
    el('span', { className: 'score-bar' }, bar),
    el('span', { className: 'score', textContent: result.score.toFixed(4) })
  );
  if (isExpected) meta.append(el('span', { className: 'badge', textContent: 'Gold paper' }));

  const select = el('button', { className: 'rank-select', onclick: () => onSelect(result) },
    el('span', { className: 'rank-num', textContent: result.rank }),
    el('span', { className: 'rank-body' },
      el('span', { className: 'rank-title', textContent: result.title, title: result.title }),
      meta
    )
  );

  const actions = el('div', { className: 'rank-actions' },
    recommendationAction('view-details', 'View details', () => onViewDetails(result)),
    recommendationAction('view-graph', 'View graph', () => onSelect(result)),
    citeButton(result.uri)
  );

  const card = el('article', { className: 'rank-card' + (isExpected ? ' expected' : '') }, select, actions);
  card.dataset.uri = result.uri;
  return card;
}

function recommendationAction(icon, label, onclick){
  const image = el('img', {
    className: 'rank-action-icon',
    src: `assets/${icon}.png`,
    alt: '',
    onerror: (event) => { event.currentTarget.hidden = true; }
  });
  return el('button', {
    className: 'btn btn-primary-soft btn-sm rank-action-button',
    type: 'button',
    title: label,
    onclick
  }, image, label);
}
