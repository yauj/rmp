import json,re,urllib.parse,urllib.request,collections,sys
UA={'User-Agent':'jeremy-research/1.0'}
import time,os,urllib.error
CACHE=os.environ.get('YAUJ_WIKI_CACHE','yauj/cache/wiki-pages.json')
_c=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def fetch(title):
    if title in _c: return tuple(_c[title])
    u='https://zh.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&redirects=1&titles='+urllib.parse.quote(title)
    for _ in range(8):
        try:
            time.sleep(1.2)
            d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30))
            p=list(d['query']['pages'].values())[0]
            r=(None,None) if 'missing' in p else (p['title'],p['revisions'][0]['slots']['main']['*'])
            _c[title]=list(r); json.dump(_c,open(CACHE,'w'),ensure_ascii=False); return r
        except urllib.error.HTTPError as e:
            time.sleep(int(e.headers.get('retry-after') or 20)+2)
        except Exception as e: time.sleep(3)
    return None,None
DESIGN=re.compile(r'^\|\s*(speed|max_speed|speed_km/h|設計速度|设计速度|最高速度|最高设计速度)\s*=\s*(.*)$')
OPER=re.compile(r'^\|\s*(營運最高速度|运营最高速度)\s*=\s*(.*)$')
def nums(s):
    s=re.sub(r'<ref.*?(</ref>|/>)','',s); s=re.sub(r'\{\{[^}]*\}\}',lambda m:m.group(0) if 'convert' in m.group(0) else '',s)
    return [int(x) for x in re.findall(r'(?<![\d.])(\d{2,3})(?![\d])',s) if 40<=int(x)<=600]
def speed(text):
    des=[];op=[]
    for l in text.split('\n'):
        l=l.strip()
        m=DESIGN.match(l)
        if m: des+=nums(m.group(2))
        m=OPER.match(l)
        if m: op+=nums(m.group(2))
    if des: return max(des),'design',des
    if op: return max(op),'operating-only',op
    # fallback: prose
    m=re.findall(r'(?:最高(?:运行|運行)?(?:速度|时速|時速)|(?:设计|設計)(?:速度|时速|時速)|时速|時速)[^\d。\n]{0,12}(\d{2,3})\s*(?:公里|千米|km)',text)
    if m: return max(int(x) for x in m),'prose',[int(x) for x in m]
    return None,'none',[]
def lookup(cands):
    for t in cands:
        rt,txt=fetch(t)
        if txt:
            sp,src,al=speed(txt)
            if sp: return {'title':rt,'speed':sp,'src':src,'all':al}
            last={'title':rt,'speed':None,'src':'none','all':[]}
    return locals().get('last',{'title':None,'speed':None,'src':'nopage','all':[]})
if __name__=='__main__':
    pass
