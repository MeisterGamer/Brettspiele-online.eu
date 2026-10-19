import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { createServer as createTcpServer } from 'node:net';
import express from 'express';

const directory=mkdtempSync(path.join(tmpdir(),'famplay-platform-'));
process.env.FAMPLAY_DATA_DIR=directory;
process.env.FAMPLAY_PERSISTENCE='0';
const maria=process.env.FAMPLAY_TEST_MARIADB==='1';
if(maria) process.env.DB_NAME='famplay_test_'+Date.now();
const { authRouter }=await import('./routes/auth.js');
const { socialRouter }=await import('./routes/social.js');
const { multiplayerRouter }=await import('./routes/multiplayer.js');
const { configureEmail }=await import('./email.js');
const { updateUser, createPasswordResetToken, verifyTokenOrCode, initDatabase, getDatabasePool }=await import('./db.js');
if(maria) assert.equal(await initDatabase(),true,'MariaDB integration test requires an actual database');
const app=express();app.use(express.json());
app.use('/api/auth',authRouter);app.use('/api/users',authRouter);
app.use('/api/social',socialRouter);app.use('/api',multiplayerRouter);
app.use((error: any,_req: any,res: any,_next: any)=>res.status(500).json({error:error.message}));
const server=app.listen(0,'127.0.0.1');await once(server,'listening');
const url=`http://127.0.0.1:${(server.address() as any).port}`;
after(async ()=> {
  await new Promise<void>(resolve=>server.close(()=>resolve()));
  if(maria) {
    assert.match(process.env.DB_NAME!,/^famplay_test_\d+$/);
    await getDatabasePool()!.query('DROP DATABASE `'+process.env.DB_NAME+'`');
    await getDatabasePool()!.end();
  }
  assert.ok(directory.startsWith(path.join(tmpdir(),'famplay-platform-')));
  rmSync(directory,{recursive:true,force:true});
});
async function request(endpoint: string, method='GET', body?: unknown, token?: string) {
  const response=await fetch(url+endpoint,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,data:await response.json()};
}
const registration=(username: string)=>({username,email:username.toLowerCase()+'@example.invalid',password:'Test-Passwort-937!',familyRole:'Familien-Champion',clanName:'Testfamilie'});

