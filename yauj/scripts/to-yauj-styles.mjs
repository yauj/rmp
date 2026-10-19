#!/usr/bin/env node
// Convert a map save that uses stock RMP styles into one that uses the yauj line, station and place-label styles.
//
//   node yauj/scripts/to-yauj-styles.mjs <save.json> [out.json]
//   npm run yauj:styles -- <save.json> [out.json]
//
// Default output: <save>_yauj-styles.json next to the input. The input is never modified.
//
// Badges:   stock line badges -> yauj-line-badge, tier from the design speed in yauj/cache/research/line-speeds.json.
// Lines:    single-color -> yauj-metro (or yauj-border when its colour is #ebebeb), london-rail -> yauj-rail, mtr-light-rail -> yauj-light-rail,
//           bjsubway-dotted -> yauj-construction, mtr-unpaid-area -> yauj-osi, mtr-paid-area -> yauj-interchange.
//           mtr-race-days (express overlay) -> yauj-limited.
// Stations: mtr -> yauj-station (in service), bjsubway-basic -> yauj-station (construction when `construction`,
//           closed when not `open`), chongqingrt-basic -> yauj-station (light rail terminus).
// Line ends: where a yauj-metro line (by colour) has one solid segment at a station, the station becomes a Terminus (plain
//           station: Terminus type in the line colour; interchange: that line's status "terminus"). Rail and light rail are skipped.
// Text:     the three title lines -> yauj-map-title; paired Chinese + English city (20/15) and district (15/10) labels -> one yauj-place-label.
import fs from 'node:fs';
import path from 'node:path';

const [, , input, output] = process.argv;
if (!input) {
    console.error('Usage: node yauj/scripts/to-yauj-styles.mjs <save.json> [out.json]');
    process.exit(1);
}

const save = JSON.parse(fs.readFileSync(input, 'utf8'));
const graph = typeof save.graph === 'string' ? JSON.parse(save.graph) : save.graph;

const stats = {};
const count = key => (stats[key] = (stats[key] ?? 0) + 1);
const review = [];

const LINE_MAP = {
    'single-color': 'yauj-metro',
    'london-rail': 'yauj-rail',
    'mtr-light-rail': 'yauj-light-rail',
    'bjsubway-dotted': 'yauj-construction',
    'mtr-unpaid-area': 'yauj-osi',
    'mtr-paid-area': 'yauj-interchange',
    'mtr-race-days': 'yauj-limited',
};

// Edges.
const edgeStyles = new Map();
for (const edge of graph.edges) {
    const a = edge.attributes;
    // Pale grey single-colour lines are city borders.
    const isBorder = a.style === 'single-color' && a['single-color']?.color?.[2]?.toLowerCase() === '#ebebeb';
    const to = isBorder ? 'yauj-border' : LINE_MAP[a.style];
    edgeStyles.set(edge.key, a.style);
    if (!to) {
        count(`line kept: ${a.style}`);
        continue;
    }
    const from = a.style;
    const styleAttrs = a[from] ?? {};
    delete a[from];
    a.style = to;
    a[to] = styleAttrs;
    count(`line ${from} -> ${to}`);
}

// Which line styles touch each node, to flag stations whose status looks inconsistent with their lines.
const touching = new Map();
for (const edge of graph.edges) {
    for (const k of [edge.source, edge.target]) {
        if (!touching.has(k)) touching.set(k, new Set());
        touching.get(k).add(edge.attributes.style);
    }
}

const DEFAULT_COLOR = ['hongkong', 'lrl', '#CD9700', '#fff'];
const station = (attrs, fields) => {
    const { preciseNameOffsets, ...rest } = fields;
    attrs.type = 'yauj-station';
    attrs['yauj-station'] = {
        names: ['', ''],
        nameOffsetX: 'right',
        nameOffsetY: 'top',
        rotate: 0,
        transfer: [[]],
        kind: 'normal',
        pending: 0,
        pendingBetween: false,
        color: DEFAULT_COLOR,
        ...rest,
        ...(preciseNameOffsets ? { preciseNameOffsets } : {}),
    };
};

