"""
The two-tower model: loads the checkpoint, precomputes every candidate paper embedding once at
startup, and ranks candidates for a citation context. Importing this module does all the loading.
"""

import json
import os
import sys

import torch
from transformers import AutoTokenizer

from .. import config

sys.path.insert(0, config.ROOT)
from paper_tower.model import PaperTower
from context_tower.model import ContextTower

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------------------------------------------------------
# 1) LOAD MODEL — exact same steps as infer.py's load_models()
# ---------------------------------------------------------------
print("Loading model...")
_ckpt = torch.load(config.CHECKPOINT_PATH, map_location=DEVICE)
_a = _ckpt.get("args", {})

paper_tower = PaperTower(
    feat_keys=["P", "PCCon"], nfeat=768,
    hidden=_a.get("hidden", 500), embed_dim=_a.get("embed_dim", 768),
    n_fp_layers=_a.get("n_fp_layers", 2), dropout=_a.get("dropout", 0.25),
    input_drop=_a.get("input_drop", 0.25), att_drop=0.1, num_heads=5,
    act="none", residual=True, use_mlp=_a.get("use_mlp", True),
).to(DEVICE)
paper_tower.load_state_dict(_ckpt["paper_tower"])
paper_tower.eval()

context_tower = ContextTower(
    embed_dim=_a.get("embed_dim", 768), dropout=_a.get("input_drop", 0.5),
    scibert_model_name="allenai/scibert_scivocab_uncased",
).to(DEVICE)
context_tower.load_state_dict(_ckpt["context_tower"])
context_tower.eval()

tokenizer = AutoTokenizer.from_pretrained("allenai/scibert_scivocab_uncased")
print("Model loaded")

# ---------------------------------------------------------------
# 2) LOAD FEATURES + BUILD CANDIDATE INDEX — exact same as infer.py
# ---------------------------------------------------------------
print("Loading features and building candidate index...")
feats = {k: torch.load(os.path.join(config.DATA_ROOT, f"feat_{k}.pt"), map_location="cpu")
          for k in ["P", "PP", "PCCon"]}
corpus_ids   = torch.load(os.path.join(config.DATA_ROOT, "corpus_ids.pt"), map_location="cpu")
external_ids = torch.load(os.path.join(config.DATA_ROOT, "external_ids.pt"), map_location="cpu")
all_candidate_ids = torch.cat([corpus_ids, external_ids]).unique()

with open(os.path.join(config.DATA_ROOT, "node_index.json")) as f:
    node_index = json.load(f)
id_to_uri = {int_id: uri for uri, int_id in node_index["paper"].items()}


@torch.no_grad()
def build_index():
    ids = all_candidate_ids.tolist()
    embs = []
    for i in range(0, len(ids), 512):
        batch = {k: v[ids[i:i+512]].to(DEVICE) for k, v in feats.items()}
        embs.append(paper_tower(batch).cpu())
    return torch.cat(embs).to(DEVICE), ids


corpus_embs, corpus_ids_list = build_index()
print(f"Candidate pool ready: {len(corpus_ids_list):,} papers indexed.")


@torch.no_grad()
def recommend(query_text, topk=20, max_length=256):
    enc = tokenizer(query_text, max_length=max_length, truncation=True,
                     padding="max_length", return_tensors="pt")
    ctx_emb = context_tower(enc["input_ids"].to(DEVICE), enc["attention_mask"].to(DEVICE))
    sims = torch.matmul(ctx_emb, corpus_embs.T).squeeze(0)
    scores, indices = sims.topk(min(topk, len(corpus_ids_list)))

    results = []
    for rank, (idx, score) in enumerate(zip(indices.tolist(), scores.tolist()), 1):
        int_id = corpus_ids_list[idx]
        uri = id_to_uri.get(int_id, f"id:{int_id}")
        results.append({"rank": rank, "score": round(score, 4), "uri": uri})
    return results
