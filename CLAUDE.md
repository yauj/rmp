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
    picker); date from the map's own `(YYYY-MM-DD)` title text node (today if none). The date is
    the map's data date, not the save date. The dialog warns if the file already exists (it is overwritten).
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

Label each item with its mode (metro / HSR / intercity / mainline-suburban / tram-light-rail) and
status (in service, dashed, suspended) so Jeremy knows which style and colour to use.

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
