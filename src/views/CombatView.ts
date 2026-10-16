import type {Unit, Skill} from '../types';
import {BattleEngine, type Point} from '../combat';
import {drawFighter, type SpriteState} from '../combat-art';
import {sounds} from '../audio';

type Mode='move'|'attack'|'skill'|'idle';
type Motion={kind:SpriteState;start:number;duration:number;from?:Point;path?:Point[]};
type Float={x:number;y:number;text:string;color:string;start:number};
/** Canvas presentation; BattleEngine owns the timer-free deterministic rules. */
export class CombatView {
 private ctx:CanvasRenderingContext2D;
 private engine:BattleEngine;
 private actionMode:Mode='move';
 private selectedSkill:Skill|null=null;
 private hoveredTile:Point={x:-1,y:-1};
 private targetId:string|null=null;
 private timers=new Set<ReturnType<typeof setTimeout>>();
 private generation=0;
 private frame=0;
 private destroyed=false;
 private terminalHandled=false;
 private motions=new Map<string,Motion[]>();
 private floats:Float[]=[];
 private effects:{from:Point;to:Point;color:string;start:number;magic:boolean}[]=[];
 private originX=550;private originY=130;private tileW=96;private tileH=48;
 private listeners:{type:string;handler:EventListener}[]=[];
 constructor(private canvas:HTMLCanvasElement,initialUnits:Unit[],private onStateChange?:()=>void,private onVictory?:()=>void,private onDefeat?:()=>void){
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D rendering is unavailable.');this.ctx=ctx;
  this.engine=new BattleEngine(initialUnits);this.selectedSkill=this.getActiveUnit()?.skills[0]??null;
  this.canvas.style.touchAction='none';this.canvas.tabIndex=0;
  this.canvas.setAttribute?.('aria-label','Tactical battlefield. Tap blue tiles to move, choose Attack or a skill, then tap a target.');
  this.setupEvents();this.animate();if(this.engine.status!=='active')this.changed();
 }
 public getActiveUnit():Unit|null{return this.engine.active;}
 public getAllUnits():Unit[]{return this.engine.units;}
 public getTargetUnit():Unit|null{return this.engine.alive.find(u=>u.id===this.targetId)??this.unitAt(this.hoveredTile)??null;}
 public getTurnCount(){return this.engine.round;}
 public getIsEnemyTurn(){return this.engine.phase==='enemy'&&this.engine.status==='active';}
 public getSelectedSkill(){return this.selectedSkill;}
 public getActionMode(){return this.actionMode;}
 public getActionStatus(){return {...this.engine.action};}
 public getMessage(){return this.engine.message;}
 public getLog(){return this.engine.log.slice();}
 public getBattleStatus(){return this.engine.status;}
 public getPreview():string{
  if(this.engine.status!=='active')return this.engine.status==='victory'?'Victory — battle complete.':'Defeat — return to regroup.';
  if(this.getIsEnemyTurn())return this.engine.telegraphs.length?'Danger: evacuate the marked tiles before the next enemy phase.':'Enemy phase — planning a response…';
  const u=this.getActiveUnit();if(!u)return 'No living party members.';
  if(this.actionMode==='move'){
   if(this.engine.action.moved)return 'Movement used. Choose an action or end this unit turn.';
   const path=this.engine.path(u,this.hoveredTile.x,this.hoveredTile.y,this.engine.moveRange(u));
   return path?.length?`Move ${path.length}/${this.engine.moveRange(u)} tiles • one move per unit turn`:'Tap a blue tile. Water, pillars and living units block paths.';
  }
  if(this.actionMode==='idle')return 'Choose Move, Basic Attack, a skill, or End Turn.';
  if(this.engine.action.acted)return 'Action used. You may still move if movement is unused.';
  const target=this.unitAt(this.hoveredTile)??this.getTargetUnit();
  return target?this.engine.preview(target.id,this.actionMode==='skill'?this.selectedSkill??undefined:undefined):'Tap a living target to preview damage, cost and affinity.';
 }
 public setMode(mode:Mode,skill?:Skill){
  if(this.destroyed)return;this.actionMode=mode;if(skill)this.selectedSkill=this.getActiveUnit()?.skills.find(s=>s.id===skill.id)??null;
  this.engine.message=mode==='move'?'Select a reachable blue tile.':mode==='attack'?'Basic attack: free, physical, adjacent enemy.':mode==='skill'?`${this.selectedSkill?.name??'Select a skill'}: ${this.selectedSkill?.range===0?'tap your own tile.':'tap a valid target.'}`:'Choose your next command.';
  this.sound('playClick');this.onStateChange?.();
 }
 /** Resumes a previously destroyed/retreated view with the retained terrain. */
 public resetBattle(newUnits:Unit[]){
  this.cancelTimers();this.engine=new BattleEngine(newUnits,this.engine.grid);this.actionMode='move';this.selectedSkill=this.getActiveUnit()?.skills[0]??null;this.targetId=null;this.hoveredTile={x:-1,y:-1};this.terminalHandled=false;this.motions.clear();this.effects=[];this.floats=[];
  if(this.destroyed){this.destroyed=false;this.setupEvents();this.animate();}this.changed();
 }
 /** Copies terrain; 0/3 walkable, 1 water, 2 pillar. resetBattle retains it. */
 public setMap(grid:number[][]){
  if(!grid.length||!grid[0].length||grid.some(row=>row.length!==grid[0].length||row.some(v=>![0,1,2,3].includes(v)))){this.engine.result(false,'Invalid battlefield terrain.');this.onStateChange?.();return;}
  if(grid.flat().filter(v=>v===0||v===3).length<this.engine.alive.length){this.engine.result(false,'Not enough legal spawn tiles.');this.onStateChange?.();return;}
  this.cancelTimers();this.engine.grid=grid.map(row=>row.slice());this.engine.placeUnits();this.engine.telegraphs=[];this.motions.clear();this.hoveredTile={x:-1,y:-1};this.onStateChange?.();if(!this.destroyed&&this.getIsEnemyTurn())this.scheduleEnemies();
 }
 public endTurn(){
  if(this.destroyed||this.getIsEnemyTurn()||this.engine.status!=='active')return;
  this.transition(()=>this.engine.endTurn());this.actionMode='move';this.selectedSkill=this.getActiveUnit()?.skills[0]??null;this.targetId=null;
  if(this.engine.status==='active')this.engine.message=this.getIsEnemyTurn()?'Enemy phase.':`${this.getActiveUnit()?.name??'Party'}: one move and one action available.`;
  this.sound('playClick');this.changed();if(this.getIsEnemyTurn())this.scheduleEnemies();
 }
 public destroy(){if(this.destroyed)return;this.destroyed=true;this.cancelTimers();cancelAnimationFrame(this.frame);for(const {type,handler} of this.listeners)this.canvas.removeEventListener(type,handler);this.listeners=[];this.motions.clear();this.effects=[];this.floats=[];}
 private sound(name:'playClick'|'playSlash'|'playMagic'|'playHeal'|'playFanfare'){try{sounds[name]();}catch{/* Audio is optional. */}}
 private now(){return performance.now();}
 private unitAt(p:Point){return this.engine.alive.find(u=>u.gridX===p.x&&u.gridY===p.y);}
 private cancelTimers(){this.generation++;for(const t of this.timers)clearTimeout(t);this.timers.clear();}
 private later(fn:()=>void,ms:number){const generation=this.generation;const id=setTimeout(()=>{this.timers.delete(id);if(!this.destroyed&&generation===this.generation)fn();},ms);this.timers.add(id);}
 private changed(){
  this.onStateChange?.();
  if(this.engine.status!=='active'&&!this.terminalHandled){this.terminalHandled=true;this.cancelTimers();const won=this.engine.status==='victory';if(won)this.sound('playFanfare');this.later(()=>{if(won)this.onVictory?.();else this.onDefeat?.();},650);}
 }
 private scheduleEnemies(){
  const ids=this.engine.alive.filter(u=>!u.isPlayer).map(u=>u.id);
  const step=(index:number)=>{if(!this.getIsEnemyTurn()||this.destroyed)return;if(index>=ids.length){this.transition(()=>this.engine.finishEnemyPhase());this.selectedSkill=this.getActiveUnit()?.skills[0]??null;this.actionMode='move';this.changed();return;}
   const caster=this.engine.units.find(u=>u.id===ids[index]);const before=this.engine.log.length;this.transition(()=>this.engine.enemyStep(ids[index]),caster?.id,'attack');if(this.engine.log.length>before)this.sound('playSlash');this.changed();if(this.getIsEnemyTurn())this.later(()=>step(index+1),700);
  };this.later(()=>step(0),500);
 }
 private setupEvents(){
  const listen=(type:string,handler:EventListener)=>{this.canvas.addEventListener(type,handler);this.listeners.push({type,handler});};
  const point=(e:PointerEvent)=>{this.layout();const r=this.canvas.getBoundingClientRect();return this.screenToGrid((e.clientX-r.left)*this.canvas.width/Math.max(1,r.width),(e.clientY-r.top)*this.canvas.height/Math.max(1,r.height));};
  listen('pointermove',((event:PointerEvent)=>{const p=point(event);if(p.x===this.hoveredTile.x&&p.y===this.hoveredTile.y)return;this.hoveredTile=p;this.onStateChange?.();}) as EventListener);
  listen('pointerleave',(()=>{this.hoveredTile={x:-1,y:-1};this.onStateChange?.();}) as EventListener);
  listen('pointerdown',((event:PointerEvent)=>{
   event.preventDefault();if(this.destroyed)return;this.hoveredTile=point(event);
   if(this.engine.status!=='active'||this.getIsEnemyTurn()){this.engine.message=this.engine.status==='active'?'Wait for the enemy phase to finish.':'Battle complete — no further actions.';this.onStateChange?.();return;}
   const target=this.unitAt(this.hoveredTile),caster=this.getActiveUnit();if(target)this.targetId=target.id;if(!caster)return;
   if(this.actionMode==='move'){
    const path=this.engine.path(caster,this.hoveredTile.x,this.hoveredTile.y,this.engine.moveRange(caster));let ok=false;
    this.transition(()=>{ok=this.engine.move(this.hoveredTile.x,this.hoveredTile.y).ok;},undefined,undefined,path??undefined);
    if(ok){this.actionMode='attack';this.sound('playClick');}
   }else if(this.actionMode==='attack'||this.actionMode==='skill'){
    const skill=this.actionMode==='skill'?this.selectedSkill??undefined:undefined;
    if(this.actionMode==='skill'&&!skill)this.engine.result(false,'Select a known skill first.');
    else {let ok=false;this.transition(()=>{ok=this.engine.act(target?.id??'',skill).ok;},caster.id,skill&&skill.element!=='physical'?'cast':'attack');if(ok)this.sound(skill?.type==='heal'||skill?.type==='buff'?'playHeal':skill&&skill.element!=='physical'?'playMagic':'playSlash');}
   }this.changed();
  }) as EventListener);
  // Parent owns document-level hotkeys; no duplicate keyboard turn listener.
 }
 private transition(fn:()=>void,casterId?:string,kind:SpriteState='attack',playerPath?:Point[]){
  const before=this.engine.units.map(u=>({id:u.id,hp:u.hp,x:u.gridX,y:u.gridY}));const start=this.now(),actionBefore=this.engine.lastAction;fn();
  const action=this.engine.lastAction!==actionBefore?this.engine.lastAction:null;
  if(action&&action.casterId===casterId)kind=action.skill&&action.skill.element!=='physical'?'cast':'attack';
  for(const old of before){const u=this.engine.units.find(u=>u.id===old.id)!;const queue:Motion[]=[];
   if(u.gridX!==old.x||u.gridY!==old.y)queue.push({kind:'move',start,duration:380,from:{x:old.x,y:old.y},path:playerPath??this.engine.lastPaths[u.id]??[{x:u.gridX,y:u.gridY}]});
   if(u.hp!==old.hp){queue.push({kind:u.isDead?'death':u.hp<old.hp?'hurt':'cast',start:start+(queue.length?380:0),duration:u.isDead?850:480});this.floats.push({x:u.gridX,y:u.gridY,text:`${u.hp>old.hp?'+':''}${u.hp-old.hp} HP`,color:u.hp>old.hp?'#6ee7b7':'#fca5a5',start});
    if(casterId&&u.id!==casterId){const caster=this.engine.units.find(v=>v.id===casterId);if(caster)this.effects.push({from:{x:caster.gridX,y:caster.gridY},to:{x:u.gridX,y:u.gridY},color:kind==='cast'?'#d8b4fe':'#fde68a',start,magic:kind==='cast'});}
   }
   if(u.id===casterId&&action?.casterId===casterId)queue.push({kind,start:start+(queue.length?380:0),duration:400});
   if(queue.length)this.motions.set(u.id,queue);
  }
 }
 private layout(){
  // Keep one logical canvas pixel per CSS pixel; stretching an 1100x640
  // backing buffer into a tall mobile box distorts the board and every sprite.
  if(this.canvas.clientWidth>0&&this.canvas.clientHeight>0){
   if(this.canvas.width!==this.canvas.clientWidth)this.canvas.width=this.canvas.clientWidth;
   if(this.canvas.height!==this.canvas.clientHeight)this.canvas.height=this.canvas.clientHeight;
  }
  const rows=this.engine.grid.length,cols=this.engine.grid[0]?.length??8;
  this.tileW=Math.max(12,Math.min(104,(this.canvas.width-40)*2/(cols+rows),(this.canvas.height-142)*4/(cols+rows)));this.tileH=this.tileW/2;
  this.originX=this.canvas.width/2-(cols-rows)*this.tileW/4;
  this.originY=(this.canvas.height-(cols+rows)*this.tileH/2)/2+this.tileH/2+15;
 }
 private gridToScreen(x:number,y:number){return {x:this.originX+(x-y)*this.tileW/2,y:this.originY+(x+y)*this.tileH/2};}
 private screenToGrid(x:number,y:number){const dx=(x-this.originX)/(this.tileW/2),dy=(y-this.originY)/(this.tileH/2);return {x:Math.round((dy+dx)/2),y:Math.round((dy-dx)/2)};}
 private diamond(x:number,y:number,fill:string,stroke='#6b7890',offset=0){const p=this.gridToScreen(x,y),c=this.ctx;c.beginPath();c.moveTo(p.x,p.y-this.tileH/2-offset);c.lineTo(p.x+this.tileW/2,p.y-offset);c.lineTo(p.x,p.y+this.tileH/2-offset);c.lineTo(p.x-this.tileW/2,p.y-offset);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
 private drawTile(x:number,y:number,time:number){
  const c=this.ctx,terrain=this.engine.grid[y][x],p=this.gridToScreen(x,y);
  this.diamond(x,y,terrain===1?'#153c58':'#152135','#202e43',-9);
  this.diamond(x,y,terrain===1?'#205676':terrain===2?'#697589':terrain===3?'#55457b':(x+y)%2?'#37465c':'#42526a',terrain===1?'#44748d':'#647089',terrain===2?24:0);
  if(terrain===1){c.strokeStyle='#67a8bf';c.globalAlpha=.45;c.beginPath();const wave=Math.sin(time/600+x+y)*3;c.moveTo(p.x-10,p.y+wave);c.lineTo(p.x+10,p.y+wave);c.stroke();c.globalAlpha=1;}
  if(terrain===2){c.fillStyle='#8590a0';c.fillRect(p.x-7,p.y-45,14,23);c.fillStyle='#adb4be';c.fillRect(p.x-11,p.y-49,22,6);}
  if(terrain===3){c.strokeStyle='#b7a4ee';c.beginPath();c.ellipse(p.x,p.y,17,8,0,0,Math.PI*2);c.stroke();}
  const active=this.getActiveUnit();if(this.engine.status==='active'&&this.engine.phase==='player'&&active){
   if(this.actionMode==='move'&&!this.engine.action.moved&&this.engine.path(active,x,y,this.engine.moveRange(active))?.length)this.diamond(x,y,'rgba(45,175,221,.25)','#5cb6dc');
   if((this.actionMode==='attack'||this.actionMode==='skill')&&!this.engine.action.acted){const u=this.unitAt({x,y});if(u&&!this.engine.validate(active,u,this.actionMode==='skill'?this.selectedSkill??undefined:undefined))this.diamond(x,y,'rgba(244,142,93,.35)','#fbbf7d');}
  }
  if(this.engine.telegraphs.some(w=>this.engine.alive.some(u=>u.id===w.casterId)&&w.tiles.some(v=>v.x===x&&v.y===y))){this.diamond(x,y,`rgba(239,68,68,${.28+Math.sin(time/160)*.12})`,'#ff6e80');c.fillStyle='#ffb7bd';c.font='bold 20px sans-serif';c.textAlign='center';c.fillText('!',p.x,p.y+5);}
  if(this.hoveredTile.x===x&&this.hoveredTile.y===y)this.diamond(x,y,'rgba(255,231,180,.13)','#ffe1a0');
 }
 private drawUnit(u:Unit,time:number){
  const queue=this.motions.get(u.id)??[];while(queue.length&&time>=queue[0].start+queue[0].duration)queue.shift();if(!queue.length)this.motions.delete(u.id);
  const motion=queue[0],state=motion?.kind??'idle',progress=motion?Math.max(0,Math.min(1,(time-motion.start)/motion.duration)):0;
  if(u.isDead&&state!=='death')return;let gx=u.gridX,gy=u.gridY;
  if(state==='move'&&motion?.from&&motion.path?.length){const points=[motion.from,...motion.path],step=progress*(points.length-1),index=Math.min(points.length-2,Math.floor(step)),t=step-index;gx=points[index].x+(points[index+1].x-points[index].x)*t;gy=points[index].y+(points[index+1].y-points[index].y)*t;}
  const p=this.gridToScreen(gx,gy),c=this.ctx,scale=Math.min(1.12,this.tileW/85);
  c.beginPath();c.ellipse(p.x,p.y,17*scale,7*scale,0,0,Math.PI*2);c.fillStyle='rgba(5,10,20,.55)';c.fill();
  if(u.id===this.getActiveUnit()?.id&&this.engine.phase==='player'&&this.engine.status==='active'){c.beginPath();c.ellipse(p.x,p.y,23*scale,11*scale,0,0,Math.PI*2);c.strokeStyle='#80dbef';c.lineWidth=2;c.stroke();}
  if(u.id===this.getTargetUnit()?.id){c.beginPath();c.ellipse(p.x,p.y,26*scale,13*scale,0,0,Math.PI*2);c.strokeStyle='#f4be77';c.lineWidth=1.5;c.stroke();}
  drawFighter(c,u,p.x,p.y,scale,time,state,progress,u.isPlayer?1:-1);
  if(!u.isDead){const width=38*scale,top=p.y-87*scale;c.fillStyle='#0b1322';c.fillRect(p.x-width/2-1,top-1,width+2,6);c.fillStyle=u.isPlayer?'#65d5b1':'#ee8391';c.fillRect(p.x-width/2,top,width*Math.max(0,u.hp/u.maxHp),4);c.font=`${Math.max(9,10*scale)}px sans-serif`;c.textAlign='center';c.fillStyle='#e1e5ed';c.fillText(u.name.split(' ')[0],p.x,top-5);
   const status=(this.engine.effects[u.id]??[]).map(e=>`${e.id.toUpperCase()} ${e.turns}`).join(' · ');if(status){c.fillStyle='#d2b3ef';c.font='9px sans-serif';c.fillText(status,p.x,p.y+17);}
  }
 }
 private animate=()=>{
  if(this.destroyed)return;this.layout();const c=this.ctx,time=this.now(),width=this.canvas.width,height=this.canvas.height;
  c.clearRect(0,0,width,height);c.fillStyle='#101a2b';c.fillRect(0,0,width,height);
  const gradient=c.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#1d2c40');gradient.addColorStop(1,'#111827');c.fillStyle=gradient;c.fillRect(0,0,width,height);
  for(let y=0;y<this.engine.grid.length;y++)for(let x=0;x<this.engine.grid[y].length;x++)this.drawTile(x,y,time);
  const u=this.getActiveUnit();if(u&&this.actionMode==='move'&&!this.engine.action.moved&&this.engine.phase==='player'){
   const path=this.engine.path(u,this.hoveredTile.x,this.hoveredTile.y,this.engine.moveRange(u));if(path?.length){c.beginPath();const p=this.gridToScreen(u.gridX,u.gridY);c.moveTo(p.x,p.y);for(const step of path){const p=this.gridToScreen(step.x,step.y);c.lineTo(p.x,p.y);}c.strokeStyle='#a8e4ef';c.lineWidth=3;c.stroke();}
  }
  // Environment pass then dedicated character pass: no pillar can cover a heroine.
  for(const unit of this.engine.units.slice().sort((a,b)=>a.gridX+a.gridY-b.gridX-b.gridY))this.drawUnit(unit,time);
  this.effects=this.effects.filter(e=>time-e.start<500);for(const effect of this.effects){const t=(time-effect.start)/500,from=this.gridToScreen(effect.from.x,effect.from.y),to=this.gridToScreen(effect.to.x,effect.to.y);c.save();c.globalAlpha=1-t;c.strokeStyle=effect.color;c.lineWidth=effect.magic?5:3;c.beginPath();if(effect.magic){c.moveTo(from.x,from.y-35);c.lineTo(from.x+(to.x-from.x)*Math.min(1,t*3),from.y-35+(to.y-from.y)*Math.min(1,t*3));}else c.arc(to.x,to.y-25,24,-Math.PI*.8+t,Math.PI*.2+t);c.stroke();for(let i=0;i<6;i++){const angle=i*Math.PI/3+t*4;c.fillStyle=effect.color;c.fillRect(to.x+Math.cos(angle)*t*38,to.y-25+Math.sin(angle)*t*30,3,3);}c.restore();}
  this.floats=this.floats.filter(f=>time-f.start<1100);for(const f of this.floats){const t=(time-f.start)/1100,p=this.gridToScreen(f.x,f.y);c.globalAlpha=1-t;c.fillStyle=f.color;c.font='bold 17px sans-serif';c.textAlign='center';c.fillText(f.text,p.x,p.y-65-t*32);}c.globalAlpha=1;
  // The parent DOM HUD owns status, previews and feedback (avoids overprinting its title).
  this.frame=requestAnimationFrame(this.animate);
 };
}

