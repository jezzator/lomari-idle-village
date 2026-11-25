"""Lomari: Idle Village — economie-data en simulatie van een speler (14 dagen)."""
import math, json, sys

RES = ['hout','bladeren','lianen','steen','voedsel','gereedschap','kristal','energie']
VAL = dict(hout=1, bladeren=1, lianen=2, steen=3, voedsel=1.5, gereedschap=8, kristal=25, energie=40)
BASE_CAP = dict(hout=1000, bladeren=1000, lianen=600, steen=600, voedsel=600, gereedschap=300, kristal=80, energie=150)
R = 1.17                       # kostengroei per extra exemplaar
FASE_AT = [10, 25, 50, 100]    # aantallen waarop groeifase 2..5 beschikbaar komt
FASE_COSTMULT = [8, 40, 200, 1000]  # fase-upgrade = basisprijs x dit
FASE_EXTRA = [{}, {'steen': 1, 'gereedschap': .2}, {'steen': 1, 'gereedschap': .5}, {'gereedschap': 1, 'kristal': .05}]
PS = 0.3                       # productieschaal
UPKEEP = 0.012                 # voedsel/s per bewoner

# id: (naam, district, productie/s, verbruik/s, kosten, opslag, bewoners, werkers)
B = {
 'hakplek':  ('Houthakkersplek','Takelom',{'hout':.6},{},{'hout':10},{},0,1),
 'zaag':     ('Zaagplatform','Takelom',{'hout':5},{},{'hout':180,'lianen':20},{},0,1),
 'kroon':    ('Boomkroonbouw','Takelom',{'hout':40},{},{'hout':4000,'steen':300},{},0,2),
 'stamrek':  ('Stammenrek','Takelom',{},{},{'hout':60},{'hout':600},0,0),
 'pluk':     ('Bladplukkers','Lomavii',{'bladeren':.7},{},{'hout':15},{},0,1),
 'liaan':    ('Lianenkwekerij','Lomavii',{'lianen':.35},{},{'hout':40,'bladeren':15},{},0,1),
 'hangtuin': ('Hangtuin','Lomavii',{'bladeren':4,'lianen':2},{},{'hout':900,'lianen':250},{},0,2),
 'netrek':   ('Nettenrek','Lomavii',{},{},{'hout':50,'lianen':10},{'bladeren':600,'lianen':300},0,0),
 'nest':     ('Slaapnest','Moloro',{},{},{'hout':25,'bladeren':25},{},2,0),
 'familie':  ('Familiekamer','Moloro',{},{},{'hout':700,'bladeren':500,'steen':60},{},10,0),
 'bessen':   ('Bessentuin','Moloro',{'voedsel':.5},{},{'hout':20,'bladeren':10},{},0,1),
 'voorraad': ('Voorraadhol','Moloro',{},{},{'hout':60,'bladeren':30},{'voedsel':400},0,0),
 'groeve':   ('Steengroeve','Dorukha',{'steen':.4},{},{'hout':90},{},0,1),
 'tunnel':   ('Tunnelgang','Dorukha',{'steen':3.5},{},{'hout':1500,'steen':120},{},0,2),
 'kristgrot':('Kristalgrot','Dorukha',{'kristal':.05},{},{'hout':900,'steen':500},{},0,2),
 'kelder':   ('Steenkelder','Dorukha',{},{},{'hout':80,'steen':40},{'steen':400,'kristal':40},0,0),
 'werkbank': ('Werkbank','Frikto',{'gereedschap':.4},{'hout':1.2,'steen':.3},{'hout':400,'steen':80},{},0,1),
 'smidse':   ('Grote werkplaats','Frikto',{'gereedschap':3.5},{'hout':8,'steen':2.5},{'hout':6000,'steen':1200,'gereedschap':100},{},0,3),
 'gerkist':  ('Gereedschapsopslag','Frikto',{},{},{'hout':200,'steen':50},{'gereedschap':200},0,0),
 'zangplek': ('Zangplek','Voelari',{'energie':.02},{},{'bladeren':600,'lianen':250},{},0,1),
 'ontmoet':  ('Ontmoetingsboom','Voelari',{'energie':.15},{},{'hout':5000,'kristal':60,'lianen':800},{},0,3),
 'lichtkr':  ('Lichtkring','Voelari',{},{},{'bladeren':300,'kristal':5},{'energie':150},0,0),
 'brug':     ('Touwbrug','Rikilari',{},{},{'lianen':300,'hout':200},{},0,0),   # +4% productie per brug (globaal)
}
DISTRICT_OPEN = {'Takelom':{},'Lomavii':{},'Moloro':{},
  'Dorukha':{'hout':2500},'Rikilari':{'lianen':6000,'hout':8000},
  'Frikto':{'hout':40000,'steen':8000},'Voelari':{'bladeren':250000,'lianen':80000,'kristal':800}}
