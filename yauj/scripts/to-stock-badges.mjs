#!/usr/bin/env node
// Convert a yauj map save (custom yauj styles) into a JSON that stock RMP can open, swapping every yauj node and
// line for the closest stock one. This is the reverse of to-yauj-styles.mjs; the conversion is lossy, see CLAUDE.md.
//
//   node yauj/scripts/to-stock-badges.mjs <save.json> [out.json]
//   npm run yauj:stock -- <save.json> [out.json]
//
// Default output: yauj/stock/<name>_stock.json. The input is never modified. What is converted:
//   badges        yauj-line-badge       -> Chongqing / Chongqing 2021 / Suzhou badges (by tier)
//   lines         yauj-metro            -> single-color              yauj-border   -> single-color
//                 yauj-rail             -> london-rail (slower speed = limitedService)
//                 yauj-light-rail       -> mtr-light-rail            yauj-limited  -> mtr-race-days
//                 yauj-construction     -> bjsubway-dotted           yauj-light-rail-construction -> bjsubway-dotted
//                 yauj-osi              -> mtr-unpaid-area           yauj-interchange -> mtr-paid-area
//   stations      yauj-station          -> mtr (in service, terminus, interchange; only open/terminus lines kept),
//                                          bjsubway-basic (construction / closed, also stations whose lines are all
//                                          closed or under construction), chongqingrt-basic (light rail terminus)
//   text          yauj-place-label      -> a Chinese and an English text node (mtr_zh / mtr_en)
//                 yauj-map-title        -> three text nodes
//   removed       yauj-legend
// Lossy swaps are listed in the summary.
import fs from 'node:fs';
import path from 'node:path';

const [, , input, output] = process.argv;
if (!input) {
    console.error('Usage: node yauj/scripts/to-stock-badges.mjs <save.json> [out.json]');
    process.exit(1);
}

const save = JSON.parse(fs.readFileSync(input, 'utf8'));
const graphIsString = typeof save.graph === 'string';
const graph = graphIsString ? JSON.parse(save.graph) : save.graph;

const stats = {};
const warnings = new Set();
const count = (key, note) => {
    stats[key] = (stats[key] ?? 0) + 1;
    if (note) warnings.add(note);
};

// yauj badges are centre-anchored; the original round and Suzhou badges are anchored at their top-left (20x20).
const TOP_LEFT_OFFSET = 10;

const toNumberOrText = s => (/^\d+$/.test(s) ? Number(s) : s);

const convert = (attrs, badge) => {
    const [main, sub = ''] = badge.names;
    const isNum = sub === '';
    const { tier, color } = badge;
    let type,
        value,
        offset = 0,
        note;

    // Suzhou number badge: letters are only supported as a branch ("6B" -> 6 + branch switch).
    const suzhouNum = () => {
        const branch = /^(\d+)B$/i.exec(main);
        return { num: branch ? Number(branch[1]) : toNumberOrText(main), branch: !!branch, color };
    };

    switch (tier) {
        case 'metro':
            [type, value, offset] = isNum
                ? ['chongqingrt-num-line-badge', { num: main, color }, TOP_LEFT_OFFSET]
                : ['chongqingrt-text-line-badge', { names: [main, sub], color }, TOP_LEFT_OFFSET];
            break;
        case 'fast':
            if (isNum) {
                [type, value, offset] = ['suzhourt-num-line-badge', suzhouNum(), TOP_LEFT_OFFSET];
                note = 'fast: drawn as a Suzhou square (circle outline is not available), same as higher';
            } else {
                [type, value, offset] = ['chongqingrt-text-line-badge', { names: [main, sub], color }, TOP_LEFT_OFFSET];
                note = 'fast text: drawn as a plain round Chongqing text badge (outline dropped)';
            }
            break;
        case 'higher':
            if (isNum) [type, value, offset] = ['suzhourt-num-line-badge', suzhouNum(), TOP_LEFT_OFFSET];
            else [type, value] = ['chongqingrt-text-line-badge-2021', { names: [main, sub], color, isRapid: false }];
            break;
        case 'high':
            if (isNum) [type, value] = ['chongqingrt-num-line-badge-2021', { num: toNumberOrText(main), color }];
            else [type, value] = ['chongqingrt-text-line-badge-2021', { names: [main, sub], color, isRapid: false }];
            break;
        case 'regional':
            [type, value] = ['chongqingrt-text-line-badge-2021', { names: [main, sub], color, isRapid: true }];
            note = 'regional: drawn like higher speed regional (stock has one wide rectangle, with outline)';
            break;
        case 'highRegional':
            [type, value] = ['chongqingrt-text-line-badge-2021', { names: [main, sub], color, isRapid: true }];
            break;
        default:
            throw new Error(`Unknown tier "${tier}" on ${attrs.type}`);
    }

    delete attrs['yauj-line-badge'];
    attrs.type = type;
    attrs[type] = value;
    attrs.x -= offset;
    attrs.y -= offset;
    count(`${tier} -> ${type}`, note);
};

for (const node of graph.nodes) {
    const attrs = node.attributes;
    if (attrs?.type === 'yauj-line-badge') convert(attrs, attrs['yauj-line-badge']);
}

/* ----- Lines ----- */
const LINE_TO_STOCK = {
    'yauj-metro': 'single-color',
    'yauj-border': 'single-color',
    'yauj-rail': 'london-rail',
    'yauj-light-rail': 'mtr-light-rail',
    'yauj-limited': 'mtr-race-days',
    'yauj-construction': 'bjsubway-dotted',
    'yauj-light-rail-construction': 'bjsubway-dotted',
    'yauj-osi': 'mtr-unpaid-area',
    'yauj-interchange': 'mtr-paid-area',
};
for (const edge of graph.edges) {
    const a = edge.attributes;
    const to = LINE_TO_STOCK[a.style];
    if (!to) continue;
    const from = a.style;
    const styleAttrs = a[from] ?? {};
    delete a[from];
    a.style = to;
    a[to] = styleAttrs;
    count(
        `line ${from} -> ${to}`,
        from === 'yauj-light-rail-construction'
            ? 'light rail construction: drawn as the (thicker) Beijing dotted line, stock has no thin dotted line'
            : undefined
    );
}

