import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { apiAuth } from './apiAuth';
const originalFetch=globalThis.fetch;
const originalWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
const originalStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
const items=new Map<string,string>();
Object.defineProperty(globalThis,'window',{value:{},configurable:true});
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(key:string)=>items.get(key)||null,setItem:(key:string,value:string)=>items.set(key,value),removeItem:(key:string)=>items.delete(key)},configurable:true});
after(()=>{
  globalThis.fetch=originalFetch;
  if(originalWindow)Object.defineProperty(globalThis,'window',originalWindow);else delete (globalThis as any).window;
  if(originalStorage)Object.defineProperty(globalThis,'localStorage',originalStorage);else delete (globalThis as any).localStorage;
});
test('temporary API errors retain a session; invalid credentials clear it',async ()=>{
  apiAuth.setToken('test-token');apiAuth.setCachedUser({id:'alice',name:'Alice'} as any);
  globalThis.fetch=async ()=>Response.json({error:'Temporary failure'},{status:503});
  assert.equal((await apiAuth.fetchCurrentUser())?.id,'alice');assert.equal(apiAuth.getToken(),'test-token');
  globalThis.fetch=async ()=>Response.json({error:'Expired'},{status:401});
  assert.equal(await apiAuth.fetchCurrentUser(),null);assert.equal(apiAuth.getToken(),null);
});
test('HTML returned by a static host reports the missing auth backend clearly',async ()=>{
  globalThis.fetch=async ()=>new Response('<html>App</html>',{headers:{'Content-Type':'text/html'}});
  const result=await apiAuth.register({username:'Alice',email:'alice@example.invalid',password:'test-password',familyRole:'Parent'});
  assert.equal(result.success,false);assert.match(result.error!,/Anmeldeserver/);
});
test('email verification never switches the current session to another account',async ()=>{
  apiAuth.setToken('alice-token');apiAuth.setCachedUser({id:'alice',name:'Alice'} as any);
  globalThis.fetch=async ()=>Response.json({success:true,user:{id:'bob',name:'Bob'}});
  assert.equal((await apiAuth.verifyEmail('mail-link')).success,true);
  assert.equal(apiAuth.getCachedUser()?.id,'alice');assert.equal(apiAuth.getToken(),'alice-token');
});
