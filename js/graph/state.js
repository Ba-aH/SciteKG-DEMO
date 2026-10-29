// State shared by the graph modules.
export const PAGE_SIZE = 10; // neighbors shown per page, for each of references / cited by / authors

export const state = {
  selectedUri: null,  // paper whose neighbourhood is drawn in the graph
  selectedTitle: null,
  offsets: { references: 0, cited_by: 0, authors: 0 }, // current page start of each neighbor list
  trail: [],          // papers visited before the current one while exploring, for "Back"
  graphRequest: 0,    // counts graph loads so a slow, outdated one is ignored
  fullView: false,    // full-page, untruncated graph
  fullViewOrigin: null, // where to return to when leaving the full view
  cy: null,           // current cytoscape instance
  layers: { references: true, cited_by: true, authors: true, contexts: true } // legend toggles
};
