#!/usr/bin/env python3
"""Mark intermediate termini (short-run turnbacks) from the research cache on a yauj-style save.

    python3 yauj/scripts/mark-intermediate-termini.py yauj/saves/<save>_yauj-styles.json [--all] [--dry]

Reads yauj/cache/research/intermediate-termini.json for the save's region and, for every entry with status "current"
(with --all also "unclear"), finds the station with that name that touches a line of that colour id and
  - plain station (no interchange list): sets the "Terminus" station type in the line colour,
  - interchange that lists the line: sets that line's status to "terminus".
Loop lines (Beijing 2 and 10, Shanghai 4) have no line ends, so no end of line is ever marked on them. Their entries in the
cache carry "type": "loop" and name the stations where trains start and end service (driver change, next to the depot);
those are marked the same way. The script warns when a "loop" line does not look like a loop on the map.
A cache entry may carry "at": [x, y] (pin the station by position) and "line" (the colour id it is drawn with).
Stations that are missing, ambiguous or interchanges that do not list the line are printed for hand work. Writes the
save in place (it is the derived _yauj-styles file, never the original); positions and lines are never touched.
"""
import json, re, sys, collections
path = [a for a in sys.argv[1:] if not a.startswith('--')][0]
flags = set(a for a in sys.argv[1:] if a.startswith('--'))
region = re.search(r'RailMapToolkit_([A-Za-z]+)_', path).group(1)
save = json.load(open(path))
g = save['graph']; graph = json.loads(g) if isinstance(g, str) else g
termini = json.load(open('yauj/cache/research/intermediate-termini.json'))['lines']
want = {'current'} | ({'unclear'} if '--all' in flags else set())
nodes = {n['key']: n for n in graph['nodes']}
lines_at = collections.defaultdict(dict)  # node -> colour id -> theme
for e in graph['edges']:
    a = e['attributes']; b = a.get(a['style'], {})
    col = b.get('color') or b.get('colorBackground')
    if col and a['style'] not in ('yauj-border',):
        for k in (e['source'], e['target']): lines_at[k][col[1]] = col
norm = lambda s: re.sub(r'\s+', '', s)


def loop_ends(cid):
    """Stations with a single in service segment of this colour: none on a loop line."""
    deg = collections.Counter()
    for e in graph['edges']:
        a = e['attributes']; b = a.get(a['style'], {})
        col = b.get('color') or b.get('colorBackground')
        if col and col[1] == cid and a['style'] in ('yauj-metro', 'yauj-rail'):
            deg[e['source']] += 1; deg[e['target']] += 1
    return [k for k, d in deg.items() if d == 1]


loop_warned = set()
done, todo = [], []
for key, entries in termini.items():
    if not key.startswith(region + '|') or not entries or not isinstance(entries[0], dict): continue
    cid = key.split('|', 1)[1]
    for en in entries:
        if en['status'] not in want: continue
        if en.get('type') == 'loop' and cid not in loop_warned:
            loop_warned.add(cid)
            ends = loop_ends(cid)
            if ends: todo.append(f'{cid}: marked as a loop line but {len(ends)} station(s) on the map have a single {cid} segment (not a closed loop?)')
        # An entry can pin the station by position ("at": [x, y]) when the map names it differently or leaves it blank (it
        # shares the name of an OSI-linked station), and name the line it is drawn with ("line") when that differs from the key.
        cid = en.get('line', key.split('|', 1)[1])
        if en.get('at'):
            hits = [n for n in nodes.values() if n['attributes']['type'] == 'yauj-station'
                    and [n['attributes']['x'], n['attributes']['y']] == en['at']]
        else:
            hits = [n for n in nodes.values() if n['attributes']['type'] == 'yauj-station'
                    and norm(n['attributes']['yauj-station']['names'][0]) == norm(en['station']) and cid in lines_at[n['key']]]
        if len(hits) != 1:
            todo.append(f'{cid} {en["station"]}: {len(hits)} stations on that line with this name'); continue
        n = hits[0]; a = n['attributes']; st = a['yauj-station']; theme = lines_at[n['key']].get(cid)
        if theme is None:
            todo.append(f'{cid} {en["station"]}: the station found does not have a {cid} line'); continue
        where = f'({a["x"]}, {a["y"]})'
        row = st['transfer'][0] if st['transfer'] else []
        mine = [t for t in row if t[1] == cid]
        if st['kind'] == 'lineColor' or any(len(t) > 6 and t[6] == 'terminus' for t in mine):
            done.append(f'already marked: {cid} {en["station"]} {where}'); continue
        if mine:
            t = mine[0]
            while len(t) < 7: t.append('')
            t[6] = 'terminus'
            done.append(f'interchange status: {cid} {en["station"]} {where}')
        elif row:
            todo.append(f'{cid} {en["station"]} {where}: interchange that does not list {cid} (add the line, status Terminus)')
        elif st['kind'] == 'normal':
            st['kind'] = 'lineColor'; st['color'] = theme
            done.append(f'Terminus type: {cid} {en["station"]} {where}')
        else:
            todo.append(f'{cid} {en["station"]} {where}: station kind is {st["kind"]}')
for r in done: print('  ', r)
print('\nBy hand:'); [print('  -', r) for r in todo]
if '--dry' not in flags:
    save['graph'] = json.dumps(graph) if isinstance(g, str) else graph
    json.dump(save, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'\nwrote {path}')
