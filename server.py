"""
server.py — minimal LCR inference API, no Django.

This file only assembles the app. The logic lives in backend/, one folder per area:

    backend/input_processing/   what the user typed        GET  /example
                                (request schema, query text, random examples)
    backend/recommendations/    the two-tower model        POST /predict
                                (checkpoint, candidate index, ranking)
    backend/graph/              the citation neighbourhood GET  /graph, /author
                                (SPARQL queries, paging, authors, contexts)
    backend/knowledge_graph/    shared by all of them      GET  /paper
                                (the rdflib graph, paper metadata)
    backend/config.py           every path and environment variable

Mirrors infer.py exactly for the model side:
  encode(context) -> context_tower -> similarity vs precomputed
  paper_tower embeddings -> top-k papers.

Paper metadata / citation neighbors are fetched with real SPARQL
queries against the in-memory rdflib graph (loaded once at startup).

Run:
    pip install fastapi uvicorn torch transformers rdflib
    python server.py
    python -m http.server 5500  

    # -> http://localhost:5500/index.html

Endpoints:
    POST /predict             {"context": "...", "topk": 20}
         -> {"results": [{rank, score, uri, title}]}
    GET  /paper?uri=...       -> metadata via SPARQL
    GET  /graph?uri=...&limit=N&references_offset=&cited_by_offset=&authors_offset=&full=bool
         -> one page of the neighborhood of a paper via SPARQL: papers it cites,
            papers citing it, its authors, and the citation context linking each
            neighbor, plus the total of each list so the client can page through all of it.
            With full=true there is no paging: every neighbor is returned in one go.
    GET  /author?uri=...      -> author name + their papers via SPARQL
    GET  /example?with_details=bool
         -> random example context from all_contexts.json
            (sits beside server.py), plus (if with_details) the cited
            paper's title/abstract resolved via SPARQL, in one call
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# importing a routes module loads what it needs (model, knowledge graph, examples) once, at startup
from backend.graph.routes import router as graph_router
from backend.input_processing.routes import router as input_router
from backend.knowledge_graph.papers import router as papers_router
from backend.recommendations.routes import router as recommendations_router

app = FastAPI(title="LCR API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (input_router, recommendations_router, graph_router, papers_router):
    app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
