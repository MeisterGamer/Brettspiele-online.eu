export const yatzyCategories = ['ones','twos','threes','fours','fives','sixes','threeOfKind','fourOfKind','fullHouse','smallStraight','largeStraight','yatzy','chance'] as const;
export type YatzyCategory = typeof yatzyCategories[number];
export type Scorecard = Partial<Record<YatzyCategory, number>>;
export interface YatzyState {
  active: number;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  cards: Scorecard[];
  finished: boolean;
  revision: number;
}
export type YatzyAction = { type:'ROLL'; dice:number[] } | { type:'HOLD'; index:number } | { type:'SCORE'; category:YatzyCategory };
export function initialYatzy(players: number): YatzyState {
  return { active:0, dice:[1,2,3,4,5], held:Array(5).fill(false), rollsLeft:3, cards:Array.from({length:Math.min(4,Math.max(1,players))},()=>({})), finished:false, revision:0 };
}
export function yatzyScore(dice: readonly number[], category: YatzyCategory): number {
  const counts=Array(7).fill(0); dice.forEach(d=>counts[d]++);
  const sum=dice.reduce((a,b)=>a+b,0);
  const upper=yatzyCategories.indexOf(category);
  if (upper<6) return counts[upper+1]*(upper+1);
  if (category==='threeOfKind') return counts.some(n=>n>=3) ? sum : 0;
  if (category==='fourOfKind') return counts.some(n=>n>=4) ? sum : 0;
  if (category==='fullHouse') return counts.includes(3) && counts.includes(2) ? 25 : 0;
  if (category==='smallStraight') return [1,2,3].some(start=>[0,1,2,3].every(n=>counts[start+n])) ? 30 : 0;
  if (category==='largeStraight') return [1,2].some(start=>[0,1,2,3,4].every(n=>counts[start+n])) ? 40 : 0;
  if (category==='yatzy') return counts.includes(5) ? 50 : 0;
  return sum;
}
export function yatzyTotal(card: Scorecard): number {
  const upper=yatzyCategories.slice(0,6).reduce((sum,k)=>sum+(card[k]||0),0);
  return Object.values(card).reduce((a,b)=>a+b,0)+(upper>=63 ? 35 : 0);
}
export function reduceYatzy(state: YatzyState, action: YatzyAction): YatzyState {
  if (state.finished) return state;
  if (action.type==='ROLL') {
    if (!state.rollsLeft || !Array.isArray(action.dice) || action.dice.length!==5 || action.dice.some(d=>!Number.isInteger(d)||d<1||d>6)) return state;
    return {...state, dice:state.dice.map((d,i)=>state.held[i] ? d : action.dice[i]), rollsLeft:state.rollsLeft-1, revision:state.revision+1};
  }
  if (action.type==='HOLD') {
    if (state.rollsLeft===3 || !Number.isInteger(action.index) || action.index<0 || action.index>4) return state;
    return {...state,held:state.held.map((held,i)=>i===action.index ? !held : held),revision:state.revision+1};
  }
  if (action.type==='SCORE') {
    if (state.rollsLeft===3 || !yatzyCategories.includes(action.category) || state.cards[state.active][action.category]!==undefined) return state;
    const cards=state.cards.map((card,i)=>i===state.active ? {...card,[action.category]:yatzyScore(state.dice,action.category)} : card);
    const finished=cards.every(card=>Object.keys(card).length===13);
    let active=state.active;
    if (!finished) do { active=(active+1)%cards.length; } while (Object.keys(cards[active]).length===13);
    return {...state,cards,active,rollsLeft:3,held:Array(5).fill(false),finished,revision:state.revision+1};
  }
  return state;
}
export function chooseYatzyCategory(state: YatzyState): YatzyCategory {
  const open=yatzyCategories.filter(k=>state.cards[state.active][k]===undefined);
  return [...open].sort((a,b)=> {
    const utility=(category:YatzyCategory) => {
      const score=yatzyScore(state.dice,category);
      const upper=yatzyCategories.indexOf(category);
      return score+(upper<6 && score >= (upper+1)*3 ? 12 : 0) - (category==='chance' ? 5 : 0);
    };
    return utility(b)-utility(a);
  })[0];
}
export function chooseYatzyHolds(state: YatzyState): boolean[] {
  const counts=Array(7).fill(0); state.dice.forEach(d=>counts[d]++);
  const group=[6,5,4,3,2,1].sort((a,b)=>counts[b]-counts[a] || b-a)[0];
  const card=state.cards[state.active];
  if (counts[group]>=3 && (card.yatzy===undefined || card.fourOfKind===undefined || card.threeOfKind===undefined || card[yatzyCategories[group-1]]===undefined)) return state.dice.map(d=>d===group);
  if (card.largeStraight===undefined || card.smallStraight===undefined) {
    const unique=[...new Set(state.dice)].sort((a,b)=>a-b);
    let best:number[]=[];
    for (const start of unique) {
      const run=[start]; while (unique.includes(run[run.length-1]+1)) run.push(run[run.length-1]+1);
      if (run.length>best.length) best=run;
    }
    if (best.length>=3) {
      const used=new Set<number>();
      return state.dice.map(d=> { if (!best.includes(d)||used.has(d)) return false; used.add(d); return true; });
    }
  }
  return state.dice.map(d=>d===group);
}
