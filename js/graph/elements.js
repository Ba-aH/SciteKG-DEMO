import { apiGraph } from './api.js';
import { authorPosition, LAYOUT, polar, SIDES, sidePlacements } from './layout.js';

/* ---------------------------------------------------------
   GRAPH BUILDING — backed by SPARQL queries on the KG (/graph in server.py).
   Shape = entity type (paper: circle, author: diamond, citation context:
   small rounded square). Colour = role relative to the selected paper.
   Layout: papers it cites on the left, papers citing it on the right (so
   every arrow flows right → left), authors in a row on top, and each
   citation context sits on the line between the two papers it links.
--------------------------------------------------------- */

function truncateTitle(title, maxLen = 28){
  if (!title) return '(no title)';
  return title.length > maxLen ? title.slice(0, maxLen).trim() + '…' : title;
}

// offsets: first item of each list to show; full: ignore paging and load everything
export async function buildGraphAround(topUri, topTitle, { offsets, full }){
  let data = { references: [], cited_by: [], authors: [], totals: { references: 0, cited_by: 0, authors: 0 }, offsets };
  let failed = false;
  try {
    data = await apiGraph(topUri, offsets, full);
  } catch (err){
    console.error('Failed to load graph neighborhood', err);
    failed = true;
  }
  const title = topTitle || data.title || topUri;

  // ids are unique per entity, so a paper that is both cited and citing is drawn once
  const nodes = new Map();
  const edges = new Map();
  const addNode = (id, fields, position) => {
    if (!nodes.has(id)) nodes.set(id, { data: { id, ...fields }, position });
  };
  const addEdge = (source, target, fields) => {
    const id = `${source}->${target}`;
    if (!edges.has(id)) edges.set(id, { data: { id, source, target, ...fields } });
  };

  addNode(topUri, {
    kind: 'paper', role: 'selected', uri: topUri, title,
    label: truncateTitle(title, 60), tip: title
  }, { x: 0, y: 0 });

  for (const [role, side] of Object.entries(SIDES)){
    const papers = data[role];
    const placements = sidePlacements(side, papers.length);
    papers.forEach((paper, i) => {
      const { angle, radius } = placements[i];
      // the passage travels with the paper node, so the click handler can show
      // it without a second round trip
      addNode(paper.uri, {
        kind: 'paper', role, layer: role, uri: paper.uri, title: paper.title,
        label: truncateTitle(paper.title, 26), tip: paper.title, context: paper.context
      }, polar(angle, radius));

      // a citation always runs citing → cited
      const [source, target] = role === 'references' ? [topUri, paper.uri] : [paper.uri, topUri];
      const ctx = paper.context;
      // the direct edge is replaced by outward context → paper edges while contexts are visible
      addEdge(source, target, { role, layer: role, replacedByContext: Boolean(ctx) });
      if (!ctx) return;

      const [citingTitle, citedTitle] = role === 'references' ? [title, paper.title] : [paper.title, title];
      addNode(ctx.uri, {
        kind: 'context', layer: 'contexts', anchor: role, ...ctx, citingTitle, citedTitle, label: '',
        tip: `${ctx.marker ?? 'Citation context'}: ${truncateTitle(ctx.text, 160)}`
      }, polar(angle, radius - LAYOUT.contextOffset));
      addEdge(ctx.uri, source, { role, layer: 'contexts', anchor: role, contextTarget: 'citing' });
      addEdge(ctx.uri, target, { role, layer: 'contexts', anchor: role, contextTarget: 'cited' });
    });
  }

  data.authors.forEach((author, i) => {
    addNode(author.uri, {
      kind: 'author', layer: 'authors', uri: author.uri, name: author.name,
      label: truncateTitle(author.name, 22), tip: author.name
    }, authorPosition(i, data.authors.length));
    addEdge(author.uri, topUri, { role: 'authors', layer: 'authors' });
  });

  return {
    elements: [...nodes.values(), ...edges.values()],
    // legend counts are totals over all pages; contexts only count the ones on screen
    counts: {
      ...data.totals,
      contexts: [...nodes.values()].filter(n => n.data.kind === 'context').length
    },
    offsets: data.offsets,
    failed
  };
}
