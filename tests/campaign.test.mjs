import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const { GameState } = loadTS('src/gameState.ts');
const { getStage } = loadTS('src/data/stages.ts');
const { BattleEngine } = loadTS('src/combat.ts');
const storage = () => ({getItem: () => null, setItem: () => {}});
test('every combat region including Frostpeak can award victory once', () => {
  for (const id of ['ruins','eldertree','swamp','frostpeak','dunes','abyssal']) {
    const s = new GameState(storage()); s.beginBattle(id);
    assert.equal(s.claimVictory(id), true, id);
    assert.equal(s.claimVictory(id), false, `${id} duplicate reward`);
  }
});

test('a rested campaign team can complete all six authored encounters without turn deadlocks', () => {
  const state = new GameState(storage());
  for (const id of ['ruins','eldertree','swamp','frostpeak','dunes','abyssal']) {
    state.currentNodeId = 'ravenhold'; state.rest();
    const stage = getStage(id);
    const b = new BattleEngine([...state.party,...stage.enemies],stage.grid);
    for(let i=0;i<180 && b.status==='active';i++) {
      if(b.phase==='enemy') { for(const e of b.alive.filter(e=>!e.isPlayer)) b.enemyStep(e.id); b.finishEnemyPhase(); continue; }
      const u=b.active;
      const options=()=>b.alive.filter(t=>!t.isPlayer).flatMap(t=>[undefined,...u.skills.filter(s=>s.type==='damage')].filter(s=>!b.validate(u,t,s)).map(s=>({t,s,score:Math.min(t.hp,b.damage(u,t,s))+(b.damage(u,t,s)>=t.hp?100:0)}))).sort((a,c)=>c.score-a.score);
      let attacks=options();
      if(!attacks.length || b.telegraphs.some(w=>w.tiles.some(p=>p.x===u.gridX&&p.y===u.gridY))) {
        let best;
        for(let y=0;y<8;y++) for(let x=0;x<8;x++) {
          const path=b.path(u,x,y,b.moveRange(u)); if(!path?.length)continue;
          const danger=b.telegraphs.some(w=>w.tiles.some(p=>p.x===x&&p.y===y));
          const score=Math.min(...b.alive.filter(t=>!t.isPlayer).map(t=>Math.abs(x-t.gridX)+Math.abs(y-t.gridY)))+(danger?100:0)+path.length*.01;
          if(!best||score<best.score)best={x,y,score};
        }
        if(best)b.move(best.x,best.y);
        attacks=options();
      }
      if(attacks[0])b.act(attacks[0].t.id,attacks[0].s);
      b.endTurn();
    }
    assert.equal(b.status,'victory',`${id}: ${b.log.slice(-8).join('\n')}`);
    state.beginBattle(id);state.syncBattle(b.units);assert.equal(state.claimVictory(id),true);
  }
  assert.equal(state.clearedNodes.length,6);
});
