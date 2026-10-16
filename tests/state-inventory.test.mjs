import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTS } from './load-ts.mjs';
function fixture() {
  const cache = new Map();
  const { GameState } = loadTS('src/gameState.ts', {}, cache);
  const { InventoryView } = loadTS('src/views/InventoryView.ts', {}, cache);
  loadTS('src/audio.ts', {}, cache).sounds.enabled = false;
  const state = new GameState(); state.gold = 42;
  const elements = new Map();
  const container = { innerHTML: '', querySelectorAll() { return []; }, querySelector(selector) {
    const el = { listeners: {}, value: '', addEventListener(event, callback) { this.listeners[event] = callback; } };
    elements.set(selector, el); return el;
  } };
  let changes = 0;
  const view = new InventoryView(container, state.party[0], state.items, () => changes++, state);
  return { state, view, container, elements, changes: () => changes };
}
test('inventory uses shared gold, selectable party and effective comparison stats', () => {
  const {state, container, elements, changes} = fixture();
  assert.match(container.innerHTML, /42 Gold/);
  assert.match(container.innerHTML, /inv-party-select/);
  assert.match(container.innerHTML, /Base 18 \+17/);
  assert.match(container.innerHTML, /After: 23/);
  const selector = elements.get('#inv-party-select'); selector.value = 'lyria'; selector.listeners.change();
  assert.match(container.innerHTML, /Lyria/);
  elements.get('#btn-toggle-equip').listeners.click();
  assert.equal(state.items[0].equippedBy, 'lyria'); assert.equal(changes(), 1);
});
test('unsupported scroll action is disabled with explicit non-consumption explanation', () => {
  const {state, view, container} = fixture();
  state.items.splice(0, state.items.length, state.items.find(i => i.id === 'scroll_flame'));
  view.render();
  assert.match(container.innerHTML, /id="btn-use-item"[^>]*disabled/);
  assert.match(container.innerHTML, /cannot be used.*inventory/i);
  assert.equal(state.items.length, 1);
});
