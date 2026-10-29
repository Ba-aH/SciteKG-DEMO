"""
The in-memory RDF graph (merged-kg.ttl), loaded once, plus the small helpers every SPARQL query needs.
Used by all three areas: input examples, recommendation titles and the graph.
"""

from fastapi import HTTPException
from rdflib import Graph, URIRef

from .. import config

# real SPARQL queries run against this in-memory graph
print(f"Parsing KG: {config.TTL_PATH} (one-time, this may take a while)...")
kg = Graph()
kg.parse(config.TTL_PATH, format="turtle")
print(f"KG loaded: {len(kg):,} triples.")

PREFIXES = """
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX cito:    <http://purl.org/spar/cito/>
PREFIX c4o:     <http://purl.org/spar/c4o/>
PREFIX fabio:   <http://purl.org/spar/fabio/>
PREFIX bibo:    <http://purl.org/ontology/bibo/>
PREFIX foaf:    <http://xmlns.com/foaf/0.1/>
PREFIX citekg:  <https://citekg.org/ontology/>
"""


def iri(uri):
    """Turn a URI from the request into a safe <...> term for the query templates."""
    try:
        return URIRef(uri).n3()
    except Exception:
        raise HTTPException(400, f"invalid uri: {uri}")


def first(rows, field):
    """First non-empty value of `field` across the result rows, as a string."""
    for row in rows:
        value = getattr(row, field)
        if value is not None:
            return str(value)
    return None


def as_str(value):
    return None if value is None else str(value)
