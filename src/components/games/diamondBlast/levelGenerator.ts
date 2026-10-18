import type { LevelConfig, LevelGoal, ObstacleType } from './types';
import { campaignLevel } from '../../../services/campaign';
import { GEM_COLORS } from './matchEngine';

/** Five difficulty stages of ten levels, with explicit and reachable obstacle goals. */
export const getLevelConfig=(levelNumber:number):LevelConfig=>{
  const {id,tier,stage,label}=campaignLevel(levelNumber);
  const maxMoves=36-tier*3-Math.floor((stage-1)/3);
  const targetScore=1200+tier*1000+stage*180;
  const starScores:[number,number,number]=[targetScore,Math.round(targetScore*1.4),Math.round(targetScore*1.9)];
  const obstacles:LevelConfig['obstacles']=[];
  const goals:LevelGoal[]=[{type:'score',target:targetScore,current:0,label:`Erreiche ${targetScore} Punkte`}];
  // Rotate placements between levels; keep the central and outer lanes connected.
  const positions:[[number,number],...[number,number][]]=[[2,2],[5,5],[2,5],[5,2],[1,1],[6,6],[1,6],[6,1],[3,3],[4,4],[3,4],[4,3],[0,3],[7,4],[0,4],[7,3],[3,0],[4,7],[4,0],[3,7]];
  const rotated=positions.map(([r,c])=>stage%2?[r,c]:[c,7-r]);
  let cursor=0;
  const add=(type:ObstacleType,count:number,goal:LevelGoal['type'],name:string)=>{
    for(let i=0;i<count;i++){const [r,c]=rotated[cursor++];obstacles.push({r,c,type,...(type==='rock'?{health:tier>=3?2:1}:{})});}
    goals.push({type:goal,target:count,current:0,label:`${name}: ${count}`});
  };
  if(tier>=1)add('ice',2+Math.floor(stage/2),'clear-ice','Eis entfernen');
  if(tier>=2)add('rock',2+Math.floor(stage/4),'destroy-rocks','Felsen zerstoeren');
  if(tier>=3)add('chain',2+Math.floor(stage/4),'unlock-chains','Ketten loesen');
  if(tier===0&&stage>=5||tier===4){
    const color=GEM_COLORS[(stage-1)%GEM_COLORS.length];
    const names={red:'Rubine',blue:'Saphire',green:'Smaragde',yellow:'Topasse',purple:'Amethyste',orange:'Bernsteine'};
    const target=tier===4?18+stage:8+stage;
    goals.push({type:'collect-color',target,current:0,color,label:`Sammle ${target} ${names[color]}`});
  }
  return {levelNumber:id,title:`${label} · Level ${stage}/10`,maxMoves,targetScore,starScores,obstacles,goals};
};
