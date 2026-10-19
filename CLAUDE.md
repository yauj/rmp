# CLAUDE.md — yauj-dev branch

This branch is NOT for developing RMP itself. It is Jeremy's personal workspace for researching
rail network updates for three hand-maintained regional maps. The `yauj/` directory holds the
map saves; the rest of the repo is upstream RMP (Rail Map Painter, part of Rail Map Toolkit) and
is not the subject of work here unless asked.

- Local only. Do NOT push this branch to the fork/remote unless Jeremy explicitly says so.
- This repo replaces the earlier Claude project as the primary place to look for updates.

## Running locally
Jeremy runs the app with `npm run dev` (Vite dev server, `vite --host`; app is served under `/rmp/`).
Customisations on this branch, all local to Jeremy's setup:
- Default preferences (app-slice): auto-parallel Off, grid lines On, snapping Off, change-type
  warnings disabled. Default map for a fresh profile is the Pearl River Delta snapshot
  (`getInitialParam` in `src/util/save.ts`, imports from `yauj/saves/`; bump the filename when a
  newer snapshot is saved). The tutorial is still available via `getTutorialParam`.
- Dev-only "yauj" dropdown (next to the Open menu in the header, only under `npm run dev`),
  backed by a small Vite plugin (`yaujSaves` in `vite.config.mts`, `apply: 'serve'`, only plain
  .json/.svg names in `yauj/saves/`):
  - **yauj import**: lists the `.json` files in `yauj/saves/` (newest first) and loads the chosen
    one after the usual overwrite confirmation.
  - **yauj export**: opens a dialog asking for the region and the "data up to" date, then writes
    `RailMapToolkit_<Region>_<YYYYMMDD>.json` and `.svg` (SVG 2.0, Download dialog defaults) into
    `yauj/saves/`. Defaults: region from the last file opened (yauj import or the Open file
    picker); date from the map's own title (the yauj map title node, or a `(YYYY-MM-DD)` text node; today if none). The date is
    the map's data date, not the save date. The dialog warns if the file already exists (it is overwritten).
    It also writes `RailMapToolkit_<Region>_<YYYYMMDD>_open.svg`: the same map showing only what is in service today
    (no `.json`; the full save stays the master). See "Open-only export" below.
  - The existing Open/Download buttons are unchanged (`src/util/yauj-export.ts` holds the export logic).

## Purpose
Jeremy maintains three dated rail maps, one per megaregion, in RMP. Each map shows (a) the
network currently in service as solid lines and (b) lines under construction or approved as
dashed/annotated lines.

Process: the saved .json is imported into RMP, edited by hand, saved again as .json, and exported
as .svg (primary deliverable; PDF only occasionally, via svgtopdf.com). **Your job is research
only**: find what changed since the last snapshot and tell Jeremy what to add or change. Jeremy
makes every edit himself in RMP.

Snapshots live in `yauj/saves/` (date is in the filename and on the map title). Currently all
three are 2026-07-31:
- `RailMapToolkit_JingJinJi_YYYYMMDD.json`
- `RailMapToolkit_PearlRiverDelta_YYYYMMDD.json`
- `RailMapToolkit_YangtzeRiverDelta_YYYYMMDD.json`

## HARD RULES
- Map JSON is REVIEW ONLY. Read it to see what is already on the map. Never edit, rewrite, merge
  into, re-export, or return a modified JSON, even partially.
- Never generate x/y coordinates or station placement. Layouts are hand-placed in RMP.
- Never change the position of a node, and never create a node (station, virtual node, label), not even when Jeremy asks
  for an edit to the JSON (names, line styles, statuses). Edits that Jeremy asks for in the JSON touch only the fields he
  names.
- Only research cities in the region Jeremy names. If he points at a JSON, the cities/lines in
  that file are the authoritative scope; diff against it.
- If no baseline date is given, ask for it (or the previous update date) before researching.
  (Default baseline is the date in the latest snapshot filename for that region, but confirm.)

