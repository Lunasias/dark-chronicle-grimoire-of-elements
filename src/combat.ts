import type {Unit, Skill} from './types';

export type Point = {x:number; y:number};
export type BattleStatus = 'active'|'victory'|'defeat';
export type BattleEffect = {id:string; turns:number; amount:number};
export type Telegraph = {casterId:string; skill:Skill; tiles:Point[]};
export const DEFAULT_MAP = [
  [0,0,0,0,0,0,0,0], [0,0,2,0,0,0,0,0], [0,0,0,0,1,1,0,0],
  [0,2,0,0,1,1,0,0], [0,0,0,0,0,0,0,0], [0,0,0,2,0,3,2,0],
  [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
];

/** Deterministic rules: no DOM, timers, random rolls, or shared input mutation.
 * Owner-turn durations tick at the START of that unit's next turn.
 * A unit may move once (3 BFS steps; haste 4), act once, in either order.
 */
export class BattleEngine {
  units:Unit[];
  grid:number[][];
  phase:'player'|'enemy'='player';
  round=1;
  status:BattleStatus='active';
  activeIndex=0;
  action={moved:false, acted:false};
  message='Choose a tile to move, or an action.';
  log:string[]=[];
  effects:Record<string,BattleEffect[]>={};
  telegraphs:Telegraph[]=[];
  /** Paths used on the last operation, available for faithful animation. */
  lastPaths:Record<string,Point[]>={};
  lastAction:{casterId:string;skill?:Skill;targets:string[]}|null=null;
  private playerOrder:string[];
  private enemyDone=new Set<string>();

  constructor(units:Unit[],grid=DEFAULT_MAP,private callbacks:{onVictory?:()=>void;onDefeat?:()=>void}={}) {
    if(!grid.length||!grid[0].length||grid.some(r=>r.length!==grid[0].length))throw new Error('Battlefield must be a nonempty rectangle');
    this.units=JSON.parse(JSON.stringify(units));
    this.grid=grid.map(row=>row.slice());
    this.placeUnits();
    this.playerOrder=this.alive.filter(u=>u.isPlayer).map(u=>u.id);
    this.checkTerminal();
  }
  get alive(){return this.units.filter(u=>!u.isDead&&u.hp>0);}
  get active():Unit|null {
    return this.alive.find(u=>u.id===this.playerOrder[this.activeIndex])??null;
  }
  result(ok:boolean,message:string) {
    this.message=message;
    if(ok)this.log.push(`[R${this.round}] ${message}`);
    this.log=this.log.slice(-60);
    return {ok,message};
  }
  moveRange(u:Unit){return this.effects[u.id]?.some(e=>e.id==='haste')?4:3;}
  distance(a:Unit,b:Unit){return Math.abs(a.gridX-b.gridX)+Math.abs(a.gridY-b.gridY);}
  walkable(x:number,y:number){return Number.isInteger(x)&&Number.isInteger(y)&&(this.grid[y]?.[x]===0||this.grid[y]?.[x]===3);}
  occupied(x:number,y:number,except?:Unit){return this.alive.some(u=>u!==except&&u.gridX===x&&u.gridY===y);}

  placeUnits() {
    const used=new Set<string>();
    for(const u of this.units) {
      u.isDead=!!u.isDead||u.hp<=0;
      if(u.isDead)continue;
      const spots:Point[]=[];
      for(let y=0;y<this.grid.length;y++)for(let x=0;x<this.grid[y].length;x++) {
        if(this.walkable(x,y)&&!used.has(`${x},${y}`))spots.push({x,y});
      }
      spots.sort((a,b)=>(Math.abs(a.x-u.gridX)+Math.abs(a.y-u.gridY))-(Math.abs(b.x-u.gridX)+Math.abs(b.y-u.gridY)));
      const p=spots[0];
      if(!p)throw new Error('Not enough walkable spawn tiles');
      u.gridX=p.x;u.gridY=p.y;used.add(`${p.x},${p.y}`);
    }
  }
  /** BFS path excludes the origin, includes destination; living occupants block. */
  path(u:Unit,x:number,y:number,max=Infinity):Point[]|null {
    if(u.isDead||u.hp<=0||!this.walkable(x,y)||this.occupied(x,y,u))return null;
    const queue=[{x:u.gridX,y:u.gridY,path:[] as Point[]}];
    const seen=new Set([`${u.gridX},${u.gridY}`]);
    for(let i=0;i<queue.length;i++) {
      const p=queue[i];
      if(p.x===x&&p.y===y)return p.path;
      if(p.path.length>=max)continue;
      for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]) {
        const nx=p.x+dx,ny=p.y+dy,key=`${nx},${ny}`;
        if(seen.has(key)||!this.walkable(nx,ny)||this.occupied(nx,ny,u))continue;
        seen.add(key);queue.push({x:nx,y:ny,path:[...p.path,{x:nx,y:ny}]});
      }
    }
    return null;
  }
  move(x:number,y:number) {
    const u=this.active;
    if(this.status!=='active'||this.phase!=='player'||!u)return this.result(false,'It is not your turn.');
    if(this.action.moved)return this.result(false,'Movement already used.');
    const path=this.path(u,x,y,this.moveRange(u));
    if(!path?.length)return this.result(false,'No legal path to that tile.');
    this.lastAction=null;this.lastPaths={[u.id]:path};u.gridX=x;u.gridY=y;this.action.moved=true;
    return this.result(true,`${u.name} moved ${path.length} tiles.`);
  }
  private knownSkill(c:Unit,s?:Skill){return s?c.skills.find(known=>known.id===s.id):undefined;}
  validate(caster:Unit,target:Unit|undefined,skill?:Skill):string {
    if(caster.isDead||caster.hp<=0)return 'A defeated unit cannot act.';
    if(!target||target.isDead||target.hp<=0)return 'Choose a living target.';
    if(skill&&!this.knownSkill(caster,skill))return 'Skill is not known by this unit.';
    skill=this.knownSkill(caster,skill);
    const support=skill&&skill.type!=='damage';
    if(support?target.isPlayer!==caster.isPlayer:target.isPlayer===caster.isPlayer) {
      return support?'Choose an ally or yourself.':'Choose an enemy.';
    }
    if(skill?.range===0&&target!==caster)return 'This skill targets yourself only.';
    if(this.distance(caster,target)>(skill?.range??1))return 'Target is out of range.';
    if(skill&&caster.mp<skill.mpCost)return 'Not enough MP.';
    return '';
  }
  affinity(t:Unit):string {
    return (t as Unit & {element?:string}).element??(t.id.includes('sorceress')||t.id.includes('morgana')?'shadow':t.id==='arza'||t.id==='lyria'?'holy':t.id==='selenis'?'wind':'physical');
  }
  multiplier(element:string,t:Unit) {
    const affinity=this.affinity(t);
    if(element==='physical')return 1;
    if(element===affinity)return .75;
    const weakness:Record<string,string[]>={holy:['shadow'],shadow:['holy'],fire:['wind'],wind:['fire','ice'],ice:['fire']};
    return weakness[element]?.includes(affinity)?1.5:1;
  }
  damage(c:Unit,t:Unit,s?:Skill) {
    const raw=Math.max(1,(s&&s.element!=='physical'?c.matk:c.atk)+(s?.power??0)-t.def);
    return Math.max(1,Math.floor(raw*this.multiplier(s?.element??'physical',t)*(s?.id==='snipe'?1.5:1)));
  }
  preview(targetId:string,skill?:Skill) {
    const c=this.active,t=this.units.find(u=>u.id===targetId);
    if(!c)return 'No active unit.';
    const error=this.validate(c,t,skill);if(error)return error;
    const s=this.knownSkill(c,skill);
    if(s?.type==='heal')return `Restore up to ${s.power+Math.floor(c.matk*.8)} HP • ${s.mpCost} MP`;
    if(s?.type==='buff')return `${s.id==='tailwind'?'Haste +1 movement / SPD':'DEF'} +${s.power} • 2 owner turns • ${s.mpCost} MP`;
    const effect=s?.id==='poison_dart'?' • poison 6 HP ×3':s?.id==='dark_slash'?' • 50% lifesteal':s?.id==='snipe'?' • CRITICAL':'';
    return `${s?.name??'Basic attack'}: ${this.damage(c,t!,s)} damage${effect} • ×${this.multiplier(s?.element??'physical',t!)} • ${s?.mpCost??0} MP`;
  }
  /** Low-level effect application for simulations. UI callers should use act(). */
  apply(c:Unit,t:Unit,s?:Skill) {
    if(c.isDead||c.hp<=0||t.isDead||t.hp<=0)return;
    if(s)c.mp-=s.mpCost;
    if(s?.type==='heal')t.hp=Math.min(t.maxHp,t.hp+s.power+Math.floor(c.matk*.8));
    else if(s?.type==='buff')this.addEffect(t,s.id==='tailwind'?'haste':'def',s.power,2);
    else {
      const damage=Math.min(t.hp,this.damage(c,t,s));t.hp=Math.max(0,t.hp-damage);
      if(s?.id==='dark_slash')c.hp=Math.min(c.maxHp,c.hp+Math.floor(damage*.5));
      if(s?.id==='poison_dart'&&t.hp>0)this.addEffect(t,'poison',6,3);
    }
    t.isDead=t.hp<=0;
    if(t.isDead)this.telegraphs=this.telegraphs.filter(w=>w.casterId!==t.id);
  }
  act(targetId:string,skill?:Skill) {
    const c=this.active;
    if(this.status!=='active'||this.phase!=='player'||!c)return this.result(false,'It is not your turn.');
    if(this.action.acted)return this.result(false,'Action already used.');
    const t=this.units.find(u=>u.id===targetId),error=this.validate(c,t,skill);
    if(error)return this.result(false,error);
    const s=this.knownSkill(c,skill),hp=t!.hp;
    this.lastPaths={};this.lastAction={casterId:c.id,skill:s,targets:[t!.id]};this.apply(c,t!,s);this.action.acted=true;
    const text=s?.type==='buff'?`${s.id==='tailwind'?'Haste / SPD':'DEF'} +${s.power} (2 turns)`:s?.type==='heal'?`+${t!.hp-hp} HP`:`${hp-t!.hp} damage${t!.isDead?' — defeated':''}`;
    const result=this.result(true,`${c.name}: ${s?.name??'Basic attack'} → ${t!.name}: ${text}.`);
    this.checkTerminal();return result;
  }
  addEffect(u:Unit,id:string,amount:number,turns:number) {
    const list=this.effects[u.id]??=[];const old=list.find(e=>e.id===id);
    if(old){old.turns=turns;return;}
    list.push({id,amount,turns});
    if(id==='def')u.def+=amount;if(id==='haste')u.spd+=amount;
  }
  tick(u:Unit) {
    for(const e of this.effects[u.id]??[]) {
      if(e.id==='poison'&&!u.isDead) {
        u.hp=Math.max(0,u.hp-e.amount);u.isDead=u.hp<=0;
        this.result(true,`${u.name}: poison −${e.amount} HP${u.isDead?' — defeated':''}.`);
      }
      e.turns--;
      if(e.turns===0) {
        if(e.id==='def')u.def-=e.amount;if(e.id==='haste')u.spd-=e.amount;
        this.result(true,`${u.name}: ${e.id} expired.`);
      }
    }
    this.effects[u.id]=(this.effects[u.id]??[]).filter(e=>e.turns>0);
    if(u.isDead)this.telegraphs=this.telegraphs.filter(w=>w.casterId!==u.id);
  }
  endTurn() {
    if(this.phase!=='player'||this.status!=='active')return;
    this.activeIndex++;this.action={moved:false,acted:false};this.startPlayerTurn();
  }
  startPlayerTurn() {
    // Stable unit ids avoid index shifts when poison kills the next queued heroine.
    while(this.activeIndex<this.playerOrder.length) {
      const u=this.active;
      if(u)this.tick(u);
      this.checkTerminal();if(this.status!=='active')return;
      if(u&&!u.isDead)return;
      this.activeIndex++;
    }
    this.phase='enemy';this.activeIndex=0;
  }
  private routeToRange(c:Unit,t:Unit,range:number):Point[]|null {
    let best:Point[]|null=null;
    for(let y=0;y<this.grid.length;y++)for(let x=0;x<this.grid[y].length;x++) {
      if(Math.abs(x-t.gridX)+Math.abs(y-t.gridY)>range)continue;
      const path=this.path(c,x,y);
      if(path&&(!best||path.length<best.length))best=path;
    }
    return best;
  }
  enemyStep(id:string) {
    if(this.phase!=='enemy'||this.status!=='active'||this.enemyDone.has(id))return;
    this.enemyDone.add(id);this.lastPaths={};this.lastAction=null;
    const c=this.alive.find(u=>u.id===id&&!u.isPlayer);if(!c)return;
    this.tick(c);this.checkTerminal();if(c.isDead||this.status!=='active')return;
    const warning=this.telegraphs.find(w=>w.casterId===id);
    if(warning) {
      this.telegraphs=this.telegraphs.filter(w=>w!==warning);
      this.lastAction={casterId:id,skill:warning.skill,targets:[]};
      for(const t of this.alive.filter(u=>u.isPlayer&&warning.tiles.some(p=>p.x===u.gridX&&p.y===u.gridY))) {
        this.lastAction.targets.push(t.id);
        const hit=Math.min(t.hp,this.damage(c,t,warning.skill));t.hp=Math.max(0,t.hp-hit);t.isDead=t.hp<=0;
        this.result(true,`${c.name}: ${warning.skill.name} → ${t.name} −${hit} HP${t.isDead?' — defeated':''}.`);
      }
      this.checkTerminal();return;
    }
    const heroes=this.alive.filter(u=>u.isPlayer).sort((a,b)=>this.distance(c,a)-this.distance(c,b));
    let target=heroes[0];if(!target){this.checkTerminal();return;}
    const choices=c.skills.filter(s=>s.type==='damage'&&c.mp>=s.mpCost).sort((a,b)=>b.range-a.range);
    let s=choices.find(s=>!this.validate(c,target,s));
    if(!s&&this.distance(c,target)>1) {
      const routes=heroes.map(t=>({target:t,path:this.routeToRange(c,t,choices[0]?.range??1)})).filter(r=>r.path!==null).sort((a,b)=>a.path!.length-b.path!.length);
      const route=routes[0];
      if(route){target=route.target;const path=route.path!.slice(0,this.moveRange(c));if(path.length){const p=path[path.length-1];this.lastPaths[c.id]=path;c.gridX=p.x;c.gridY=p.y;this.result(true,`${c.name} advances ${path.length} tiles.`);}}
      s=choices.find(s=>!this.validate(c,target,s));
    }
    if(s?.id==='abyssal_ruin') {
      c.mp-=s.mpCost;const tiles:Point[]=[];
      for(let y=0;y<this.grid.length;y++)for(let x=0;x<this.grid[y].length;x++)if(Math.abs(x-target.gridX)+Math.abs(y-target.gridY)<=1)tiles.push({x,y});
      this.telegraphs.push({casterId:id,skill:s,tiles});
      this.lastAction={casterId:id,skill:s,targets:[]};
      this.result(true,`${c.name} channels ${s.name}: leave the red tiles before the next enemy phase!`);return;
    }
    if(!this.validate(c,target,s)) {
      const hp=target.hp;this.lastAction={casterId:id,skill:s,targets:[target.id]};this.apply(c,target,s);
      this.result(true,`${c.name}: ${s?.name??'Basic attack'} → ${target.name}: ${hp-target.hp} damage${target.isDead?' — defeated':''}.`);
    }
    this.checkTerminal();
  }
  finishEnemyPhase() {
    if(this.status!=='active'||this.phase!=='enemy')return;
    this.phase='player';this.round++;this.activeIndex=0;this.enemyDone.clear();
    this.playerOrder=this.alive.filter(u=>u.isPlayer).map(u=>u.id);
    this.action={moved:false,acted:false};
    for(const u of this.alive.filter(u=>u.isPlayer))u.mp=Math.min(u.maxMp,u.mp+4);
    this.startPlayerTurn();
  }
  /** Remove transient stat deltas before terminal callbacks/state persistence. */
  clearEffects() {
    for(const u of this.units)for(const e of this.effects[u.id]??[]) {
      if(e.id==='def')u.def-=e.amount;if(e.id==='haste')u.spd-=e.amount;
    }
    this.effects={};this.telegraphs=[];
  }
  checkTerminal() {
    if(this.status!=='active')return;
    const players=this.alive.some(u=>u.isPlayer),enemies=this.alive.some(u=>!u.isPlayer);
    if(players&&enemies)return;
    this.status=!players?'defeat':'victory';this.clearEffects();
    this.result(true,this.status==='victory'?'Victory — the field is yours.':'Defeat — your party has fallen.');
    if(this.status==='victory')this.callbacks.onVictory?.();else this.callbacks.onDefeat?.();
  }
}

