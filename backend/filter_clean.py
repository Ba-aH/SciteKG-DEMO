import json

INPUT_FILE = "all_contexts_clean(acl200).json"
OUTPUT_FILE = "data_clean.json"

def load_records(text):
    text = text.strip()
    # Standard JSON (array or single object)
    try:
        data = json.loads(text)
        return data if isinstance(data, list) else [data]
    except json.JSONDecodeError:
        pass
    # Fallback: concatenated objects separated by commas/whitespace/newlines
    decoder = json.JSONDecoder()
    records, i = [], 0
    while i < len(text):
        if text[i] in " \t\r\n,":
            i += 1
            continue
        obj, i = decoder.raw_decode(text, i)
        records.append(obj)
    return records

with open(INPUT_FILE, encoding="utf-8") as f:
    records = load_records(f.read())

kept = [r for r in records if r.get("clean_status") == "ok"]

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(kept, f, ensure_ascii=False, indent=2)

print(f"Total: {len(records)} | kept: {len(kept)} | removed: {len(records) - len(kept)}")