for (const node of graph.nodes) {
    const a = node.attributes;
    if (a.type === 'mtr') {
        const { names, nameOffsetX, nameOffsetY, rotate, transfer, preciseNameOffsets } = a.mtr;
        delete a.mtr;
        station(a, { names, nameOffsetX, nameOffsetY, rotate, transfer, preciseNameOffsets });
        count('station mtr -> yauj-station (in service)');
    } else if (a.type === 'bjsubway-basic') {
        const { names, nameOffsetX, nameOffsetY, open, construction, preciseNameOffsets } = a['bjsubway-basic'];
        delete a['bjsubway-basic'];
        // "Not open" only means closed where a solid line reaches the station; a station that only dotted (under construction)
        // lines reach is simply under construction.
        const styles0 = [...(touching.get(node.key) ?? [])].filter(x => !['yauj-osi', 'yauj-interchange', 'yauj-border'].includes(x));
        const onlyDotted = styles0.length > 0 && styles0.every(x => x === 'yauj-construction' || x === 'yauj-light-rail-construction');
        const kind = !open ? (onlyDotted ? 'construction' : 'closed') : construction ? 'construction' : 'normal';
        station(a, { names, nameOffsetX, nameOffsetY, kind, preciseNameOffsets });
        count(`station bjsubway-basic -> yauj-station (${kind})`);
        // Flag the mixed cases: "construction" on a solid line only, or "closed" on a dotted line.
        const styles = [...(touching.get(node.key) ?? [])];
        const dotted = styles.includes('yauj-construction');
        const solid = styles.some(s => s !== 'yauj-construction');
        if ((kind === 'construction' && solid && !dotted) || (kind === 'closed' && dotted)) {
            review.push(`${node.key} (${a.x}, ${a.y}) is ${kind} but touches ${styles.join(', ')}`);
        }
    } else if (a.type === 'chongqingrt-basic') {
        const { names, nameOffsetX, nameOffsetY, color, preciseNameOffsets } = a['chongqingrt-basic'];
        delete a['chongqingrt-basic'];
        station(a, { names, nameOffsetX, nameOffsetY, color, kind: 'lightRailTerminus', preciseNameOffsets });
        count('station chongqingrt-basic -> yauj-station (light rail terminus)');
    }
}

/* ----- Line ends: a station where a metro line (by colour id) has exactly one solid segment is its terminus ----- */
// Only yauj-metro segments count: rail and light rail ends are left as ordinary stations, and an end that continues as an
// under construction extension is still marked (the open line ends there today). Plain stations get the Terminus station type
// in the line colour, interchanges get status "terminus" on that line; an interchange that does not list the line is reported.
const metroAt = new Map(); // station key -> colour id -> { theme, count }
for (const edge of graph.edges) {
    const a = edge.attributes;
    if (a.style !== 'yauj-metro') continue;
    const theme = a['yauj-metro']?.color;
    if (!theme) continue;
    for (const k of [edge.source, edge.target]) {
        if (!metroAt.has(k)) metroAt.set(k, new Map());
        const lines = metroAt.get(k);
        const entry = lines.get(theme[1]) ?? { theme, count: 0 };
        entry.count++;
        lines.set(theme[1], entry);
    }
}
for (const node of graph.nodes) {
    const a = node.attributes;
    if (a.type !== 'yauj-station' || a['yauj-station'].kind !== 'normal') continue;
    const st = a['yauj-station'];
    const ends = [...(metroAt.get(node.key) ?? [])].filter(([, v]) => v.count === 1);
    if (ends.length === 0) continue;
    const row = st.transfer[0] ?? [];
    const label = `${st.names[0] || st.names[1] || node.key} (${a.x}, ${a.y})`;
    if (row.length === 0) {
        st.kind = 'lineColor';
        st.color = ends[0][1].theme;
        count('line end -> Terminus station type');
        if (ends.length > 1) review.push(`${label} ends ${ends.map(([id]) => id).join(', ')} but has no interchange list; only ${ends[0][0]} was marked`);
        continue;
    }
    for (const [id] of ends) {
        const info = row.find(t => t[1] === id);
        if (!info) {
            review.push(`${label} ends ${id} but its interchange does not list that line (add it, status Terminus)`);
            continue;
        }
        while (info.length < 7) info.push('');
        info[6] = 'terminus';
        count('line end -> interchange status terminus');
    }
}

/* ----- Line badges: stock badge -> yauj-line-badge, tier from the design speed in yauj/cache/research/line-speeds.json ----- */
// Speed bands (km/h): metro <= 80 circle, fast < 120, higher < 160, high >= 160; regional < 140, highRegional >= 140.
// Metro vs regional is the service type ("kind" in the cache). Without a cache entry or a speed the plain tier of the
// kind is used and the badge is listed under "Check by hand".
const region = /RailMapToolkit_([A-Za-z]+)_/.exec(path.basename(input))?.[1];
const speedsPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'cache', 'research', 'line-speeds.json');
const speeds = fs.existsSync(speedsPath) ? JSON.parse(fs.readFileSync(speedsPath, 'utf8')).lines : {};
const speedOf = (colorId, label) =>
    speeds[`${region}|${colorId}|${label}`] ??
    Object.entries(speeds).find(([k]) => k.startsWith(`${region}|${colorId}|`))?.[1];
