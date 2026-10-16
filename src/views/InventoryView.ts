import type { Item, Unit } from '../types';
import { sounds } from '../audio';
import { getPortraitSVG } from '../portraits';
import { GameState } from '../gameState';
import type { BaseStats } from '../gameState';
const esc = (v: unknown): string => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const stats = [['atk','ATK'],['def','DEF'],['spd','SPD'],['matk','MATK'],['maxHp','HP MAX'],['maxMp','MP MAX']] as const;

export class InventoryView {
  private state: GameState;
  private selectedUnitId: string;
  private selectedItemId: string | null;
  private message = '';
  private shared: boolean;
  constructor(private container: HTMLElement, unit: Unit, initialItems: Item[], private onInventoryChanged?: () => void, state?: GameState) {
    this.shared = !!state;
    this.state = state ?? new GameState({getItem: () => null, setItem: () => {}});
    if (!state) {
      this.state.party = [unit];
      this.state.items = initialItems.map(i => ({...i, stats: i.stats ? {...i.stats} : undefined}));
      this.initializeFallback(unit);
    }
    this.selectedUnitId = unit.id;
    this.selectedItemId = this.state.items[0]?.id ?? null;
    this.render();
  }
  private initializeFallback(unit: Unit): void {
    if (!unit.baseStats) unit.baseStats = Object.freeze(Object.fromEntries(stats.map(([key]) => [key,unit[key]]))) as unknown as BaseStats;
    for (const i of this.state.items) {
      if (i.equipped && !i.equippedBy) i.equippedBy = unit.id;
      if (i.id.startsWith('potion_mp') && !i.restoreMp) { i.restoreMp = i.healAmount || 30; delete i.healAmount; }
    }
    for (const [key] of stats) unit[key] = unit.baseStats[key];
    for (const i of this.state.items.filter(i => i.equipped && i.equippedBy === unit.id)) {
      unit.atk += i.stats?.atk || 0; unit.def += i.stats?.def || 0;
      unit.spd += i.stats?.spd || 0; unit.maxHp += i.stats?.hp || 0;
    }
    unit.hp = Math.min(unit.hp,unit.maxHp); unit.mp = Math.min(unit.mp,unit.maxMp);
  }
  public updateUnit(unit: Unit): void {
    if (!this.shared) { this.state.party = [unit]; this.initializeFallback(unit); }
    this.selectedUnitId = unit.id; this.render();
  }
  public getItems(): Item[] { return this.state.items; }
  private get unit(): Unit { return this.state.party.find(u => u.id === this.selectedUnitId) ?? this.state.party[0]; }
  private get item(): Item | undefined { return this.state.items.find(i => i.id === this.selectedItemId); }
  private invalidUse(item: Item, unit: Unit): string {
    if (unit.isDead || unit.hp <= 0) return 'This hero is fallen. Rest in a town to revive her.';
    if (item.restoreMp) return unit.mp >= unit.maxMp ? 'MP is already full; the vial will not be consumed.' : '';
    if (item.healAmount) return unit.hp >= unit.maxHp ? 'HP is already full; the potion will not be consumed.' : '';
    return 'This scroll cannot be used from inventory. It will not be consumed.';
  }
  private comparison(item: Item, unit: Unit): string {
    if (item.type === 'consumable') return item.restoreMp ? `Restores ${item.restoreMp} MP` : item.healAmount ? `Restores ${item.healAmount} HP` : '';
    const previous = this.state.items.find(i => i.equipped && i.equippedBy === unit.id && i.type === item.type);
    return (['atk','def','spd','hp'] as const).map(key => {
      const current = key === 'hp' ? unit.maxHp : unit[key];
      const after = current - (previous?.stats?.[key] || 0) + (previous?.id === item.id ? 0 : item.stats?.[key] || 0);
      return `<div class="attr-item"><span>${key.toUpperCase()} ${current}</span><span>After: ${after} (${after >= current ? '+' : ''}${after-current})</span></div>`;
    }).join('');
  }
  public render(): void {
    const unit = this.unit;
    if (!unit) { this.container.innerHTML = '<p>No heroes available.</p>'; return; }
    if (!this.item) this.selectedItemId = this.state.items[0]?.id ?? null;
    const item = this.item;
    const invalid = item?.type === 'consumable' ? this.invalidUse(item,unit) : '';
    const owner = item?.equipped ? this.state.party.find(u => u.id === item.equippedBy) : undefined;
    const pct = (n: number,max: number) => max > 0 ? Math.max(0,Math.min(100,n/max*100)) : 0;
    this.container.innerHTML = `<div class="inv-wrapper"><div class="inv-char-panel">
      <label for="inv-party-select">Party hero</label><select id="inv-party-select" aria-label="Party hero">${this.state.party.map(u => `<option value="${esc(u.id)}" ${u.id === unit.id ? 'selected' : ''}>${esc(u.name)} · Lv. ${u.level}</option>`).join('')}</select>
      <div class="inv-char-header"><div class="char-portrait-box">${getPortraitSVG(unit.portraitKey)}</div><div class="char-title-info"><h3>${esc(unit.name)}</h3><div class="char-sub">${esc(unit.title)} (Lv. ${unit.level})</div>
      <div class="stat-bars-mini"><div class="mini-bar-bg"><div class="mini-bar-hp" style="width:${pct(unit.hp,unit.maxHp)}%"></div></div><div class="mini-bar-bg"><div class="mini-bar-mp" style="width:${pct(unit.mp,unit.maxMp)}%"></div></div></div>
      <div>HP ${unit.hp}/${unit.maxHp} · MP ${unit.mp}/${unit.maxMp}</div><div>XP ${unit.xp || 0}/${unit.level*100}</div></div></div>
      <div class="paper-doll">${(['weapon','armor','accessory'] as const).map(type => {
        const gear = this.state.items.find(i => i.equipped && i.equippedBy === unit.id && i.type === type);
        return `<div class="doll-slot" id="slot-${type === 'accessory' ? 'acc' : type}"><span class="slot-label">${type.toUpperCase()}</span><div class="slot-item-icon">${esc(gear?.icon || '—')}</div><div class="slot-item-name">${esc(gear?.name || 'Empty')}</div></div>`;
      }).join('')}</div><div class="attr-grid">${stats.map(([key,label]) => {
        const base = unit.baseStats?.[key] ?? unit[key], bonus = unit[key]-base;
        return `<div class="attr-item"><span class="attr-name">${label}</span><span class="attr-val">${unit[key]} <small>Base ${base} ${bonus >= 0 ? '+' : ''}${bonus}</small></span></div>`;
      }).join('')}</div></div>
      <div class="inv-items-panel"><div class="inv-header-gold"><h4>Bag Storage (${this.state.items.length} items)</h4><div class="gold-badge">💰 ${this.state.gold.toLocaleString()} Gold</div></div>
      <div class="grid-16">${Array.from({length: Math.max(16,this.state.items.length)},(_,index) => {
        const i = this.state.items[index]; if (!i) return '<div class="bag-cell empty"></div>';
        return `<button type="button" class="bag-cell ${esc(i.rarity)} ${i.equipped ? 'equipped' : ''} ${i.id === item?.id ? 'active' : ''}" data-item-id="${esc(i.id)}" aria-label="${esc(i.name)}"><span class="bag-icon">${esc(i.icon)}</span>${i.equipped ? '<span class="eq-tag">E</span>' : ''}</button>`;
      }).join('')}</div><div class="item-detail-card">${item ? `<div class="detail-top"><span class="detail-icon">${esc(item.icon)}</span><div><div class="detail-name ${esc(item.rarity)}">${esc(item.name)}</div><div class="detail-type">${item.type.toUpperCase()} • ${item.rarity.toUpperCase()}</div></div></div>
      <p class="detail-desc">${esc(item.desc)}</p>${owner ? `<p>Equipped by ${esc(owner.name)}</p>` : ''}<div class="attr-grid">${this.comparison(item,unit)}</div>
      <div class="detail-actions">${item.type === 'consumable' ? `<button class="btn-inv-action" id="btn-use-item" ${invalid ? 'disabled' : ''} title="${esc(invalid)}">Use on ${esc(unit.name)}</button>` : `<button class="btn-inv-action" id="btn-toggle-equip">${owner?.id === unit.id ? 'Unequip' : owner ? 'Transfer & Equip' : 'Equip'}</button>`}</div>
      ${invalid ? `<p class="empty-hint" role="status">${esc(invalid)}</p>` : ''}` : '<p class="empty-hint">Select an item to view details</p>'}<p role="status" aria-live="polite">${esc(this.message)}</p></div></div></div>`;
    this.attachEvents();
  }
  private attachEvents(): void {
    this.container.querySelectorAll<HTMLElement>('.bag-cell[data-item-id]').forEach(el => el.addEventListener('click',() => {
      this.selectedItemId = el.dataset.itemId ?? null; this.message = ''; sounds.playClick(); this.render();
    }));
    const select = this.container.querySelector<HTMLSelectElement>('#inv-party-select');
    select?.addEventListener('change',() => { this.selectedUnitId = select.value; this.message = ''; this.render(); });
    this.container.querySelector('#btn-toggle-equip')?.addEventListener('click',() => {
      const item = this.item; if (!item || !this.state.equip(item.id,this.unit.id)) return;
      sounds.playSlash(); this.message = 'Equipment updated.'; this.onInventoryChanged?.(); this.render();
    });
    this.container.querySelector('#btn-use-item')?.addEventListener('click',() => {
      const item = this.item; if (!item || this.invalidUse(item,this.unit) || !this.state.useItem(item.id,this.unit.id)) return;
      sounds.playHeal(); this.message = `Used ${item.name} on ${this.unit.name}.`; this.onInventoryChanged?.(); this.render();
    });
  }
}
