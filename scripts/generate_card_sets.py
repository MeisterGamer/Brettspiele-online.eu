"""Three deliberately different playable decks. PNG artwork is generated separately."""
from pathlib import Path
from html import escape
import json
ROOT=Path(__file__).resolve().parents[1]/'public/assets/atelier'
SUITS={
 'hearts':'M0 16C-35-6-16-34 0-17 16-34 35-6 0 16Z',
 'diamonds':'M0-25 18-3 0 20-18-3Z',
 'clubs':'M-5 3C-26 18-37-14-13-13-20-36 20-36 13-13 37-14 26 18 5 3L8 20H-8Z',
 'spades':'M0-28C-9-12-29-6-20 8-13 19-3 10 0 4L-5 20H5L0 4C3 10 13 19 20 8 29-6 9-12 0-28Z'}
def txt(value,x,y,size,color,extra=''):
 return f'<text x="{x}" y="{y}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="{size}" fill="{color}" {extra}>{escape(str(value))}</text>'
def save(path,body):
 p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" width="120" height="180">{body}</svg>\n',encoding='utf-8')
def pip(suit,x,y,scale=.39,flip=False):
 color='#be1f35' if suit in ('hearts','diamonds') else '#15171b'
 return f'<path data-pip="{suit}" d="{SUITS[suit]}" fill="{color}" transform="translate({x} {y}) rotate({180 if flip else 0}) scale({scale})"/>'
def romme():
 pairs=lambda ys:[(x,y) for y in ys for x in [39,81]]
 layouts={2:[(60,51),(60,129)],3:[(60,51),(60,90),(60,129)],4:pairs([51,129]),5:pairs([51,129])+[(60,90)],6:pairs([51,90,129]),7:pairs([51,90,129])+[(60,70)],8:pairs([51,90,129])+[(60,70),(60,110)],9:pairs([51,77,103,129])+[(60,90)],10:pairs([51,77,103,129])+[(60,64),(60,116)]}
 frame='<rect x="1" y="1" width="118" height="178" rx="8" fill="#fffefb" stroke="#c6c4bf" stroke-width="2"/>'
 for suit in SUITS:
  color='#be1f35' if suit in ('hearts','diamonds') else '#15171b'
  for rank in ['A',*range(2,11),'J','Q','K']:
   shown={'J':'B','Q':'D'}.get(rank,rank)
   corner=txt(shown,15,24,19,color)+pip(suit,15,37,.26)
   body=frame+corner+f'<g transform="rotate(180 60 90)">{corner}</g>'
   if rank=='A':body+=pip(suit,60,93,1.25)
   elif isinstance(rank,int):body+=''.join(pip(suit,x,y,flip=y>90) for x,y in layouts[rank])
   else:body+='<rect x="28" y="42" width="64" height="96" rx="2" fill="none" stroke="#bbb"/>'
   save(f'romme-v2/{suit}-{rank}.svg',body)
 save('romme-v2/joker.svg',frame+txt('J',15,24,19,'#6a2187')+txt('J',105,168,19,'#6a2187')+txt('JOKER',60,148,12,'#6a2187'))
def sequence():
 for value in [*range(1,13),'wild']:
  wild=value=='wild';color='#e25c15' if wild else '#1761c5' if value<=4 else '#168549' if value<=8 else '#c93435'
  body=f'<rect x="1" y="1" width="118" height="178" rx="11" fill="#fff" stroke="{color}" stroke-width="2"/><path d="M2 11Q2 2 11 2H109Q118 2 118 11V42H2Z" fill="{color}"/>'
  if wild:
   body+=txt('JOKER',60,28,18,'#fff')
   for i,c in enumerate(['#1761c5','#168549','#c93435']):body+=f'<rect x="{28+i*10}" y="{61-i*5}" width="45" height="60" rx="5" fill="{c}" stroke="#fff" stroke-width="2"/>'
   body+=txt('1–12',60,142,29,color)+txt('FREIE ZAHL',60,164,9,color)
  else:
   body+=txt(value,17,29,22,'#fff')+txt(value,60,116,66,color)+txt('ZAHLENSTAPEL',60,157,9,color)
   for i in range(12):body+=f'<circle cx="{16+i*8}" cy="168" r="2.5" fill="{color if i<value else "#d9e1e9"}"/>'
  save(f'sequence-v2/{value}.svg',body)
def family():
 colors={'red':'#de2546','blue':'#176ce3','green':'#078653','yellow':'#ffcc20'}
 marks={'red':'<circle cx="101" cy="20" r="6"/>','blue':'<rect x="95" y="14" width="12" height="12" rx="1"/>','green':'<path d="m101 13 7 13H94Z"/>','yellow':'<path d="m101 12 8 8-8 8-8-8Z"/>'}
 for name,color in colors.items():
  ink='#192031' if name=='yellow' else '#fff'
  for value in [*map(str,range(10)),'skip','reverse','+2']:
   body=f'<rect x="1" y="1" width="118" height="178" rx="14" fill="{color}" stroke="#fff" stroke-width="2"/><path d="M-5 139Q40 151 126 55M-5 151Q40 163 126 67" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="9"/><g fill="{ink}">{marks[name]}</g>'
   label={'skip':'STOP','reverse':'RICHTUNG','+2':'+2 KARTEN'}.get(value,'')
   corner={'skip':'⊘','reverse':'↔'}.get(value,value)
   body+=txt(corner,20,30,22,ink)+f'<g transform="rotate(180 60 90)">{txt(corner,20,30,22,ink)}</g>'
   if value=='skip':body+=f'<circle cx="60" cy="87" r="28" fill="none" stroke="{ink}" stroke-width="8"/><path d="m40 107 40-40" stroke="{ink}" stroke-width="8"/>'
   elif value=='reverse':body+=f'<path d="M28 74H91L78 59M92 102H29L42 117" fill="none" stroke="{ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
   else:body+=txt(value,60,115,66,ink)
   if label:body+=txt(label,60,143,10,ink)
   save(f'family-v2/{name}-{value.replace("+","plus")}.svg',body)
 for value in ['wild','+4']:
  body='<rect x="1" y="1" width="118" height="178" rx="14" fill="#13151b" stroke="#fff" stroke-width="2"/>'
  for i,c in enumerate(colors.values()):body+=f'<rect x="{21+i%2*40}" y="{48+i//2*40}" width="37" height="37" rx="7" fill="{c}"/>'
  if value=='+4':body+='<rect x="24" y="69" width="72" height="40" rx="7" fill="#fff"/>'+txt('+4',60,101,35,'#13151b')
  body+=txt('FARBWAHL' if value=='wild' else '+4 UND FARBWAHL',60,145,10,'#fff')+txt('FARBE' if value=='wild' else '+4',25,28,14,'#fff')
  save(f'family-v2/wild-{value.replace("+","plus")}.svg',body)
if __name__=='__main__':
 romme();sequence();family()
 files=sorted(str(p.relative_to(ROOT)).replace('\\','/') for p in ROOT.rglob('*') if p.suffix in ('.png','.svg'))
 (ROOT/'manifest.json').write_text(json.dumps({'collection':'FamPlay Atelier','version':2,'files':files},indent=2)+'\n',encoding='utf-8')
 print('Generated 120 game-specific card faces and indexed',len(files),'assets.')
