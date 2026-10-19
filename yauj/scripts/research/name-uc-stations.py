#!/usr/bin/env python3
"""Propose names for unnamed under construction / closed stations by lining each dotted chain up with the station
lists of the zh.wikipedia line templates (Template:<line>, fields 車站列表 / 未来发展) and line pages.

    python3 yauj/scripts/research/name-uc-stations.py yauj/saves/<save>.json [--apply] [--refs yauj/cache/research/line-station-lists.json]

Read-only unless --apply. With --apply only proposals that are safe are written (names[0] and names[1]) and a backup of the
save is written to yauj/cache/backup/. A proposal is safe when the chain lines up with ONE reference list with every
named station in the chain matching the list and every station slot between them filled, and no other list fits equally.
Everything else is printed as "not applied" with the reason. Convention (CLAUDE.md): a station without a name may share
its name with a linked station (OSI / in-station interchange); those are never proposed.

Dotted chain = connected set of yauj-construction / yauj-light-rail-construction lines (any colour), ordered along its
longest path. Reference lists come from templates (cached by yauj/scripts/line-speeds/speeds.py fetch()).
"""
import collections, importlib.util, json, os, re, sys, shutil, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'line-speeds'))
from speeds import fetch as _fetch  # noqa: E402

_CACHE = os.environ.get('YAUJ_WIKI_CACHE', 'yauj/cache/raw/wiki-pages.json')
_snapshot = None


def fetch(title):
    """YAUJ_OFFLINE=1 reads only what is already cached (no network, no cache writes)."""
    if os.environ.get('YAUJ_OFFLINE'):
        global _snapshot
        while _snapshot is None:
            try:
                _snapshot = json.load(open(_CACHE))
            except json.JSONDecodeError:  # another run is writing the cache; try again
                time.sleep(1)
        hit = _snapshot.get(title)
        return tuple(hit) if hit else (None, None)
    return _fetch(title)


path = [a for a in sys.argv[1:] if not a.startswith('--')][0]
apply_ = '--apply' in sys.argv
# --extra "(x,y)=name;(x,y)=name": names checked by hand (e.g. a junction the lists cannot settle), added to the proposals
extra = {}
for a_ in sys.argv:
    if a_.startswith('--extra='):
        for item in a_[len('--extra='):].split(';'):
            pos_, name_ = item.rsplit('=', 1)
            extra[pos_.strip()] = name_.strip()
DOT = {'yauj-construction', 'yauj-light-rail-construction'}
# English Wikipedia line articles that list stations with their Chinese names (see en-names.py)
EN_ARTICLES = {  # city -> English Wikipedia line articles to read; add the line's article when naming a new line
    'bj': ['Line 19 (Beijing Subway)', 'Line 22 (Beijing Subway)', 'Line 28 (Beijing Subway)'],
    'tj': ['Line 4 (Tianjin Metro)', 'Line 7 (Tianjin Metro)', 'Line 8 (Tianjin Metro)', 'Line 11 (Tianjin Metro)'],
    'sjz': ['Line 4 (Shijiazhuang Metro)', 'Line 6 (Shijiazhuang Metro)'],
}
CITY_OF_PREFIX = {'北京': 'bj', '天津': 'tj', '石家庄': 'sjz'}


