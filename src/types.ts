export interface Unit {
  id: string;
  name: string;
  title: string;
  gender: 'female'; // All characters female
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
  matk: number;
  isPlayer: boolean;
  gridX: number;
  gridY: number;
  portraitKey: string;
  color: string;
  skills: Skill[];
  isDead?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  nameTh: string;
  mpCost: number;
  range: number;
  type: 'damage' | 'heal' | 'buff';
  power: number;
  element: 'physical' | 'fire' | 'holy' | 'wind' | 'shadow';
  icon: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  rarity: 'common' | 'rare' | 'epic';
  stats?: {
    atk?: number;
    def?: number;
    spd?: number;
    hp?: number;
  };
  healAmount?: number;
  icon: string;
  desc: string;
  equipped?: boolean;
}

export interface WorldNode {
  id: string;
  name: string;
  nameTh: string;
  x: number; // Percentage on map (0 - 100)
  y: number; // Percentage on map (0 - 100)
  icon: string;
  biome: string;
  levelReq: number;
  description: string;
  connectedTo: string[];
  type: 'capital' | 'dungeon' | 'port' | 'citadel' | 'forest' | 'ruins' | 'swamp' | 'dunes';
}

export interface DialogueLine {
  speaker: string;
  speakerTh: string;
  portraitKey: string;
  text: string;
  textTh: string;
  emotion?: 'normal' | 'serious' | 'smile' | 'angry';
}
