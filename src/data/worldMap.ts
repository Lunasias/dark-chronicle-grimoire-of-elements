import { WorldNode } from '../types';

export const WORLD_NODES: WorldNode[] = [
  {
    id: 'ravenhold',
    name: 'Ravenhold Capital',
    nameTh: 'นครหลวงเรเวนโฮลด์',
    x: 50,
    y: 50,
    icon: '⭐',
    biome: 'capital',
    levelReq: 1,
    description: 'ศูนย์กลางแห่งอาณาจักร กองบัญชาการอัศวินหญิงแห่งแสงสุริยา',
    connectedTo: ['eldertree', 'silverport', 'ruins', 'swamp'],
    type: 'capital'
  },
  {
    id: 'eldertree',
    name: 'Eldertree Forest',
    nameTh: 'พฤกษาโบราณเอลเดอร์ทรี',
    x: 48,
    y: 26,
    icon: '🍃',
    biome: 'forest',
    levelReq: 3,
    description: 'ป่าเวทมนตร์ลึกลับ แหล่งสถิตของภูติและสมุนไพรศักดิ์สิทธิ์',
    connectedTo: ['ravenhold', 'frostpeak', 'abyssal'],
    type: 'forest'
  },
  {
    id: 'silverport',
    name: 'Silverport Harbor',
    nameTh: 'ท่าเรือซิลเวอร์พอร์ต',
    x: 24,
    y: 44,
    icon: '⚓',
    biome: 'port',
    levelReq: 2,
    description: 'เมืองท่าค้าขายชายฝั่งทะเลตะวันตก มีกองเรือคุ้มกันของราชินี',
    connectedTo: ['ravenhold', 'frostpeak', 'swamp'],
    type: 'port'
  },
  {
    id: 'frostpeak',
    name: 'Frostpeak Citadel',
    nameTh: 'ป้อมปราการยอดเขาหิมะ',
    x: 22,
    y: 20,
    icon: '❄️',
    biome: 'citadel',
    levelReq: 5,
    description: 'ป้อมปราการน้ำแข็งบนยอดเขาสูงชัน มีนักรบวัลคิรีคอยพิทักษ์',
    connectedTo: ['eldertree', 'silverport'],
    type: 'citadel'
  },
  {
    id: 'ruins',
    name: 'Forgotten Ruins',
    nameTh: 'โบราณสถานลืมเลือน',
    x: 74,
    y: 35,
    icon: '🔮',
    biome: 'ruins',
    levelReq: 4,
    description: 'ซากวิหารเวทมนตร์โบราณที่กักเก็บมหาศิลาธาตุทั้งสี่',
    connectedTo: ['ravenhold', 'abyssal', 'dunes'],
    type: 'ruins'
  },
  {
    id: 'swamp',
    name: 'Moonlit Swamp',
    nameTh: 'หนองน้ำใต้แสงจันทร์',
    x: 32,
    y: 72,
    icon: '🌙',
    biome: 'swamp',
    levelReq: 3,
    description: 'บึงพรายมืดมิด เต็มไปด้วยไอพิษและเหล่าแม่มดนอกรีต',
    connectedTo: ['ravenhold', 'silverport', 'dunes'],
    type: 'swamp'
  },
  {
    id: 'dunes',
    name: 'Sunscorch Dunes',
    nameTh: 'เนินทรายเพลิงสุริยา',
    x: 78,
    y: 64,
    icon: '☀️',
    biome: 'dunes',
    levelReq: 5,
    description: 'ทะเลทรายแผดเผา ซากอารยธรรมเก่าที่ถูกกลบฝังใต้ผืนทราย',
    connectedTo: ['ruins', 'swamp'],
    type: 'dunes'
  },
  {
    id: 'abyssal',
    name: 'Abyssal Rift',
    nameTh: 'รอยแยกแห่งความมืด (บอสใหญ่)',
    x: 68,
    y: 15,
    icon: '💎',
    biome: 'dungeon',
    levelReq: 7,
    description: 'รอยแยกมิติแห่งความมืด ดินแดนของจักรพรรดินีมอร์กาน่า',
    connectedTo: ['eldertree', 'ruins'],
    type: 'dungeon'
  }
];