## Regions and cities
**Jing-Jin-Ji (京津冀), 13 cities:** Beijing, Tianjin, Shijiazhuang, Tangshan, Baoding, Langfang,
Cangzhou, Handan, Xingtai, Hengshui, Qinhuangdao, Zhangjiakou, Chengde.
- Metros: Beijing, Tianjin, Shijiazhuang. All others are HSR/intercity only.
- Xiong'an (雄安站) is not a metro city but is on the HSR layer; track it as a rail hub.

**Pearl River Delta (珠三角), 12 cities:** Hong Kong, Macao (澳門), Guangzhou, Shenzhen, Dongguan,
Foshan, Zhongshan, Jiangmen, Zhaoqing, Qingyuan, Huizhou, Zhuhai.
- Metros: Hong Kong, Shenzhen, Dongguan, Guangzhou, Foshan, Macao.
- Zhuhai is intercity/HSR only. Also covers HK/GZ/FS/SZ trams, light rail, APM.

**Yangtze River Delta (长三角):**
- Metro cities (11): Shanghai, Nanjing, Hangzhou, Suzhou, Ningbo, Hefei, Wuxi, Changzhou,
  Nantong, Shaoxing, Wuhu.
- HSR/intercity-only (14): Zhenjiang, Yangzhou, Taizhou (Jiangsu), Huzhou, Jiaxing, Ma'anshan,
  Chuzhou, Tongling, Anqing, Xuancheng, Huangshan, Lu'an, Chizhou, Huainan.
- Not on the map; include only if explicitly asked: Wenzhou, Xuzhou, Jinhua-Yiwu metros.

## Rail modes to track (all of them)
1. Metro / subway (地铁): new lines, extensions/phases (延伸/二期/北延 etc.), infill stations.
2. High-speed rail (高铁): lines, stations, hubs.
3. Intercity / higher-speed (城际), including cross-city lines touching these cities (e.g.
   Nanjing S-lines, Ningma/Ningchu intercity, Guangzhou-Shenzhen intercity).
4. Mainline / suburban / regional rail, including 市域(郊)铁路 (e.g. Shanghai 市域铁路, Beijing
   suburban/S lines) and conventional mainline railways.
5. Light rail, trams, APM and other small rail: Hong Kong Light Rail and Tramways, Shenzhen/
   Guangzhou/Foshan trams and APM, Shanghai/Suzhou trams, Beijing tram/T-lines, etc. Some are
   drawn as light lines with NO stations (a plain line between endpoints). Don't demand station
   lists for those. [VERIFY exact intent]

## Drawing conventions in the maps (context for describing what to add)
- `london-rail` style = HSR / intercity / mainline convention:
  - HSR: white + the Hong Kong HSR colour.
  - Intercity (城际): white + the Guangzhou/Guangdong intercity blue.
  - Mainline: inverse of intercity (colours swapped), unless the line has its own specific colour
    (e.g. Beijing lines), in which case that colour is used.
- Metro lines: solid line in the system's official line colour (e.g. shenzhen/sz2, shanghai/sh11).
- Planned / under-construction sections: dashed (`bjsubway-dotted` style) with `bjsubway-basic`
  station nodes, in the line's own colour (planned HSR uses the HSR grey). [VERIFY]
- Trams / light rail / APM: `mtr-light-rail` style, often with no stations (virtual endpoints).
- Large text labels are city names; the map title carries the snapshot date.

