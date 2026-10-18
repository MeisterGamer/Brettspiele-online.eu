"""Original FamPlay Atelier vector artwork. Run from any directory with Python 3."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'atelier'
FILES = []
INK, GOLD, PAPER = '#182c40', '#c89a52', '#fff7e5'
COLORS = {'red':'#bb354b','blue':'#246baf','green':'#167b65','yellow':'#b97b16','black':'#26364c'}

def save(name, body, w=120, h=180):
    target = ROOT / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>\n', encoding='utf-8')
    FILES.append(name)

def text(value, x, y, size, color=INK, extra=''):
    return f'<text x="{x}" y="{y}" font-family="Verdana,Arial,sans-serif" font-size="{size}" font-weight="700" fill="{color}" text-anchor="middle" {extra}>{escape(str(value))}</text>'

def emblem(x=60, y=90, scale=1, color=GOLD):
    return f'<g transform="translate({x} {y}) scale({scale})" fill="none" stroke="{color}" stroke-width="2"><path d="M0-22 22 0 0 22-22 0Z M0-13 13 0 0 13-13 0Z"/><path d="M-28 0h10 M18 0h10 M0-28v10 M0 18v10"/></g>'

SUITS = {
    'hearts':'M0 15C-36-6-16-35 0-17 16-35 36-6 0 15Z',
    'diamonds':'M0-27 19-4 0 20-19-4Z',
    'spades':'M0-28C-9-12-29-6-20 8-13 19-3 10 0 4L-5 20H5L0 4C3 10 13 19 20 8 29-6 9-12 0-28Z',
    'clubs':'M-5 3C-26 18-37-14-13-13-20-36 20-36 13-13 37-14 26 18 5 3L8 20H-8Z',
}
def suit(name,x,y,scale=1):
    color=COLORS['red'] if name in ('hearts','diamonds') else INK
    return f'<path d="{SUITS[name]}" transform="translate({x} {y}) scale({scale})" fill="{color}"/>'

def card_frame(color=PAPER):
    return f'<rect x="1" y="1" width="118" height="178" rx="12" fill="{color}" stroke="{GOLD}" stroke-width="2"/><rect x="6" y="6" width="108" height="168" rx="8" fill="none" stroke="{GOLD}" stroke-opacity=".35"/>'

def cards():
    for name in SUITS:
        for rank in ['A',*range(2,11),'J','Q','K']:
            color=COLORS['red'] if name in ('hearts','diamonds') else INK
            corners=text(rank,17,25,17,color)+suit(name,17,39,.26)
            body=card_frame()+corners+f'<g transform="rotate(180 60 90)">{corners}</g>'
            if isinstance(rank,int):
                # Each ordinary card has exactly its rank in pips.
                rows=(rank+1)//2
                for i in range(rank):
                    x=60 if rank%2 and i==rank-1 else [43,77][i%2]
                    y=55+(i//2)*(70/max(1,rows-1))
                    body+=suit(name,x,y,.36)
            elif rank=='A':
                body+=emblem(scale=1.8)+suit(name,60,95,1)
            else:
                # Character portraits are composited from the generated transparent PNG atlas.
                body+=f'<path d="M25 142H95" stroke="{GOLD}" stroke-opacity=".3"/>'
            save(f'cards/{name}-{rank}.svg',body)
    save('cards/joker.svg',card_frame()+text('J',17,25,17)+text('J',103,166,17)+text('JOKER',60,147,10))
    for name,color in [('classic',INK),('family','#1e5d66'),('sequence','#865324')]:
        body=card_frame(color)+f'<defs><pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse"><path d="m8 1 7 7-7 7-7-7Z" fill="none" stroke="{GOLD}" stroke-opacity=".3"/></pattern></defs><rect x="10" y="10" width="100" height="160" rx="6" fill="url(#weave)"/><path d="M60 44 96 90 60 136 24 90Z" fill="{color}" stroke="{GOLD}"/>'+emblem(scale=1.1)+text('FAMPLAY',60,155,9,PAPER)
        save(f'cards/back-{name}.svg',body)
    values=[*map(str,range(10)),'skip','reverse','+2']
    for name,color in list(COLORS.items())[:4]:
        for value in values:
            glyph=text(value,60,109,48,color)
            if value=='skip':glyph=f'<circle cx="60" cy="90" r="24" fill="none" stroke="{color}" stroke-width="7"/><path d="m43 107 34-34" stroke="{color}" stroke-width="7"/>'
            if value=='reverse':glyph=f'<path d="M37 78h47l-13-13M83 102H36l13 13" fill="none" stroke="{color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
            label={'skip':'STOP','reverse':'WECHSEL'}.get(value,value)
            body=card_frame(color)+f'<path d="M13 44 60 24 107 44v92L60 156 13 136Z" fill="{PAPER}"/><path d="M20 48 60 31 100 48" stroke="{GOLD}" fill="none"/>'+text(label,60,18,10,PAPER)+glyph+text({'red':'ROT','blue':'BLAU','green':'GRUEN','yellow':'GELB'}[name],60,165,9,PAPER)
            save(f'family/{name}-{value.replace("+","plus")}.svg',body)
    for value in ['wild','+4']:
        body=card_frame(INK)
        for i,color in enumerate(list(COLORS.values())[:4]):
            x,y=32+(i%2)*28,61+(i//2)*28
            body+=f'<rect x="{x}" y="{y}" width="26" height="26" rx="6" fill="{color}" stroke="{PAPER}" stroke-width="1"/>'
        body+=text('+4' if value=='+4' else 'FARBE',60,140,24,PAPER)+text('FAMPLAY',60,25,11,GOLD)
        save(f'family/wild-{value.replace("+","plus")}.svg',body)
    for value in range(1,14):
        color=[COLORS['blue'],COLORS['green'],COLORS['red']][min(2,(value-1)//4)] if value<=12 else INK
        label=str(value) if value<=12 else 'WILD'
        body=card_frame()+f'<path d="M60 33 104 90 60 147 16 90Z" fill="{color}"/>'+text(label,60,104,46 if value<=12 else 22,PAPER)+text(str(value) if value<=12 else '*',19,26,15,color)+text(str(value) if value<=12 else '*',101,167,15,color)
        save(f'sequence/{value if value<=12 else "wild"}.svg',body)

def figures():
    paths={
      'p':'M35 76Q44 60 43 47A17 17 0 1 1 57 47Q56 60 65 76Z',
      'r':'M31 76 35 38 28 33V16H40V28H46V16H54V28H60V16H72V33L65 38 69 76Z',
      'n':'M29 76Q38 53 51 47L37 41 23 48 20 34 42 18 49 7 58 20Q82 30 72 76Z',
      'b':'M33 76Q45 55 40 45 24 34 50 10 76 34 60 45 55 55 67 76Z',
      'q':'M30 76 25 28 40 39 50 20 60 39 75 28 70 76Z',
      'k':'M33 76 35 43 30 36 38 26H45V19H37V12H45V4H55V12H63V19H55V26H62L70 36 65 43 67 76Z',
    }
    for side,light,dark in [('w','#fff5d9','#c5ab78'),('b','#46617b','#14273d')]:
        for piece,path in paths.items():
            body=f'<defs><linearGradient id="ivory" x2="1" y2=".3"><stop stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></linearGradient></defs><ellipse cx="50" cy="91" rx="35" ry="6" fill="#000" opacity=".2"/><g fill="url(#ivory)" stroke="{INK if side=="w" else GOLD}" stroke-width="2.5" stroke-linejoin="round"><path d="{path}"/><path d="M28 76H72L79 87H21Z"/><rect x="19" y="85" width="62" height="7" rx="3"/></g><path d="M37 71H63 M32 80H68" stroke="{GOLD}" stroke-width="2"/>'
            if piece=='b':body+='<path d="m51 24-9 14" stroke="#182c40" stroke-width="3"/>'
            if piece=='n':body+='<circle cx="47" cy="30" r="2.5" fill="#182c40"/>'
            save(f'pieces/chess-{side}-{piece}.svg',body,100,100)
    for name,color in COLORS.items():
        if name!='black':
            mark={'red':'<circle cx="50" cy="66" r="7"/>','blue':'<path d="M43 59h14v14H43Z"/>','green':'<path d="m50 57 9 17H41Z"/>','yellow':'<path d="m50 57 9 9-9 9-9-9Z"/>'}[name]
            body=f'<defs><linearGradient id="paint"><stop stop-color="{PAPER}"/><stop offset=".25" stop-color="{color}"/><stop offset="1" stop-color="{INK}"/></linearGradient></defs><ellipse cx="50" cy="91" rx="31" ry="6" opacity=".25"/><path d="M21 86Q35 69 39 43A19 19 0 1 1 61 43Q65 69 79 86Z" fill="url(#paint)" stroke="{INK}" stroke-width="2"/><ellipse cx="50" cy="85" rx="29" ry="7" fill="{color}" stroke="{GOLD}" stroke-width="2"/><g fill="{PAPER}">{mark}</g>'
            save(f'pieces/pawn-{name}.svg',body,100,100)
        if name in ('red','black'):
            for king in [False,True]:
                body=f'<ellipse cx="50" cy="59" rx="43" ry="34" fill="{INK}"/><ellipse cx="50" cy="49" rx="43" ry="34" fill="{color}" stroke="{GOLD}" stroke-width="2"/><ellipse cx="50" cy="47" rx="33" ry="24" fill="none" stroke="{PAPER}" stroke-opacity=".35" stroke-width="2"/>'
                body+=f'<path d="m32 50-4-16 15 7 7-16 7 16 15-7-4 16Z" fill="{GOLD}"/><path d="M34 55h32" stroke="{GOLD}" stroke-width="3"/>' if king else emblem(50,47,.55)
                save(f'pieces/checker-{name}{"-king" if king else ""}.svg',body,100,100)

def boards():
    palettes={'mahogany':('#654931','#281e1a'),'feltGreen':('#24675c','#102f35'),'hearthCozy':('#705340','#251e23'),'terraceGarden':('#385863','#172936'),'oceanRadar':('#16455e','#0b1c32'),'slateZen':('#344452','#141e2d')}
    for name,(light,dark) in palettes.items():
        body=f'<defs><radialGradient id="ambient"><stop stop-color="{light}"/><stop offset="1" stop-color="{dark}"/></radialGradient><pattern id="grain" width="90" height="24" patternUnits="userSpaceOnUse"><path d="M0 8Q45 17 90 8M0 20Q45 8 90 20" fill="none" stroke="{PAPER}" stroke-opacity=".035"/></pattern><pattern id="stitch" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 2h12M2 0v12" stroke="{PAPER}" stroke-opacity=".035"/></pattern></defs><rect width="1200" height="800" fill="url(#ambient)"/><rect width="1200" height="800" fill="url(#{"grain" if name in ("mahogany","hearthCozy") else "stitch"})"/>'
        body+=f'<rect x="22" y="22" width="1156" height="756" rx="32" stroke="{GOLD}" stroke-opacity=".3" fill="none"/><rect x="30" y="30" width="1140" height="740" rx="26" stroke="{GOLD}" stroke-opacity=".12" fill="none"/>'+emblem(600,400,3,color=GOLD)
        save(f'boards/{name}.svg',body,1200,800)
    for name in ['chess','checkers']:
        body=''
        for row in range(8):
            for col in range(8):
                fill=('#46646b' if name=='chess' else '#384758') if (row+col)%2 else PAPER
                body+=f'<rect x="{col*100}" y="{row*100}" width="100" height="100" fill="{fill}"/>'
                body+=f'<path d="M{col*100} {row*100+8}h100" stroke="{GOLD}" stroke-opacity=".12"/>'
        save(f'boards/{name}.svg',body,800,800)

if __name__=='__main__':
    cards(); figures(); boards()
    FILES.extend('images/'+name for name in ['card-back.png','card-characters.png','chess-pieces.png','game-table.png','game-tokens.png'] if (ROOT/'images'/name).exists())
    (ROOT/'manifest.json').write_text(json.dumps({'collection':'FamPlay Atelier','version':1,'files':FILES},indent=2)+'\n',encoding='utf-8')
    print(f'Indexed {len(FILES)} original asset files in {ROOT}')
