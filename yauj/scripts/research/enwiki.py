"""Throttled English Wikipedia fetch with a cache (yauj/cache/raw/en-wiki-pages.json). Run one process at a time."""
import json, os, time, urllib.error, urllib.parse, urllib.request

CACHE = os.environ.get('YAUJ_EN_WIKI_CACHE', 'yauj/cache/raw/en-wiki-pages.json')
_c = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
UA = {'User-Agent': 'jeremy-research/1.0'}


def fetch(title):
    """(resolved title, wikitext) or (None, None) when the page does not exist."""
    if title in _c:
        return tuple(_c[title])
    u = ('https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json'
         '&redirects=1&titles=' + urllib.parse.quote(title))
    for _ in range(8):
        try:
            time.sleep(1.2)
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30))
            p = list(d['query']['pages'].values())[0]
            r = (None, None) if 'missing' in p else (p['title'], p['revisions'][0]['slots']['main']['*'])
            _c[title] = list(r)
            json.dump(_c, open(CACHE, 'w'), ensure_ascii=False)
            return r
        except urllib.error.HTTPError as e:
            time.sleep(int(e.headers.get('retry-after') or 20) + 2)
        except Exception:
            time.sleep(3)
    return None, None
