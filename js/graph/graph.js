// The graph area: loads a paper's neighbourhood, draws it, and handles navigating through it.
import { $ } from '../shared/ui.js';
import { buildGraphAround } from './elements.js';
import { initControls, leaveFullView, updateControls } from './controls.js';
import { closePanel, initPanel, isPanelOpen, openAuthorPanel, openContextPanel, openPaperPanel } from './panel.js';
import { state } from './state.js';
import { graphStyle } from './style.js';

let onFocus = () => {};

// onFocus(uri) runs whenever the paper at the center of the graph changes
export function initGraph(callbacks){
  onFocus = callbacks.onFocus;

  initPanel({ getSelectedUri: () => state.selectedUri, onExplore: exploreFrom });
  initControls({ reload: loadGraph, show: showNeighborhood, applyLayers });

  // Esc: close the detail panel first, then leave the full view
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isPanelOpen()) closePanel();
    else if (state.fullView) leaveFullView();
  });

  return { selectFromList, showPaperDetails };
}

function showPaperDetails(uri){
  return openPaperPanel(uri, null, 'selected');
}

// a fresh selection (from the recommendation list) starts a new trail
function selectFromList(uri, title){
  state.trail = [];
  return showNeighborhood(uri, title);
}

// starts on the first page of every list, unless offsets are given (going back)
async function showNeighborhood(uri, title, offsets = { references: 0, cited_by: 0, authors: 0 }){
  state.selectedUri = uri;
  state.selectedTitle = title;
  state.offsets = { ...offsets };
  onFocus(uri);
  await loadGraph();
}

async function loadGraph(){
  const request = ++state.graphRequest;
  const graph = await buildGraphAround(state.selectedUri, state.selectedTitle, {
    offsets: state.offsets,
    full: state.fullView
  });
  if (request !== state.graphRequest) return; // a newer click won the race
  renderGraph(graph);
}

// move on to a neighbor, keeping the way back
function exploreFrom(uri, title){
  state.trail.push({ uri: state.selectedUri, title: state.selectedTitle, offsets: { ...state.offsets } });
  showNeighborhood(uri, title);
}

// Legend toggles. A context also needs the layer of the paper it hangs on,
// and a direct citation edge is hidden while its context path is visible.
function applyLayers(){
  state.cy?.elements().forEach(ele => {
    const { layer, anchor = layer, replacedByContext } = ele.data();
    if (!layer) return; // the selected paper is always shown
    let visible = state.layers[layer] && state.layers[anchor];
    if (replacedByContext && state.layers.contexts) visible = false;
    ele.style('display', visible ? 'element' : 'none');
  });
}

function renderGraph(graph){
  state.cy?.destroy();
  updateControls(graph);

  const note = $('graph-note');
  note.hidden = graph.elements.length > 1;
  note.textContent = graph.failed
    ? 'Failed to load the neighbourhood — check console / backend logs.'
    : 'Nothing found for this paper in the knowledge graph.';

  state.cy = cytoscape({
    container: $('graph'),
    elements: graph.elements,
    style: graphStyle(),
    layout: { name: 'preset', padding: 30 }, // positions are computed in buildGraphAround
    minZoom: 0.3,
    maxZoom: 2.5
  });
  applyLayers();
  state.cy.fit(state.cy.elements(':visible'), 30);

  const tip = $('graph-tip');
  const hideTip = () => { tip.hidden = true; $('graph').style.cursor = ''; };
  state.cy.on('mouseover', 'node', (evt) => {
    tip.textContent = evt.target.data('tip');
    tip.style.left = `${evt.renderedPosition.x}px`;
    tip.style.top = `${evt.renderedPosition.y}px`;
    tip.hidden = false;
    $('graph').style.cursor = 'pointer';
  });
  state.cy.on('mouseout', 'node', hideTip);
  state.cy.on('viewport', hideTip);

  state.cy.on('dbltap', 'node[kind = "paper"]', (evt) => {
    const { uri, title, role } = evt.target.data();
    if (role === 'selected') return;
    closePanel();
    exploreFrom(uri, title);
  });

  state.cy.on('tap', 'node', (evt) => {
    const node = evt.target.data();
    if (node.kind === 'author') openAuthorPanel(node.uri, node.name);
    else if (node.kind === 'context') openContextPanel(node);
    // the selected paper has no context: just its own detail. A neighbor paper
    // also shows the passage where the two papers cite each other
    else openPaperPanel(node.uri, node.context ?? null, node.role);
  });
}
