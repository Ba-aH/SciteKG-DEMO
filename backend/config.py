"""
Paths shared by the whole backend. Most can be overridden with an environment variable
(LCR_CHECKPOINT, LCR_DATA_ROOT, LCR_TTL_PATH, LCR_CONTEXTS_PATH).
"""

import os

# folder that contains server.py
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# same paths style as your infer.py usage
CHECKPOINT_PATH = os.path.expanduser(
    os.environ.get("LCR_CHECKPOINT", r"..\models\acl200\P+PCCon\exp_PP_MLP_(P+PCCon)(run2)\best_model.pt"))
DATA_ROOT = os.path.expanduser(
    # os.environ.get("LCR_DATA_ROOT", r"..\SciteKG\shared\data_prep")) # for argumentation (corpus+external) dataset
    os.environ.get("LCR_DATA_ROOT", r"data\acl200_prep"))
TTL_PATH = os.path.expanduser(
    os.environ.get("LCR_TTL_PATH", r"data\acl200_prep\merged-kg.ttl"))
ABSTRACTS_PATH = os.path.join(DATA_ROOT, "abstracts.json")
CONTEXTS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "all_contexts_clean(acl200).json")
ROOT = os.path.expanduser(r"SciteKG")  # folder that holds paper_tower/ and context_tower/
