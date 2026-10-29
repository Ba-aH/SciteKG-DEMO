from fastapi import APIRouter, Query

from .service import sparql_author_detail, sparql_graph

router = APIRouter()


@router.get("/graph")
def graph(
    uri: str,
    limit: int = Query(10, ge=1, le=30),
    references_offset: int = Query(0, ge=0),
    cited_by_offset: int = Query(0, ge=0),
    authors_offset: int = Query(0, ge=0),
    full: bool = False,
):
    if full:
        return sparql_graph(uri, limit=None)
    offsets = {"references": references_offset, "cited_by": cited_by_offset, "authors": authors_offset}
    return sparql_graph(uri, limit=limit, offsets=offsets)


@router.get("/author")
def author(uri: str):
    return sparql_author_detail(uri)
