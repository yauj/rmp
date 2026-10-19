# Jing-Jin-Ji: research findings (cache as of 2026-10-16)

File: `yauj/saves/RailMapToolkit_JingJinJi_20260731_yauj-styles.json` (original untouched).

## Applied to the _yauj-styles file
- Lines, stations, place labels and map title converted to Yauj styles; 92 badges converted with the tier from the design speed.
- Intermediate termini marked (status "current" only):

| Station | Line | Done as |
|---|---|---|
| 公主坟 (-350,5) | Beijing 1 | interchange status Terminus |
| 古城, 果园 | Beijing 1 | Terminus type |
| 中关村, 黄村西大街 | Beijing 4 | Terminus type |
| 大屯路东 (125,-425) | Beijing 15 | interchange status Terminus |
| 后沙峪 | Beijing 15 | Terminus type |
| 篱笆房 | Fangshan | Terminus type |
| 郭公庄 (-400,415) | Fangshan | interchange status Terminus |
| 昌平东关, 沙河高教园 | Changping | Terminus type |
| 新立 | Tianjin 9 (after 22:30, one direction) | Terminus type |

## To do by hand
1. Add the `Yauj - Legend` node (needs a free spot).
2. Interchanges: converted stations list only the other lines; add the own line and set each Status where it matters.
3. Check the three interchange statuses above by eye.
4. Fix the station/line mismatches (below, under Unknowns).
5. Light rail: nothing under construction was found, so no dotted light rail to draw. Already drawn: Xijiao, Yizhuang T1.

## Badge tiers (design speed km/h)
- Metro (30): Beijing 1-5, 7-10, 12-14, 16, 18, Yizhuang, Yanfang; Shijiazhuang 1-3; Tianjin 1-8, 10, 11; Z4.
- Fast (10): Beijing 6, 11, 15, 17, Fangshan, S1, Changping, Capital Airport (110), Fuzhongxin; Tianjin 9.
- Higher (1): Beijing 19 (120). High (2): Daxing Airport (160), Jinjing (160).
- Regional (1): S2 (120). Higher speed regional (2): Huairou-Miyun (160), Tongmi (160).
- Borderline for your call: Capital Airport 110 (fast).

## Light rail findings
- Under construction: none. Planned: Yizhuang T2-T4; Shunyi T1/T3 (no dates). On hold: Shunyi T2.
- Stopped, not on the map: Tianjin TEDA guided tram (2023-06-01).
- No tram found in Shijiazhuang, Tangshan, Qinhuangdao, Langfang, Baoding, Xiong'an, other Hebei cities (not proof).

## Unknowns to review
**Short runs, status "unclear" (not applied; use `mark-intermediate-termini.py --all` once checked)**
- Beijing 4 新宫: older 安河桥北–新宫 small route; the page says it was adjusted to 黄村西大街–中关村.
- Beijing 10 成寿寺, 巴沟: 2020 peak extra trains 成寿寺→巴沟; confirm they still run.
- Beijing 14 丽泽商务区: only the 2021 through-running trial is described, not today's timetable.
- Fangshan 东管头南: small route end after the 2023 adjustment.
- Not checked for short runs: Tianjin 1 and 5 (single pattern now), Beijing 5 (ended 2010).

**Other**
- Beijing Xijiao line: after the 2018-01 derailment the page lists suspended sections; present service not confirmed.
- Yizhuang T1: 老观里 station not opened.
- Speeds from prose rather than the infobox: none in this region (all design speeds).
- Map: 9 stations are "under construction" but touch only solid lines: (-180,-250), (60,-640), (-180,-425), (-180,-375),
  (330,-320), (225,100), (1950,2350), (2125,2350), (2325,2350). One closed station (-550,0) touches both construction and solid lines.
- Not researched: the delta since 2026-07-31. Run `check-updates.py --refresh`, then the watchlist.
