
import { STORY_CHAPTER_1, VICTORY_DIALOGUE } from './data/dialogues';
import { CombatView } from './views/CombatView';
import { WorldMapView } from './views/WorldMapView';
import { InventoryView } from './views/InventoryView';
import { DialogueView } from './views/DialogueView';
import { sounds } from './audio';
import { getPortraitSVG } from './portraits';
import { Unit } from './types';
import { GameState } from './gameState';
import { getStage } from './data/stages';
import { WORLD_NODES } from './data/worldMap';

// App State
const state = new GameState();
let battleNode = 'ruins';
let battleInProgress = false;
let beforeBattle: Unit[] = [];
let hotbarSignature = '';
let queueSignature = '';
let lastPortrait = '';
let toastTimer: ReturnType<typeof setTimeout>;
const el = (id: string) => document.getElementById(id)!;
function notify(message: string) {
  el('save-status').textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el('save-status').textContent = ''; }, 4500);
}

// Elements
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
const panes = document.querySelectorAll<HTMLElement>('.view-pane');
const audioToggleBtn = document.getElementById('btn-audio-toggle') as HTMLButtonElement;
const headerGold = document.getElementById('header-gold') as HTMLElement;

// Initialize Views
let combatView: CombatView;
let worldMapView: WorldMapView;
let inventoryView: InventoryView;
let dialogueView: DialogueView;

// Tab Switching
function switchView(viewId: string) {
  panes.forEach(p => p.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));

  const activePane = document.getElementById(viewId);
  const activeTab = document.querySelector(`[data-view="${viewId}"]`);

  if (activePane) activePane.classList.add('active');
  if (activeTab) activeTab.classList.add('active');
  if (viewId === 'view-inventory' && inventoryView) {
    inventoryView.render();
    const container = el('inventory-container');
    container.inert = battleInProgress;
    container.classList.toggle('inventory-locked', battleInProgress);
    if (battleInProgress) notify('Finish or retreat from battle before changing gear or using items.');
  }
  if (viewId === 'view-worldmap' && worldMapView) updateMapInspector();

  sounds.playClick();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-view');
    if (target) switchView(target);
  });
});

// Sound Toggle
audioToggleBtn?.addEventListener('click', () => {
  sounds.enabled = !sounds.enabled;
  audioToggleBtn.innerText = sounds.enabled ? '🔊 Sound ON' : '🔇 Sound OFF';
});

// Update Header
function updateHeader() {
  if (headerGold) headerGold.innerText = `${state.gold.toLocaleString()} G`;
}

