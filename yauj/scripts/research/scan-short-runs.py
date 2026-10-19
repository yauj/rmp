#!/usr/bin/env python3
"""Scan cached zh.wikipedia line pages for short-run / intermediate-turnback wording.

    python3 yauj/scripts/research/scan-short-runs.py JingJinJi YangtzeRiverDelta

Reads the pages of every line in yauj/cache/research/line-speeds.json (fetching missing pages through the shared throttled
fetch() in yauj/scripts/line-speeds/speeds.py) and writes the matching passages to yauj/cache/raw/short-run-scan.json:
{ "<Region>|<colour id>|<label>": {"title": ..., "hits": ["<passage>", ...]} }. Read-only on yauj/saves.
"""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'line-speeds'))
from speeds import fetch

KW = re.compile(r'大小交路|长短交路|長短交路|小交路|短交路|大交路|区间车|區間車|区间列车|短线车|短線車|短途班次|中间折返|中途折返|站前折返|区间交路|分段运行|分段運行|折返运营|折返營運|区间运营|套跑|小圈|区间运行|区段运行|中间站折返|折返开行|单一交路')
regions = sys.argv[1:] or ['JingJinJi', 'YangtzeRiverDelta']
speeds = json.load(open('yauj/cache/research/line-speeds.json'))['lines']
out_path = 'yauj/cache/raw/short-run-scan.json'
res = json.load(open(out_path)) if os.path.exists(out_path) else {}
for key, v in sorted(speeds.items()):
    if key.split('|')[0] not in regions or not v.get('title'):
        continue
    if key in res:
        continue
    title, text = fetch(v['title'])
    if not text:
        res[key] = {'title': v['title'], 'hits': []}
        continue
    text = re.sub(r'<ref[^>]*?>.*?</ref>|<ref[^>]*/>', '', text, flags=re.S)
    hits, seen = [], set()
    for m in KW.finditer(text):
        a, b = max(0, m.start() - 150), min(len(text), m.end() + 250)
        s = re.sub(r'\s+', ' ', text[a:b])
        k = s[100:160]
        if k in seen:
            continue
        seen.add(k)
        hits.append(s)
    res[key] = {'title': title, 'hits': hits[:8]}
json.dump(res, open(out_path, 'w'), ensure_ascii=False, indent=1)
print(sum(1 for v in res.values() if v['hits']), 'of', len(res), 'lines have hits')