### Line badge (label) convention (set in the Pearl River Delta map; reuse in the other regions)
All line badges are the custom `yauj-line-badge` node (`src/components/svgs/nodes/yauj-line-badge.tsx`).
The dropdown is a single "Tier" setting; colour is always the line's own colour.
| Tier (dropdown) | Drawn as | Max speed | Example in PRD |
|---|---|---|---|
| Normal Metro | circle | <= 80 km/h | SZ 1-5, 7-10, 12, 16; GZ 1/2/7/8/10-12; Guangfo; Macao; HK Tsuen Wan/Island/Kwun Tong/TKO/South Island/Disneyland |
| Fast Speed Metro | circle + inner outline | < 120 km/h (i.e. ~100) | SZ 6, SZ 13, GZ 4/5/6 (design ~100), GZ 13, FS 2 |
| Higher Speed Metro | rounded square | < 160 km/h (i.e. 120-140) | SZ 6B/11/14/20, GZ 3/9/14/21, DG R1/R2, HK EAL (KCR) / TML / AEL / TCL |
| High Speed Metro | rounded square + inner outline | >= 160 km/h | GZ 18/22 |
| Regional Rail | wide rectangle | < 140 km/h | 珠机城际 (120) |
| Higher Speed Regional Rail | wide rectangle + inner outline | >= 140 km/h (so 穗深, 140 on phase 1 / 160 elsewhere, is included) | 广州东环, 穗深 (160), 广珠, 广清, 广肇, 广惠, 琶莲 (200) |

Metro vs regional is the service type; speed decides the tier within it. Use the line's designed maximum
speed from zh.wikipedia (最高速度 in the infobox), not the current operating speed.

- Fields: main text (number, letters such as `6B`, or a Chinese name), optional second line (English;
  leave empty for a number-style badge), tier, colour.
- Branch lines: type the letter in the main text (`6B`). The old "Is branch line" switch belongs to the
  legacy Suzhou badge and is no longer used.
- **Stock-RMP conversion (yauj -> stock):** the yauj nodes and styles only exist on this branch. To get a JSON that stock
  RMP opens, run `npm run yauj:stock -- yauj/saves/<save>.json` (script: `yauj/scripts/to-stock-styles.mjs`). It writes
  `yauj/stock/<name>_stock.json` and never touches the input. SVG exports need no conversion. It converts everything:
  - Badges (lossy, stock has fewer looks): Normal -> Chongqing round (num/text); Fast and Higher number badges -> Suzhou
    square (`6B` becomes 6 + branch switch); Fast text -> Chongqing round text (outline lost); Higher/High text ->
    Chongqing 2021 text (not rapid); High number -> Chongqing 2021 number; Regional and Higher Speed Regional ->
    Chongqing 2021 text, rapid (wide rectangle). Positions are re-anchored (yauj badges are centre-anchored).
  - Lines: Metro and City border -> single-color; Rail -> london-rail (Slower speed = limited service); Light rail ->
    mtr-light-rail; Limited service -> mtr-race-days; Under construction and Light rail under construction ->
    bjsubway-dotted; OSI -> mtr-unpaid-area; In-station interchange -> mtr-paid-area.
  - Stations: in service, terminus and interchange -> mtr (closed / under-construction interchange lines are dropped,
    the terminus border colour is lost); Under construction, Closed and stations whose lines are all closed / under
    construction -> bjsubway-basic; light rail termini -> chongqingrt-basic.
  - Text: place labels -> a Chinese and an English text node; map title -> three text nodes; the legend is removed.
  The reverse is `npm run yauj:styles` (`to-yauj-styles.mjs`); a round trip keeps all lines, station kinds, labels and
  the title, but not terminus colours, dotted interchange circles, or the legend. Keep the yauj save as the master.
- The legacy `chongqingrt-*` and `suzhourt-*` badge nodes still exist (unchanged from upstream) and
  render old saves; do not use them for new work.
- The node is anchored at its centre. Legacy round/Suzhou badges were anchored top-left.
- For JingJinJi / YangtzeRiverDelta, classify each line into the tiers above and pick the matching Tier.