# magische upgrades: tier k -> x1.25 alle productie
def magic_cost(k): return {'kristal': 40*4**k, 'energie': 25*4**k}

class Game:
    def __init__(s, nova=0):
        s.r = {k:0.0 for k in RES}; s.r['hout']=30
        s.n = {k:0 for k in B}; s.fase = {k:1 for k in B}
        s.open = {'Takelom','Lomavii','Moloro'}; s.magic = 0; s.nova = nova
        s.earned = 0.0; s.band = 0.0; s.energy_total = 0.0
    def cap(s,k): return BASE_CAP[k] + sum(B[b][5].get(k,0)*(1.12**s.n[b]-1)/.12 for b in B)
    def beds(s): return 4 + sum(s.n[b]*B[b][6] for b in B)
    def jobs(s): return sum(s.n[b]*B[b][7] for b in B)
    def mult(s):
        return (1+.04*s.n['brug']) * 1.25**s.magic * (1+.03*s.nova) * (1+.004*s.band)
    def rates(s):
        staff = min(1.0, s.beds()/max(1,s.jobs()))
        food_ok = 1.0
        m = s.mult()*staff
        prod = {k:0.0 for k in RES}; use = {k:0.0 for k in RES}
        for b,(nm,d,p,c,*_) in B.items():
            f = s.n[b]*2**(s.fase[b]-1)
            for k,v in p.items(): prod[k]+=v*f*m*PS
            for k,v in c.items(): use[k]+=v*f*m*PS
        use['voedsel'] += UPKEEP*min(s.beds(), s.jobs()+4)
        return prod, use
    def cost(s,b):
        return {k:v*R**s.n[b] for k,v in B[b][4].items()}
    def fase_cost(s,b):
        i = s.fase[b]-1
        c = {k:v*FASE_COSTMULT[i] for k,v in B[b][4].items()}
        base = sum(VAL[k]*v for k,v in B[b][4].items())
        for k,f in FASE_EXTRA[i].items(): c[k]=c.get(k,0)+base*FASE_COSTMULT[i]*f/VAL[k]
        return c
    def can(s,c): return all(s.r[k]>=v for k,v in c.items())
    def fits(s,c): return all(s.cap(k)>=v for k,v in c.items())
    def pay(s,c):
        for k,v in c.items(): s.r[k]-=v
    def value_rate(s):
        p,u = s.rates(); return sum(VAL[k]*(p[k]-u[k]) for k in RES)
    def step(s, dt, eff=1.0):
        p,u = s.rates()
        starving = s.r['voedsel'] <= 0 and p['voedsel'] < u['voedsel']
        for k in RES:
            net = (p[k]-u[k])*eff*(0.5 if starving and k!='voedsel' else 1)
            if net>0:
                s.earned += VAL[k]*net*dt
                if k=='energie': s.energy_total += net*dt
            s.r[k] = max(0.0, min(s.cap(k), s.r[k]+net*dt))
        s.band += dt/3600 * 0.6 * len(s.open)/7   # grof: Band groeit met tijd en aantal open districten
    # kandidaten: (soort, id, kosten)
    def options(s):
        o=[]
        for b,(nm,d,*_) in B.items():
            if d in s.open:
                o.append(('bouw',b,s.cost(b)))
                if s.fase[b]<5 and s.n[b]>=FASE_AT[s.fase[b]-1] and B[b][2]:
                    o.append(('fase',b,s.fase_cost(b)))
        for d,c in DISTRICT_OPEN.items():
            if d not in s.open: o.append(('district',d,c))
        if 'Voelari' in s.open and s.magic<12: o.append(('magie',s.magic,magic_cost(s.magic)))
        return o
    def apply(s,o):
        t,x,c = o; s.pay(c)
        if t=='bouw': s.n[x]+=1
        elif t=='fase': s.fase[x]+=1
        elif t=='district': s.open.add(x)
        else: s.magic+=1
    def gain_of(s,o):
        before = s.value_rate();
        t,x,c=o; snap=(dict(s.n),dict(s.fase),set(s.open),s.magic)
        if t=='bouw': s.n[x]+=1
        elif t=='fase': s.fase[x]+=1
        elif t=='district': s.open.add(x)
        else: s.magic+=1
        g = s.value_rate()-before
        s.n,s.fase,s.open,s.magic = dict(snap[0]),dict(snap[1]),set(snap[2]),snap[3]
        if t=='district': g = max(g, before*0.15)      # nieuw district = nieuwe gebouwen; geef het voorrang
        if t=='bouw' and B[x][6]: g = max(g, 0)
        return g
    def decide(s):
        """Kies een aankoop. Geeft True terug als er iets gekocht is."""
        p,u = s.rates()
        # 1. werkplek zonder bewoner -> wonen
        if s.beds() < s.jobs()+1:
            for b in ('familie','nest'):
                c=s.cost(b)
                if B[b][1] in s.open and s.can(c) and s.fits(c): s.apply(('bouw',b,c)); return True
        # 2. voedseltekort -> bessentuin
        if p['voedsel'] < u['voedsel']*1.1:
            c=s.cost('bessen')
            if s.can(c): s.apply(('bouw','bessen',c)); return True
        # 3. beste keuze: wachttijd + terugverdientijd zo kort mogelijk
        net={k:p[k]-u[k] for k in RES}
        best=None; blocked=[]
        for o in s.options():
            cv = sum(VAL[k]*v for k,v in o[2].items())
            g = s.gain_of(o)
            if g<=0: continue
            wait=0.0
            for k,v in o[2].items():
                short=v-s.r[k]
                if short>0:
                    if net[k]<=1e-9: wait=float('inf'); break
                    wait=max(wait, short/net[k])
            if wait==float('inf'): continue
            if not s.fits(o[2]):
                blocked.append(o); continue
            score = wait + cv/g
            if best is None or score<best[0]: best=(score,o)
        for o in blocked:           # opslag te klein -> opslaggebouw, als dat betaalbaar is
            for k,v in o[2].items():
                if s.cap(k)<v:
                    for b in B:
                        if B[b][5].get(k) and B[b][1] in s.open and s.can(s.cost(b)):
                            s.apply(('bouw',b,s.cost(b))); return True
        if not best: return False
        o=best[1]
        if s.can(o[2]): s.apply(o); return True
        return False
    def nova_pending(s):
        if s.energy_total < 10000: return 0   # Hergroei pas na Veyra (10.000 energie)
        return int((s.earned/1e8)**(1/3)*3)

