#!/usr/bin/env python3
"""Print a cached zh.wikipedia page as plain text (wikilinks, templates and refs stripped).

    python3 yauj/scripts/research/show-page.py "<title>" [start] [length]
"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'line-speeds'))
from speeds import fetch
title = sys.argv[1]
start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
length = int(sys.argv[3]) if len(sys.argv) > 3 else 6000
t, txt = fetch(title)
if not txt:
    sys.exit(f'no page for {title}')
txt = re.sub(r'<ref[^>]*?>.*?</ref>|<ref[^>]*/>', '', txt, flags=re.S)
txt = re.sub(r'\[\[(?:File|文件|Image|图像)[^\]]*\]\]', '', txt)
txt = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', txt)
for _ in range(3):
    txt = re.sub(r'\{\{[^{}]*\}\}', '', txt)
txt = re.sub(r'\n\s*\|-\s*', '\n', txt)
txt = re.sub(r'\n[|!]\s*', ' | ', txt)
txt = re.sub(r"'''?", '', txt)
txt = re.sub(r'\n{2,}', '\n', txt)
print(f'[{t}] {len(txt)} chars')
print(txt[start:start + length])
