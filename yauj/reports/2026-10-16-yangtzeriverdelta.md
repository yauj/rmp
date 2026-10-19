# Yangtze River Delta: research findings (cache as of 2026-10-16)

File: `yauj/saves/RailMapToolkit_YangtzeRiverDelta_20260731_yauj-styles.json` (original untouched).

## Applied to the _yauj-styles file
- Lines, stations, place labels and map title converted to Yauj styles; 183 badges converted with the tier from the design speed.
- Intermediate termini marked (status "current" only):

| Station | Line | Done as |
|---|---|---|
| 金吉路, 佘山 | Shanghai 9 | Terminus type |
| 杨高中路 (2775,-2050) | Shanghai 9 | interchange status Terminus |
| 新江湾城, 航中路 | Shanghai 10 | Terminus type |
| 华鹏路 | Shanghai 13 | Terminus type |
| 古浪路, 双柏路 | Shanghai 15 | Terminus type |
| 沈梅路, 康文路 | Shanghai 18 | Terminus type |
| 长江南路 (2625,-2600) | Shanghai 3 and 18 | interchange status Terminus on both |
| 明辉路 | Ningbo 3 | Terminus type |
| 禄口机场 | Nanjing S1 | Terminus type (short run starts 2026-09-29, after the baseline) |

## To do by hand
1. Mark as Terminus (not found on the map under that line): 上海火车站 (Shanghai 1 extra route), 葑亭大道 and 苏州新区火车站 (Suzhou 11).
2. Add the `Yauj - Legend` node.
3. Interchanges: add the own line and set Status where it matters; check the three interchange statuses above by eye.
4. Fix the station/line mismatches (below).
5. Light rail: nothing under construction was found, so no dotted light rail to draw. Already drawn: Songjiang T1/T2, Suzhou Gaoxin,
   Nanjing Hexi/Qilin, Jiaxing T1.

## Badge tiers (design speed km/h)
- Metro (56): all lines at 80, incl. Shanghai 1-8, 10, 13-15, 18; Pujiang; Nanjing 1-3, 5, 7, 10; Hangzhou 1-5, 9, 10; Ningbo 1, 2, 4, 5, 8;
  Hefei 1-5, 7; Suzhou 1-8; Wuxi 1-4; Changzhou, Nantong, Wuhu lines.
- Fast (13): Shanghai 11, 12, 17; Hangzhou 6-8; Hefei 6, 8; Ningbo 6, 7; Nanjing 4; Shaoxing 1; Suzhou 11.
- Higher (7): Shanghai 9, 16; Hangzhou 16, 19; Ningbo 3; Shaoxing 2; Wuxi S1 (all 120).
- Regional (10): Nanjing S1-S3, S6-S9; Hangzhou-Haining, Ningbo-Yuyao, Shaoxing intercity.
- Higher speed regional (4): airport link 160, Jinshan 160, maglev 431, S4 140.

## Light rail findings
- Under construction: none. Planned/on hold: Songjiang T2 phase 2, T3-T7; Nanjing Hexi 2, Jiangxinzhou, Nanbu, Jianye, Lishui;
  Suzhou T4 and the rest of the 6-line network; Jiaxing other lines.
- Stopped, not on the map: Shanghai Zhangjiang tram (2023-06-01, dismantled).
- No tram found in Hangzhou, Ningbo, Wuxi, Changzhou, Nantong, Hefei, Shaoxing, Wuhu, Huzhou, Yangzhou, Zhenjiang (not proof).

## Unknowns to review
**Speeds**
- No design speed on zh.wikipedia: Nanjing 3, Nanjing S3 (宁和), Wuxi 4. Tier left at plain metro / regional.
- From prose, not the infobox: Nanjing 1, 4, 5, S1, S2, S7, S8, S9. Nanjing 4 (100, fast) and S1/S7/S8 (100, regional) depend on it.

**Short runs, status "unclear" (not applied; `mark-intermediate-termini.py --all` once checked)**
- Shanghai 6 巨峰路/高青路 (2009), 7 祁华路 (2014; 美兰湖–云台路 wording unclear), 8 延吉中路/东方体育中心 (2013), 13 张江路.
- Nanjing 4 东流, 7 西善桥/丁家庄 (planning-stage wording), S3 刘村 (opening pattern), S8 方州广场.
- Ningbo 1 望春桥/东环南路: the page does not name today's small-route ends.
- Shanghai 1 上海火车站 and Suzhou 11: current but not found on the map (see To do).
- Planned only: Ningbo 4 奥体中心/南高教园区, 7 富强东路/宝轴西路, 8 洪塘/寒松路.
- Suzhou 3 has an 早晚高峰小交路 column in its station table that could not be read automatically; check by eye.
- Hangzhou has none (only a one-off 龙翔桥 run). Disruption-only runs were left out.

**Other**
- Songjiang T4/T5 details come from English Wikipedia via search; zh gives one line (车墩站-玉树路站 20.6 km).
- Jiaxing: status of the rest of phase 1 not confirmed.
- Map: 3 under-construction stations on solid lines: (-550,-140), (-520,50), (1195,650). 21 "closed" stations on construction lines
  (around x 2050-2900, y 375; x 2955, y 1175-1575; (-7775,-4225); (-8750,-3635); (-8690,-3975)). The Foshan-style "closed vs under
  construction" mapping was never confirmed, so these may be correct as Under construction.
- Not researched: the delta since 2026-07-31. Run `check-updates.py --refresh`, then the watchlist.