const tierOf = (kind, speed) => {
    if (kind === 'regional') return speed == null || speed < 140 ? 'regional' : 'highRegional';
    if (speed == null || speed <= 80) return 'metro';
    return speed < 120 ? 'fast' : speed < 160 ? 'higher' : 'high';
};
// The Chongqing and Suzhou badges are anchored at their top left (20x20), the 2021 ones at their centre.
const BADGES = {
    'chongqingrt-num-line-badge': { offset: 10, names: b => [String(b.num), ''] },
    'chongqingrt-text-line-badge': { offset: 10, names: b => b.names },
    'suzhourt-num-line-badge': { offset: 10, names: b => [`${b.num}${b.branch ? 'B' : ''}`, ''] },
    'chongqingrt-num-line-badge-2021': { offset: 0, names: b => [String(b.num), ''] },
    'chongqingrt-text-line-badge-2021': { offset: 0, names: b => b.names },
};
const tierNotes = new Map();
for (const node of graph.nodes) {
    const a = node.attributes;
    const spec = BADGES[a.type];
    if (!spec) continue;
    const badge = a[a.type];
    const names = spec.names(badge).map(s => String(s ?? ''));
    const entry = speedOf(badge.color[1], names[0]);
    const kind = entry?.kind ?? (badge.isRapid ? 'regional' : 'metro');
    const speed = entry?.speed ?? null;
    const tier = tierOf(kind, speed);
    delete a[a.type];
    a.x += spec.offset;
    a.y += spec.offset;
    a.type = 'yauj-line-badge';
    a['yauj-line-badge'] = { names, tier, color: badge.color };
    count(`badge -> yauj-line-badge (${tier})`);
    if (speed == null) tierNotes.set(`${badge.color[1]}|${names[0]}`, `badge ${names[0]} (${badge.color[1]}): no design speed in the cache, tier left at "${tier}"`);
}
review.push(...tierNotes.values());

// Pair Chinese + English place text.
const PRESETS = [
    { preset: 'city', zh: 20, en: 15, gap: 20 },
    { preset: 'district', zh: 15, en: 10, gap: 15 },
];
const texts = graph.nodes
    .filter(n => n.attributes.type === 'text')
    .map(n => ({ key: n.key, node: n, text: n.attributes.text, x: n.attributes.x, y: n.attributes.y }));
const used = new Set();
const removed = new Set();
for (const { preset, zh, en, gap } of PRESETS) {
    const zhNodes = texts.filter(n => n.text.language === 'mtr_zh' && n.text.fontSize === zh);
    for (const zn of zhNodes) {
        if (used.has(zn.key)) continue;
        const match = texts
            .filter(
                n =>
                    !used.has(n.key) &&
                    n.text.language === 'mtr_en' &&
                    n.text.fontSize === en &&
                    Math.abs(n.x - zn.x) < 1 &&
                    Math.abs(n.y - zn.y - gap) < 1
            )
            .at(0);
        if (!match) {
            review.push(`no English line found for ${JSON.stringify(zn.text.content)} at (${zn.x}, ${zn.y})`);
            continue;
        }
        const za = zn.node.attributes;
        used.add(match.key);
        removed.add(match.key);
        const zhName = za.text.content.replace(/\s+/g, '');
        const enName = match.text.content.trim();
        const color = za.text.color;
        used.add(zn.key);
        delete za.text;
        za.type = 'yauj-place-label';
        za['yauj-place-label'] = { names: [zhName, enName], preset, color };
        count(`text -> yauj-place-label (${preset})`);
    }
}

// The map title: Chinese name (80), English name (50, 70 below) and "(YYYY-MM-DD)" (40, 120 below).
const DATE_TEXT = /^\(?\s*(\d{4}-\d{2}-\d{2})\s*\)?$/;
for (const dn of texts.filter(
    n => n.text.language === 'mtr_en' && n.text.fontSize === 40 && DATE_TEXT.test(n.text.content.trim())
)) {
    const en = texts.find(
        n =>
            !used.has(n.key) &&
            n.text.language === 'mtr_en' &&
            n.text.fontSize === 50 &&
            Math.abs(n.x - dn.x) < 10 &&
            Math.abs(n.y - dn.y + 50) < 1
    );
    const zh =
        en &&
        texts.find(
            n =>
                !used.has(n.key) &&
                n.text.language === 'mtr_zh' &&
                n.text.fontSize === 80 &&
                Math.abs(n.x - en.x) < 10 &&
                Math.abs(n.y - en.y + 70) < 1
        );
    if (!en || !zh) {
        review.push(`map date ${dn.text.content} at (${dn.x}, ${dn.y}) has no matching title lines`);
        continue;
    }
    for (const n of [dn, en, zh]) used.add(n.key);
    removed.add(dn.key);
    removed.add(en.key);
    const za = zh.node.attributes;
    delete za.text;
    za.type = 'yauj-map-title';
    za['yauj-map-title'] = {
        names: [zh.text.content.trim(), en.text.content.trim()],
        date: dn.text.content.match(DATE_TEXT)[1],
    };
    count('text -> yauj-map-title');
}
graph.nodes = graph.nodes.filter(n => !removed.has(n.key));
const leftover = graph.nodes.filter(n => n.attributes.type === 'text').length;
if (leftover) count(`text kept: ${leftover}`);

if (typeof save.graph === 'string') save.graph = JSON.stringify(graph);
else save.graph = graph;

const out = output ?? path.join(path.dirname(input), `${path.basename(input, '.json')}_yauj-styles.json`);
fs.writeFileSync(out, JSON.stringify(save));
console.log(`Wrote ${out}`);
for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${String(v).padStart(5)}  ${k}`);
if (review.length) {
    console.log('\nCheck by hand:');
    for (const r of review) console.log(`  - ${r}`);
}
