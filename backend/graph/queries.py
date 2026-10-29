"""
SPARQL for the citation neighbourhood: the papers a paper cites, the papers citing it, its authors
and the cito:Citation nodes (passages) that link them.
"""

from ..knowledge_graph.store import PREFIXES

# Papers the selected paper cites (cito:cites points from citing to cited paper)
REFERENCES_QUERY = PREFIXES + """
SELECT DISTINCT ?paper ?title WHERE {
  %(uri)s cito:cites ?paper .
  OPTIONAL { ?paper dcterms:title ?title . }
}
"""

# Papers that cite the selected paper (cito:isCitedBy is the inverse, kept as a fallback)
CITED_BY_QUERY = PREFIXES + """
SELECT DISTINCT ?paper ?title WHERE {
  { ?paper cito:cites %(uri)s } UNION { %(uri)s cito:isCitedBy ?paper }
  OPTIONAL { ?paper dcterms:title ?title . }
}
"""

AUTHORS_QUERY = PREFIXES + """
SELECT DISTINCT ?author ?name WHERE {
  { %(uri)s citekg:hasAuthor ?author } UNION { ?author citekg:authorOf %(uri)s }
  OPTIONAL { ?author foaf:name ?name . }
}
"""

AUTHOR_DETAIL_QUERY = PREFIXES + """
SELECT DISTINCT ?name ?paper ?title WHERE {
  OPTIONAL { %(uri)s foaf:name ?name . }
  OPTIONAL {
    { %(uri)s citekg:authorOf ?paper } UNION { ?paper citekg:hasAuthor %(uri)s }
    OPTIONAL { ?paper dcterms:title ?title . }
  }
}
LIMIT 50
"""

# cito:Citation nodes linking the selected paper to the given neighbors, in both directions.
# ?direction says which side the selected paper is on: "cited_by" = the neighbor cites it.
CONTEXTS_QUERY = PREFIXES + """
SELECT ?citation ?direction ?other ?text ?marker ?type ?before ?after WHERE {
  VALUES ?other { %(others)s }
  {
    ?citation cito:hasCitedEntity %(uri)s ;
              cito:hasCitingEntity ?other .
    BIND("cited_by" AS ?direction)
  } UNION {
    ?citation cito:hasCitingEntity %(uri)s ;
              cito:hasCitedEntity ?other .
    BIND("references" AS ?direction)
  }
  OPTIONAL { ?citation c4o:hasContext ?text . }
  OPTIONAL { ?citation citekg:hasCitationMarker ?marker . }
  OPTIONAL { ?citation citekg:hasCitationType ?type . }
  OPTIONAL { ?citation citekg:hasContextBefore ?before . }
  OPTIONAL { ?citation citekg:hasContextAfter ?after . }
}
ORDER BY ?citation
"""
