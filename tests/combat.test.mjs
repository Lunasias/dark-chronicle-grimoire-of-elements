import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const {BattleEngine}=loadTS('src/combat.ts');
const skill=(id,extra={})=>({id,name:id,nameTh:id,mpCost:3,range:3,type:'damage',power:10,element:'physical',icon:'',description:'',...extra});
const unit=(id,isPlayer,x,y,extra={})=>({id,name:id,title:'',gender:'female',level:1,hp:100,maxHp:100,mp:30,maxMp:30,atk:20,matk:40,def:5,spd:10,isPlayer,gridX:x,gridY:y,color:'#fff',portraitKey:id,skills:[],...extra});
const grid=()=>Array.from({length:5},()=>Array(5).fill(0));
test('legal spawns and BFS cannot cross water, pillars or living occupants',()=>{
 const map=grid(); map[0][1]=1; map[1][1]=2;
 const b=new BattleEngine([unit('a',true,0,0),unit('b',false,1,0)],map);
 assert.notEqual(b.units[1].gridX,1);
 assert.equal(b.path(b.units[0],2,0,2),null);
 assert.equal(b.path(b.units[0],-1,0,2),null);
 assert.equal(new Set(b.units.map(u=>`${u.gridX},${u.gridY}`)).size,2);
});
test('one move plus free basic attack per turn; invalid teams, dead targets and self skills never cost MP',()=>{
 const heal=skill('heal',{type:'heal'}),guard=skill('guard',{type:'buff',range:0});
 const b=new BattleEngine([unit('a',true,0,0,{skills:[heal,guard]}),unit('b',false,2,0),unit('c',true,0,1)],grid());
 const a=b.active;assert.equal(b.act('b',heal).ok,false);assert.equal(a.mp,30);
 assert.equal(b.act('c',guard).ok,false);assert.equal(a.mp,30);
 assert.equal(b.move(1,0).ok,true);assert.equal(b.move(1,1).ok,false);
 assert.equal(b.act('b').ok,true);assert.equal(a.mp,30);assert.equal(b.units[1].hp,85);
 assert.equal(b.act('b').ok,false);b.endTurn();assert.equal(b.active.id,'c');
 assert.equal(b.action.moved,false);assert.equal(b.action.acted,false);
 b.units[1].isDead=true;assert.equal(b.act('b').ok,false);
});
test('magic, elemental weakness/resistance, guaranteed snipe crit and lifesteal have deterministic previews',()=>{
 const magic=skill('starlight',{element:'holy'}),snipe=skill('snipe'),drain=skill('dark_slash');
 const b=new BattleEngine([unit('a',true,0,0,{hp:50,skills:[magic,snipe,drain]}),unit('b',false,1,0,{element:'shadow'})],grid());
 assert.equal(b.damage(b.active,b.units[1],magic),67);
 assert.equal(b.damage(b.active,b.units[1],snipe),37);
 assert.match(b.preview('b',magic),/67/);b.act('b',drain);assert.equal(b.active.hp,62);
 const c=new BattleEngine([unit('a',true,0,0,{skills:[magic]}),unit('b',false,1,0,{element:'holy'})],grid());assert.equal(c.damage(c.active,c.units[1],magic),33);
});
test('DEF and haste expire after two owner turns; poison ticks without healing dead targets',()=>{
 const guard=skill('guard',{type:'buff',range:0,power:8}),haste=skill('tailwind',{type:'buff',range:0,power:6}),poison=skill('poison_dart');
 const b=new BattleEngine([unit('a',true,0,0,{skills:[guard,haste]}),unit('b',false,1,0,{skills:[poison]})],grid());
 const a=b.active,e=b.units[1];b.act('a',guard);assert.equal(a.def,13);b.tick(a);assert.equal(a.def,13);b.tick(a);assert.equal(a.def,5);
 b.apply(a,a,haste);assert.equal(a.spd,16);assert.equal(b.moveRange(a),4);b.tick(a);b.tick(a);assert.equal(a.spd,10);
 b.apply(e,a,poison);const hp=a.hp;b.tick(a);assert.equal(a.hp,hp-6);b.tick(a);b.tick(a);const after=a.hp;b.tick(a);assert.equal(a.hp,after);
});
test('enemy ranged AI uses skills, avoids blocked tiles, and victory/defeat are terminal once',()=>{
 let wins=0,losses=0;
 const b=new BattleEngine([unit('a',true,0,0,{hp:10}),unit('mage',false,3,0,{skills:[skill('shadow_orb',{element:'shadow'})]})],grid(),{onVictory:()=>wins++,onDefeat:()=>losses++});
 b.endTurn();b.enemyStep('mage');assert.equal(b.status,'defeat');assert.equal(losses,1);b.enemyStep('mage');b.endTurn();assert.equal(losses,1);assert.equal(b.units[1].mp,27);
 const c=new BattleEngine([unit('a',true,0,0,{atk:200}),unit('e',false,1,0)],grid(),{onVictory:()=>wins++});c.act('e');assert.equal(c.status,'victory');c.act('e');assert.equal(wins,1);
});
test('boss telegraphs fixed AoE for a full player round and only hits living units still in warning tiles',()=>{
 const ruin=skill('abyssal_ruin',{power:20});
 const b=new BattleEngine([unit('a',true,0,0),unit('b',true,0,1),unit('boss',false,2,0,{skills:[ruin]})],grid());
 b.endTurn();b.endTurn();b.enemyStep('boss');assert.equal(b.telegraphs.length,1);assert.equal(b.units[0].hp,100);
 const cells=b.telegraphs[0].tiles;assert.ok(cells.some(p=>p.x===0&&p.y===0));b.finishEnemyPhase();assert.equal(b.phase,'player');
 b.move(2,1);b.endTurn();b.endTurn();b.enemyStep('boss');assert.equal(b.telegraphs.length,0);assert.equal(b.units[0].hp,100);assert.ok(b.units[1].hp<100);
});
test('AI follows a full BFS detour instead of oscillating against a wall',()=>{
 const map=Array.from({length:7},()=>Array(7).fill(0));for(let y=0;y<6;y++)map[y][1]=2;
 const b=new BattleEngine([unit('a',true,2,0),unit('e',false,0,0)],map);b.endTurn();b.enemyStep('e');assert.equal(b.units[1].gridY,3);assert.equal(b.units[1].gridX,0);
});
test('poison death of final unplayed hero advances to enemy phase without skipping survivors',()=>{
 const b=new BattleEngine([unit('a',true,0,0),unit('b',true,1,0,{hp:2}),unit('e',false,4,4)],grid());b.addEffect(b.units[1],'poison',6,3);b.endTurn();assert.equal(b.phase,'enemy');assert.equal(b.units[1].isDead,true);b.enemyStep('e');b.finishEnemyPhase();assert.equal(b.active.id,'a');
});
test('canonical skills cannot be forged by reusing an id and terminal outcome keeps temporary buffs out of persisted stats',()=>{
 const magic=skill('starlight',{element:'holy'}),guard=skill('guard',{type:'buff',range:0,power:8});
 const b=new BattleEngine([unit('a',true,0,0,{skills:[magic,guard]}),unit('e',false,1,0,{hp:500,maxHp:500})],grid());
 b.act('e',{...magic,power:9999,mpCost:0});assert.equal(b.units[1].hp,455);assert.equal(b.active.mp,27);
 const c=new BattleEngine([unit('a',true,0,0,{atk:200,skills:[guard]}),unit('e',false,1,0)],grid());c.apply(c.active,c.active,guard);c.act('e');assert.equal(c.active.def,5);assert.match(c.message,/Victory/);assert.ok(c.log.some(s=>/HP|damage/.test(s)));
});
test('lastAction and lastPaths expose real AI skill and legal movement for canvas effects',()=>{
 const map=grid();map[1][1]=2;
 const b=new BattleEngine([unit('a',true,2,0),unit('mage',false,0,2,{skills:[skill('shadow_orb',{range:2,element:'shadow'})]})],map);
 b.endTurn();b.enemyStep('mage');assert.equal(b.lastAction.skill.id,'shadow_orb');assert.equal(b.lastAction.casterId,'mage');assert.equal(b.lastAction.targets[0],'a');
 assert.ok(b.lastPaths.mage.length);assert.ok(b.lastPaths.mage.every(p=>b.walkable(p.x,p.y)));
});
test('battles initialized with a defeated side are immediately terminal and notify once',()=>{
 let wins=0,losses=0;const b=new BattleEngine([unit('a',true,0,0),unit('e',false,1,0,{hp:0})],grid(),{onVictory:()=>wins++});assert.equal(b.status,'victory');b.checkTerminal();assert.equal(wins,1);
 const c=new BattleEngine([unit('a',true,0,0,{isDead:true}),unit('e',false,1,0)],grid(),{onDefeat:()=>losses++});assert.equal(c.status,'defeat');c.checkTerminal();assert.equal(losses,1);
});
export {skill,unit,grid};
