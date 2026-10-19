#!/usr/bin/env python3
"""Find which tracked zh.wikipedia pages changed since the cache was last refreshed (cheap, one API call per 50 pages).

    python3 yauj/scripts/research/check-updates.py --init          # record the current revisions as the baseline
    python3 yauj/scripts/research/check-updates.py [Region...]     # list pages edited since the baseline
    python3 yauj/scripts/research/check-updates.py --refresh       # also re-download the changed pages into raw/wiki-pages.json
                                                                   # and move their baseline forward

Tracked pages = every line page in research/line-speeds.json plus the pages named in research/light-rail-expansions.json
and research/watchlist.json. For each changed page the passages matching a research category (see CATEGORIES in
yauj/cache/README.md) are printed, so a new date can be checked page by page instead of from scratch.
Index: yauj/cache/raw/page-index.json  { title: { revid, timestamp, checked } }
"""
import json, os, re, sys, time, urllib.parse, urllib.request, datetime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'line-speeds'))
import speeds as S

C = 'yauj/cache'
INDEX = f'{C}/raw/page-index.json'
UA = S.UA
args = [a for a in sys.argv[1:] if not a.startswith('--')]
flags = {a for a in sys.argv[1:] if a.startswith('--')}

CATEGORIES = {
    'opened': r'开通|通车|试运营|开始运营|恢复(运营|通车)',
    'construction': r'开工|动工|盾构|铺轨|洞通|轨通|封顶',
    'planned': r'获批|批复|规划|可研|环评|招标',
    'closed/suspended': r'封闭|停运|暂停|停止运营|飞站|不停靠|拆除',
    'service pattern': r'大小交路|小交路|区间车|快慢车|直通运营|跨线|贯通|交路',
    'new station': r'新增.{0,6}站|加设|增设|新站',
}

def tracked():
    t = {}
    for k, v in json.load(open(f'{C}/research/line-speeds.json'))['lines'].items():
        if v.get('title') and (not args or k.split('|')[0] in args):
            t.setdefault(v['title'], []).append(k)
    lr = json.load(open(f'{C}/research/light-rail-expansions.json'))
    for reg, rows in lr.items():
        if isinstance(rows, list) and (not args or reg in args):
            for r in rows:
                if r.get('src') and not r['src'].startswith('http'):
                    t.setdefault(r['src'], []).append(f'{reg}|light-rail|{r["line"]}')
    if os.path.exists(f'{C}/research/watchlist.json'):
        for w in json.load(open(f'{C}/research/watchlist.json'))['items']:
            if w.get('page') and (not args or w['region'] in args):
                t.setdefault(w['page'], []).append(w['id'])
    return t

def revisions(titles):
    out = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        u = ('https://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=ids|timestamp&format=json&redirects=1&titles='
             + urllib.parse.quote('|'.join(chunk)))
        time.sleep(1.2)
        d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30))['query']
        alias = {x['from']: x['to'] for x in d.get('normalized', [])}
        alias.update({x['from']: x['to'] for x in d.get('redirects', [])})
        pages = {p['title']: p for p in d['pages'].values()}
        for t in chunk:
            r = t
            for _ in range(3): r = alias.get(r, r)
            p = pages.get(r)
            if p and 'revisions' in p:
                out[t] = {'revid': p['revisions'][0]['revid'], 'timestamp': p['revisions'][0]['timestamp']}
    return out

def passages(text, rx):
    text = re.sub(r'<ref.*?(</ref>|/>)', '', text, flags=re.S)
    text = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', text)
    text = re.sub(r'\{\{[^{}]*\}\}', '', text)
    return [s.strip() for s in re.split(r'[。\n]', text) if re.search(rx, s) and len(s) < 220]

today = datetime.date.today().isoformat()
idx = json.load(open(INDEX)) if os.path.exists(INDEX) else {}
pages = tracked()
now = revisions(sorted(pages))
if '--init' in flags:
    for t, r in now.items(): idx[t] = {**r, 'checked': today}
    json.dump(idx, open(INDEX, 'w'), ensure_ascii=False, indent=1)
    print(f'baseline recorded for {len(now)} of {len(pages)} pages'); sys.exit()

changed = [t for t, r in now.items() if t in idx and idx[t]['revid'] != r['revid']]
new = [t for t in now if t not in idx]
missing = [t for t in pages if t not in now]
print(f'{len(pages)} tracked pages: {len(changed)} edited since their baseline, {len(new)} not in the index, {len(missing)} not found')
for t in changed:
    print(f'\n## {t}  ({idx[t]["checked"]} -> {now[t]["timestamp"][:10]})  {", ".join(pages[t][:3])}')
    if '--refresh' in flags:
        old = (S._c.get(t) or [None, ''])[1] or ''
        S._c.pop(t, None)
        _, new_text = S.fetch(t)
        old_set = set(passages(old, '.'))
        for cat, rx in CATEGORIES.items():
            hits = [p for p in passages(new_text or '', rx) if p not in old_set]
            for p in hits[:6]: print(f'  [{cat}] {p}')
        idx[t] = {**now[t], 'checked': today}
for t in new: print(f'  not indexed: {t}')
for t in missing: print(f'  no page: {t}')
if '--refresh' in flags:
    for t in new: idx[t] = {**now[t], 'checked': today}
    json.dump(idx, open(INDEX, 'w'), ensure_ascii=False, indent=1)
elif changed:
    print('\nRun with --refresh to download these pages and list the new passages.')
