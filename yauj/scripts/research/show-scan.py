#!/usr/bin/env python3
"""Print the short-run scan of yauj/cache/raw/short-run-scan.json compactly (wikilinks/templates/refs stripped).

    python3 yauj/scripts/research/show-scan.py JingJinJi [only-colour-id-prefix]
"""
import json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'line-speeds'))
from speeds import fetch
KW = re.compile(r'大小交路|长短交路|長短交路|小交路|短交路|大交路|区间车|區間車|区间列车|短线车|短線車|短途班次|中间折返|中途折返|区间交路|分段运行|区间运营|套跑|小圈|区间运行|区段运行|中间站折返|折返开行')
region = sys.argv[1]
prefix = sys.argv[2] if len(sys.argv) > 2 else ''
scan = json.load(open('yauj/cache/raw/short-run-scan.json'))
for k, v in sorted(scan.items()):
    r, cid, lab = k.split('|')
    if r != region or not cid.startswith(prefix) or not v['hits']:
        continue
    _, txt = fetch(v['title'])
    txt = re.sub(r'<ref[^>]*?>.*?</ref>|<ref[^>]*/>', '', txt, flags=re.S)
    txt = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', txt)
    txt = re.sub(r'\{\{[^{}]*\}\}', '', txt)
    spans = []
    for m in KW.finditer(txt):
        a, b = max(0, m.start() - 50), min(len(txt), m.end() + 150)
        if spans and a <= spans[-1][1]:
            spans[-1][1] = b
        else:
            spans.append([a, b])
    print('##', k, v['title'])
    for a, b in spans[:3]:
        print('  -', re.sub(r'\s+', ' ', txt[a:b])[:330])
