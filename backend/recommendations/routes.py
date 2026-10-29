from fastapi import APIRouter, HTTPException

from ..input_processing.query import PredictRequest, build_query_text
from ..knowledge_graph.papers import sparql_paper_detail
from .model import recommend

router = APIRouter()


@router.post("/predict")
def predict(req: PredictRequest):
    context = req.context.strip()
    if not context:
        raise HTTPException(400, "context is required")

    query_text = build_query_text(context, req.title, req.abstract)
    ranked = recommend(query_text, topk=req.topk)

    # attach title via a quick SPARQL lookup per result so the ranked
    # list has display titles without a second frontend round trip
    for r in ranked:
        r["title"] = sparql_paper_detail(r["uri"])["title"]
    return {"results": ranked}
