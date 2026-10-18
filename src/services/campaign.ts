export const CAMPAIGN_TIERS=['Sehr leicht','Leicht','Mittel','Schwer','Experte'] as const;
export const CAMPAIGN_LEVELS=50;
export function campaignLevel(value:number) {
  const id=Math.max(1,Math.min(50,Number.isFinite(value)?Math.floor(value):1));
  const tier=Math.floor((id-1)/10),stage=(id-1)%10+1;
  return {id,tier,stage,label:CAMPAIGN_TIERS[tier]};
}
export function levelUnlocked(id:number,stars:Record<number,number>) {
  return (id-1)%10===0||Boolean(stars[id]||stars[id-1]);
}
export function seededRandom(seed:number) {
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
