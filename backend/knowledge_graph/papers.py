"""
Paper metadata (title, authors, year, venue, abstract) from the knowledge graph.
Shared: titles for the recommendation list, the detail panel and BibTeX all come from here.
"""

import json
import os
from functools import lru_cache

from fastapi import APIRouter

from .. import config
from .store import PREFIXES, first, iri, kg

abstracts = {}
if os.path.exists(config.ABSTRACTS_PATH):
    with open(config.ABSTRACTS_PATH) as f:
        abstracts = json.load(f)

PAPER_DETAIL_QUERY = PREFIXES + """
SELECT ?title ?abstract ?year ?venue ?authorName WHERE {
  OPTIONAL { %(uri)s dcterms:title ?title . }
  OPTIONAL { %(uri)s bibo:abstract ?abstract . }
  OPTIONAL { %(uri)s fabio:hasPublicationYear ?year . }
  OPTIONAL { %(uri)s bibo:publishedIn ?venue . }
  OPTIONAL {
    %(uri)s citekg:hasAuthor ?author .
    ?author foaf:name ?authorName .
  }
}
"""


@lru_cache(maxsize=4096)  # /predict looks up 20 titles per call; repeated queries hit the cache
def sparql_paper_detail(uri):
    rows = list(kg.query(PAPER_DETAIL_QUERY % {"uri": iri(uri)}))

    # prefer the abstract from the KG (bibo:abstract on the paper node);
    # fall back to abstracts.json only for papers that don't have it in RDF
    abstract = first(rows, "abstract") or abstracts.get(uri)
    authors = list(dict.fromkeys(str(r.authorName) for r in rows if r.authorName))

    return {
        "uri": uri,
        "title": first(rows, "title") or "(no title)",
        "year": first(rows, "year"),
        "venue": first(rows, "venue"),
        "authors": authors,
        "abstract": abstract,
    }


router = APIRouter()


@router.get("/paper")
def paper(uri: str):
    return sparql_paper_detail(uri)
