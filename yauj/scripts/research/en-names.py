"""English station names from English Wikipedia line articles: Chinese name -> English name, as the article spells it.

    python3 yauj/scripts/research/en-names.py "Line 22 (Beijing Subway)" ...      # print the pairs
Used by name-uc-stations.py. A name that no English article gives stays blank; nothing is translated.
"""
import re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from enwiki import fetch

CJK = re.compile(r'[一-鿿㐀-䶿]+')


def english_of(cell):
    cell = re.sub(r'<ref.*?(</ref>|/>)', '', cell, flags=re.S)
    m = re.search(r'\{\{\s*(?:stl|Stl|stn|Stn)\s*\|[^|}]*\|([^|}]+)', cell)
    if m:
        name = m.group(1)
    else:
        m = re.search(r'\[\[([^\]|]+)\|([^\]]+)\]\]', cell) or re.search(r'\[\[([^\]|]+)\]\]', cell)
        name = m.group(m.lastindex) if m else re.sub(r"[|!{}\[\]']|rowspan=\S+|colspan=\S+|style=\S+", ' ', cell)
    name = re.sub(r'(?i)\s+(metro |subway |rail )?station$', '', name.strip())
    name = re.sub(r'(?i)\s+railway$', '', name)  # "Beijing East railway station" is the station called Beijing East
    return re.sub(r'\s+', ' ', name).strip(' ,')


def pairs(title):
    rt, text = fetch(title)
    out = {}
    if not text:
        return None, out
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if not (line.startswith('|') or line.startswith('!')) or line.startswith('|-') or line.startswith('|}'):
            continue
        m = re.search(r'(?:\{\{\s*(?:lang|zh-cn|lang-zh|zh)\s*\|[^|}]*\|?\s*(?:c=|s=)?|^[|!]\s*)([一-鿿㐀-䶿]+)', line)
        if not m or not CJK.fullmatch(m.group(1)):
            continue
        j = i - 1
        while j >= 0 and (lines[j].startswith('|-') or not lines[j].strip()):
            j -= 1
        if j < 0 or not (lines[j].startswith('|') or lines[j].startswith('!')) or CJK.search(lines[j]):
            continue
        en = english_of(lines[j].lstrip('|!'))
        if en and re.search(r'[A-Za-z]', en):
            out.setdefault(m.group(1), en)
    return rt, out


if __name__ == '__main__':
    for title in sys.argv[1:]:
        rt, p = pairs(title)
        print('##', title, '->', rt, len(p))
        for k, v in p.items():
            print('   ', k, '=', v)
