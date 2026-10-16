import { Unit } from '../types';
import { ENEMY_ENCOUNTERS } from './characters';
export interface Stage { id: string; title: string; objective: string; grid: number[][]; enemies: Unit[]; }
const layouts: Record<string, string[]> = {
  ruins: ['00000000','00200000','00001100','02001100','00000000','00020320','00000000','00000000'],
  eldertree: ['00000000','02000200','00020000','00200200','00000000','02003020','00000000','00000000'],
  swamp: ['00000000','00110000','00110000','00000110','00000110','00003000','00000000','00000000'],
  frostpeak: ['00000000','02000020','00022000','00000000','00200200','00003000','00000000','00000000'],
  dunes: ['00000000','00020000','00000020','02000000','00022000','00003000','00000000','00000000'],
  abyssal: ['00000000','02000020','00000000','00011000','00200020','00003000','00000000','00000000']
};
const names: Record<string, string> = { ruins: 'Forgotten Ruins', eldertree: 'Eldertree Ambush', swamp: 'Moonlit Venom', frostpeak: 'Frostpeak Watch', dunes: 'Sunscorch Trial', abyssal: 'The Abyssal Empress' };
export function getStage(id: string): Stage {
  const key = layouts[id] ? id : 'ruins';
  const grid = layouts[key].map(row => [...row].map(Number));
  const enemies: Unit[] = structuredClone(key === 'abyssal' ? ENEMY_ENCOUNTERS.boss : ENEMY_ENCOUNTERS.default);
  const difficulty = ['ruins','eldertree','swamp','frostpeak','dunes','abyssal'].indexOf(key);
  const occupied = new Set<string>();
  enemies.forEach((unit, i) => {
    const affinity: Record<string, Unit['element']> = { eldertree: 'wind', swamp: 'shadow', frostpeak: 'ice', dunes: 'fire', abyssal: 'shadow' };
    if (affinity[key]) unit.element = affinity[key];
    unit.gridX = [5,6,6][i]; unit.gridY = [1,3,0][i];
    while (![0,3].includes(grid[unit.gridY][unit.gridX]) || occupied.has(`${unit.gridX},${unit.gridY}`)) {
      unit.gridX = (unit.gridX + 1) % 8;
      if (unit.gridX === 0) unit.gridY = (unit.gridY + 1) % 4;
    }
    occupied.add(`${unit.gridX},${unit.gridY}`);
    if (key !== 'abyssal') {
      unit.level += difficulty;
      unit.hp += difficulty * 9; unit.maxHp = unit.hp;
      unit.atk += difficulty * 2; unit.matk += difficulty * 3;
      unit.def += difficulty;
      if (key === 'swamp' && i < 2) {
        unit.name = 'Marsh Viper'; unit.color = '#65a30d';
        unit.skills = [{ id:'poison_dart', name:'Venom Spit', nameTh:'พิษบึง', mpCost:3, range:3, type:'damage', power:15, element:'shadow', icon:'🐍', description:'Poisons for two rounds.' }];
      }
      if (key === 'frostpeak') { unit.name = i < 2 ? 'Frost Sentinel' : 'Frost Oracle'; unit.color = '#67e8f9'; unit.skills.forEach(s => { s.element = 'ice'; }); }
      if (key === 'dunes') { unit.name = i < 2 ? 'Dune Reaver' : 'Flame Oracle'; unit.color = '#fb923c'; if(i === 2) unit.skills.forEach(s => { s.element = 'fire'; }); }
      if (key === 'eldertree' && i < 2) { unit.name = 'Thorn Stalker'; unit.color = '#34d399'; unit.skills[0].range = 2; }
    }
  });
  return { id: key, title: names[key], objective: key === 'abyssal' ? 'Defeat Morgana. Leave red warning tiles before her next phase.' : 'Defeat every enemy. Keep your party alive.', grid, enemies };
}
