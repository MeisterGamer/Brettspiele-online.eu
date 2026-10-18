import type {UserProgress} from './types';
export const DIAMOND_SAVE_KEY='diamond_blast_linear_50_v3';
const cleanRecords=(value:unknown)=>Object.fromEntries(Object.entries(value&&typeof value==='object'?value:{}).filter(([id,score])=>Number.isInteger(Number(id))&&Number(id)>=1&&Number(id)<=50&&typeof score==='number'&&Number.isFinite(score)&&score>0));
export function normalizeDiamondProgress(value:any):UserProgress {
  const levelStars=Object.fromEntries(Object.entries(cleanRecords(value?.levelStars)).map(([id,stars])=>[id,Math.min(3,Math.floor(stars))]));
  let unlockedLevel=1;while(unlockedLevel<50&&levelStars[unlockedLevel])unlockedLevel++;
  return {unlockedLevel,levelStars,levelScores:cleanRecords(value?.levelScores),classicHighScore:Math.max(0,Number(value?.classicHighScore)||0),timeHighScore:Math.max(0,Number(value?.timeHighScore)||0)};
}
export const diamondLevelUnlocked=(id:number,progress:UserProgress)=>Number.isInteger(id)&&id>=1&&id<=50&&id<=progress.unlockedLevel;
export function recordDiamondWin(progress:UserProgress,id:number,stars:number,score:number):UserProgress {
  if(!diamondLevelUnlocked(id,progress))return progress;
  return normalizeDiamondProgress({...progress,levelStars:{...progress.levelStars,[id]:Math.max(progress.levelStars[id]||0,stars)},levelScores:{...progress.levelScores,[id]:Math.max(progress.levelScores[id]||0,score)}});
}
