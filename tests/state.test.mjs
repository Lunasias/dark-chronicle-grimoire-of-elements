import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const create = (storage) => new (loadTS('src/gameState.ts').GameState)(storage);
const memory = () => { let data = null; return { getItem: () => data, setItem: (_, value) => { data = value; } }; };
test('versioned persistence roundtrips without equipment inflation and rejects corrupt schema', () => {
  const storage = memory(); const state = create(storage);
  state.gold = 781; state.party[0].hp = 23;
  assert.equal(state.save(), true);
  const loaded = create(storage);
  assert.equal(loaded.gold, 781); assert.equal(loaded.party[0].hp, 23); assert.equal(loaded.party[0].atk, 35);
  for (const invalid of ['{', '{"version":999}', '{"version":1,"party":[]}', '{"version":1,"gold":-1}']) {
    assert.equal(create({getItem: () => invalid, setItem() {}}).gold, 1250);
  }
  const broken = create({ getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } });
  assert.equal(broken.save(), false);
});
test('equipment toggles and transfers ownership without cumulative drift, including HP and SPD', () => {
  const state = create(); const arza = state.party[0], lyria = state.party[1];
  assert.equal(state.equip('weapon_sunblade', 'lyria'), true);
  assert.equal(arza.atk, 23); assert.equal(lyria.atk, 22); assert.equal(lyria.maxHp, 79);
  for (let i = 0; i < 20; i++) { state.equip('weapon_sunblade', 'lyria'); state.equip('weapon_sunblade', 'lyria'); }
  assert.equal(lyria.atk, 22); assert.equal(lyria.maxHp, 79);
  assert.equal(state.equip('acc_starlight', 'lyria'), true);
  assert.equal(arza.spd, 12); assert.equal(lyria.spd, 15);
  assert.equal(state.equip('potion_hp_1', 'arza'), false);
  assert.equal(state.equip('weapon_sunblade', 'missing'), false);
});
test('potions target selected hero and never consume ineffective or unsupported scrolls', () => {
  const state = create(); const hero = state.party[1];
  assert.equal(state.useItem('potion_hp_1', hero.id), false);
  hero.hp = 10; hero.mp = 0;
  assert.equal(state.useItem('potion_mp_1', hero.id), true);
  assert.equal(hero.mp, 30); assert.equal(hero.hp, 10);
  assert.equal(state.useItem('potion_hp_1', hero.id), true);
  assert.equal(hero.hp, 50);
  assert.equal(state.useItem('scroll_flame', hero.id), false);
  assert.ok(state.items.some(i => i.id === 'scroll_flame'));
  hero.hp = 0; hero.isDead = true;
  assert.equal(state.useItem('potion_hp_2', hero.id), false);
});
test('battle sync copies only current resources, clamps invalid values, and retains derived stats', () => {
  const state = create(); const hero = state.party[0];
  state.syncBattle([{...hero, hp: -3, mp: NaN, atk: 999, isDead: true}, {...state.party[1], hp: 30, mp: 7}]);
  assert.equal(hero.hp, 0); assert.equal(hero.mp, 0); assert.equal(hero.isDead, true); assert.equal(hero.atk, 35);
  assert.equal(state.party[1].hp, 30); assert.equal(state.party[1].mp, 7);
});
test('victory grants actual item, gold, XP and levels only once per begun battle', () => {
  const state = create(); const count = state.items.length;
  assert.equal(state.claimVictory('ruins'), false);
  state.beginBattle('ruins');
  assert.equal(state.claimVictory('eldertree'), false);
  assert.equal(state.claimVictory('ruins'), true);
  assert.equal(state.gold, 1600); assert.equal(state.items.length, count + 1);
  assert.ok(state.party.every(u => u.level === 6));
  const attack = state.party[0].atk;
  assert.equal(state.claimVictory('ruins'), false); assert.equal(state.gold, 1600);
  state.beginBattle('ruins'); assert.equal(state.claimVictory('ruins'), true);
  assert.ok(state.party.every(u => u.level === 7)); assert.ok(state.party[0].atk > attack);
  assert.equal(new Set(state.items.map(i => i.id)).size, state.items.length);
});
test('travel validates roads, progression and boss level without deadlocking first ruins', () => {
  const state = create();
  for (const id of ['ruins', 'eldertree', 'swamp', 'silverport']) assert.equal(state.canTravel(id).allowed, true, id);
  assert.equal(state.canTravel('missing').allowed, false);
  assert.equal(state.canTravel('frostpeak').allowed, false);
  assert.equal(state.travel('ruins'), true);
  assert.equal(state.canTravel('dunes').allowed, false);
  assert.equal(state.canTravel('abyssal').allowed, false);
  state.beginBattle('ruins'); state.claimVictory('ruins');
  assert.equal(state.canTravel('dunes').allowed, true);
  assert.equal(state.canTravel('abyssal').allowed, false);
  state.travel('ravenhold'); state.travel('eldertree'); state.beginBattle('eldertree'); state.claimVictory('eldertree');
  state.party.forEach(u => u.level = 6);
  assert.equal(state.canTravel('abyssal').allowed, false);
  state.party.forEach(u => u.level = 7);
  assert.equal(state.travel('abyssal'), true);
  assert.equal(state.canTravel('silverport').allowed, false);
});
test('rest revives party free in capital, charges 50 in towns, and rejects wilderness', () => {
  const state = create(); const hero = state.party[0]; hero.hp = 0; hero.mp = 0; hero.isDead = true;
  state.rest(); assert.equal(hero.hp, hero.maxHp); assert.equal(hero.mp, hero.maxMp); assert.equal(hero.isDead, false); assert.equal(state.gold, 1250);
  state.travel('ruins'); hero.hp = 1; state.rest(); assert.equal(hero.hp, 1);
  state.travel('ravenhold'); state.travel('silverport'); state.rest(); assert.equal(hero.hp, hero.maxHp); assert.equal(state.gold, 1200);
  hero.hp = 1; state.gold = 0; state.rest(); assert.equal(hero.hp, 1);
});
test('loaded saves reject invalid numeric resources and conflicting ownership without partial hydration', () => {
  const storage = memory(); const state = create(storage); state.save();
  const valid = JSON.parse(storage.getItem('ignored'));
  const mutations = [
    s => s.party[0].atk = -1,
    s => s.party[0].mp = null,
    s => s.party[0].baseStats.maxHp = -1,
    s => s.items[0].stats.hp = null,
    s => s.items[0].equippedBy = 'missing',
    s => s.items[0].equipped = 'yes',
    s => s.items.push({...s.items[0], id: 'duplicate-slot'}),
    s => s.party[1].id = s.party[0].id,
    s => s.unlockedNodes = [],
  ];
  for (const mutate of mutations) {
    const invalid = structuredClone(valid); invalid.gold = 99; mutate(invalid);
    assert.equal(create({getItem: () => JSON.stringify(invalid),setItem() {}}).gold, 1250);
  }
});
test('fresh state applies owned initial equipment and independent immutable bases', () => {
  const state = create();
  assert.equal(state.party[0].atk, 35);
  assert.equal(state.party[0].maxHp, 122);
  assert.equal(state.party[0].spd, 16);
  assert.equal(state.items[0].equippedBy, 'arza');
  assert.equal(state.party[1].atk, 10);
  assert.equal(create().party[0].atk, 35);
});
