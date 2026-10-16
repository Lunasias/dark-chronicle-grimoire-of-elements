import type { Item, Unit } from './types';
import { INITIAL_PARTY } from './data/characters';
import { INITIAL_ITEMS } from './data/items';
import { WORLD_NODES } from './data/worldMap';

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface BaseStats { maxHp: number; maxMp: number; atk: number; def: number; spd: number; matk: number }
type Hero = Unit & { xp?: number; baseStats?: BaseStats };
type OwnedItem = Item & { equippedBy?: string; restoreMp?: number };
export const SAVE_KEY = 'grimoire-of-elements.save';
export const SAVE_VERSION = 1;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const finite = (value: unknown, fallback = 0): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1000000, value)) : fallback;
const statKeys = ['maxHp', 'maxMp', 'atk', 'def', 'spd', 'matk'] as const;

export class GameState {
  public party: Unit[] = clone(INITIAL_PARTY);
  public items: Item[] = clone(INITIAL_ITEMS);
  public gold = 1250;
  public currentNodeId = 'ravenhold';
  public clearedNodes: string[] = [];
  public unlockedNodes: string[] = ['ravenhold', 'ruins', 'eldertree', 'swamp', 'silverport', 'frostpeak'];
  private storage?: StorageLike;
  private battleNodeId: string | null = null;
  private rewardClaimed = true;

  constructor(storage?: StorageLike) {
    this.storage = storage;
    if (!storage) {
      try { this.storage = globalThis.localStorage; } catch { /* Browser privacy mode. */ }
    }
    for (const hero of this.party as Hero[]) {
      hero.baseStats = Object.freeze(Object.fromEntries(statKeys.map(key => [key, hero[key]]))) as unknown as BaseStats;
      hero.xp = 0;
    }
    for (const item of this.items as OwnedItem[]) {
      if (item.equipped) item.equippedBy = this.party[0].id;
      if (item.id.startsWith('potion_mp')) { item.restoreMp = item.healAmount || 30; delete item.healAmount; }
    }
    this.recalculate(true);
    this.load();
  }

  public save(): boolean {
    if (!this.storage) return false;
    try {
      this.recalculate();
      const snapshot = { version: SAVE_VERSION, party: this.party, items: this.items, gold: this.gold,
        currentNodeId: this.currentNodeId, clearedNodes: this.clearedNodes, unlockedNodes: this.unlockedNodes };
      if (!this.validSave(snapshot)) return false;
      this.storage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      return true;
    } catch { return false; }
  }

  private validSave(value: unknown): value is { version: number; party: Hero[]; items: OwnedItem[]; gold: number; currentNodeId: string; clearedNodes: string[]; unlockedNodes: string[] } {
    if (!value || typeof value !== 'object') return false;
    const data = value as Record<string, unknown>;
    const number = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1000000;
    const node = (id: unknown): id is string => typeof id === 'string' && WORLD_NODES.some(n => n.id === id);
    const nodes = (list: unknown): list is string[] => Array.isArray(list) && list.every(node) && new Set(list).size === list.length;
    if (data.version !== SAVE_VERSION || !number(data.gold) || !node(data.currentNodeId) || !nodes(data.clearedNodes) || !nodes(data.unlockedNodes)) return false;
    const unlocked = data.unlockedNodes;
    if (!['ravenhold', 'ruins', 'eldertree', 'swamp', 'silverport', 'frostpeak'].every(id => unlocked.includes(id))) return false;
    if (!data.unlockedNodes.includes(data.currentNodeId)) return false;
    if (!Array.isArray(data.party) || data.party.length !== INITIAL_PARTY.length || !Array.isArray(data.items) || data.items.length > 10000) return false;
    const ids = new Set<string>();
    for (const hero of data.party as Hero[]) {
      if (!hero || !INITIAL_PARTY.some(p => p.id === hero.id) || ids.has(hero.id)) return false;
      ids.add(hero.id);
      if (!number(hero.level) || hero.level < 1 || hero.level > 100 || !Number.isInteger(hero.level) || !number(hero.xp) || !number(hero.hp) || !number(hero.mp)) return false;
      if (!hero.baseStats || !statKeys.every(key => number(hero.baseStats![key]) && number(hero[key])) || hero.baseStats.maxHp < 1 || hero.hp > hero.maxHp || hero.mp > hero.maxMp) return false;
    }
    const itemIds = new Set<string>(); const slots = new Set<string>();
    for (const item of data.items as OwnedItem[]) {
      if (!item || typeof item.id !== 'string' || !item.id || itemIds.has(item.id)) return false;
      itemIds.add(item.id);
      if (!['weapon', 'armor', 'accessory', 'consumable'].includes(item.type) || !['common', 'rare', 'epic'].includes(item.rarity)) return false;
      if (![item.name, item.desc, item.icon].every(s => typeof s === 'string' && s.length <= 2000)) return false;
      if (item.stats && (typeof item.stats !== 'object' || !Object.values(item.stats).every(number))) return false;
      if (item.healAmount !== undefined && !number(item.healAmount) || item.restoreMp !== undefined && !number(item.restoreMp)) return false;
      if (item.equipped !== undefined && typeof item.equipped !== 'boolean') return false;
      if (item.equippedBy !== undefined && !ids.has(item.equippedBy)) return false;
      if (item.equipped) {
        const slot = `${item.equippedBy}:${item.type}`;
        if (!item.equippedBy || item.type === 'consumable' || slots.has(slot)) return false;
        slots.add(slot);
      }
    }
    return true;
  }

