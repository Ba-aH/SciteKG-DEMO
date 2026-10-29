// The chrome around the graph: legend toggles, pagers, the Back button and the full-page view.
import { $ } from '../shared/ui.js';
import { PAGE_SIZE, state } from './state.js';

let actions = {}; // {reload, show, applyLayers}, provided by graph.js

export function initControls(callbacks){
  actions = callbacks;

  document.querySelectorAll('#legend [data-layer]').forEach(button => {
    button.addEventListener('click', () => {
      const layer = button.dataset.layer;
      state.layers[layer] = !state.layers[layer];
      button.setAttribute('aria-pressed', state.layers[layer]);
      actions.applyLayers();
    });
  });

  document.querySelectorAll('#pagers .pager').forEach(pager => {
    pager.addEventListener('click', (e) => {
      const step = Number(e.target.dataset.step);
      if (!step) return;
      const layer = pager.dataset.layer;
      state.offsets[layer] = Math.max(0, state.offsets[layer] + step * PAGE_SIZE);
      actions.reload();
    });
  });

  $('btn-back').addEventListener('click', () => {
    const previous = state.trail.pop();
    if (previous) actions.show(previous.uri, previous.title, previous.offsets);
  });

  $('btn-full-graph').addEventListener('click', () => state.fullView ? leaveFullView() : enterFullView());
}

// refreshes everything around the graph after a (re)render
export function updateControls(graph){
  updateLegend(graph);
  updatePagers(graph);
  $('btn-back').hidden = state.trail.length === 0;
  $('btn-full-graph').textContent = state.fullView ? 'Back to recommendations' : 'View full graph';
  $('graph-title').textContent = state.fullView ? 'Full neighbourhood' : 'Neighbourhood';
}

function updateLegend({ counts }){
  document.querySelectorAll('#legend [data-layer]').forEach(button => {
    button.querySelector('.count').textContent = counts[button.dataset.layer];
  });
}

// "‹ 11–20 of 37 ›" for every list that has more than one page
function updatePagers({ counts, offsets }){
  const pagers = document.querySelectorAll('#pagers .pager');
  pagers.forEach(pager => {
    const layer = pager.dataset.layer;
    const total = counts[layer];
    const start = offsets[layer];
    pager.hidden = state.fullView || total <= PAGE_SIZE;
    pager.querySelector('.pager-range').textContent = `${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}`;
    pager.querySelector('[data-step="-1"]').disabled = start === 0;
    pager.querySelector('[data-step="1"]').disabled = start + PAGE_SIZE >= total;
  });
  $('pagers').hidden = [...pagers].every(pager => pager.hidden);
}

// Full-page view: hides everything but the graph and loads every neighbor, unpaged.
// Leaving restores the paper, page and trail the user came from.
function setFullView(on){
  state.fullView = on;
  document.body.classList.toggle('full-view', on);
}

function enterFullView(){
  state.fullViewOrigin = {
    uri: state.selectedUri,
    title: state.selectedTitle,
    offsets: { ...state.offsets },
    trail: [...state.trail]
  };
  setFullView(true);
  actions.reload();
}

export function leaveFullView(){
  const { uri, title, offsets, trail } = state.fullViewOrigin;
  setFullView(false);
  state.trail = trail;
  actions.show(uri, title, offsets);
}
