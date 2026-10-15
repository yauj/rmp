#!/usr/bin/env python3
"""Print the sentences of a cached zh.wikipedia page that match a regex (default: status words for new lines).

    python3 yauj/scripts/research/grep-page.py "<title>" [regex]
"""
import os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'line-speeds'))
from speeds import fetch
title = sys.argv[1]
rx = re.compile(sys.argv[2] if len(sys.argv) > 2 else r'在建|规划|規劃|筹建|开工|試運營|试运营|暂缓|停运|拆除|预计|預計|2025|2026|2027|2028|延伸|延长|新线')
t, txt = fetch(title)
if not txt:
    sys.exit(f'no page for {title}')
txt = re.sub(r'<ref[^>]*?>.*?</ref>|<ref[^>]*/>', '', txt, flags=re.S)
txt = re.sub(r'\[\[(?:File|文件|Image|图像)[^\]]*\]\]', '', txt)
txt = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', txt)
for _ in range(3):
    txt = re.sub(r'\{\{[^{}]*\}\}', '', txt)
txt = re.sub(r"'''?|<gallery>.*?</gallery>", '', txt, flags=re.S)
print(f'[{t}]')
for para in re.split(r'\n+', txt):
    for sent in re.split(r'(?<=[。；])', para):
        if rx.search(sent) and len(sent.strip()) > 8:
            print(' -', sent.strip()[:260])