### yauj line, station and place-label styles (reuse in the other regions)
Custom styles that exist only on this branch, for the same reason as `yauj-line-badge`:
| Kind | Name in RMP | Drawn as |
|---|---|---|
| Line | yauj-metro (all line styles are listed as "Yauj - …") | solid line (was `single-color`) |
| Line | yauj-rail | London-rail dashes (was `london-rail`) |
| Line | yauj-light-rail | thin line (was `mtr-light-rail`) |
| Line | yauj-construction | Beijing dotted, under construction (was `bjsubway-dotted`) |
| Line | yauj-osi | HK dashed out-of-station interchange (was `mtr-unpaid-area`) |
| Line | yauj-interchange | HK solid in-station interchange (was `mtr-paid-area`) |
| Line | yauj-light-rail-construction | thin dotted line in the line colour, light rail expansion |
| Line | yauj-limited | dashed in the line colour, limited service / express overlay (was `mtr-race-days`) |
| Line | yauj-border | city border, solid `#ebebeb` |
| Station | yauj-station | "Station type" dropdown: In service (HK pill), Under construction, Closed, Terminus, Light rail terminus (small), Light rail terminus under construction (small, dotted) |
| Node | yauj-legend | fixed legend of every line style, station type and badge tier, drawn with the real styles; "Open lines only" switch (used by the open-only export) hides the not-in-service rows |
| Node | yauj-map-title | map title block: Chinese name (80), English name (50), date in brackets (40), black; the export reads the date from it |
| Node | yauj-place-label | one node, Chinese + English linked, Preset = City (20/15) or District (15/10) |

- Under construction / Closed stations: Beijing dotted circle, name hidden, label `(施工封闭)` / `(暂缓开通)` with an
  English line below (`(U/C)` / `(Closed)`), same small size.
- Interchanges: add every line at the station (open ones too) and set each line's Status: In service, Terminus,
  Closed or Under construction. In service lines share a pill (ticks shown only when 2+ lines are solid), a Terminus
  line gets a border in its line colour, Closed / Under construction lines are thin dotted circles next to (or
  between) the solid ones. One open line plus one closed line = an empty circle plus a dotted circle.
- Light rail terminus: small circle in the line colour, only where the light rail does not end at a metro/rail station.
- Trams do not get interchange entries. If a tram line passes through a station, it connects there; do not report a
  station as missing an interchange list because of a tram line (colour ids like `btxj`, `btt1`).
- A dotted line to an open station can show a future service pattern (the service on two lines will switch), not a new
  interchange: 龙泽西 and 东北旺 on Beijing 13 / 18. Do not report those as a missing interchange list or a style error.
- Loop lines (Beijing 2 and 10, Shanghai 4) have no line ends. Mark Terminus at the stations where trains start and end
  service (driver change, next to the depot): Beijing 2 西直门 and 积水潭, Beijing 10 巴沟 and 车道沟, Shanghai 4 宜山路.
  They are recorded in `intermediate-termini.json` with `"type": "loop"` and applied by `mark-intermediate-termini.py`
  like the short run turnbacks.
- Terminus marks that Jeremy set by hand are right, including ones that are not at a metro line end (short runs); do not
  audit them. Only mark true line ends that are missing.
- Under construction interchange: to display one, use the normal ("open") station type and set the status of each line at
  it to Under construction. The under construction station type (name hidden) is for a single line. Placeholder entries in the
  default colour (the Kwun Tong Line green, `#01a040`) are intentional, so do not report them as mismatches.
- A station that is not open yet but sits on an open line (Pazhou; Beijing 17 广渠门外, Beijing 13 清华东路西口, the airport
  line's 望京南) is an under construction station on a solid line. That is correct, not a line style mistake: check
  zh.wikipedia (the station table says 尚未开通 / 有待确定) before changing the line to dotted.
- Station names: a station may have no name because it shares the name of a station it is linked to by an OSI or in-station
  interchange line (e.g. a metro and a high speed rail station). Before reporting an unnamed station, follow its OSI /
  interchange links and check the linked stations' names. Unnamed under construction stations should still get their
  planned name. The English name is whatever English Wikipedia's line article gives for that Chinese name (never a
  translation or pinyin made up here); if the English article does not list the station, the English name stays blank.
  Use the current names in the zh.wikipedia station table of the line page, not the line's navbox template, which is
  often out of date (e.g. 慈云寺桥, 北京通州站, 燕郊南, 农业中关村, 延安路, 雅安道, 中北镇). Duplicated or placeholder
  names on under construction stations are not worth reporting.
