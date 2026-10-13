import { Item, Unit } from '../types';
import { sounds } from '../audio';
import { getPortraitSVG } from '../portraits';

export class InventoryView {
  private items: Item[] = [];
  private unit: Unit;
  private selectedItem: Item | null = null;
  private container: HTMLElement;
  private onInventoryChanged?: () => void;

  constructor(container: HTMLElement, unit: Unit, initialItems: Item[], onInventoryChanged?: () => void) {
    this.container = container;
    this.unit = unit;
    this.items = [...initialItems];
    this.onInventoryChanged = onInventoryChanged;
    this.selectedItem = this.items[0] || null;
    this.render();
  }

  public updateUnit(unit: Unit) {
    this.unit = unit;
    this.render();
  }

  public getItems(): Item[] {
    return this.items;
  }

  public render() {
    const equippedWeapon = this.items.find(i => i.equipped && i.type === 'weapon');
    const equippedArmor = this.items.find(i => i.equipped && i.type === 'armor');
    const equippedAcc = this.items.find(i => i.equipped && i.type === 'accessory');

    this.container.innerHTML = `
      <div class="inv-wrapper">
        <!-- Left: Paper Doll & Hero Sheet -->
        <div class="inv-char-panel">
          <div class="inv-char-header">
            <div class="char-portrait-box">
              ${getPortraitSVG(this.unit.portraitKey)}
            </div>
            <div class="char-title-info">
              <h3>${this.unit.name}</h3>
              <div class="char-sub">${this.unit.title} (Lv. ${this.unit.level})</div>
              <div class="stat-bars-mini">
                <div class="mini-bar-bg"><div class="mini-bar-hp" style="width:${(this.unit.hp / this.unit.maxHp) * 100}%"></div></div>
                <div class="mini-bar-bg"><div class="mini-bar-mp" style="width:${(this.unit.mp / this.unit.maxMp) * 100}%"></div></div>
              </div>
            </div>
          </div>

          <!-- Paper Doll Slots -->
          <div class="paper-doll">
            <div class="doll-slot" id="slot-weapon">
              <span class="slot-label">WEAPON</span>
              <div class="slot-item-icon">${equippedWeapon ? equippedWeapon.icon : '—'}</div>
              <div class="slot-item-name">${equippedWeapon ? equippedWeapon.name : 'Empty'}</div>
            </div>
            <div class="doll-slot" id="slot-armor">
              <span class="slot-label">ARMOR</span>
              <div class="slot-item-icon">${equippedArmor ? equippedArmor.icon : '—'}</div>
              <div class="slot-item-name">${equippedArmor ? equippedArmor.name : 'Empty'}</div>
            </div>
            <div class="doll-slot" id="slot-acc">
              <span class="slot-label">ACCESSORY</span>
              <div class="slot-item-icon">${equippedAcc ? equippedAcc.icon : '—'}</div>
              <div class="slot-item-name">${equippedAcc ? equippedAcc.name : 'Empty'}</div>
            </div>
          </div>

          <!-- Attributes Grid -->
          <div class="attr-grid">
            <div class="attr-item"><span class="attr-name">ATK</span> <span class="attr-val">${this.unit.atk}</span></div>
            <div class="attr-item"><span class="attr-name">DEF</span> <span class="attr-val">${this.unit.def}</span></div>
            <div class="attr-item"><span class="attr-name">SPD</span> <span class="attr-val">${this.unit.spd}</span></div>
            <div class="attr-item"><span class="attr-name">MATK</span> <span class="attr-val">${this.unit.matk}</span></div>
            <div class="attr-item"><span class="attr-name">HP MAX</span> <span class="attr-val">${this.unit.maxHp}</span></div>
            <div class="attr-item"><span class="attr-name">MP MAX</span> <span class="attr-val">${this.unit.maxMp}</span></div>
          </div>
        </div>

        <!-- Right: 16-Slot Inventory Grid & Item Details -->
        <div class="inv-items-panel">
          <div class="inv-header-gold">
            <h4>Bag Storage (16 Slots)</h4>
            <div class="gold-badge">💰 1,250 Gold</div>
          </div>

          <div class="grid-16">
            ${Array.from({ length: 16 }).map((_, i) => {
              const item = this.items[i];
              if (!item) return `<div class="bag-cell empty"></div>`;
              const isSel = this.selectedItem?.id === item.id;
              return `
                <div class="bag-cell ${item.rarity} ${item.equipped ? 'equipped' : ''} ${isSel ? 'active' : ''}" data-item-id="${item.id}">
                  <span class="bag-icon">${item.icon}</span>
                  ${item.equipped ? '<span class="eq-tag">E</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Item Details Card -->
          <div class="item-detail-card">
            ${this.selectedItem ? `
              <div class="detail-top">
                <span class="detail-icon">${this.selectedItem.icon}</span>
                <div>
                  <div class="detail-name ${this.selectedItem.rarity}">${this.selectedItem.name}</div>
                  <div class="detail-type">${this.selectedItem.type.toUpperCase()} • ${this.selectedItem.rarity.toUpperCase()}</div>
                </div>
              </div>
              <p class="detail-desc">${this.selectedItem.desc}</p>
              <div class="detail-actions">
                ${this.selectedItem.type !== 'consumable' ? `
                  <button class="btn-inv-action" id="btn-toggle-equip">
                    ${this.selectedItem.equipped ? 'Unequip' : 'Equip'}
                  </button>
                ` : `
                  <button class="btn-inv-action" id="btn-use-item">Use Item</button>
                `}
              </div>
            ` : `<p class="empty-hint">Select an item to view details</p>`}
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    this.container.querySelectorAll('.bag-cell[data-item-id]').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-item-id');
        this.selectedItem = this.items.find(i => i.id === id) || null;
        sounds.playClick();
        this.render();
      });
    });

    const btnEquip = this.container.querySelector('#btn-toggle-equip');
    if (btnEquip && this.selectedItem) {
      btnEquip.addEventListener('click', () => {
        if (!this.selectedItem) return;
        sounds.playSlash();

        if (this.selectedItem.equipped) {
          this.selectedItem.equipped = false;
          if (this.selectedItem.stats?.atk) this.unit.atk -= this.selectedItem.stats.atk;
          if (this.selectedItem.stats?.def) this.unit.def -= this.selectedItem.stats.def;
        } else {
          // Unequip any existing of same type
          this.items.filter(i => i.type === this.selectedItem!.type && i.equipped).forEach(prev => {
            prev.equipped = false;
            if (prev.stats?.atk) this.unit.atk -= prev.stats.atk;
            if (prev.stats?.def) this.unit.def -= prev.stats.def;
          });
          this.selectedItem.equipped = true;
          if (this.selectedItem.stats?.atk) this.unit.atk += this.selectedItem.stats.atk;
          if (this.selectedItem.stats?.def) this.unit.def += this.selectedItem.stats.def;
        }

        this.onInventoryChanged?.();
        this.render();
      });
    }

    const btnUse = this.container.querySelector('#btn-use-item');
    if (btnUse && this.selectedItem) {
      btnUse.addEventListener('click', () => {
        if (!this.selectedItem || this.selectedItem.type !== 'consumable') return;
        sounds.playHeal();
        if (this.selectedItem.healAmount) {
          this.unit.hp = Math.min(this.unit.maxHp, this.unit.hp + this.selectedItem.healAmount);
        }

        const idx = this.items.indexOf(this.selectedItem);
        if (idx !== -1) {
          this.items.splice(idx, 1);
        }
        this.selectedItem = this.items[0] || null;
        this.onInventoryChanged?.();
        this.render();
      });
    }
  }
}
