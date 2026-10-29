"""
What the user typed: the request schema and how it becomes the text the model reads.
"""

from typing import Optional

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    context: str
    title: Optional[str] = None
    abstract: Optional[str] = None
    topk: int = Field(20, ge=1, le=100)


def build_query_text(context, title=None, abstract=None):
    """
    Combine title/abstract (when provided from the 'Additional information'
    fields) with the citation context before encoding. Title/abstract are
    prepended so the [cite] marker's local context still anchors the end
    of the input, consistent with how context_tower reads citation passages.
    """
    parts = [title, abstract, context]
    return " ".join(p.strip() for p in parts if p and p.strip())
