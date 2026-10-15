#!/usr/bin/env python3
"""Look up design speeds (zh.wikipedia infobox) for every line badge in the yauj saves of the given regions.

    python3 yauj/scripts/line-speeds/run.py            # from the repo root
    python3 yauj/scripts/line-speeds/run.py JingJinJi

Fetched wiki pages are cached in yauj/cache/wiki-pages.json (git-ignored), so reruns only hit the network for new lines.
Results go to yauj/cache/line-speeds.json. Read-only on the saves.
"""
import glob, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from speeds import lookup
from lines import spec

regions = sys.argv[1:] or ['JingJinJi', 'YangtzeRiverDelta']
out = 'yauj/cache/line-speeds.json'
res = json.load(open(out))['lines'] if os.path.exists(out) else {}
for r in regions:
    f = sorted(glob.glob(f'yauj/saves/RailMapToolkit_{r}_*.json'))[-1]
    g = json.load(open(f))['graph']
    if isinstance(g, str): g = json.loads(g)
    keys = set()
    for n in g['nodes']:
        a = n['attributes']; t = a.get('type')
        if t and 'line-badge' in t:
            v = a[t]
            label = str(v.get('num')) if 'num' in v else (v.get('names') or [''])[0]
            keys.add((r, v['color'][1], label))
    for k in sorted(keys):
        key = '|'.join(k)
        if key in res and res[key].get('speed'): continue
        c, kind = spec(k[1], k[2])
        if not c: res[key] = {'title': None, 'speed': None, 'src': 'nospec', 'kind': None}; continue
        x = lookup(c); x['kind'] = kind; res[key] = x
        print(key, x['title'], x['speed'], x['src'], flush=True)
json.dump({'fetched': 'see git/mtime', 'lines': res}, open(out, 'w'), ensure_ascii=False, indent=1)
