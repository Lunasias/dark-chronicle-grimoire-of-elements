import { Unit } from '../types';

export const INITIAL_PARTY: Unit[] = [
  {
    id: 'arza',
    name: 'Arza',
    title: 'Knight of the Sunlit Blade',
    gender: 'female',
    level: 5,
    hp: 82,
    maxHp: 82,
    mp: 24,
    maxMp: 24,
    atk: 18,
    def: 16,
    spd: 12,
    matk: 8,
    isPlayer: true,
    gridX: 2,
    gridY: 5,
    portraitKey: 'arza',
    color: '#3b82f6',
    skills: [
      {
        id: 'slash',
        name: 'Crimson Slash',
        nameTh: 'ดาบผ่าพิภพ',
        mpCost: 4,
        range: 1,
        type: 'damage',
        power: 24,
        element: 'physical',
        icon: '⚔️',
        description: 'ฟันดาบหนักหน่วงสร้างดาเมจกายภาพรุนแรง'
      },
      {
        id: 'radiant',
        name: 'Radiant Edge',
        nameTh: 'คมดาบแสงสุริยา',
        mpCost: 8,
        range: 2,
        type: 'damage',
        power: 32,
        element: 'holy',
        icon: '✨',
        description: 'ปลดปล่อยคลื่นแสงสุริยาในระยะ 2 ช่อง'
      },
      {
        id: 'heal',
        name: 'First Aid',
        nameTh: 'ปฐมพยาบาล',
        mpCost: 6,
        range: 1,
        type: 'heal',
        power: 28,
        element: 'holy',
        icon: '🩹',
        description: 'ฟื้นฟู HP ให้ตนเองหรือเพื่อนร่วมทีม'
      },
      {
        id: 'guard',
        name: 'Iron Aegis',
        nameTh: 'ปราการเหล็กกล้า',
        mpCost: 5,
        range: 0,
        type: 'buff',
        power: 8,
        element: 'physical',
        icon: '🛡️',
        description: 'เพิ่มพลังป้องกัน DEF ชั่วคราว'
      }
    ]
  },
  {
    id: 'lyria',
    name: 'Lyria',
    title: 'Astral Archmage',
    gender: 'female',
    level: 5,
    hp: 64,
    maxHp: 64,
    mp: 48,
    maxMp: 48,
    atk: 10,
    def: 10,
    spd: 11,
    matk: 24,
    isPlayer: true,
    gridX: 1,
    gridY: 6,
    portraitKey: 'lyria',
    color: '#8b5cf6',
    skills: [
      {
        id: 'starlight',
        name: 'Starlight Pulse',
        nameTh: 'ดวงดาวส่องประกาย',
        mpCost: 6,
        range: 3,
        type: 'damage',
        power: 26,
        element: 'holy',
        icon: '💫',
        description: 'ยิงลำแสงดวงดาวระเบิดเป้าหมายระยะไกล'
      },
      {
        id: 'glacial',
        name: 'Frost Lance',
        nameTh: 'หอกน้ำแข็งเหมันต์',
        mpCost: 9,
        range: 3,
        type: 'damage',
        power: 34,
        element: 'fire',
        icon: '❄️',
        description: 'ควบแน่นเวทเยือกแข็งยิงทะลวงเกราะ'
      },
      {
        id: 'celestial_heal',
        name: 'Celestial Mend',
        nameTh: 'มนต์รักษาหมู่ดาว',
        mpCost: 10,
        range: 3,
        type: 'heal',
        power: 36,
        element: 'holy',
        icon: '💖',
        description: 'ฟื้นฟูพลังชีวิตระยะไกล'
      },
      {
        id: 'mana_barrier',
        name: 'Arcane Ward',
        nameTh: 'บาเรียเวทมนตร์',
        mpCost: 8,
        range: 2,
        type: 'buff',
        power: 10,
        element: 'holy',
        icon: '🔮',
        description: 'สร้างเกราะป้องกันเวทคุ้มกันเป้าหมาย'
      }
    ]
  },
  {
    id: 'selenis',
    name: 'Selenis',
    title: 'Windstalker Ranger',
    gender: 'female',
    level: 5,
    hp: 70,
    maxHp: 70,
    mp: 30,
    maxMp: 30,
    atk: 17,
    def: 12,
    spd: 16,
    matk: 12,
    isPlayer: true,
    gridX: 3,
    gridY: 6,
    portraitKey: 'selenis',
    color: '#10b981',
    skills: [
      {
        id: 'gale_shot',
        name: 'Gale Shot',
        nameTh: 'ศรสายลมพัดกระหน่ำ',
        mpCost: 5,
        range: 4,
        type: 'damage',
        power: 24,
        element: 'wind',
        icon: '🏹',
        description: 'ยิงลูกศรความเร็วสูงทะลวงเป้าหมายไกล 4 ช่อง'
      },
      {
        id: 'snipe',
        name: 'Deadly Aim',
        nameTh: 'เล็งจุดตาย',
        mpCost: 10,
        range: 4,
        type: 'damage',
        power: 38,
        element: 'physical',
        icon: '🎯',
        description: 'เล็งยิงจุดอ่อนสร้างคริติคอลรุนแรง'
      },
      {
        id: 'poison_dart',
        name: 'Viper Dart',
        nameTh: 'ลูกดอกพิษอสรพิษ',
        mpCost: 6,
        range: 3,
        type: 'damage',
        power: 18,
        element: 'shadow',
        icon: '🐍',
        description: 'เคลือบพิษทำให้ศัตรูอ่อนแรง'
      },
      {
        id: 'tailwind',
        name: 'Tailwind Haste',
        nameTh: 'ลมหนุนความเร็ว',
        mpCost: 6,
        range: 0,
        type: 'buff',
        power: 6,
        element: 'wind',
        icon: '🍃',
        description: 'เพิ่มความคล่องตัวและหลบหลีก'
      }
    ]
  }
];

