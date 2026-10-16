import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
function unit(id,isPlayer,x,y,extra={}){return {id,name:id,title:'',gender:'female',level:1,hp:100,maxHp:100,mp:30,maxMp:30,atk:20,matk:40,def:5,spd:10,isPlayer,gridX:x,gridY:y,color:'#70a8fc',portraitKey:id,skills:[],...extra};}
function setup(units=[unit('arza',true,0,0),unit('sorceress',false,2,0)],extra={}){
 const events={},timers=new Map(),frames=new Map(),draws=[];let n=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:()=>({width:100})},{get:(t,k)=>k in t?t[k]:(...args)=>{draws.push([k,...args]);},set:(t,k,v)=>(t[k]=v,true)});
 const canvas={width:1100,height:640,style:{},getContext:()=>ctx,getBoundingClientRect:()=>({left:20,top:40,width:550,height:320}),addEventListener:(k,v)=>events[k]=v,removeEventListener:(k)=>delete events[k]};
 const globals={performance:{now:()=>1000},requestAnimationFrame:fn=>{frames.set(++n,fn);return n;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:fn=>{timers.set(++n,fn);return n;},clearTimeout:id=>timers.delete(id),window:{},...extra};
 const {CombatView}=loadTS('src/views/CombatView.ts',globals);const view=new CombatView(canvas,units,undefined,extra.onVictory,extra.onDefeat);
 return {view,events,timers,frames,draws,canvas,tap(x,y){const p=view.gridToScreen(x,y);events.pointerdown({clientX:20+p.x/2,clientY:40+p.y/2,preventDefault(){}});},flush(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}}};
}
test('canvas pointer taps resolve scaled tile centers without prior hover; APIs expose consumed move and feedback',()=>{
 const h=setup();h.tap(1,0);assert.equal(h.view.getAllUnits()[0].gridX,1);assert.equal(h.view.getActionStatus().moved,true);
 h.view.setMode('attack');h.tap(2,0);assert.equal(h.view.getActionStatus().acted,true);assert.equal(h.view.getAllUnits()[1].hp,85);
 assert.ok(h.view.getMessage());assert.ok(h.view.getLog().length);assert.equal(h.view.getBattleStatus(),'active');h.view.destroy();
});
test('reset and destroy cancel enemy timers and RAF, clear stale selection and detach listeners',()=>{
 const h=setup();h.view.endTurn();assert.ok(h.timers.size>0);h.view.resetBattle([unit('new',true,0,0),unit('e',false,3,0)]);assert.equal(h.timers.size,0);assert.equal(h.view.getTurnCount(),1);assert.equal(h.view.getTargetUnit(),null);assert.equal(h.view.getActionStatus().acted,false);
 h.view.endTurn();h.view.destroy();assert.equal(h.timers.size,0);assert.equal(h.frames.size,0);assert.equal(Object.keys(h.events).length,0);
});
test('board center conversions roundtrip all tiles and renderer draws humanoid geometry rather than emoji tokens',()=>{
 const h=setup();for(let y=0;y<8;y++)for(let x=0;x<8;x++){const p=h.view.gridToScreen(x,y);const g=h.view.screenToGrid(p.x,p.y);assert.equal(g.x,x);assert.equal(g.y,y);}
 assert.ok(h.draws.filter(d=>d[0]==='fillRect').length>15);assert.ok(!h.draws.some(d=>d[0]==='fillText'&&/[⚔️🏹🔮]/u.test(d[1])));h.view.destroy();
});
test('canvas leaves title, action status and instructions to the DOM HUD without duplicate overprinted text',()=>{
 const h=setup();assert.ok(!h.draws.some(d=>d[0]==='fillText'&&(/ROUND |Choose a tile to move|Tap a blue tile/.test(d[1]))));h.view.destroy();
});
test('destroy/reset resumes one render loop and events while preserving custom terrain',()=>{
 const h=setup();h.view.destroy();const map=Array.from({length:8},()=>Array(8).fill(0));map[0][0]=1;h.view.setMap(map);h.view.resetBattle([unit('arza',true,0,0),unit('e',false,2,0)]);assert.ok(h.frames.size);assert.ok(h.events.pointerdown);assert.notEqual(h.view.getAllUnits()[0].gridX+8*h.view.getAllUnits()[0].gridY,0);h.view.destroy();
});
test('AI animation follows legal BFS cells and casts ranged magic rather than slashing',()=>{
 const orb={id:'shadow_orb',name:'orb',nameTh:'',mpCost:3,range:2,type:'damage',power:10,element:'shadow',icon:'',description:''};
 const h=setup([unit('arza',true,2,0),unit('sorceress',false,0,2,{skills:[orb]})]);const map=Array.from({length:8},()=>Array(8).fill(0));map[1][1]=2;h.view.setMap(map);h.view.endTurn();h.flush();const motions=h.view.motions.get('sorceress');assert.ok(motions.some(m=>m.kind==='cast'));assert.ok(motions[0].path.every(p=>map[p.y][p.x]===0));assert.ok(h.view.effects[0].magic);h.view.destroy();
});
test('reset with an already defeated side schedules the matching terminal callback once',()=>{
 let wins=0;const h=setup(undefined,{onVictory:()=>wins++});h.view.resetBattle([unit('a',true,0,0),unit('e',false,1,0,{hp:0})]);h.flush();assert.equal(wins,1);assert.equal(h.view.getBattleStatus(),'victory');h.flush();assert.equal(wins,1);h.view.destroy();
});
test('view forwards defeat once and reset suppresses stale enemy callbacks',()=>{
 let defeats=0;const h=setup([unit('arza',true,0,0,{hp:1}),unit('e',false,1,0)],{onDefeat:()=>defeats++});h.view.endTurn();h.flush();h.flush();assert.equal(defeats,1);assert.equal(h.view.getBattleStatus(),'defeat');h.view.endTurn();h.flush();assert.equal(defeats,1);h.view.destroy();
});