def english_names(wanted):
    """{station key: (Chinese name, city)} -> {station key: English name}. The name comes from the English articles of that
    city only (the same Chinese name exists in several cities); a name the articles do not give is left out (blank)."""
    spec = importlib.util.spec_from_file_location('en_names', os.path.join(os.path.dirname(__file__), 'en-names.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    found = {}
    for city, titles in EN_ARTICLES.items():
        for title in titles:
            rt, pairs = mod.pairs(title)
            for zh, en in pairs.items():
                found.setdefault((city, zh), en)
    return {k: found[(city, zh)] for k, (zh, city) in wanted.items() if (city, zh) in found}


MARK = {'gstart', 'gend', 'blstart', 'blend', 'blline', 'bgstart', 'bgend'}

REF_TEMPLATES = (
    ['北京地铁%d号线' % n for n in list(range(1, 13)) + [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]]
    + ['北京地铁房山线', '北京地铁燕房线', '北京地铁昌平线', '北京地铁S1线', '北京地铁首都机场线', '北京大兴国际机场线', '北京地铁八通线', '北京地铁亦庄线']
    + ['天津地铁%d号线' % n for n in range(1, 14)] + ['天津地铁Z2线', '天津轨道交通Z4线', '天津地铁B1线', '天津地铁Z1线', '天津地铁Z3线']
    + ['石家庄地铁%d号线' % n for n in range(1, 7)]
)


def norm(s):
    s = re.sub(r"'''?|\[\[|\]\]|%.*?%|<[^>]*>", '', s).strip()
    s = re.sub(r'[（(].*?[）)]', '', s)
    return re.sub(r'\s+', '', s.strip())


# stations match on their name without a closing 站, but the list's own spelling is what gets written
key = lambda n: re.sub(r'站$', '', n) if n else n


def template_lists(title):
    rt, t = fetch('Template:' + title)
    if not t:
        return []
    out = []
    for key in ['車站列表', '车站列表', '未来发展', '未來發展']:
        m = re.search(r'\|\s*' + key + r'\s*=\s*(.*?)(?=\n\s*\||\n\}\})', t, re.S)
        if not m:
            continue
        seq = []
        for tok in m.group(1).split('~'):
            tok = tok.strip()
            if not tok:
                continue
            tok = re.sub(r"^\S*start\S*=\S*\s*", '', tok)
            tok = tok.split('#')[-1]
            parts = [p for p in re.split(r'\s+', tok) if p] if (' ' in tok and "'''" in tok) else [tok]
            for p in parts:
                n = norm(p)
                if n and n not in MARK and not n.startswith('blline') and not re.match(r'^[a-z]+$', n):
                    seq.append(n)
        if len(seq) >= 3:
            out.append((f'{title}:{key}', seq))
    return out


def page_list(title):
    rt, t = fetch(title)
    if not t:
        return []
    names = []
    for m in re.finditer(r'\{\{\s*(?:stl|站|Stl)\s*\|\s*[^|}]*\|\s*([^|}]+?)\s*(?:\|[^}]*)?\}\}', t):
        n = norm(m.group(1))
        if n and n not in names:
            names.append(n)
    return [(f'{title}:page', names)] if len(names) >= 3 else []


d = json.load(open(path))
g = d['graph']
g = json.loads(g) if isinstance(g, str) else g
N = {n['key']: n['attributes'] for n in g['nodes']}
E = g['edges']
refs = []
for title in REF_TEMPLATES:
    refs += [(t, R, 2) for t, R in template_lists(title)]
    # Page tables are a weaker reference (they can merge several routes into one list): blanks inside the span only.
    refs += [(t, R, 1) for t, R in page_list(title)] if title.startswith(('北京地铁', '天津', '石家庄')) and '--templates-only' not in sys.argv else []
print(f'{len(refs)} reference lists')


def nm(k):
    return norm(N[k]['yauj-station']['names'][0]) or None


# --- dotted components; every leaf-to-leaf path of a component is tried against every reference list
adj = collections.defaultdict(list)
for e in E:
    if e['attributes']['style'] in DOT:
        adj[e['source']].append(e['target'])
        adj[e['target']].append(e['source'])
seen = set()
comps = []
for s0 in list(adj):
    if s0 in seen:
        continue
    comp, st = [], [s0]
    seen.add(s0)
    while st:
        x = st.pop()
        comp.append(x)
        for y in adj[x]:
            if y not in seen:
                seen.add(y)
                st.append(y)
    comps.append(comp)


def bfs_path(a, b):
    prev = {a: None}
    q = [a]
    for x in q:
        if x == b:
            break
        for y in adj[x]:
            if y not in prev:
                prev[y] = x
                q.append(y)
    out = []
    while b is not None:
        out.append(b)
        b = prev.get(b)
    return out[::-1]


pos = lambda k: f"({N[k]['x']},{N[k]['y']})"
is_blank = lambda k: N[k]['type'] == 'yauj-station' and nm(k) is None and N[k]['yauj-station']['kind'] in ('construction', 'closed', 'normal')
report, writes = [], {}
for comp in comps:
    stn = [k for k in comp if N[k]['type'] == 'yauj-station']
    blanks = [k for k in stn if is_blank(k)]
    if not blanks:
        continue
    leaves = [k for k in comp if len(adj[k]) == 1] or comp[:1]
    # (station key -> {name -> [evidence]})
    votes = collections.defaultdict(lambda: collections.defaultdict(list))
    notes = []
    for la in range(len(leaves)):
        for lb in range(la + 1, len(leaves)):
            P = [k for k in bfs_path(leaves[la], leaves[lb]) if N[k]['type'] == 'yauj-station']
            C = [nm(k) for k in P]
            if not any(is_blank(k) for k in P):
                continue
            for title, R, trust in refs:
                where = collections.defaultdict(list)
                for r, n_ in enumerate(R):
                    where[key(n_)].append(r)
                for rev in (False, True):
                    CC = [key(c) for c in (C[::-1] if rev else C)]
                    PP = P[::-1] if rev else P
                    shifts = collections.Counter()
                    for i, c in enumerate(CC):
                        for r in where.get(c, []) if c else []:
                            shifts[r - i] += 1
                    for d, hits in shifts.items():
                        if hits < 2:
                            continue
                        idx = [i for i in range(len(CC)) if 0 <= i + d < len(R)]
                        bad = [i for i in idx if CC[i] and CC[i] != key(R[i + d])]
                        good = [i for i in idx if CC[i] and CC[i] == key(R[i + d])]
                        if not bad:
                            groups = [idx]
                        elif len(bad) == 1 and len(good) >= 4:
                            groups = [idx]
                            notes.append(f"{title}: map name {CC[bad[0]]} {pos(PP[bad[0]])} but the list has {R[bad[0] + d]} there")
                        else:
                            groups, cur = [], []
                            for i in idx:
                                if i in bad:
                                    groups.append(cur)
                                    cur = []
                                else:
                                    cur.append(i)
                            groups.append(cur)
                        for grp in groups:
                            ms = [i for i in grp if CC[i]]
                            if len(ms) < 2:
                                continue
                            lo, hi = min(ms), max(ms)
                            # blanks between the first and last matched station are determined. Beyond them only for a
                            # template list (an order the wiki maintains): the next station after an anchor is the next in the list.
                            first, last = (grp[0], grp[-1]) if trust == 2 else (lo, hi)
                            for i in grp:
                                if first <= i <= last and CC[i] is None and is_blank(PP[i]):
                                    votes[PP[i]][R[i + d]].append(title)
    head = f"component with {len(stn)} stations, {len(blanks)} unnamed, around {pos(comp[0])}"
    got = 0
    for k in blanks:
        v = votes.get(k)
        if not v:
            continue
        if len(v) > 1:
            notes.append(f"{pos(k)} readings disagree: {', '.join(sorted(v))}")
            continue
        (name, titles), = v.items()
        writes[k] = name
        got += 1
    taken = collections.Counter([nm(k) for k in stn if nm(k)] + [writes[k] for k in blanks if k in writes])
    for k in blanks:
        if k in writes and taken[writes[k]] > 1:
            notes.append(f"{pos(k)} would be {writes[k]}, which is already used in this component")
            del writes[k]
            got -= 1
    report.append(f"{'APPLY' if got else 'NOT APPLIED'}  {head}: {got} of {len(blanks)} unnamed stations matched")
    for n_ in sorted(set(notes)):
        report.append(f'     note: {n_}')
    for k in blanks:
        if k in writes:
            report.append(f"     {pos(k)} -> {writes[k]}   [{', '.join(sorted({t.split(':')[0] for t in votes[k][writes[k]]}))}]")
    left = [pos(k) for k in blanks if k not in writes]
    if left:
        report.append(f"     unmatched: {' '.join(left)}")

for k in list(N):
    if N[k]['type'] == 'yauj-station' and pos(k) in extra:
        writes[k] = extra[pos(k)]
        report.append(f'     by hand: {pos(k)} -> {extra[pos(k)]}')
print('\n'.join(report))
refresh = [a_[len('--english-from-backup='):] for a_ in sys.argv if a_.startswith('--english-from-backup=')]
if refresh:
    # stations that were unnamed in the backup get their English from English Wikipedia (and nothing else)
    old = json.load(open(refresh[0]))
    og = old['graph'] if isinstance(old['graph'], dict) else json.loads(old['graph'])
    was_blank = {n['key'] for n in og['nodes'] if n['attributes']['type'] == 'yauj-station' and not n['attributes']['yauj-station']['names'][0].strip()}
    now = {k: N[k]['yauj-station']['names'][0] for k in was_blank if k in N and N[k]['yauj-station']['names'][0].strip()}
    for k, zh in now.items():
        writes.setdefault(k, zh)
if apply_ and writes:
    # a name that exists in several cities takes the city of the nearest station along the lines whose name belongs to one city
    name_cities = collections.defaultdict(set)
    for title, R, trust in refs:
        for n_ in R:
            name_cities[key(n_)].add(CITY_OF_PREFIX.get(re.match(r'(北京|天津|石家庄)', title).group(1)) if re.match(r'(北京|天津|石家庄)', title) else '?')
    nbr = collections.defaultdict(list)
    for e in E:
        nbr[e['source']].append(e['target'])
        nbr[e['target']].append(e['source'])

    def city_of(k):
        cs = name_cities.get(key(writes[k]), set())
        if len(cs) == 1:
            return next(iter(cs))
        seen_, q = {k}, [k]
        for x in q:
            nm_ = N[x]['yauj-station']['names'][0] if N[x]['type'] == 'yauj-station' else ''
            c_ = name_cities.get(key(norm(nm_)), set()) if nm_ else set()
            if x != k and len(c_) == 1:
                return next(iter(c_))
            for y in nbr[x]:
                if y not in seen_:
                    seen_.add(y)
                    q.append(y)
        return None

    en = english_names({k: (writes[k], city_of(k)) for k in writes})
    os.makedirs('yauj/cache/backup', exist_ok=True)
    shutil.copy(path, f'yauj/cache/backup/{os.path.basename(path)}.{int(time.time())}')
    raw = json.load(open(path))
    gg = raw['graph']
    gg = json.loads(gg) if isinstance(gg, str) else gg
    for n in gg['nodes']:
        if n['key'] in writes:
            n['attributes']['yauj-station']['names'] = [writes[n['key']], en.get(n['key'], '')]
    raw['graph'] = gg if isinstance(raw['graph'], dict) else json.dumps(gg)
    open(path, 'w').write(json.dumps(raw, ensure_ascii=False, separators=(',', ':')))
    print(f'\nwrote {len(writes)} names to {path}')