export const ENEMY_ENCOUNTERS: Record<string, Unit[]> = {
  default: [
    {
      id: 'goblin_1',
      name: 'Goblin Huntress',
      title: 'Scout of the Ruins',
      gender: 'female',
      level: 3,
      hp: 45,
      maxHp: 45,
      mp: 15,
      maxMp: 15,
      atk: 14,
      def: 8,
      spd: 13,
      matk: 6,
      isPlayer: false,
      gridX: 4,
      gridY: 2,
      portraitKey: 'goblin',
      color: '#ef4444',
      skills: [
        {
          id: 'gob_stab',
          name: 'Twin Daggers',
          nameTh: 'มีดคู่จู่โจม',
          mpCost: 0,
          range: 1,
          type: 'damage',
          power: 16,
          element: 'physical',
          icon: '🗡️',
          description: 'แทงด้วยมีดสั้นสองเล่ม'
        }
      ]
    },
    {
      id: 'goblin_2',
      name: 'Goblin Huntress',
      title: 'Scout of the Ruins',
      gender: 'female',
      level: 3,
      hp: 45,
      maxHp: 45,
      mp: 15,
      maxMp: 15,
      atk: 14,
      def: 8,
      spd: 13,
      matk: 6,
      isPlayer: false,
      gridX: 5,
      gridY: 3,
      portraitKey: 'goblin',
      color: '#ef4444',
      skills: [
        {
          id: 'gob_stab',
          name: 'Twin Daggers',
          nameTh: 'มีดคู่จู่โจม',
          mpCost: 0,
          range: 1,
          type: 'damage',
          power: 16,
          element: 'physical',
          icon: '🗡️',
          description: 'แทงด้วยมีดสั้นสองเล่ม'
        }
      ]
    },
    {
      id: 'sorceress_1',
      name: 'Shadow Sorceress',
      title: 'Cultist of the Eclipse',
      gender: 'female',
      level: 4,
      hp: 55,
      maxHp: 55,
      mp: 40,
      maxMp: 40,
      atk: 9,
      def: 9,
      spd: 10,
      matk: 20,
      isPlayer: false,
      gridX: 6,
      gridY: 1,
      portraitKey: 'sorceress',
      color: '#a855f7',
      skills: [
        {
          id: 'shadow_orb',
          name: 'Void Orb',
          nameTh: 'ลูกแก้วความมืด',
          mpCost: 6,
          range: 3,
          type: 'damage',
          power: 24,
          element: 'shadow',
          icon: '🔮',
          description: 'ยิงพลังมืดกัดกร่อนพลังชีวิต'
        }
      ]
    }
  ],

  boss: [
    {
      id: 'morgana_boss',
      name: 'Empress Morgana',
      title: 'Mistress of the Abyssal Void',
      gender: 'female',
      level: 8,
      hp: 140,
      maxHp: 140,
      mp: 60,
      maxMp: 60,
      atk: 24,
      def: 18,
      spd: 14,
      matk: 28,
      isPlayer: false,
      gridX: 5,
      gridY: 2,
      portraitKey: 'morgana',
      color: '#f43f5e',
      skills: [
        {
          id: 'abyssal_ruin',
          name: 'Abyssal Calamity',
          nameTh: 'หายนะแห่งขุมนรก',
          mpCost: 15,
          range: 3,
          type: 'damage',
          power: 36,
          element: 'shadow',
          icon: '💥',
          description: 'ปลดปล่อยพลังเวทระเบิดรุนแรง'
        },
        {
          id: 'dark_slash',
          name: 'Blood Scythe',
          nameTh: 'เคียวโลหิตทมิฬ',
          mpCost: 8,
          range: 1,
          type: 'damage',
          power: 28,
          element: 'physical',
          icon: '🩸',
          description: 'ฟันด้วยเคียวโลหิตดูดกลืนพลัง'
        }
      ]
    },
    {
      id: 'sorceress_elite',
      name: 'Shadow Witch Vivienne',
      title: 'High Priestess of the Abyss',
      gender: 'female',
      level: 6,
      hp: 75,
      maxHp: 75,
      mp: 50,
      maxMp: 50,
      atk: 10,
      def: 12,
      spd: 12,
      matk: 24,
      isPlayer: false,
      gridX: 6,
      gridY: 3,
      portraitKey: 'sorceress',
      color: '#9333ea',
      skills: [
        {
          id: 'shadow_orb',
          name: 'Void Burst',
          nameTh: 'ระเบิดมิติเงา',
          mpCost: 8,
          range: 3,
          type: 'damage',
          power: 28,
          element: 'shadow',
          icon: '🔮',
          description: 'เวทมนตร์มืดโบราณ'
        }
      ]
    }
  ]
};
