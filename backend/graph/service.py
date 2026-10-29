"""
Builds the neighbourhood of a paper from the knowledge graph, one page at a time (or all of it).
"""

from functools import lru_cache

from ..knowledge_graph.papers import sparql_paper_detail
from ..knowledge_graph.store import as_str, first, iri, kg
from .queries import (AUTHOR_DETAIL_QUERY, AUTHORS_QUERY, CITED_BY_QUERY,
                      CONTEXTS_QUERY, REFERENCES_QUERY)


@lru_cache(maxsize=256)  # paging asks for the same full lists again and again
def sparql_papers(query, uri):
    """All distinct neighbor papers as a tuple of {uri, title}, sorted by title (untitled last)."""
    rows = kg.query(query % {"uri": iri(uri)})
    papers = {}
    for row in rows:
        papers.setdefault(str(row.paper), {"uri": str(row.paper), "title": as_str(row.title) or "(no title)"})
    return tuple(sorted(papers.values(), key=lambda p: (p["title"] == "(no title)", p["title"].lower(), p["uri"])))


@lru_cache(maxsize=256)
def sparql_authors(uri):
    """All authors as a tuple of {uri, name}, sorted by name."""
    rows = kg.query(AUTHORS_QUERY % {"uri": iri(uri)})
    authors = {}
    for row in rows:
        authors.setdefault(str(row.author), {"uri": str(row.author), "name": as_str(row.name) or "(unknown author)"})
    return tuple(sorted(authors.values(), key=lambda a: (a["name"].lower(), a["uri"])))


def sparql_contexts(uri, neighbor_uris):
    """First citation context per (direction, neighbor), e.g. ("cited_by", <paper uri>)."""
    if not neighbor_uris:
        return {}
    others = " ".join(iri(u) for u in neighbor_uris)
    rows = kg.query(CONTEXTS_QUERY % {"uri": iri(uri), "others": others})

    contexts = {}
    for row in rows:  # rows are ordered by citation URI, so setdefault keeps a stable "first" one
        contexts.setdefault((str(row.direction), str(row.other)), {
            "uri": str(row.citation),
            "text": as_str(row.text),
            "marker": as_str(row.marker),
            "type": as_str(row.type),
            "before": as_str(row.before),
            "after": as_str(row.after),
        })
    return contexts


def sparql_graph(uri, limit=10, offsets=None):
    """One page (`limit` items starting at offsets[layer]) of each neighbor list, plus the full totals.
    limit=None returns every item."""
    offsets = offsets or {}
    lists = {
        "references": sparql_papers(REFERENCES_QUERY, uri),
        "cited_by": sparql_papers(CITED_BY_QUERY, uri),
        "authors": sparql_authors(uri),
    }
    # copy the items: the cached ones are shared between requests
    page = {layer: [dict(item) for item in items[offsets.get(layer, 0):][:limit]]
            for layer, items in lists.items()}

    contexts = sparql_contexts(uri, {p["uri"] for p in page["references"] + page["cited_by"]})
    for paper in page["references"]:
        paper["context"] = contexts.get(("references", paper["uri"]))
    for paper in page["cited_by"]:
        paper["context"] = contexts.get(("cited_by", paper["uri"]))

    return {
        "uri": uri,
        "title": sparql_paper_detail(uri)["title"],
        **page,
        "totals": {layer: len(items) for layer, items in lists.items()},
        "offsets": {layer: offsets.get(layer, 0) for layer in lists},
    }


@lru_cache(maxsize=1024)
def sparql_author_detail(uri):
    rows = list(kg.query(AUTHOR_DETAIL_QUERY % {"uri": iri(uri)}))
    papers = {str(r.paper): {"uri": str(r.paper), "title": as_str(r.title) or "(no title)"}
              for r in rows if r.paper}
    return {"uri": uri, "name": first(rows, "name") or "(unknown author)", "papers": list(papers.values())}
