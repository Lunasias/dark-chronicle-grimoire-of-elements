import { INITIAL_PARTY, ENEMY_ENCOUNTERS } from './data/characters';
import { INITIAL_ITEMS } from './data/items';
import { STORY_CHAPTER_1, VICTORY_DIALOGUE } from './data/dialogues';
import { CombatView } from './views/CombatView';
import { WorldMapView } from './views/WorldMapView';
import { InventoryView } from './views/InventoryView';
import { DialogueView } from './views/DialogueView';
import { sounds } from './audio';
import { getPortraitSVG } from './portraits';
import { Unit, Skill } from './types';

// App State
let gold = 1250;
let party: Unit[] = JSON.parse(JSON.stringify(INITIAL_PARTY));
let items = JSON.parse(JSON.stringify(INITIAL_ITEMS));

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
  if (headerGold) headerGold.innerText = `${gold.toLocaleString()} G`;
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

    if (portraitSlot) portraitSlot.innerHTML = getPortraitSVG(active.portraitKey);
    if (nameEl) nameEl.innerText = active.name;
    if (lvlEl) lvlEl.innerText = `Lv. ${active.level}`;
    if (hpBar) hpBar.style.width = `${Math.max(0, (active.hp / active.maxHp) * 100)}%`;
    if (hpText) hpText.innerText = `${active.hp} / ${active.maxHp}`;
    if (mpBar) mpBar.style.width = `${Math.max(0, (active.mp / active.maxMp) * 100)}%`;
    if (mpText) mpText.innerText = `${active.mp} / ${active.maxMp}`;

    // Render 4-slot skill hotbar
    const hotbar = document.getElementById('skill-hotbar');
    if (hotbar) {
      hotbar.innerHTML = active.skills.map(s => {
        const isSelected = selSkill?.id === s.id;
        return `
          <div class="skill-slot-btn ${isSelected ? 'active' : ''}" data-skill-id="${s.id}" title="${s.name} (${s.description})">
            <span class="skill-icon">${s.icon}</span>
            <span class="skill-cost-badge">${s.mpCost} MP</span>
          </div>
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
  if (queueStrip) {
    const allLiving = combatView.getAllUnits().filter(u => !u.isDead);
    queueStrip.innerHTML = allLiving.map((u, i) => {
      const isActive = active?.id === u.id;
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
window.addEventListener('DOMContentLoaded', () => {
  updateHeader();

  // 1. Combat View
  const combatCanvas = document.getElementById('combat-canvas') as HTMLCanvasElement;
  const initialEnemies = ENEMY_ENCOUNTERS.default;
  const combatUnits = [...party, ...initialEnemies];

  combatView = new CombatView(
    combatCanvas,
    combatUnits,
    () => updateCombatHUD(),
    () => handleVictory()
  );

  document.getElementById('btn-mode-move')?.addEventListener('click', () => combatView.setMode('move'));
  document.getElementById('btn-mode-attack')?.addEventListener('click', () => combatView.setMode('attack'));
  document.getElementById('btn-mode-skill')?.addEventListener('click', () => {
    const active = combatView.getActiveUnit();
    if (active) combatView.setMode('skill', active.skills[0]);
  });
  document.getElementById('btn-end-turn')?.addEventListener('click', () => combatView.endTurn());

  // 2. World Map View
  const mapCanvas = document.getElementById('world-map-canvas') as HTMLCanvasElement;
  worldMapView = new WorldMapView(
    mapCanvas,
    (node) => {
      // Node selected
      const title = document.getElementById('map-node-title');
      const th = document.getElementById('map-node-th');
      const desc = document.getElementById('map-node-desc');
      if (title) title.innerText = node.name;
      if (th) th.innerText = node.nameTh;
      if (desc) desc.innerText = `${node.description} (Level: ${node.levelReq})`;
    }
  );

  document.getElementById('btn-map-action')?.addEventListener('click', () => {
    const node = worldMapView.getSelectedNode();
    const enemies = node.id === 'abyssal' ? ENEMY_ENCOUNTERS.boss : ENEMY_ENCOUNTERS.default;
    combatView.resetBattle([...party, ...enemies]);
    switchView('view-combat');
  });

  // 3. Dialogue View
  const dialogueContainer = document.getElementById('dialogue-container') as HTMLElement;
  dialogueView = new DialogueView(dialogueContainer, STORY_CHAPTER_1, () => {
    switchView('view-combat');
  });

  // 4. Inventory View
  const invContainer = document.getElementById('inventory-container') as HTMLElement;
  inventoryView = new InventoryView(invContainer, party[0], items, () => {
    // Inventory changed
    items = inventoryView.getItems();
  });

  updateCombatHUD();
});

// Victory handling
function handleVictory() {
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'flex';
  gold += 350;
  updateHeader();
}

document.getElementById('btn-claim-victory')?.addEventListener('click', () => {
  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';
  dialogueView.setScript(VICTORY_DIALOGUE);
  switchView('view-story');
});
