// Wires the three areas together. Each area knows nothing about the others, only these callbacks.
import { initGraph } from './graph/graph.js';
import { initInput } from './input/input.js';
import { initRecommendations } from './recommendations/recommendations.js';
import { setStatus } from './shared/ui.js';

const recommendations = initRecommendations({
  // a clicked card (or the top result of a new ranking) becomes the center of the graph
  onSelect: (result) => graph.selectFromList(result.uri, result.title),
  onViewDetails: (result) => graph.showPaperDetails(result.uri)
});

const graph = initGraph({
  // the list highlights whichever paper the graph is showing
  onFocus: (uri) => recommendations.highlight(uri)
});

initInput({
  // a validated query goes to the recommendations
  onSubmit: (query) => recommendations.rank(query)
});

setStatus('Ready — enter a citation context');
