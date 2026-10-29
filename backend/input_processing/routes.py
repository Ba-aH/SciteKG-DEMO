from fastapi import APIRouter

from .examples import random_example

router = APIRouter()


@router.get("/example")
def example(with_details: bool = False):
    return random_example(with_details)
