import { test, expect } from '@playwright/test';

test('wins a real encounter through pointer commands, grants loot once and reloads campaign', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(async () => {
    const combat = '/src/combat.ts', state = '/src/gameState.ts', stages = '/src/data/stages.ts';
    const { BattleEngine } = await import(combat);
    const { GameState } = await import(state);
    const { getStage } = await import(stages);
    const s = new GameState({getItem: () => null, setItem: () => {}});
    const stage = getStage('ruins');
    (window as any).testModel = new BattleEngine([...s.party, ...stage.enemies], stage.grid);
  });
  let won = false;
  for (let step = 0; step < 40; step++) {
    const plan = await page.evaluate(() => {
      const b = (window as any).testModel;
      const u = b.active;
      const commands: any[] = [];
      const options = () => b.alive.filter((t: any) => !t.isPlayer).flatMap((t: any) => [undefined, ...u.skills.filter((s: any) => s.type === 'damage')].filter(s => !b.validate(u,t,s)).map(s => ({t,s,score:Math.min(t.hp,b.damage(u,t,s)) + (b.damage(u,t,s) >= t.hp ? 100 : 0)}))).sort((a: any,c: any) => c.score-a.score);
      let attacks = options();
      if (!attacks.length) {
        let choice: any;
        for (let y=0;y<8;y++) for(let x=0;x<8;x++) {
          const path = b.path(u,x,y,b.moveRange(u)); if (!path?.length) continue;
          const score = Math.min(...b.alive.filter((t: any) => !t.isPlayer).map((t: any) => Math.abs(x-t.gridX)+Math.abs(y-t.gridY))) + path.length*.01;
          if (!choice || score < choice.score) choice = {x,y,score};
        }
        if(choice) { b.move(choice.x,choice.y); commands.push({kind:'move',x:choice.x,y:choice.y}); }
        attacks = options();
      }
      const attack = attacks[0];
      if(attack) { b.act(attack.t.id,attack.s); commands.push({kind:'act',skill:attack.s?.id,x:attack.t.gridX,y:attack.t.gridY}); }
      if(b.status==='active') { b.endTurn(); commands.push({kind:'end'}); }
      const enemyPhase = b.phase==='enemy' && b.status==='active';
      if(enemyPhase) { for(const e of b.alive.filter((e: any) => !e.isPlayer)) b.enemyStep(e.id); b.finishEnemyPhase(); }
      return {commands,enemyPhase,status:b.status,round:b.round,hero:b.active?.name};
    });
    for (const command of plan.commands) {
      if (command.kind === 'end') { await page.locator('#btn-end-turn').click(); continue; }
      if (command.kind === 'move') await page.locator('#btn-mode-move').click();
      else if (command.skill) await page.locator(`[data-skill-id="${command.skill}"]`).click();
      else await page.locator('#btn-mode-attack').click();
      const point = await page.locator('#combat-canvas').evaluate((canvas: HTMLCanvasElement, c) => {
        const w = Math.max(12, Math.min(104, (canvas.width-40)*2/16, (canvas.height-142)*4/16));
        const h = w/2, ox=canvas.width/2, oy=(canvas.height-16*h/2)/2+h/2+15;
        return {x:(ox+(c.x-c.y)*w/2)*canvas.clientWidth/canvas.width,y:(oy+(c.x+c.y)*h/2)*canvas.clientHeight/canvas.height};
      }, command);
      await page.locator('#combat-canvas').click({position:point});
      await expect(page.locator('#combat-action-status')).toContainText(command.kind==='move'?'Move used':'Action used');
    }
    if(plan.status==='victory') { won=true; break; }
    expect(plan.status).not.toBe('defeat');
    if(plan.enemyPhase) await expect(page.locator('#combat-turn-num')).toHaveText(`TURN ${plan.round}`, {timeout:8000});
    await expect(page.locator('#hero-name-text')).toHaveText(plan.hero);
  }
  expect(won).toBe(true);
  await expect(page.locator('#victory-modal')).toBeVisible();
  await expect(page.locator('#victory-reward')).toContainText('+350 Gold');
  await expect(page.locator('#header-gold')).toHaveText('1,600 G');
  await page.locator('#btn-claim-victory').click();
  await page.locator('#tab-inventory').click();
  await page.getByRole('button', {name:'Ancient Element Shard', exact:true}).click();
  await expect(page.locator('#inventory-container')).toContainText('Ancient Element Shard');
  await page.reload();
  await expect(page.locator('#header-gold')).toHaveText('1,600 G');
  await expect(page.locator('#view-worldmap')).toBeVisible();
  expect(errors).toEqual([]);
});

test('waiting loses a real battle and retry restores the pre-battle team', async ({page}) => {
  test.setTimeout(90000);
  await page.goto('/');
  for(let i=0;i<40;i++) {
    if(await page.locator('#defeat-modal').isVisible()) break;
    await expect.poll(async () => await page.locator('#defeat-modal').isVisible() || await page.locator('#btn-end-turn').isEnabled(), {timeout:8000}).toBe(true);
    if(await page.locator('#defeat-modal').isVisible()) break;
    await page.locator('#btn-end-turn').click();
  }
  await expect(page.locator('#defeat-modal')).toBeVisible({timeout:8000});
  await page.locator('#btn-retry').click();
  await expect(page.locator('#combat-turn-num')).toHaveText('TURN 1');
  await expect(page.locator('#hero-name-text')).toHaveText('Arza');
  await expect(page.locator('#hero-hp-text')).toHaveText('122 / 122');
  await expect(page.locator('#btn-end-turn')).toBeEnabled();
  await page.reload();
  await expect(page.locator('#view-worldmap')).toBeVisible();
  await expect(page.locator('#btn-rest')).toBeEnabled();
  await page.locator('#btn-rest').click();
  await page.locator('#tab-inventory').click();
  await expect(page.locator('#inventory-container')).toContainText('HP 122/122');
});