- Default colours: metro, construction and limited service start as the Kwun Tong Line (`#01a040`), light rail and
  light rail construction as the Hong Kong Island Tram (`#007549`), rail as the Hong Kong high speed rail colour
  (`#9d948b`), see `src/constants/yauj-colors.ts`. The sidebar colour button also starts as the Kwun Tong Line, and the
  sidebar line icons use these defaults. Light rail styles do not take the sidebar colour (they keep the tram default).
- Palette sync: `npm run yauj:palette -- yauj/saves/<save>.json [--write]` brings every line, badge, station and interchange
  colour up to date with the current RMG palette (dry run unless `--write`; writes `<save>_palette-synced.json`).
  `npm run yauj:terminus-colors` does the opposite for lines whose Terminus stations carry the newer colour.
- Yauj - Rail has a "Slower speed" switch (inverted dashes, the old limited service look).
- Terminus (station type): HK-sized circle with a border in the line colour, name drawn like the HK station.
  Use it where a limited service line just ends early.
- Convert a stock-style save: `npm run yauj:styles -- yauj/saves/<save>.json` (script: `yauj/scripts/to-yauj-styles.mjs`;
  badges get their tier from `yauj/cache/research/line-speeds.json`). Writes `<save>_yauj-styles.json` beside it, never touches the input, and lists stations whose status disagrees with the
  lines they touch.
  It also marks line ends: where a metro line (by colour id) has a single solid segment at a station, a plain station becomes
  the Terminus type in the line colour and an interchange gets status `terminus` on that line (listed under "Check by hand"
  if the interchange does not list the line). Rail and light rail ends are left alone, and an end that continues as an
  under construction extension is still marked. Short-run turnbacks still come from `mark-intermediate-termini.py`.

### Open-only export (`_open.svg`)
`yauj export` also renders a copy of the map with only the network in service. Logic is `makeOpenOnlyGraph` in
`src/util/yauj-open-only.ts` (tests beside it); it works on a clone, so the map being edited and the saved `.json` are
untouched. The SVG goes through `renderVideoFrameGeometry` as the export's render hook. Rules:
- `yauj-construction` and `yauj-light-rail-construction` lines are deleted.
- Stations of kind Under construction / Closed / Light rail terminus under construction, and interchanges whose lines
  are all Closed / Under construction, become invisible `virtual` nodes at the same spot (open lines still run through
  them, also mid-line). Interchange connectors (`yauj-osi`, `yauj-interchange`) touching them are dropped.
- Nodes and stations that had lines and now have none are deleted.
- Interchanges with an open line: each Closed / Under construction line gets status `hidden` (not in the dropdown; the
  slot keeps its room so the pill and name do not move, nothing is drawn). Exception: a Closed / Under construction slot
  between two open ones stays visible (out-of-station interchange, e.g. Pazhou).
- Line badges, place labels, the title and facilities are not touched.
- Every `yauj-legend` gets `openOnly: true`: the Under construction and Light rail under construction lines, the
  Under construction / Closed station rows, the interchange-with-a-closed-line row and the light rail terminus under
  construction row are hidden.
- Not handled: facility icons next to a removed station stay; image nodes are missing from the open SVG.
- The Jing-Jin-Ji / Yangtze River Delta saves must be converted with `npm run yauj:styles` first; stock-style saves have
  nothing for it to filter.

Label each item with its mode (metro / HSR / intercity / mainline-suburban / tram-light-rail) and
status (in service, dashed, suspended) so Jeremy knows which style and colour to use.

## Research cache (git-ignored, `yauj/cache/`)
Layout and the update routine are in `yauj/cache/README.md` (read it first). In short: `raw/` (wiki pages, page revision
index, keyword scan) and `research/` (`line-speeds.json`, `intermediate-termini.json`, `light-rail-expansions.json`,
`watchlist.json`), every line keyed `Region|colour id` as on the map. Check the cache before searching.
- `line-speeds.json`: `Region|colour id|badge text -> { title, speed, src (design | prose | operating-only | user | wiki | none),
  all, kind (metro | regional), note? }`. Drives the badge tier in `to-yauj-styles.mjs`.