// ----------------------------------------------------
// Combat UI Synchronization
// ----------------------------------------------------
function updateCombatHUD() {
  const active = combatView.getActiveUnit();
  const target = combatView.getTargetUnit();
  const turnNum = combatView.getTurnCount();
  const isEnemy = combatView.getIsEnemyTurn();
  const mode = combatView.getActionMode();
  const selSkill = combatView.getSelectedSkill();
  const action = combatView.getActionStatus();
  const locked = isEnemy || !battleInProgress || !active;
  el('combat-action-status').textContent = `Move ${action.moved ? 'used' : 'ready'} · Action ${action.acted ? 'used' : 'ready'}`;
  el('combat-message').textContent = combatView.getMessage();
  el('combat-preview').textContent = combatView.getPreview();
  el('combat-log').replaceChildren(...combatView.getLog().slice(-8).map(line => { const li = document.createElement('li'); li.textContent = line; return li; }));
  (el('btn-mode-move') as HTMLButtonElement).disabled = locked || action.moved;
  (el('btn-mode-attack') as HTMLButtonElement).disabled = locked || action.acted;
  (el('btn-mode-skill') as HTMLButtonElement).disabled = locked || action.acted;
  (el('btn-end-turn') as HTMLButtonElement).disabled = locked;
  (el('btn-abandon') as HTMLButtonElement).disabled = !battleInProgress;

  // Top Bar Turn Status
  const turnNumEl = document.getElementById('combat-turn-num');
  const phaseTextEl = document.getElementById('combat-phase-text');
  if (turnNumEl) turnNumEl.innerText = `TURN ${turnNum}`;
  if (phaseTextEl) {
    phaseTextEl.innerText = isEnemy ? 'ENEMY PHASE (AI THINKING)' : 'PLAYER PHASE';
    phaseTextEl.className = isEnemy ? 'turn-phase enemy' : 'turn-phase';
  }

  // Active Hero HUD
  if (active) {
    const portraitSlot = document.getElementById('hero-portrait-slot');
    const nameEl = document.getElementById('hero-name-text');
    const lvlEl = document.getElementById('hero-lvl-text');
    const hpBar = document.getElementById('hero-hp-bar');
    const hpText = document.getElementById('hero-hp-text');
    const mpBar = document.getElementById('hero-mp-bar');
    const mpText = document.getElementById('hero-mp-text');

    if (portraitSlot && lastPortrait !== active.portraitKey) { portraitSlot.innerHTML = getPortraitSVG(active.portraitKey); lastPortrait = active.portraitKey; }
    if (nameEl) nameEl.innerText = active.name;
    if (lvlEl) lvlEl.innerText = `Lv. ${active.level}`;
    if (hpBar) hpBar.style.width = `${Math.max(0, (active.hp / active.maxHp) * 100)}%`;
    if (hpText) hpText.innerText = `${active.hp} / ${active.maxHp}`;
    if (mpBar) mpBar.style.width = `${Math.max(0, (active.mp / active.maxMp) * 100)}%`;
    if (mpText) mpText.innerText = `${active.mp} / ${active.maxMp}`;

    // Render 4-slot skill hotbar
    const hotbar = document.getElementById('skill-hotbar');
    const signature = `${active.id}:${active.mp}:${selSkill?.id}:${mode}:${action.acted}:${locked}`;
    if (hotbar && signature !== hotbarSignature) {
      hotbarSignature = signature;
      hotbar.innerHTML = active.skills.map(s => {
        const isSelected = selSkill?.id === s.id;
        return `
          <button class="skill-slot-btn ${isSelected && mode === 'skill' ? 'active' : ''}" data-skill-id="${s.id}" ${locked || action.acted || active.mp < s.mpCost ? 'disabled' : ''} aria-label="${s.name}" title="${s.name} (${s.description}) • Range ${s.range}">
            <span class="skill-icon">${s.icon}</span>
            <span class="skill-cost-badge">${s.mpCost} MP</span>
          </button>
        `;
      }).join('');

      hotbar.querySelectorAll<HTMLElement>('.skill-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sId = btn.getAttribute('data-skill-id');
          const sk = active.skills.find(x => x.id === sId);
          if (sk) {
            combatView.setMode('skill', sk);
          }
        });
      });
    }
  }

  // Action Mode Buttons
  const btnMove = document.getElementById('btn-mode-move');
  const btnAtk = document.getElementById('btn-mode-attack');
  const btnSkill = document.getElementById('btn-mode-skill');

  if (btnMove) btnMove.className = `btn-tactics ${mode === 'move' ? 'active' : ''}`;
  if (btnAtk) btnAtk.className = `btn-tactics ${mode === 'attack' ? 'active' : ''}`;
  if (btnSkill) btnSkill.className = `btn-tactics ${mode === 'skill' ? 'active' : ''}`;

  // Target HUD Card
  const targetCard = document.getElementById('combat-target-card');
  if (target && !target.isDead) {
    if (targetCard) targetCard.style.opacity = '1';
    const tPortrait = document.getElementById('target-portrait-slot');
    const tName = document.getElementById('target-name-text');
    const tSub = document.getElementById('target-sub-text');
    const tHpBar = document.getElementById('target-hp-bar');

    if (tPortrait) tPortrait.innerHTML = getPortraitSVG(target.portraitKey);
    if (tName) tName.innerText = target.name;
    if (tSub) tSub.innerText = `Lv. ${target.level} • ${target.title}`;
    if (tHpBar) tHpBar.style.width = `${Math.max(0, (target.hp / target.maxHp) * 100)}%`;
  } else {
    if (targetCard) targetCard.style.opacity = '0.5';
  }

  // Turn Order Queue strip on left
  const queueStrip = document.getElementById('turn-queue-strip');
  const nextQueueSignature = combatView.getAllUnits().map(u => `${u.id}:${u.isDead}`).join('|') + active?.id + isEnemy;
  if (queueStrip && queueSignature !== nextQueueSignature) {
    queueSignature = nextQueueSignature;
    const allLiving = combatView.getAllUnits().filter(u => !u.isDead);
    queueStrip.innerHTML = allLiving.map((u, i) => {
      const isActive = !isEnemy && active?.id === u.id;
      return `
        <div class="queue-unit-badge ${isActive ? 'active-turn' : ''}" title="${u.name} (Lv. ${u.level})">
          ${getPortraitSVG(u.portraitKey)}
          <span class="queue-order-tag">${i + 1}</span>
        </div>
      `;
    }).join('');
  }
}

