"""
Random example contexts from all_contexts.json (sits beside server.py).
"""

import json
import os
import random

from fastapi import HTTPException

from .. import config
from ..knowledge_graph.papers import sparql_paper_detail

example_contexts = []
if os.path.exists(config.CONTEXTS_PATH):
    with open(config.CONTEXTS_PATH, encoding="utf-8-sig") as f:
        example_contexts = json.load(f)
    print(f"Loaded {len(example_contexts):,} example contexts from {config.CONTEXTS_PATH}")
else:
    print(f"WARNING: {config.CONTEXTS_PATH} not found — /example endpoint will return 404.")


def random_example(with_details=False):
    """
    Return one random example context from all_contexts.json
    (sits beside server.py). If with_details is True (only sent when
    the frontend's "additional information" checkbox is checked), also
    resolve the cited paper's title/abstract via SPARQL so the whole
    thing comes back in a single round trip.
    """
    if not example_contexts:
        raise HTTPException(404, f"No example contexts loaded from {config.CONTEXTS_PATH}")

    row = random.choice(example_contexts)
    cited_uri = row.get("cited_uri")

    result = {
        "context": row.get("context", ""),
        "cited_uri": cited_uri,
        "citing_uri": row.get("citing_uri"),
        "title": None,
        "abstract": None,
    }

    if with_details and cited_uri:
        detail = sparql_paper_detail(cited_uri)
        result["title"] = detail["title"] if detail["title"] != "(no title)" else None
        result["abstract"] = detail["abstract"]

    return result
