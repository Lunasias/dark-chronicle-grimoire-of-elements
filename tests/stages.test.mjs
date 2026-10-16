import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
const { WORLD_NODES } = loadTS('src/data/worldMap.ts');
test('world routes have existing reciprocal destinations', () => {
  for (const n of WORLD_NODES) for (const id of n.connectedTo) {
    const target = WORLD_NODES.find(x => x.id === id);
    assert.ok(target, `${n.id} -> ${id}`);
    assert.ok(target.connectedTo.includes(n.id), `${id} -> ${n.id}`);
  }
});
test('battle regions have distinct legal maps and spawns', () => {
  const { getStage } = loadTS('src/data/stages.ts');
  const maps = new Set();
  for (const id of ['ruins', 'eldertree', 'swamp', 'frostpeak', 'dunes', 'abyssal']) {
    const s = getStage(id);
    assert.equal(s.grid.length, 8);
    maps.add(JSON.stringify(s.grid));
    const cells = new Set();
    for (const u of s.enemies) {
      assert.ok([0, 3].includes(s.grid[u.gridY][u.gridX]));
      const key = `${u.gridX},${u.gridY}`;
      assert.ok(!cells.has(key)); cells.add(key);
    }
  }
  assert.equal(maps.size, 6);
});
test('regional enemies expose the element their encounter teaches', () => {
  const { getStage } = loadTS('src/data/stages.ts');
  for (const [id, element] of [['frostpeak','ice'], ['dunes','fire'], ['eldertree','wind'], ['swamp','shadow']]) {
    for (const u of getStage(id).enemies) assert.equal(u.element, element, `${id}: ${u.name}`);
  }
});
