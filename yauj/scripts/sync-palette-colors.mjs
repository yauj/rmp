#!/usr/bin/env node
// Bring every colour in a save up to date with the current RMG palette.
//
//   node yauj/scripts/sync-palette-colors.mjs <save.json> [out.json] [--city a,b] [--write]
//   npm run yauj:palette -- <save.json>
//
// A colour is the tuple [city, line id, hex, foreground] used by line edges, badges, stations, interchange entries and
// text. Every tuple whose city + line id exists in the palette gets the palette's hex and foreground; the rest is left
// alone. City "other", "london" white/black and the unused Hong Kong placeholder colour of stations (lrl) are skipped (hand-picked colours such as the #ebebeb city border).
// Without --write nothing is saved and only the changes are listed. Output: <save>_palette-synced.json next to the input
// (or out.json). The input is never modified. Palette: https://railmapgen.github.io/rmg-palette/resources/palettes/<city>.json
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const write = args.includes('--write');
const cityFlag = args.indexOf('--city');
const only = cityFlag >= 0 ? new Set(args.splice(cityFlag, 2)[1].split(',')) : null;
const [input, output] = args.filter(a => a !== '--write');
if (!input) {
    console.error('Usage: node yauj/scripts/sync-palette-colors.mjs <save.json> [out.json] [--city a,b] [--write]');
    process.exit(1);
}
const save = JSON.parse(fs.readFileSync(input, 'utf8'));
const graphIsString = typeof save.graph === 'string';
const graph = graphIsString ? JSON.parse(save.graph) : save.graph;

const HEX = /^#[0-9a-f]{3,8}$/i;
const isTuple = (v, cities) =>
    Array.isArray(v) && v.length >= 4 && typeof v[0] === 'string' && cities.has(v[0]) && typeof v[1] === 'string' &&
    HEX.test(v[2]) && typeof v[3] === 'string' && HEX.test(v[3]);

// First pass: which cities are used.
const used = new Set();
const scan = v => {
    if (Array.isArray(v) && typeof v[0] === 'string' && typeof v[1] === 'string' && HEX.test(v[2] ?? '') && HEX.test(v[3] ?? '')) used.add(v[0]);
    if (v && typeof v === 'object') Object.values(v).forEach(scan);
};
scan(graph);
used.delete('other');
const cities = new Set([...used].filter(c => !only || only.has(c)));

const palettes = {};
for (const city of cities) {
    const res = await fetch(`https://railmapgen.github.io/rmg-palette/resources/palettes/${city}.json`);
    if (!res.ok) { console.warn(`no palette for "${city}" (${res.status}), skipped`); cities.delete(city); continue; }
    palettes[city] = Object.fromEntries((await res.json()).map(p => [p.id, p]));
}

const changes = new Map();
const walk = v => {
    if (isTuple(v, cities)) {
        const p = palettes[v[0]][v[1]];
        if (p && !(v[0] === 'london' && ['white', 'black'].includes(v[1])) && !(v[0] === 'hongkong' && v[1] === 'lrl')) {
            const diff = [];
            if (v[2].toLowerCase() !== p.colour.toLowerCase()) diff.push(`${v[2]} -> ${p.colour}`);
            if (v[3].toLowerCase() !== p.fg.toLowerCase() && !(v[3] === '#fff' && p.fg === '#ffffff')) diff.push(`fg ${v[3]} -> ${p.fg}`);
            if (diff.length) {
                const k = `${v[0]}/${v[1]}: ${diff.join(', ')}`;
                changes.set(k, (changes.get(k) ?? 0) + 1);
                v[2] = p.colour;
                v[3] = p.fg;
            }
        }
    } else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
walk(graph);

console.log(`cities checked: ${[...cities].join(', ') || 'none'}`);
if (!changes.size) console.log('all colours already match the palette');
for (const [k, n] of [...changes].sort()) console.log(`  ${String(n).padStart(4)}  ${k}`);
if (write && changes.size) {
    save.graph = graphIsString ? JSON.stringify(graph) : graph;
    const out = output ?? path.join(path.dirname(input), `${path.basename(input, '.json')}_palette-synced.json`);
    fs.writeFileSync(out, JSON.stringify(save));
    console.log(`Wrote ${out}`);
} else if (changes.size) console.log('\n(dry run, add --write to save)');
