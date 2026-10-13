import { DialogueLine } from '../types';

export const STORY_CHAPTER_1: DialogueLine[] = [
  {
    speaker: 'Lyria',
    speakerTh: 'ไลเรีย',
    portraitKey: 'lyria',
    text: "The relic... it's not just a weapon. It's the key to sealing the ancient darkness. But the path ahead is fraught with danger.",
    textTh: "มหาศิลาธาตุ... มันไม่ได้เป็นเพียงแค่อาวุธโบราณ แต่มันคือกุญแจสำคัญในการผนึกจอมมารแห่งขุมนรก แต่เส้นทางข้างหน้าเต็มไปด้วยอันตราย",
    emotion: 'serious'
  },
  {
    speaker: 'Arza',
    speakerTh: 'อาร์ซา',
    portraitKey: 'arza',
    text: "My blade is pledged to Ravenhold. As long as I draw breath, no shadow shall extinguish our people's light.",
    textTh: "คมดาบแห่งแสงสุริยาของข้าขอสาบาน ตราบใดที่ข้ายังหายใจ เงาทมิฬจะไม่มีวันกลืนกินรอยยิ้มของผู้คนในเรเวนโฮลด์ได้!",
    emotion: 'normal'
  },
  {
    speaker: 'Selenis',
    speakerTh: 'เซเลนิส',
    portraitKey: 'selenis',
    text: "The winds carry foul whispers from the Forgotten Ruins. Scout reports confirm goblin huntresses and cultists are amassing.",
    textTh: "สายลมกระซิบบอกลางร้ายจากโบราณสถานลืมเลือน หน่วยสอดแนมแจ้งว่าพบพวกก็อบลินและเหล่าแม่มดลัทธิเงากำลังรวมตัวกัน",
    emotion: 'normal'
  },
  {
    speaker: 'Lyria',
    speakerTh: 'ไลเรีย',
    portraitKey: 'lyria',
    text: "Then let us make haste. We must reclaim the Grimoire of Elements before Empress Morgana awakens.",
    textTh: "ถ้าเช่นนั้นเราต้องรีบออกเดินทาง เราต้องกู้คัมภีร์มหาเวท Grimoire of Elements กลับมาก่อนที่จักรพรรดินีมอร์กาน่าจะตื่นขึ้นอย่างสมบูรณ์!",
    emotion: 'smile'
  }
];

export const VICTORY_DIALOGUE: DialogueLine[] = [
  {
    speaker: 'Arza',
    speakerTh: 'อาร์ซา',
    portraitKey: 'arza',
    text: "Battle cleared! The area is secure for now. Let us tend to our wounds and push forward.",
    textTh: "กำจัดศัตรูหมดแล้ว! พื้นที่ปลอดภัยดี ตรวจดูบาดแผลแล้วรีบมุ่งหน้าต่อไปกันเถอะ",
    emotion: 'smile'
  },
  {
    speaker: 'Selenis',
    speakerTh: 'เซเลนิส',
    portraitKey: 'selenis',
    text: "Found some supplies and ancient elemental shards among the ruins. Good spoils!",
    textTh: "ข้าพบขวดยาฟื้นฟูกับเศษผลึกเวทมนตร์โบราณที่ศัตรูทิ้งไว้ด้วย เป็นรางวัลที่ดีทีเดียว!",
    emotion: 'normal'
  }
];
