#!/usr/bin/env node
// Recolour every line to the colour of its line-coloured Terminus stations.
//
//   node yauj/scripts/match-lines-to-terminus.mjs <save.json> [out.json] [--city hongkong|all]
//   npm run yauj:terminus-colors -- <save.json>
//
// The Terminus station colour is taken as the latest palette colour of a line (the most common colour among that
// line's `lineColor` stations). Everything else drawn with the same city and line id is changed to it: line edges,
// line badges (the route labels) and interchange entries. Lines without a Terminus station are left alone.
// Default city: hongkong. Default output: <save>_terminus-colors.json next to the input. The input is never modified.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const cityFlag = args.indexOf('--city');
const city = cityFlag >= 0 ? args.splice(cityFlag, 2)[1] : 'hongkong';
const [input, output] = args;
if (!input) {
    console.error('Usage: node yauj/scripts/match-lines-to-terminus.mjs <save.json> [out.json] [--city hongkong|all]');
    process.exit(1);
}

const save = JSON.parse(fs.readFileSync(input, 'utf8'));
const graph = typeof save.graph === 'string' ? JSON.parse(save.graph) : save.graph;

// Terminus colour per line: the most common among its line-coloured stations.
const tally = new Map();
for (const node of graph.nodes) {
    const a = node.attributes;
    if (a.type !== 'yauj-station' || a['yauj-station'].kind !== 'lineColor') continue;
    const color = a['yauj-station'].color;
    if (city !== 'all' && color[0] !== city) continue;
    const key = `${color[0]}/${color[1]}`;
    const byHex = tally.get(key) ?? new Map();
    const hex = color[2].toLowerCase();
    byHex.set(hex, { color, count: (byHex.get(hex)?.count ?? 0) + 1 });
    tally.set(key, byHex);
}
const target = new Map(
    [...tally].map(([key, byHex]) => [key, [...byHex.values()].sort((x, y) => y.count - x.count)[0].color])
);

// A theme is [city, line id, background, foreground, ...]; interchange infos extend it with line/station codes.
const counts = {};
const isTheme = v =>
    Array.isArray(v) && v.length >= 4 && typeof v[0] === 'string' && typeof v[1] === 'string' && /^#/.test(v[2] ?? '');
const walk = (value, where) => {
    if (isTheme(value)) {
        const to = target.get(`${value[0]}/${value[1]}`);
        if (to && to[2].toLowerCase() !== value[2].toLowerCase()) {
            const label = `${value[1]} ${value[2]} -> ${to[2]} (${where})`;
            counts[label] = (counts[label] ?? 0) + 1;
            value[2] = to[2];
            value[3] = to[3];
        }
        return;
    }
    if (Array.isArray(value)) value.forEach(v => walk(v, where));
    else if (value && typeof value === 'object') for (const v of Object.values(value)) walk(v, where);
};
for (const edge of graph.edges) walk(edge.attributes, 'line');
for (const node of graph.nodes) {
    const a = node.attributes;
    const where =
        a.type === 'yauj-line-badge' ? 'route label' : a.type === 'yauj-station' ? 'station interchange' : a.type;
    walk(a, where);
}

if (typeof save.graph === 'string') save.graph = JSON.stringify(graph);
const out = output ?? path.join(path.dirname(input), `${path.basename(input, '.json')}_terminus-colors.json`);
fs.writeFileSync(out, JSON.stringify(save));
console.log(`Wrote ${out}`);
console.log('Terminus colours used:');
for (const [key, color] of target) console.log(`  ${key}  ${color[2]}`);
console.log('Changes:');
for (const [label, n] of Object.entries(counts).sort()) console.log(`  ${String(n).padStart(4)}  ${label}`);
