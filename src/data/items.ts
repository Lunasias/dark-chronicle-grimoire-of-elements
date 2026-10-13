import { Item } from '../types';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'weapon_sunblade',
    name: 'Sunlit Claymore',
    type: 'weapon',
    rarity: 'rare',
    stats: { atk: 12, hp: 15 },
    icon: '🗡️',
    desc: 'ดาบแห่งแสงสุริยา หลอมด้วยเหล็กศักดิ์สิทธิ์ (+12 ATK, +15 HP)',
    equipped: true
  },
  {
    id: 'armor_silver',
    name: 'Silverguard Cuirass',
    type: 'armor',
    rarity: 'rare',
    stats: { def: 10, hp: 25 },
    icon: '🛡️',
    desc: 'เกราะหน้าอกเงินขัดเงาของอัศวินหญิงหลวง (+10 DEF, +25 HP)',
    equipped: true
  },
  {
    id: 'acc_starlight',
    name: 'Starlight Pendant',
    type: 'accessory',
    rarity: 'epic',
    stats: { atk: 5, spd: 4 },
    icon: '📿',
    desc: 'จี้ห้อยคอดวงดาราลึกลับ ส่องแสงนำทางยามราตรี (+5 ATK, +4 SPD)',
    equipped: true
  },
  {
    id: 'potion_hp_1',
    name: 'Healing Elixir',
    type: 'consumable',
    rarity: 'common',
    healAmount: 40,
    icon: '🧪',
    desc: 'ยาฟื้นฟูพลังชีวิต 40 หน่วย'
  },
  {
    id: 'potion_hp_2',
    name: 'Healing Elixir',
    type: 'consumable',
    rarity: 'common',
    healAmount: 40,
    icon: '🧪',
    desc: 'ยาฟื้นฟูพลังชีวิต 40 หน่วย'
  },
  {
    id: 'potion_mp_1',
    name: 'Mana Crystal Vial',
    type: 'consumable',
    rarity: 'common',
    healAmount: 30,
    icon: '🔷',
    desc: 'ยาฟื้นฟูพลังเวทมนตร์ 30 MP'
  },
  {
    id: 'scroll_flame',
    name: 'Scroll of Firestorm',
    type: 'consumable',
    rarity: 'rare',
    icon: '📜',
    desc: 'ม้วนคัมภีร์เวทเพลิงโบราณ'
  },
  {
    id: 'relic_grimoire',
    name: 'Grimoire of Elements',
    type: 'accessory',
    rarity: 'epic',
    stats: { atk: 8, def: 6, spd: 3 },
    icon: '📖',
    desc: 'คัมภีร์มหาเวทธาตุทั้ง 4 พลังโบราณไร้ขีดจำกัด'
  }
];
