#!/usr/bin/env python3
"""Read-only consistency check of a yauj map save.

    python3 yauj/scripts/check-map.py yauj/saves/RailMapToolkit_PearlRiverDelta_20260731.json
"""
import collections, json, sys

d = json.load(open(sys.argv[1]))
g = d['graph']
g = json.loads(g) if isinstance(g, str) else g
N = {n['key']: n for n in g['nodes']}
YAUJ_LINES = {'yauj-metro', 'yauj-rail', 'yauj-light-rail', 'yauj-light-rail-construction', 'yauj-construction',
              'yauj-limited', 'yauj-osi', 'yauj-interchange', 'yauj-border'}
DASH = {'yauj-construction', 'yauj-light-rail-construction'}
adj = collections.defaultdict(list)
edge_colors = collections.defaultdict(collections.Counter)
for e in g['edges']:
    a = e['attributes']
    b = a.get(a['style'], {})
    col = b.get('color') or b.get('colorBackground')
    if col:
        edge_colors[f'{col[0]}/{col[1]}'][col[2].lower()] += 1
    for k, o in ((e['source'], e['target']), (e['target'], e['source'])):
        adj[k].append((a['style'], col[1] if col else None, col[2].lower() if col else None))
at = lambda n: n['attributes']
print('nodes', len(N), 'edges', len(g['edges']))
print('node types', dict(collections.Counter(at(n)['type'] for n in g['nodes'])))
print('line styles', dict(collections.Counter(e['attributes']['style'] for e in g['edges'])))
st = collections.Counter()
for n in g['nodes']:
    if at(n)['type'] == 'yauj-station':
        b = at(n)['yauj-station']
        st[b['kind']] += 1
        for t in b['transfer'][0]:
            st['status:' + (t[6] if len(t) > 6 else 'open')] += 1
print('stations', dict(st))

def section(title, rows):
    print(f'\n## {title}: {len(rows)}')
    for r in rows[:25]:
        print('  ', r)
    if len(rows) > 25:
        print('   ...')

stock = [e['key'] + ' ' + e['attributes']['style'] for e in g['edges'] if e['attributes']['style'] not in YAUJ_LINES and e['attributes']['style'] != 'mtr-race-days']
stock += [n['key'] + ' ' + at(n)['type'] for n in g['nodes'] if at(n)['type'] in ('mtr', 'bjsubway-basic', 'chongqingrt-basic')]
section('old-style leftovers', stock)
section('plain text nodes', [f"{at(n)['x']},{at(n)['y']} {at(n)['text']['content']!r}" for n in g['nodes'] if at(n)['type'] == 'text'])

rows = []
for k, n in N.items():
    a = at(n)
    if a['type'] != 'yauj-station':
        continue
    b = a['yauj-station']
    nm = b['names'][0].strip().replace('\n', '')
    styles = [x[0] for x in adj[k] if x[0] not in ('yauj-osi', 'yauj-interchange', 'yauj-border')]
    if not styles:
        continue
    tr = b['transfer'][0]
    status = [(t[6] if len(t) > 6 else 'open') for t in tr]
    dashed = [s in DASH for s in styles]
    pos = f"({a['x']},{a['y']})"
    if b['kind'] == 'construction' and not any(dashed):
        rows.append(('construction label but only solid lines', nm, pos))
    if b['kind'] == 'closed' and any(dashed) and all(dashed):
        rows.append(('closed but only construction lines', nm, pos))
    if b['kind'] == 'normal' and not tr and all(dashed):
        rows.append(('plain station with only construction lines', nm, pos))
    if b['kind'] == 'normal' and tr and all(dashed) and any(s in ('open', 'terminus') for s in status):
        rows.append(('only construction lines but a solid status', nm, pos, status))
    if any(s == 'yauj-light-rail-construction' for s in styles) and b['kind'] != 'lightRailTerminusConstruction':
        rows.append(('light rail construction line end is not the dotted terminus', nm, b['kind'], pos))
    if b['kind'] == 'lightRailTerminus' and any(dashed):
        rows.append(('solid light rail terminus on a dotted line', nm, pos))
    if b['kind'] == 'lineColor':
        canon = {x[2] for x in adj[k] if x[2]}
        if b['color'][2].lower() not in canon:
            rows.append(('terminus colour differs from adjacent line', nm, b['color'][1], b['color'][2], sorted(canon), pos))
section('station vs line consistency', rows)

rows = []
for n in g['nodes']:
    a = at(n)
    if a['type'] == 'yauj-station':
        b = a['yauj-station']
        for t in [b['color']] + b['transfer'][0]:
            key = f'{t[0]}/{t[1]}'
            if key in edge_colors and t[2].lower() not in edge_colors[key]:
                rows.append((b['names'][0].strip(), 'station/interchange colour', key, t[2], 'edges use', dict(edge_colors[key])))
    if a['type'] == 'yauj-line-badge':
        c = a['yauj-line-badge']['color']
        key = f'{c[0]}/{c[1]}'
        if key in edge_colors and c[2].lower() not in edge_colors[key]:
            rows.append((a['yauj-line-badge']['names'][0], 'badge', key, c[2], 'edges use', dict(edge_colors[key])))
section('colours that differ from the line edges', rows)

section('lines with more than one edge colour', [(k, dict(v)) for k, v in edge_colors.items() if len(v) > 1])