// ----------------------------------------------------
// Boot and Event Wiring
// ----------------------------------------------------
function updateMapInspector() {
  const node = worldMapView.getSelectedNode();
  el('map-node-title').textContent = node.name;
  el('map-node-th').textContent = node.nameTh;
  el('map-node-desc').textContent = `${node.description} · Recommended Lv. ${node.levelReq}`;
  const atNode = state.currentNodeId === node.id;
  const town = node.type === 'capital' || node.type === 'port';
  const access = state.canTravel(node.id);
  el('map-access-message').textContent = battleInProgress ? 'Battle in progress. Return to combat or retreat first.' : worldMapView.getMessage() || (!atNode ? access.reason : town ? 'Safe haven — rest and prepare your party.' : 'Area ready. Clear enemies to earn gold, equipment and XP.');
  const start = el('btn-map-action') as HTMLButtonElement;
  start.disabled = battleInProgress || !atNode || town;
  start.textContent = town ? 'Safe haven' : state.clearedNodes.includes(node.id) ? 'Replay encounter' : 'Enter encounter';
  const rest = el('btn-rest') as HTMLButtonElement;
  rest.disabled = battleInProgress || !atNode || !town;
  rest.textContent = node.type === 'capital' ? 'Rest / Recover — Free' : 'Rest / Recover';
  el('campaign-progress').textContent = `Cleared ${state.clearedNodes.length}/6 · Party Lv. ${Math.min(...state.party.map(u => u.level))} · Clear Ruins + Eldertree and reach Lv. 7 to challenge Morgana.`;
}

function startBattle(nodeId: string, retry = false) {
  if (battleInProgress) return;
  const stage = getStage(nodeId);
  if (!retry) beforeBattle = structuredClone(state.party);
  const heroes = structuredClone(beforeBattle);
  if (heroes.every(u => u.hp <= 0 || u.isDead)) { notify('Recover at the capital before entering battle.'); return; }
  heroes.forEach((u, i) => { u.gridX = [2,1,3][i]; u.gridY = [5,6,6][i]; });
  battleNode = nodeId;
  state.beginBattle(nodeId);
  battleInProgress = true;
  combatView.setMap(stage.grid);
  combatView.resetBattle([...heroes, ...stage.enemies]);
  el('battle-title').textContent = stage.title;
  el('battle-objective').textContent = stage.objective;
  hotbarSignature = ''; queueSignature = '';
  updateCombatHUD(); switchView('view-combat');
}

function retreat() {
  if (!battleInProgress) return;
  battleInProgress = false;
  combatView.destroy();
  state.syncBattle(combatView.getAllUnits());
  state.currentNodeId = 'ravenhold';
  state.save();
  worldMapView.setCurrentNode('ravenhold');
  updateCombatHUD(); switchView('view-worldmap');
  notify('Retreated to the capital. Rest to recover before trying again.');
}

function handleVictory() {
  if (!battleInProgress) return;
  battleInProgress = false;
  state.syncBattle(combatView.getAllUnits());
  const oldGold = state.gold;
  const oldItems = new Set(state.items.map(i => i.id));
  if (state.claimVictory(battleNode)) {
    const reward = state.items.filter(i => !oldItems.has(i.id)).map(i => i.name).join(', ');
    el('victory-reward').textContent = `+${state.gold - oldGold} Gold · ${reward || 'Supplies'} · XP awarded to your party. Progress saved.`;
  }
  updateHeader(); updateCombatHUD();
  el('victory-modal').style.display = 'flex';
  el('btn-claim-victory').focus();
}

function handleDefeat() {
  if (!battleInProgress) return;
  battleInProgress = false;
  state.syncBattle(combatView.getAllUnits());
  updateCombatHUD();
  el('defeat-modal').style.display = 'flex';
  el('btn-retry').focus();
}