test('full account lifecycle, durable friends and invitations, private rooms and errors through production routers',async ()=> {
  configureEmail({host:''});
  const first=await request('/api/auth/register','POST',registration('TestAlice'));
  const second=await request('/api/auth/register','POST',registration('TestBob'));
  assert.equal(first.status,201);assert.equal(second.status,201);
  const alice=first.data,bob=second.data;
  assert.equal((await request('/api/auth/me','GET',undefined,alice.token)).data.user.id,alice.user.id);
  assert.equal((await request('/api/auth/login','POST',{usernameOrEmail:'testalice',password:'wrong'})).status,401);
  assert.equal((await request('/api/auth/login','POST',{usernameOrEmail:'TESTALICE@EXAMPLE.INVALID',password:registration('TestAlice').password})).status,200);
  await updateUser(alice.user.id,{coins:0,gems:0});
  const profile=(await request('/api/auth/me','GET',undefined,alice.token)).data.user;
  assert.equal(profile.coins,0);assert.equal(profile.gems,0);
  const renamed=await request('/api/auth/profile','PATCH',{name:'AliceUpdated',clanName:'Neue Familie',familyRole:'Parent',themeId:'emerald',role:'admin',coins:99999},alice.token);
  assert.equal(renamed.status,200);assert.equal(renamed.data.user.name,'AliceUpdated');
  assert.equal(renamed.data.user.role,'user');assert.equal(renamed.data.user.coins,0);
  assert.equal((await request('/api/auth/me','GET',undefined,alice.token)).data.user.clanName,'Neue Familie');
  assert.equal((await request('/api/auth/profile','PATCH',{name:'TestAlice',clanName:'Testfamilie',familyRole:'Parent'},alice.token)).status,200);
  assert.equal((await request('/api/auth/register','POST',registration('TestAlice'))).status,409);
  const racing=await Promise.all([request('/api/auth/register','POST',registration('RaceUser')),request('/api/auth/register','POST',registration('RaceUser'))]);
  assert.deepEqual(racing.map(r=>r.status).sort(),[201,409]);
  for(const bad of [{...registration('BadName'),username:'x'.repeat(65)},{...registration('BadEmail'),email:'a@'}, {...registration('BadClan'),clanName:'x'.repeat(65)}, {...registration('BadRole'),familyRole:{admin:true}}]) {
    assert.equal((await request('/api/auth/register','POST',bad)).status,400);
  }
  assert.equal((await request('/api/social/friends')).status,401);
  assert.equal((await request('/api/auth/users','GET',undefined,alice.token)).status,403);
  assert.equal((await request('/api/auth/users/'+bob.user.id,'PATCH',{role:'admin'},alice.token)).status,403);
  assert.deepEqual((await request('/api/social/friends','GET',undefined,alice.token)).data.friends,[]);
  assert.equal((await request('/api/social/friends','POST',{target:'UnknownUser'},alice.token)).status,404);
  assert.equal((await request('/api/social/friends','POST',{target:'TestAlice'},alice.token)).status,400);
  const added=await request('/api/social/friends','POST',{target:'TestBob',nickname:'Bobby'},alice.token);
  assert.equal(added.status,201);assert.equal(added.data.friend.id,bob.user.id);assert.equal(added.data.friend.name,'Bobby');
  assert.equal((await request('/api/social/friends','POST',{target:bob.user.id},alice.token)).status,409);
  assert.equal((await request('/api/social/friends/'+bob.user.id,'PATCH',{isFavorite:true},alice.token)).data.friends[0].isFavorite,true);
  assert.deepEqual((await request('/api/social/friends','GET',undefined,bob.token)).data.friends,[], 'friend lists must be account-scoped');

  const code='FAM-ABCDEF123456';
  const created=await request('/api/multiplayer/message','POST',{type:'CREATE_ROOM',roomCode:code,config:{name:'Privater Testtisch',gameId:'chess',maxPlayers:4,isPrivate:true}},alice.token);
  assert.equal(created.status,200);
  assert.equal(created.data.messages.find((m: any)=>m.type==='ROOM_STATE_SYNC').room.participants[0].id,alice.user.id);
  assert.ok(!(await request('/api/rooms')).data.rooms.some((r: any)=>r.code===code));
  assert.equal((await request('/api/social/invitations','POST',{friendId:bob.user.id,roomCode:code},bob.token)).status,403);
  assert.equal((await request('/api/social/invitations','POST',{friendId:bob.user.id,roomCode:code},alice.token)).status,201);
  const invitation=(await request('/api/social/invitations','GET',undefined,bob.token)).data.invitations[0];
  assert.equal(invitation.roomCode,code);assert.equal(invitation.senderName,'TestAlice');
  const joined=await request('/api/multiplayer/message','POST',{type:'JOIN_ROOM',roomCode:'famabcdef123456'},bob.token);
  assert.equal(joined.status,200);assert.equal(joined.data.messages.find((m: any)=>m.type==='ROOM_STATE_SYNC').room.participants.length,2);
  const charlie=(await request('/api/auth/register','POST',registration('Charlie'))).data;
  assert.equal((await request('/api/multiplayer/events?roomCode='+code,'GET',undefined,charlie.token)).status,403);
  assert.equal((await request('/api/multiplayer/message','POST',{type:'JOIN_ROOM',roomCode:code},charlie.token)).status,409);
  assert.equal((await request('/api/multiplayer/message','POST',{type:'JOIN_ROOM',roomCode:'does-not-exist'},charlie.token)).status,409);
  assert.equal((await request('/api/multiplayer/message','POST',{type:'CREATE_ROOM',roomCode:'FAM-AAAAAAAABBBB',config:{name:'Bad game',gameId:'missing'}},charlie.token)).status,409);
  assert.equal((await request('/api/multiplayer/message','POST',{type:'SET_DIFFICULTY',roomCode:code,difficulty:'hard'},bob.token)).status,409);
  assert.equal((await request('/api/multiplayer/message','POST',{type:'SET_READY',roomCode:code,ready:true},bob.token)).status,200);
  assert.equal((await request('/api/multiplayer/message','POST',{type:'ROOM_CHAT',roomCode:code,text:'Hallo'},bob.token)).status,200);
  assert.ok((await request('/api/multiplayer/events?roomCode='+code,'GET',undefined,alice.token)).data.events.some((e: any)=>e.data.type==='ROOM_CHAT'));

  assert.equal((await request('/api/auth/verify-email','POST',{codeOrToken:alice.verificationCode},bob.token)).status,400);
  assert.equal((await request('/api/auth/verify-email','POST',{codeOrToken:alice.verificationCode},alice.token)).status,200);
  assert.equal((await request('/api/auth/me','GET',undefined,alice.token)).data.user.isVerified,true);
  assert.equal(await verifyTokenOrCode(alice.verificationCode,alice.user.id),null);
  const reset='test-reset-token-after-restart';
  await createPasswordResetToken(bob.user.id,reset,new Date(Date.now()+60000));
  const durable=execFileSync(process.execPath,['--import','tsx','--input-type=module','-e',
    `const db=await import('./server/db.ts');if(process.env.FAMPLAY_TEST_MARIADB==='1')await db.initDatabase();const social=await import('./server/socialStore.ts');console.log(JSON.stringify({reset:!!await db.verifyPasswordResetToken('${reset}'),verification:!!await db.verifyTokenOrCode('${bob.verificationCode}','${bob.user.id}'),friends:(await social.listFriendLinks('${alice.user.id}')).length,invites:(await social.listInvitations('${bob.user.id}')).length}));await db.getDatabasePool()?.end();`
  ],{env:process.env,encoding:'utf8'}).trim().split('\n').at(-1)!;
  assert.deepEqual(JSON.parse(durable),{reset:true,verification:true,friends:1,invites:1});
  assert.equal((await request('/api/auth/reset-password','POST',{token:reset,newPassword:'new-safe-password'})).status,200);
  assert.equal((await request('/api/auth/reset-password','POST',{token:reset,newPassword:'another-safe-password'})).status,400);
  assert.equal((await request('/api/auth/login','POST',{usernameOrEmail:'TestBob',password:'new-safe-password'})).status,200);
  assert.deepEqual((await request('/api/social/friends/'+bob.user.id,'DELETE',undefined,alice.token)).data.friends,[]);
  assert.equal((await request('/api/social/friends','GET',undefined,alice.token)).data.friends.length,0);
  await updateUser(charlie.user.id,{role:'admin'});
  assert.ok((await request('/api/auth/users','GET',undefined,charlie.token)).data.users.some((u: any)=>u.id===bob.user.id));
  assert.equal((await request('/api/auth/users/'+charlie.user.id,'PATCH',{role:'user'},charlie.token)).status,409);
  assert.equal((await request('/api/auth/users/'+bob.user.id,'PATCH',{isBanned:true,isVip:true,coinsDelta:500},charlie.token)).status,200);
  assert.equal((await request('/api/social/friends','GET',undefined,bob.token)).status,401);
  assert.equal((await request('/api/auth/login','POST',{usernameOrEmail:'TestBob',password:'new-safe-password'})).status,403);
  const unbanned=await request('/api/auth/users/'+bob.user.id,'PATCH',{isBanned:false},charlie.token);
  assert.equal(unbanned.status,200);assert.equal(unbanned.data.user.isVip,true);assert.equal(unbanned.data.user.coins,1000);
});

test('registration responds while SMTP never sends its greeting',async ()=> {
  const sockets=new Set<any>();
  const smtp=createTcpServer(socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  smtp.listen(0,'127.0.0.1');await once(smtp,'listening');
  configureEmail({host:'127.0.0.1',port:(smtp.address() as any).port,secure:false,user:'',pass:''});
  try {
    const started=Date.now();
    const response=await request('/api/auth/register','POST',registration('SlowSmtp'));
    assert.equal(response.status,201);assert.ok(Date.now()-started<2000,'registration must not wait for SMTP timeout');
    await new Promise(resolve=>setTimeout(resolve,50));
  } finally {
    configureEmail({host:''});
    for(const socket of sockets) socket.destroy();
    await new Promise<void>(resolve=>smtp.close(()=>resolve()));
  }
});
