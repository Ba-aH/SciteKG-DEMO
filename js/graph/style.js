import { cssVar } from '../shared/ui.js';

export function graphStyle(){
  const color = {
    selected: cssVar('--accent'),
    references: cssVar('--role-ref'),
    cited_by: cssVar('--role-citing'),
    authors: cssVar('--kind-author'),
    context: cssVar('--kind-context'),
    text: cssVar('--text'),
    surface: cssVar('--surface')
  };
  return [
    {
      selector: 'node',
      style: {
        'background-color': color.context,
        'label': 'data(label)',
        'color': color.text,
        'font-family': 'system-ui, sans-serif',
        'font-size': 10,
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'text-wrap': 'wrap',
        'text-max-width': '110px',
        'text-background-color': color.surface,
        'text-background-opacity': 0.85,
        'text-background-padding': 2,
        'min-zoomed-font-size': 8,
        'border-width': 2,
        'border-color': color.surface,
        'width': 26,
        'height': 26
      }
    },
    // papers it cites: label on the outer (left) side
    {
      selector: 'node[role = "references"]',
      style: { 'background-color': color.references, 'text-halign': 'left', 'text-valign': 'center', 'text-margin-x': -8, 'text-margin-y': 0, 'text-max-width': '150px' }
    },
    // papers citing it: label on the outer (right) side
    {
      selector: 'node[role = "cited_by"]',
      style: { 'background-color': color.cited_by, 'text-halign': 'right', 'text-valign': 'center', 'text-margin-x': 8, 'text-margin-y': 0, 'text-max-width': '150px' }
    },
    {
      selector: 'node[kind = "author"]',
      style: { 'shape': 'diamond', 'background-color': color.authors, 'width': 24, 'height': 24, 'text-valign': 'top', 'text-margin-y': -6, 'text-max-width': '90px' }
    },
    {
      selector: 'node[kind = "context"]',
      style: { 'shape': 'round-rectangle', 'background-color': color.context, 'width': 17, 'height': 11, 'border-width': 1 }
    },
    {
      selector: 'node[role = "selected"]',
      style: {
        'background-color': color.selected,
        'width': 56,
        'height': 56,
        'font-size': 11,
        'font-weight': 700,
        'text-max-width': '170px',
        'min-zoomed-font-size': 0,
        'border-width': 4,
        'underlay-color': color.selected,
        'underlay-opacity': 0.18,
        'underlay-padding': 10,
        'z-index': 10
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'curve-style': 'straight',
        'line-color': color.context,
        'target-arrow-color': color.context,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.8,
        'opacity': 0.85
      }
    },
    { selector: 'edge[role = "references"]', style: { 'line-color': color.references, 'target-arrow-color': color.references } },
    { selector: 'edge[role = "cited_by"]', style: { 'line-color': color.cited_by, 'target-arrow-color': color.cited_by } },
    { selector: 'edge[contextTarget = "citing"]', style: { 'line-color': color.cited_by, 'target-arrow-color': color.cited_by } },
    { selector: 'edge[contextTarget = "cited"]', style: { 'line-color': color.references, 'target-arrow-color': color.references } },
    {
      selector: 'edge[role = "authors"]',
      style: { 'line-color': color.authors, 'line-style': 'dotted', 'target-arrow-shape': 'none' }
    }
  ];
}