- `intermediate-termini.json`: `lines: { "Region|colour id": [ { station, type? (loop), pattern, runs, since, status
  (current | historic | unclear | planned), confidence (high | medium | low), src, note? } ] }`; `"Region|none found"` lists lines checked without a
  result. `yauj/scripts/mark-intermediate-termini.py <yauj-styles save>` applies the `current` ones to a map.
- `light-rail-expansions.json`: `{ fetched, about, "<Region>": [ { system, line, status (operating | suspended |
  under-construction | planned | on-hold | stopped | dismantled), section, timing, src, note? } ] }`; an entry with system
  "checked, none found" lists what was searched.
- `watchlist.json`: `items: [ { id, region, category, mode, line, what, status, expected, page, src, map_action } ]`, the
  dated future events to re-check on the next update. Add to it whenever research finds one.
Scripts: `yauj/scripts/research/check-updates.py` (which tracked pages changed since the baseline), `scan-short-runs.py`,
`show-scan.py`, `show-page.py "<title>"`, `grep-page.py "<title>" [regex]`, `line-speeds/run.py [Region]`. All use the
shared throttled `fetch()` in `yauj/scripts/line-speeds/speeds.py`, so run only one at a time (they share one cache file).

## Update workflow
Jeremy names a region and a window (baseline snapshot date to today, or to an end date). Report
ONLY the delta. Bucket and label every item:
1. **Opened**: exact opening date. Trial operation (试运营) listed separately with its date.
2. **Newly started construction**: line/segment and start date (see rule below).
3. **Under construction (在建)**: current stage + expected opening year/window.
4. **Planned/approved (规划/获批/可研或初步设计批复/开工)**: approval stage + expected timeline.
5. **Service withdrawals and reopenings**:
   - suspended / skip-stop (飞站): date, reason (e.g. 白云机场南站 skip-stop from 2026-05-07);
   - temporarily closed (封闭/停运): date, reason, expected reopening or "no reopening date announced";
   - permanently closed/decommissioned: date;
   - reopened/resumed: reopening date.
   Suspended/closed is marked dashed on the map, never deleted, unless permanently decommissioned.

Keep opened/trial clearly separate from construction/planned (solid vs dashed). Also flag status
moves since baseline (planned → under construction, under construction → opened, in service →
suspended). Don't carry over anything that opened or started before the baseline.

### What counts as "construction started"
Counts: main civil works for the line itself (earthwork, tunnel boring, viaduct piling,
track-laying: 土建施工/主体工程开工, 盾构始发, 铺轨).

Does NOT count: approval only (规划获批/可研批复); advance/enabling works confined to one station
or a node inside another line's project (先期施工/代建); site enclosure (施工围蔽) at one or two
stations.

If dates are ambiguous, give ALL candidate dates and say which is the true main-works start.
Example: Guangzhou Line 28 (station shells 2019-20, Pazhou advance works Jan 2026, main tendering
May-Jun 2026, enclosure Jul 2026; only the last counts).

## Sources (priority order)
- **zh.wikipedia.org** is the source of truth for metros/intercity/suburban: stations, lines,
  phases, dates, status. If any other Chinese source (本地宝, .gov.cn, 澎湃, operators, 中国新闻网)
  disagrees (date, name, section, status), flag it and say which source says what.
- **cnrail.geogv.org** is the source of truth for high-speed rail alignments/stations/status. Flag
  any disagreement with zh.wikipedia on HSR details.
- Prefer Chinese-language sources. Be skeptical of dates: distinguish announced/target dates from
  confirmed openings or confirmed construction starts.

## Output format
Per-line additions list keyed to the map: system → line → new stations/segments. Within each
region sort by city, then mode. For each item give: mode, city, line number/name, exact section
(from-station to to-station), new station names in Chinese and English/pinyin, exact date (or
expected timeframe), the most specific zh.wikipedia link (line page preferred, station page when
one station changes; otherwise say "no zh.wikipedia page yet" and give the best alternative), and
any other source link. End with a Sources section. Keep it tight and skimmable. Delta since the
last snapshot only.
