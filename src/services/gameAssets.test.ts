import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cardBack,playingCardAsset,familyCardAsset,sequenceCardAsset,rommePortrait} from './gameAssets';
const bytes=(url:string)=>readFileSync(new URL('../../public'+url,import.meta.url));
const hash=(url:string)=>createHash('sha256').update(bytes(url)).digest('hex');
test('each game has its own actual PNG card back, with different image content',()=>{
  const paths=[cardBack('classic'),cardBack('sequence'),cardBack('family')];
  assert.equal(new Set(paths).size,3);
  assert.equal(new Set(paths.map(hash)).size,3);
  for(const path of paths){const data=bytes(path);assert.equal(data.subarray(1,4).toString(),'PNG');assert.ok(data.length<4*1024*1024);}
});
test('all 120 playable faces exist and are distinct; Romme cards have the correct pip counts',()=>{
  const paths:string[]=[];
  for(const suit of ['hearts','diamonds','clubs','spades'])for(const rank of ['A',2,3,4,5,6,7,8,9,10,'J','Q','K']){
    const path=playingCardAsset(suit,rank);paths.push(path);
    if(typeof rank==='number')assert.equal((bytes(path).toString().match(/data-pip=/g)||[]).length,rank+2);
  }
  paths.push(playingCardAsset('joker','JOKER'));
  for(let value=1;value<=12;value++)paths.push(sequenceCardAsset(value));
  paths.push(sequenceCardAsset('SKIP-BO'));
  for(const color of ['red','blue','green','yellow'])for(const value of [...Array.from({length:10},(_,i)=>String(i)),'skip','reverse','+2'])paths.push(familyCardAsset(color,value));
  paths.push(familyCardAsset('wild','wild'),familyCardAsset('wild','+4'));
  assert.equal(paths.length,120);assert.equal(new Set(paths.map(hash)).size,120);
});
test('all twelve Romme court cards use their own portrait cell',()=>{
  const cells=[];
  for(const suit of ['hearts','diamonds','clubs','spades'])for(const rank of ['K','Q','J']){
    const portrait=rommePortrait(suit,rank)!;assert.ok(bytes(portrait.src).length);
    cells.push(`${portrait.src}:${portrait.column}:${portrait.row}`);
  }
  assert.equal(new Set(cells).size,12);
  assert.equal(rommePortrait('hearts',7),undefined);
});