def simulate(days=14, sessions=((8,1.0),(12.5,.5),(17,.5),(21,1.0)), offline_eff=.5, offline_cap=8, log=True):
    """sessions: (uur van de dag, duur in uren) waarin de speler actief koopt."""
    g = Game(); t=0.0; events=[]; seen=set(); nova_total=0; resets=[]
    def mark(name):
        if name not in seen: seen.add(name); events.append((t/3600,name))
    for day in range(days):
        for (h,dur) in sessions:
            start = day*24+h
            gap = start*3600 - t
            if gap>0:                               # offline
                eff_gap = min(gap, offline_cap*3600)
                for _ in range(20): g.step(eff_gap/20, offline_eff)
                g.band += (gap-eff_gap)/3600*.6*len(g.open)/7
                t = start*3600
            end = t+dur*3600
            while t<end:
                for _ in range(20):
                    if not g.decide(): break
                g.step(10); t+=10
                for d in g.open: mark('district '+d)
                for b in B:
                    if g.fase[b]>=3: mark(f'fase 3: {B[b][0]}')
                if g.magic>=1: mark('eerste magische upgrade')
                tot=sum(g.n.values())
                for m in (10,100,500):
                    if tot>=m: mark(f'{m} gebouwen')
            # Hergroei-beslissing aan het eind van een sessie
            pend = g.nova_pending()
            if pend >= max(10, g.nova):
                resets.append((t/3600, pend, g.nova+pend));
                g2 = Game(nova=g.nova+pend); g2.band=g.band; g=g2
                seen = {e for e in seen if not e.startswith(('fase','district','eerste','10 ','100 ','500 '))} | {'district Takelom','district Lomavii','district Moloro'}
        events.append((t/3600, f'einde dag {day+1}: waarde/s {g.value_rate():,.0f}, gebouwen {sum(g.n.values())}, Nova {g.nova}, open {len(g.open)}'))
    return events, resets, g

if __name__=='__main__':
    ev, rs, g = simulate()
    for h,e in ev: print(f'{h:7.2f} u  {e}')
    print('Hergroei:', [(round(h,1),p,tot) for h,p,tot in rs])
    print('aantallen:', {B[b][0]:(g.n[b],g.fase[b]) for b in B if g.n[b]})