  private load(): void {
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (!raw) return;
      const saved: unknown = JSON.parse(raw);
      if (!this.validSave(saved)) return;
      this.party = INITIAL_PARTY.map(template => {
        const hero = saved.party.find(p => p.id === template.id)!;
        return { ...clone(template), level: hero.level, hp: hero.hp, mp: hero.mp, xp: hero.xp,
          baseStats: Object.freeze({ ...hero.baseStats! }) } as Hero;
      });
      this.items = clone(saved.items);
      this.gold = saved.gold;
      this.currentNodeId = saved.currentNodeId;
      this.clearedNodes = [...saved.clearedNodes];
      this.unlockedNodes = [...saved.unlockedNodes];
      this.recalculate();
    } catch { /* Corrupt/inaccessible saves never prevent a new game. */ }
  }

  public syncBattle(units: Unit[]): void {
    for (const hero of this.party) {
      const battle = units.find(u => u.id === hero.id && u.isPlayer);
      if (!battle) continue;
      hero.hp = battle.isDead ? 0 : Math.min(hero.maxHp, finite(battle.hp));
      hero.mp = Math.min(hero.maxMp, finite(battle.mp));
      hero.isDead = hero.hp === 0;
    }
    this.save();
  }

  public beginBattle(nodeId: string): void {
    const node = WORLD_NODES.find(n => n.id === nodeId);
    this.battleNodeId = node && !['capital', 'port'].includes(node.type) ? nodeId : null;
    this.rewardClaimed = this.battleNodeId === null;
  }

  public claimVictory(nodeId: string): boolean {
    if (this.rewardClaimed || this.battleNodeId !== nodeId || !this.party.some(u => u.hp > 0)) return false;
    this.rewardClaimed = true;
    this.gold = finite(this.gold + 350);
    let serial = 1;
    while (this.items.some(i => i.id === `reward_${nodeId}_${serial}`)) serial++;
    this.items.push({ id: `reward_${nodeId}_${serial}`, name: 'Ancient Element Shard', type: 'accessory',
      rarity: 'rare', icon: '💎', desc: 'Recovered elemental relic (+2 ATK, +8 HP, +1 SPD).', stats: { atk: 2, hp: 8, spd: 1 } });
    for (const hero of this.party as Hero[]) {
      hero.xp = finite(hero.xp) + 600;
      while (hero.level < 100 && hero.xp >= hero.level * 100) {
        hero.xp -= hero.level * 100;
        hero.level++;
        const base = { ...hero.baseStats! };
        base.maxHp += 8; base.maxMp += 4; base.atk += 2; base.def++; base.spd++; base.matk += 2;
        hero.baseStats = Object.freeze(base);
      }
    }
    if (!this.clearedNodes.includes(nodeId)) this.clearedNodes.push(nodeId);
    const unlock = (id: string) => { if (!this.unlockedNodes.includes(id)) this.unlockedNodes.push(id); };
    if (this.clearedNodes.includes('ruins')) unlock('dunes');
    if (this.clearedNodes.includes('ruins') && this.clearedNodes.includes('eldertree')) unlock('abyssal');
    this.recalculate(); this.save(); return true;
  }

  public canTravel(nodeId: string): { allowed: boolean; reason: string } {
    const target = WORLD_NODES.find(n => n.id === nodeId);
    const current = WORLD_NODES.find(n => n.id === this.currentNodeId);
    if (!target || !current) return { allowed: false, reason: 'Unknown destination.' };
    if (nodeId === this.currentNodeId) return { allowed: true, reason: 'You are here.' };
    if (!current.connectedTo.includes(nodeId) || !target.connectedTo.includes(current.id)) return { allowed: false, reason: 'No direct road from your current location.' };
    if (nodeId === 'abyssal' && (!this.clearedNodes.includes('ruins') || !this.clearedNodes.includes('eldertree'))) {
      return { allowed: false, reason: 'Clear Forgotten Ruins and Eldertree Forest first.' };
    }
    if (nodeId === 'dunes' && !this.clearedNodes.includes('ruins')) return { allowed: false, reason: 'Clear Forgotten Ruins first.' };
    if (!this.unlockedNodes.includes(nodeId)) return { allowed: false, reason: 'This destination is not unlocked.' };
    const required = nodeId === 'abyssal' ? 7 : target.levelReq;
    if (!this.party.length || this.party.some(u => finite(u.level) < required)) return { allowed: false, reason: `Every hero must reach level ${required}.` };
    return { allowed: true, reason: 'Road open.' };
  }

  public travel(nodeId: string): boolean {
    if (!this.canTravel(nodeId).allowed) return false;
    this.currentNodeId = nodeId; this.save(); return true;
  }

  public rest(): void {
    const town = WORLD_NODES.find(n => n.id === this.currentNodeId);
    if (!town || !['capital', 'port', 'citadel'].includes(town.type)) return;
    const cost = town.type === 'capital' ? 0 : 50;
    if (this.gold < cost || !this.party.some(u => u.hp < u.maxHp || u.mp < u.maxMp || u.isDead)) return;
    this.gold -= cost;
    this.recalculate(true); this.save();
  }

  public equip(itemId: string, unitId: string): boolean {
    const hero = this.party.find(u => u.id === unitId);
    const item = (this.items as OwnedItem[]).find(i => i.id === itemId);
    if (!hero || !item || item.type === 'consumable') return false;
    if (item.equipped && item.equippedBy === unitId) {
      item.equipped = false; delete item.equippedBy;
    } else {
      for (const previous of this.items as OwnedItem[]) {
        if (previous.equippedBy === unitId && previous.type === item.type) {
          previous.equipped = false; delete previous.equippedBy;
        }
      }
      item.equipped = true; item.equippedBy = unitId;
    }
    this.recalculate(); this.save(); return true;
  }

  public useItem(itemId: string, unitId: string): boolean {
    const hero = this.party.find(u => u.id === unitId);
    const item = (this.items as OwnedItem[]).find(i => i.id === itemId);
    if (!hero || !item || item.type !== 'consumable' || hero.hp <= 0 || hero.isDead) return false;
    const mana = finite(item.restoreMp);
    const heal = mana ? 0 : finite(item.healAmount);
    if ((!mana || hero.mp >= hero.maxMp) && (!heal || hero.hp >= hero.maxHp)) return false;
    hero.hp = Math.min(hero.maxHp, finite(hero.hp) + heal);
    hero.mp = Math.min(hero.maxMp, finite(hero.mp) + mana);
    this.items.splice(this.items.indexOf(item), 1);
    this.save(); return true;
  }

  private recalculate(fill = false): void {
    for (const hero of this.party as Hero[]) {
      const base = hero.baseStats!;
      for (const key of statKeys) hero[key] = finite(base[key]);
      for (const item of this.items as OwnedItem[]) {
        if (!item.equipped || item.equippedBy !== hero.id) continue;
        hero.atk += finite(item.stats?.atk);
        hero.def += finite(item.stats?.def);
        hero.spd += finite(item.stats?.spd);
        hero.maxHp += finite(item.stats?.hp);
      }
      hero.maxHp = Math.max(1, hero.maxHp);
      hero.hp = fill ? hero.maxHp : Math.min(finite(hero.hp), hero.maxHp);
      hero.mp = fill ? hero.maxMp : Math.min(finite(hero.mp), hero.maxMp);
      hero.isDead = hero.hp === 0;
    }
  }
}
