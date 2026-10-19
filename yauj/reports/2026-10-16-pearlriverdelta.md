# Pearl River Delta: research findings, written retroactively (cache as of 2026-10-16)

File: `yauj/saves/RailMapToolkit_PearlRiverDelta_20260731.json` (your hand-updated map, already in Yauj styles).
Checked against the current save with `check-map.py` and `mark-intermediate-termini.py --all --dry`.

## Already done on the map
- Yauj lines, stations, place labels, map title, legend; 123 badges with tiers; no old-style leftovers.
- Line, badge and interchange colours match the Terminus stations and the palette (Shenzhen 20 foreground synced).
- 82 Terminus stations, 78 interchange lines with status Terminus; 5 light rail termini + 1 under construction.
- Tiers agree with the speed cache everywhere except Shenzhen 3 (85 km/h, drawn metro by your call; the rule would say fast).

## To do by hand
1. Intermediate termini still unmarked (all from the earlier low-confidence list): Guangzhou 2 三元里 (-2400,-2600);
   Shenzhen 3 益田 (-125,-350) and 双龙 (705,-1225); Shenzhen 5 黄贝岭 (400,-545); Shenzhen 8 深外高中 (760,-550)
   (marked on Shenzhen 2 but not on 8).
2. Not found on the line named: Guangfo 澜石 and 普君北路; Guangzhou 7 深井 and 广州南; Shenzhen 8 湾厦 (the cache lists it under "sz2/8", so
   it may be Shenzhen 2 only, which is marked).
3. Light rail construction line ends (南岗 (-1525,-2400), 浔峰岗北 (-2675,-2745), (-1525,-2430)) are not the dotted terminus;
   (-1525,-2620) is a solid light rail terminus on a dotted line.
4. "Under construction" label on 6 stations that touch only solid lines: (-425,-150), (-90,240), (-120,270), (-4075,-1825),
   (-1850,-1875), (-1850,500). A "Closed" station on construction-only lines at (-350,-665).

## Light rail findings (cache)
- Under construction: Guangzhou Huangpu T2 south (开源大道东–地铁南岗, 12 stations, 9.5 km; started 2019-08; no opening date, only 云埔五路 "2026");
  Foshan Nanhai Lishui (里湖新城–里横路, about 9.9 km; started 2020-12-27; 2027 H1/H2 in sections); Macao Taipa east line (关闸–氹仔码头, 7.7 km;
  started 2023-10-20; open H2 2029, drawn as metro).
- On hold: Huangpu T1 east extension (永和大道–桑田三路, 2.86 km).
- Planned: Zengcheng demo line, Huangpu T5, Foshan Nanhai T2 and Shishan T1, Shenzhen Longhua extensions and 大浪线 (on hold), Longgang 云巴 stopped.
- Dismantled: Zhuhai tram 1 (stopped 2021-01-22, dismantling from 2024-05-10).

## Unknowns to review
- Speeds: Shenzhen 2 is "assumed 80" (no value found); Guangzhou 6 uses the maximum operating speed (90), not design; Shenzhen 3 is 85
  (operating); 穗深 is 140 on phase 1 and 160 elsewhere (drawn higher speed regional); Foshan 3 has no entry in the speed cache.
- The Pearl River Delta short-run list is an earlier, lower-confidence pass with no page recorded per entry; every entry is status "unclear",
  confidence "low". Hong Kong entries (青衣, 北角, 何文田, 調景嶺) are all marked on the map; re-verify the rest.
- Foshan Nanhai Lishui: wiki 14 stations (3 transfers) vs press 13 (2 transfers, 9.834 km).
- Guangzhou Huangpu T2 south: no opening date announced.
- "Closed vs under construction" for Foshan-area lines was flagged earlier and never confirmed.
- Not researched: the delta since 2026-07-31. Run `check-updates.py --refresh`, then the watchlist.
