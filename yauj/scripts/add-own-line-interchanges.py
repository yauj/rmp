#!/usr/bin/env python3
"""Make the interchange lists of a yauj-style save complete: every metro / rail line that runs through a station is listed.

    python3 yauj/scripts/add-own-line-interchanges.py yauj/saves/<save>_yauj-styles.json [--dry]

The stock to yauj conversion keeps the stock interchange list, which names only the OTHER lines of a station. For every
normal / Terminus-type station that is on two or more lines (or already has a list), the lines drawn through it
(yauj-metro, yauj-rail, yauj-construction; never trams / light rail, express overlays or connectors) that are missing from
the list are added in front of the existing entries:
  status  open          a solid line of that colour reaches the station,
          terminus      ... and only one segment of it does (the end of the line),
          construction  only dotted segments of that colour reach it.
A Terminus-type station that turns out to be on several lines becomes a normal station with a list. Existing entries are
never changed. Positions, lines and station names are never touched. Writes the save in place.
"""
import collections, json, sys

path = [a for a in sys.argv[1:] if not a.startswith('--')][0]
dry = '--dry' in sys.argv
save = json.load(open(path))
g = save['graph']
graph = json.loads(g) if isinstance(g, str) else g
SOLID = {'yauj-metro', 'yauj-rail'}
DOTTED = {'yauj-construction'}
at = collections.defaultdict(lambda: collections.defaultdict(lambda: {'theme': None, 'solid': 0, 'dotted': 0}))
for e in graph['edges']:
    a = e['attributes']
    if a['style'] not in SOLID | DOTTED:
        continue
    b = a.get(a['style'], {})
    theme = b.get('color') or b.get('colorBackground')
    if not theme:
        continue
    for k in (e['source'], e['target']):
        d = at[k][theme[1]]
        d['theme'] = d['theme'] or theme
        d['solid' if a['style'] in SOLID else 'dotted'] += 1

added = converted = 0
for n in graph['nodes']:
    a = n['attributes']
    if a['type'] != 'yauj-station':
        continue
    st = a['yauj-station']
    if st['kind'] not in ('normal', 'lineColor'):
        continue
    lines = at.get(n['key'], {})
    if not st['transfer']:
        st['transfer'] = [[]]
    row = st['transfer'][0]
    listed = {t[1] for grp in st['transfer'] for t in grp}
    if len(lines) < 2 and not listed:
        continue
    missing = []
    for cid, d in lines.items():
        if cid in listed:
            continue
        status = ('terminus' if d['solid'] == 1 and not d['dotted'] else 'open') if d['solid'] else 'construction'
        theme = d['theme']
        missing.append([theme[0], theme[1], theme[2], theme[3], '', '', status])
    if not missing:
        continue
    row[:0] = missing
    added += len(missing)
    if st['kind'] == 'lineColor':
        st['kind'] = 'normal'
        converted += 1
print(f'{added} lines added to interchange lists; {converted} Terminus-type stations became normal stations')
if not dry:
    save['graph'] = json.dumps(graph) if isinstance(g, str) else graph
    json.dump(save, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'wrote {path}')
