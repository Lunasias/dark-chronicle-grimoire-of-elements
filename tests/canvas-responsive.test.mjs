import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
test('canvas backing dimensions follow its CSS box to avoid stretched mobile sprites', () => {
  const {CombatView} = loadTS('src/views/CombatView.ts');
  const view = Object.create(CombatView.prototype);
  view.canvas = {width:1100,height:640,clientWidth:378,clientHeight:290};
  view.engine = {grid:Array.from({length:8},()=>Array(8).fill(0))};
  view.layout();
  assert.equal(view.canvas.width,378);
  assert.equal(view.canvas.height,290);
});
