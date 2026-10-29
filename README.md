# SciteKG DEMO

**An interactive web app for testing a local citation recommendation model and exploring the knowledge graph behind it.**

Paste a passage from a manuscript, mark the missing reference with `[cite]`, and the app ranks the papers in a scholarly knowledge graph that best fit that spot. Then look at each recommendation in context: the papers it cites, the papers that cite it, its authors, and the passages where those citations occur.


<!-- Add a screenshot or GIF: save it as docs/screenshot.png and uncomment the next line -->
<!-- ![CiteLens screenshot](docs/screenshot.png) -->

## Features

**Recommendations**
- Ranks candidate papers for a citation context with a two-tower model (SciBERT context encoder and a graph-based paper encoder) and shows the similarity score of each.
- Optional title and abstract of the cited paper can be added to the query.
- "Load random example" fills the form from a dataset of real contexts and marks the true cited paper with an **expected** badge, so you can see at a glance where the model ranked it.
- Per recommendation: **Copy URI**, **Copy title** and **Cite**, which copies a BibTeX entry. **Copy as JSON** exports the whole ranking.

**Input**
- Live `[cite]` highlighting, marker and character counters, validation, and an **Insert [cite]** button. `Ctrl/Cmd + Enter` submits.

**Citation neighbourhood graph**
- Three entity types, encoded by shape: papers (circles), authors (diamonds) and citation contexts (small rounded squares).
- Color encodes the role relative to the selected paper: the selected paper, the papers it cites, and the papers citing it. Arrows always point from the citing paper to the cited one.
- Click a legend item to show or hide that layer. Click any node for its details: abstract and authors, an author's papers, or the exact passage of a citation with the text around it.
- Large neighbourhoods are paged (10 per list, with pagers). **View full graph** switches to a full-page view with every neighbour, unpaged, and **Back to recommendations** restores the previous screen.
- Double-click a paper to re-center the graph on it and keep exploring, with **Back** to retrace your steps.

## How it works

```
 citation context ──► Context tower (SciBERT) ──┐
                                                ├─ similarity ─► top-k papers
 candidate papers ──► Paper tower (precomputed) ┘
                                       │
                          knowledge graph (RDF, SPARQL)
                   titles · authors · citations · citation contexts
```

- **Model.** At startup the backend loads a trained checkpoint, encodes every candidate paper once, and ranks them against the encoded context by dot-product similarity.
- **Knowledge graph.** A Turtle file is loaded into memory with rdflib. Titles, authors and the whole neighbourhood graph come from SPARQL queries against it.
- **Frontend.** Plain ES modules with no build step. [Cytoscape.js](https://js.cytoscape.org/) draws the graph and is loaded from a CDN.

### Expected RDF structure

| Entity | Class | Main properties |
|---|---|---|
| Paper | `bibo:Article` | `dcterms:title`, `bibo:abstract`, `fabio:hasPublicationYear`, `bibo:publishedIn`, `cito:cites`, `citekg:hasAuthor` |
| Author | `citekg:Author` | `foaf:name`, `citekg:authorOf` |
| Citation context | `cito:Citation` | `c4o:hasContext`, `cito:hasCitingEntity`, `cito:hasCitedEntity`, `citekg:hasCitationMarker`, `citekg:hasCitationType`, `citekg:hasContextBefore`, `citekg:hasContextAfter` |

Namespaces: `bibo`, `c4o`, `cito`, `dcterms`, `fabio`, `foaf`, and `citekg: <https://citekg.org/ontology/>`.

<!-- ## Getting started

### 1. What you need

This repository contains the web app only. It expects the following files, which are not included:

| What | Used for | Setting |
|---|---|---|
| Model code (`paper_tower/`, `context_tower/` packages) | building the two towers | `LCR_ROOT` |
| Trained checkpoint, e.g. `best_model.pt` | model weights | `LCR_CHECKPOINT` |
| Data folder with `feat_P.pt`, `feat_PP.pt`, `feat_PCCon.pt`, `corpus_ids.pt`, `external_ids.pt`, `node_index.json` (and optionally `abstracts.json`) | paper features and candidate index | `LCR_DATA_ROOT` |
| Knowledge graph, e.g. `merged-kg.ttl` | metadata and graph queries | `LCR_TTL_PATH` |
| `all_contexts.json` (optional) | the "Load random example" button | `LCR_CONTEXTS_PATH` |

Each record in `all_contexts.json` looks like this:

```json
{
  "context": "... we leverage the self-explanation capacity of LLMs [cite] ...",
  "cited_uri": "https://citekg.org/resource/paper/e49b847cb2fea213",
  "citing_uri": "https://citekg.org/resource/paper/db038fc97f9e302b"
}
```

The defaults in `backend/config.py` are Windows-style relative paths. Set the environment variables above to point anywhere, for example:

```bash
export LCR_ROOT=/path/to/SciteKG
export LCR_CHECKPOINT=/path/to/best_model.pt
export LCR_DATA_ROOT=/path/to/data_prep
export LCR_TTL_PATH=/path/to/data_prep/merged-kg.ttl
``` -->


## API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` | `{context, title?, abstract?, topk}` returns `{results: [{rank, score, uri, title}], took_ms}` |
| `GET` | `/paper?uri=` | Title, authors, year, venue and abstract of a paper |
| `GET` | `/graph?uri=&limit=&references_offset=&cited_by_offset=&authors_offset=&full=` | One page of a paper's neighbourhood, with the totals of each list. `full=true` returns everything |
| `GET` | `/author?uri=` | An author's name and papers |
| `GET` | `/example?with_details=` | A random example context, optionally with the cited paper's title and abstract |

## Project structure

The app is split into three areas: **input**, **recommendations** and **graph**. Each has its own frontend, backend and style files, so a change stays in one place.

| To change… | Frontend | Backend | Styles |
|---|---|---|---|
| Input: context, title, abstract, examples | `js/input/` | `backend/input_processing/` | `styles/input.css` |
| Recommendations: ranking, list, Cite | `js/recommendations/` | `backend/recommendations/` | `styles/recommendations.css` |
| Graph: neighbourhood, paging, full view | `js/graph/` | `backend/graph/` | `styles/graph.css` |

```
server.py                  assembles the API
index.html
backend/
  config.py                paths and environment variables
  input_processing/        request schema, query text, example contexts   (/example)
  recommendations/         model loading, candidate index, ranking        (/predict)
  graph/                   SPARQL queries, paging, authors, contexts      (/graph, /author)
  knowledge_graph/         shared: the rdflib graph and paper metadata    (/paper)
js/
  main.js                  connects the three areas
  input/  recommendations/  graph/
  shared/                  DOM helpers, API client, BibTeX
styles/                    base.css + one stylesheet per area
tools/
  clean_contexts.py        optional: clean noisy example contexts (see below)
```

The three areas never import each other. `js/main.js` connects them with three callbacks: input → recommendations → graph, and the graph tells the list which card to highlight.


<!-- ## License

Add a license before publishing, for example by choosing one at <https://choosealicense.com/>.

## Citation

If you use this work, please cite it:

```bibtex
@misc{citelens,
  title  = {CiteLens: an interactive tool for local citation recommendation},
  author = {<your name>},
  year   = {2026},
  url    = {https://github.com/<user>/<repo>}
}
``` -->