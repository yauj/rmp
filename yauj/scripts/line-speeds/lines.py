import re
CITY={'bj':['北京地铁{n}号线'],'tj':['天津地铁{n}号线','天津轨道交通{n}号线'],'sjz':['石家庄地铁{n}号线'],
'sh':['上海轨道交通{n}号线'],'nj':['南京地铁{n}号线'],'hz':['杭州地铁{n}号线'],'nb':['宁波轨道交通{n}号线'],
'hf':['合肥轨道交通{n}号线','合肥地铁{n}号线'],'sx':['绍兴轨道交通{n}号线','绍兴地铁{n}号线'],'sz':['苏州轨道交通{n}号线','苏州地铁{n}号线'],
'wx':['无锡地铁{n}号线'],'wh':['芜湖轨道交通{n}号线'],'cz':['常州地铁{n}号线'],'nt':['南通轨道交通{n}号线','南通地铁{n}号线']}
BYLABEL={'亦庄线':(['北京地铁亦庄线'],'metro'),'房山线':(['北京地铁房山线'],'metro'),'燕房线':(['北京地铁燕房线'],'metro'),
'昌平线':(['北京地铁昌平线'],'metro'),'首都机':(['北京首都机场线','北京地铁首都机场线','首都机场线'],'metro'),'大兴机场':(['北京大兴国际机场线','北京地铁大兴机场线'],'metro'),
'副中心线':(['北京城市副中心M101线'],'metro'),'S2线':(['北京市郊铁路S2线'],'regional'),'怀柔密云':(['北京市郊铁路怀柔—密云线'],'regional'),
'通密线':(['北京市郊铁路通密线'],'regional'),'津静线':(['天津轨道交通津静线','天津地铁津静线'],'metro'),
'宁波余姚':(['宁波至余姚城际铁路','宁波市域铁路','宁波轨道交通宁余线','余慈城际铁路','宁波余姚城际铁路'],'regional'),
'市域机场':(['上海轨道交通机场联络线','上海机场联络线'],'regional'),'杭海城际':(['杭海城际'],'regional'),
'浦江线':(['上海轨道交通浦江线'],'metro'),'磁浮线':(['上海磁浮示范运营线'],'regional'),'绍兴城际':(['绍兴轨道交通1号线'],'regional'),
'金山铁路':(['金山铁路'],'regional')}
def spec(cid,label):
    if label in BYLABEL: return BYLABEL[label]
    m=re.fullmatch(r'(sjz|[a-z]+?)(\d+)',cid)
    if cid=='bj26s1': return (['北京地铁S1线'],'metro')
    if cid=='z4': return (['天津轨道交通Z4线'],'metro')
    if re.fullmatch(r's\d',cid): return ([f'南京地铁S{cid[1]}号线'],'regional')
    if cid=='wx1' and label=='S1': return (['无锡地铁S1线'],'metro')
    if m and m.group(1) in CITY: return ([t.format(n=m.group(2)) for t in CITY[m.group(1)]],'metro')
    return (None,None)