/* ----- Stations ----- */
const isSolidStatus = info => !['closed', 'construction'].includes(info[6]);
const stripStatus = info => info.slice(0, 6);
for (const node of graph.nodes) {
    const a = node.attributes;
    if (a?.type !== 'yauj-station') continue;
    const st = a['yauj-station'];
    delete a['yauj-station'];
    const { names, nameOffsetX, nameOffsetY, preciseNameOffsets } = st;
    const common = { names, nameOffsetX, nameOffsetY, ...(preciseNameOffsets ? { preciseNameOffsets } : {}) };
    const lines = st.transfer?.[0] ?? [];
    const solid = lines.filter(isSolidStatus);
    const allDotted = st.kind === 'normal' && lines.length > 0 && solid.length === 0;
    let type, value, key;
    if (st.kind === 'construction' || (allDotted && lines.some(l => l[6] === 'construction'))) {
        [type, value, key] = [
            'bjsubway-basic',
            { ...common, open: true, construction: true, scale: 1 },
            'construction',
        ];
    } else if (st.kind === 'closed' || allDotted) {
        [type, value, key] = ['bjsubway-basic', { ...common, open: false, construction: false, scale: 1 }, 'closed'];
    } else if (st.kind === 'lightRailTerminus' || st.kind === 'lightRailTerminusConstruction') {
        [type, value, key] = [
            'chongqingrt-basic',
            { names: ['', ''], color: st.color, nameOffsetX, nameOffsetY, isLoop: false },
            st.kind === 'lightRailTerminus' ? 'light rail terminus' : 'light rail terminus (dotted)',
        ];
    } else {
        const dropped = lines.length - solid.length;
        const hadTerminus = lines.some(l => l[6] === 'terminus') || st.kind === 'lineColor';
        [type, value, key] = [
            'mtr',
            { ...common, rotate: st.rotate ?? 0, transfer: [solid.map(stripStatus), ...(st.transfer?.slice(1) ?? [])] },
            st.kind === 'lineColor' ? 'terminus' : 'in service',
        ];
        if (dropped)
            count(
                'stations: closed / under construction interchange lines dropped',
                'mtr station: interchange lines that are closed or under construction are dropped (stock has no dotted interchange circle)'
            );
        if (hadTerminus)
            count(
                'stations: terminus border colour lost',
                'terminus: the line-coloured border becomes a normal Hong Kong station'
            );
    }
    if (st.kind === 'lightRailTerminusConstruction')
        warnings.add('light rail terminus (dotted): drawn as the solid light rail terminus');
    a.type = type;
    a[type] = value;
    count(`station ${key} -> ${type}`);
}

/* ----- Text ----- */
let keyCounter = 0;
const newKey = base => `${base}_stock${++keyCounter}`;
const spaced = zh => ([...zh.replace(/\s+/g, '')].length > 1 ? [...zh.replace(/\s+/g, '')].join(' ') : zh);
const textNode = (key, x, y, content, fontSize, language, color) => ({
    key,
    attributes: {
        visible: true,
        zIndex: 5,
        x,
        y,
        type: 'text',
        text: {
            content,
            fontSize,
            lineHeight: fontSize,
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            language,
            color,
            rotate: 0,
            italic: 'normal',
            bold: 'normal',
            outline: 0,
        },
    },
});
const BLACK = ['other', 'other', '#000000', '#fff'];
const added = [];
graph.nodes = graph.nodes.filter(node => {
    const a = node.attributes;
    if (a?.type === 'yauj-legend') {
        count('legend removed', 'yauj-legend has no stock equivalent and was removed');
        return false;
    }
    if (a?.type === 'yauj-place-label') {
        const { names, preset, color } = a['yauj-place-label'];
        const [zhSize, enSize, gap] = preset === 'city' ? [20, 15, 20] : [15, 10, 15];
        added.push(textNode(newKey(node.key), a.x, a.y + gap, names[1] ?? '', enSize, 'mtr_en', color));
        delete a['yauj-place-label'];
        a.type = 'text';
        a.text = textNode('', 0, 0, spaced(names[0]), zhSize, 'mtr_zh', color).attributes.text;
        count(`place label (${preset}) -> 2 text nodes`);
    } else if (a?.type === 'yauj-map-title') {
        const { names, date } = a['yauj-map-title'];
        added.push(textNode(newKey(node.key), a.x, a.y + 70, names[1] ?? '', 50, 'mtr_en', BLACK));
        added.push(textNode(newKey(node.key), a.x, a.y + 120, `(${date})`, 40, 'mtr_en', BLACK));
        delete a['yauj-map-title'];
        a.type = 'text';
        a.text = textNode('', 0, 0, names[0], 80, 'mtr_zh', BLACK).attributes.text;
        count('map title -> 3 text nodes');
    }
    return true;
});
graph.nodes.push(...added);

save.graph = graphIsString ? JSON.stringify(graph) : graph;

const out =
    output ?? path.join(path.dirname(input), '..', 'stock', path.basename(input).replace(/\.json$/, '_stock.json'));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(save));

console.log(`Wrote ${out}`);
for (const [k, v] of Object.entries(stats)) console.log(`  ${v}\t${k}`);
if (!Object.keys(stats).length) console.log('  (no yauj nodes found)');
for (const w of warnings) console.log(`  note: ${w}`);