function boot() {
  updateHeader();
  combatView = new CombatView(el('combat-canvas') as HTMLCanvasElement, [...state.party, ...getStage('ruins').enemies], () => { if (combatView) updateCombatHUD(); }, handleVictory, handleDefeat);
  worldMapView = new WorldMapView(el('world-map-canvas') as HTMLCanvasElement, node => {
    if (!battleInProgress && !worldMapView.getMessage()) state.travel(node.id);
    updateMapInspector(); updateHeader();
  });
  worldMapView.setCurrentNode(state.currentNodeId);
  worldMapView.setAccessChecker(id => battleInProgress ? { allowed: false, reason: 'Finish or retreat from battle before traveling.' } : state.canTravel(id));
  dialogueView = new DialogueView(el('dialogue-container'), STORY_CHAPTER_1, () => switchView('view-worldmap'));
  inventoryView = new InventoryView(el('inventory-container'), state.party[0], state.items, () => { updateHeader(); state.save(); }, state);
  el('btn-mode-move').addEventListener('click', () => combatView.setMode('move'));
  el('btn-mode-attack').addEventListener('click', () => combatView.setMode('attack'));
  el('btn-mode-skill').addEventListener('click', () => { const u = combatView.getActiveUnit(); if (u) combatView.setMode('skill', u.skills[0]); });
  el('btn-end-turn').addEventListener('click', () => combatView.endTurn());
  el('btn-abandon').addEventListener('click', retreat);
  el('btn-map-action').addEventListener('click', () => { const n = worldMapView.getSelectedNode(); if (!battleInProgress && n.id === state.currentNodeId && !['capital','port'].includes(n.type)) startBattle(n.id); });
  el('btn-rest').addEventListener('click', () => { if (battleInProgress) return; state.rest(); state.save(); inventoryView.render(); updateHeader(); notify('Party recovered.'); updateMapInspector(); });
  el('btn-save').addEventListener('click', () => { notify(battleInProgress ? (state.save() ? 'Saved campaign. Current encounter restarts on reload.' : 'Save unavailable: browser storage is blocked.') : state.save() ? 'Saved campaign.' : 'Save unavailable: browser storage is blocked.'); });
  el('btn-help').addEventListener('click', () => { el('help-dialog').style.display = 'flex'; el('btn-close-help').focus(); });
  el('btn-close-help').addEventListener('click', () => { el('help-dialog').style.display = 'none'; el('btn-help').focus(); });
  el('btn-claim-victory').addEventListener('click', () => { el('victory-modal').style.display = 'none'; dialogueView.setScript(VICTORY_DIALOGUE); switchView('view-worldmap'); });
  el('btn-retry').addEventListener('click', () => { el('defeat-modal').style.display = 'none'; startBattle(battleNode, true); });
  el('btn-defeat-map').addEventListener('click', () => { el('defeat-modal').style.display = 'none'; combatView.destroy(); state.currentNodeId = 'ravenhold'; state.save(); worldMapView.setCurrentNode('ravenhold'); switchView('view-worldmap'); });
  document.addEventListener('keydown', event => {
    if (event.repeat) return;
    const modal = ['help-dialog','victory-modal','defeat-modal'].map(el).find(node => node.style.display !== 'none');
    if (modal) {
      if (event.key === 'Escape' && modal.id === 'help-dialog') el('btn-close-help').click();
      if (event.key === 'Tab') {
        const buttons = [...modal.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      return;
    }
    if ((event.target as HTMLElement)?.matches('input,textarea,select,button')) return;
    if (el('view-story').classList.contains('active') && [' ','Enter'].includes(event.key)) { event.preventDefault(); dialogueView.next(); return; }
    if (!battleInProgress || !el('view-combat').classList.contains('active') || combatView.getIsEnemyTurn()) return;
    if ([' ','Enter'].includes(event.key)) { event.preventDefault(); combatView.endTurn(); }
    else if (event.key.toLowerCase() === 'm') combatView.setMode('move');
    else if (event.key.toLowerCase() === 'a') combatView.setMode('attack');
    else if (event.key === 'Escape') combatView.setMode('idle');
    else if (/^[1-4]$/.test(event.key)) { const skill = combatView.getActiveUnit()?.skills[Number(event.key) - 1]; if (skill) combatView.setMode('skill', skill); }
  });
  if (state.clearedNodes.length === 0 && state.party.some(u => u.hp > 0 && !u.isDead)) startBattle('ruins');
  else { combatView.destroy(); switchView('view-worldmap'); updateCombatHUD(); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
