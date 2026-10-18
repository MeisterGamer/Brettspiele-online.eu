import type {LevelConfig,LevelGoal,ObstacleType} from './types';
import {seededRandom} from '../../../services/campaign';
import {GEM_COLORS} from './matchEngine';
export const DIAMOND_LEVEL_LIMIT=50;
export const DIAMOND_CHAPTERS=['Kristallpfad','Froststollen','Basaltmine','Kettengewölbe','Prismenkern'];
const names=[
 'Erster Glanz','Funkenspur','Rubinquelle','Saphirbogen','Bernsteinfund','Smaragdlicht','Topasbrücke','Erster Frost','Eisfenster','Kristalltor',
 'Frostgarten','Blaue Adern','Eiskreuz','Gletscherpfad','Gefrorene Krone','Kältekammer','Froststern','Erster Fels','Steinbrücke','Tor zur Mine',
 'Basaltring','Verborgene Ader','Felsengasse','Zwillingsstollen','Tiefer Schacht','Stufenbruch','Steinerner Stern','Erste Kette','Schlosskammer','Basaltherz',
 'Verschlungene Wege','Kettenbogen','Frost und Eisen','Die Kreuzung','Versiegelte Ader','Doppelfund','Eiserne Treppe','Prismenfenster','Kammer der Farben','Das letzte Schloss',
 'Dunkler Kristall','Splitterlabyrinth','Glutkammer','Eisiger Abgrund','Drei Prüfungen','Prismenspirale','Sternenbruch','Herz der Tiefe','Die letzte Ader','Krone der Kristalle',
];
function layoutOrder(id:number) {
  const pattern=(id-1)%10,random=seededRandom(id*104729);
  const cells=Array.from({length:64},(_,i)=>({r:Math.floor(i/8),c:i%8,tie:random()}));
  const metric=({r,c}:{r:number;c:number})=>{const x=Math.abs(c-3.5),y=Math.abs(r-3.5);return [x+y,Math.max(x,y),Math.min(x,y),Math.abs(r-c),Math.abs(r+c-7),r%2+c%2,x,y,(r+c)%3,(r*3+c*5)%7][pattern];};
  return cells.sort((a,b)=>metric(a)-metric(b)||a.tie-b.tie);
}
/** One continuous campaign. Targets always rise; moves never rise at chapter boundaries. */
export function getLevelConfig(value:number):LevelConfig {
  const id=Math.max(1,Math.min(50,Number.isFinite(value)?Math.floor(value):1));
  const chapter=DIAMOND_CHAPTERS[Math.floor((id-1)/10)];
  const maxMoves=36-Math.floor((id-1)*.24),targetScore=2200+id*150+Math.floor((id-1)/10)*350;
  const goals:LevelGoal[]=[{type:'score',target:targetScore,current:0,label:`${targetScore} Punkte`}];
  const obstacles:LevelConfig['obstacles']=[],order=layoutOrder(id);let cursor=0;
  const add=(type:ObstacleType,count:number,goal:LevelGoal['type'],label:string)=>{for(let i=0;i<count;i++){const {r,c}=order[cursor++];obstacles.push({r,c,type,...(type==='rock'?{health:id>=30?2:1}:{})});}goals.push({type:goal,target:count,current:0,label:`${count} ${label}`});};
  if(id>=8)add('ice',2+Math.floor((id-8)/6),'clear-ice','Eisfelder schmelzen');
  if(id>=18)add('rock',2+Math.floor((id-18)/8),'destroy-rocks','Felsen sprengen');
  if(id>=28)add('chain',2+Math.floor((id-28)/7),'unlock-chains','Ketten lösen');
  const colors=GEM_COLORS.slice(0,id<=10?5:6);
  const labels={red:'Rubine',blue:'Saphire',green:'Smaragde',yellow:'Topasse',purple:'Amethyste',orange:'Bernsteine'};
  if(id>=5){const color=colors[(id-5)%colors.length],target=7+Math.floor(id*.26);goals.push({type:'collect-color',color,target,current:0,label:`${target} ${labels[color]} sammeln`});}
  if(id>=36){const first=goals.find(g=>g.type==='collect-color')!.color!,color=colors[(colors.indexOf(first)+3)%colors.length],target=6+Math.floor(id*.17);goals.push({type:'collect-color',color,target,current:0,label:`${target} ${labels[color]} sammeln`});}
  const briefing=id===50?'Das Finale: Verbinde Spezialsteine und räume alle Hindernisse ab.':id>=28?'Ketten durch Treffer öffnen; Explosionen helfen bei schwer erreichbaren Hindernissen.':id>=18?'Felsen durch benachbarte Treffer oder Spezialsteine beschädigen.':id>=8?'Eis durch Treffer auf dem Feld oder direkt daneben schmelzen.':'Drei gleiche Kristalle verbinden. Vier und fünf erzeugen Spezialsteine.';
  return {levelNumber:id,title:`${id}. ${names[id-1]}`,chapter,briefing,seed:id*65537+9173,colors,difficulty:id,maxMoves,targetScore,starScores:[targetScore,Math.round(targetScore*1.4),Math.round(targetScore*1.9)],obstacles,goals};
}
