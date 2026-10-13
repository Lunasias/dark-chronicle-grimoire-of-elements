// High-quality SVG Portraits for all female characters
export const PORTRAITS: Record<string, string> = {
  arza: `
    <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="arza-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="arza-hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="arza-armor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
        <linearGradient id="arza-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#arza-bg)" rx="10"/>
      <!-- Glowing aura -->
      <circle cx="80" cy="80" r="64" fill="rgba(56, 189, 248, 0.25)"/>
      <!-- Back hair -->
      <path d="M35 65 Q22 110 30 155 Q80 162 130 155 Q138 110 125 65 Z" fill="url(#arza-hair)"/>
      <!-- Face -->
      <path d="M50 50 Q80 115 110 50 Q116 30 80 28 Q44 30 50 50 Z" fill="#ffedd5"/>
      <!-- Blush -->
      <ellipse cx="60" cy="74" rx="8" ry="4" fill="rgba(244, 63, 94, 0.35)"/>
      <ellipse cx="100" cy="74" rx="8" ry="4" fill="rgba(244, 63, 94, 0.35)"/>
      <!-- Eyes -->
      <ellipse cx="65" cy="65" rx="7.5" ry="9.5" fill="#0284c7"/>
      <ellipse cx="95" cy="65" rx="7.5" ry="9.5" fill="#0284c7"/>
      <circle cx="68" cy="62" r="3" fill="#ffffff"/>
      <circle cx="98" cy="62" r="3" fill="#ffffff"/>
      <!-- Eyelashes / Eyebrows -->
      <path d="M54 56 Q65 50 74 56" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M86 56 Q95 50 106 56" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Nose & Mouth -->
      <path d="M80 72 L79 75" stroke="#f97316" stroke-width="2" stroke-linecap="round"/>
      <path d="M73 82 Q80 87 87 82" stroke="#e11d48" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Front Bangs -->
      <path d="M46 42 Q68 70 78 40 Q88 70 114 42 Q122 26 80 22 Q38 26 46 42 Z" fill="url(#arza-hair)"/>
      <path d="M62 38 L72 65 L78 36" fill="url(#arza-hair)"/>
      <!-- Armor Gorget & Pauldrons -->
      <path d="M42 105 L80 120 L118 105 L140 160 L20 160 Z" fill="url(#arza-armor)"/>
      <path d="M72 120 L80 160 L88 120 Z" fill="url(#arza-gold)"/>
      <path d="M48 114 Q80 134 112 114" stroke="url(#arza-gold)" stroke-width="3.5" fill="none"/>
      <!-- Knight Cape -->
      <path d="M20 120 L42 105 L25 160 Z" fill="#2563eb"/>
      <path d="M140 120 L118 105 L135 160 Z" fill="#2563eb"/>
    </svg>
  `,

  lyria: `
    <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lyria-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="lyria-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="60%" stop-color="#e0e7ff"/>
          <stop offset="100%" stop-color="#c7d2fe"/>
        </linearGradient>
        <linearGradient id="lyria-robe" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="70%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#172554"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#lyria-bg)" rx="10"/>
      <!-- Glowing aura -->
      <circle cx="80" cy="80" r="64" fill="rgba(192, 132, 252, 0.25)"/>
      <!-- Long Silver Hair Back -->
      <path d="M30 65 Q18 115 28 155 Q80 165 132 155 Q142 115 130 65 Z" fill="url(#lyria-hair)"/>
      <!-- Face -->
      <path d="M52 50 Q80 114 108 50 Q114 32 80 30 Q46 32 52 50 Z" fill="#fff7ed"/>
      <ellipse cx="62" cy="74" rx="8" ry="4" fill="rgba(244, 63, 94, 0.35)"/>
      <ellipse cx="98" cy="74" rx="8" ry="4" fill="rgba(244, 63, 94, 0.35)"/>
      <!-- Violet Eyes -->
      <ellipse cx="66" cy="65" rx="7.5" ry="9.5" fill="#a855f7"/>
      <ellipse cx="94" cy="65" rx="7.5" ry="9.5" fill="#a855f7"/>
      <circle cx="68" cy="62" r="3" fill="#ffffff"/>
      <circle cx="96" cy="62" r="3" fill="#ffffff"/>
      <!-- Brows & Lips -->
      <path d="M56 56 Q66 50 74 56" stroke="#312e81" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M86 56 Q94 50 104 56" stroke="#312e81" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M74 82 Q80 86 86 82" stroke="#f43f5e" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <!-- Front Bangs -->
      <path d="M48 44 Q70 68 80 40 Q90 68 112 44 Q122 28 80 24 Q38 28 48 44 Z" fill="url(#lyria-hair)"/>
      <!-- Circlet Tiara -->
      <path d="M50 40 Q80 46 110 40" stroke="#facc15" stroke-width="3.5" fill="none"/>
      <circle cx="80" cy="43" r="5" fill="#38bdf8"/>
      <!-- Robe / Vestment -->
      <path d="M42 106 L80 118 L118 106 L140 160 L20 160 Z" fill="url(#lyria-robe)"/>
      <path d="M68 118 L80 160 L92 118 Z" fill="#ffffff"/>
      <circle cx="80" cy="124" r="5" fill="#facc15"/>
    </svg>
  `,

  selenis: `
    <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sel-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#022c22"/>
        </linearGradient>
        <linearGradient id="sel-hair" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#sel-bg)" rx="10"/>
      <!-- Glowing aura -->
      <circle cx="80" cy="80" r="64" fill="rgba(52, 211, 153, 0.25)"/>
      <!-- Hood Back -->
      <path d="M35 50 Q20 100 25 160 L135 160 Q140 100 125 50 Q80 20 35 50 Z" fill="#047857"/>
      <!-- Hair strands -->
      <path d="M42 60 Q38 120 45 150 Q80 155 115 150 Q122 120 118 60 Z" fill="url(#sel-hair)"/>
      <!-- Elf Face -->
      <path d="M54 54 Q80 114 106 54 Q112 36 80 34 Q48 36 54 54 Z" fill="#fef3c7"/>
      <!-- Elf Ears -->
      <path d="M48 64 L20 44 L44 72 Z" fill="#fef3c7"/>
      <path d="M112 64 L140 44 L116 72 Z" fill="#fef3c7"/>
      <!-- Emerald Eyes -->
      <ellipse cx="67" cy="66" rx="7" ry="9" fill="#10b981"/>
      <ellipse cx="93" cy="66" rx="7" ry="9" fill="#10b981"/>
      <circle cx="68" cy="63" r="2.8" fill="#ffffff"/>
      <circle cx="94" cy="63" r="2.8" fill="#ffffff"/>
      <!-- Lips -->
      <path d="M75 83 Q80 87 85 83" stroke="#fb7185" stroke-width="2.5" fill="none"/>
      <!-- Hood / Cloak Front -->
      <path d="M36 50 Q80 24 124 50 L114 74 Q80 40 46 74 Z" fill="#10b981"/>
      <!-- Scout Leather Armor -->
      <path d="M45 110 L80 120 L115 110 L138 160 L22 160 Z" fill="#92400e"/>
      <circle cx="80" cy="128" r="5" fill="#f59e0b"/>
    </svg>
  `,

  goblin: `
    <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gob-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#gob-bg)" rx="10"/>
      <!-- Glowing aura -->
      <circle cx="80" cy="80" r="64" fill="rgba(239, 68, 68, 0.25)"/>
      <!-- Wild Purple Hair -->
      <path d="M28 45 Q15 90 22 150 Q80 160 138 150 Q145 90 132 45 Z" fill="#d946ef"/>
      <!-- Goblin Face (Female) -->
      <path d="M50 54 Q80 115 110 54 Q116 34 80 32 Q44 34 50 54 Z" fill="#bef264"/>
      <!-- Long Pointy Goblin Ears -->
      <path d="M48 64 L12 40 L40 74 Z" fill="#bef264"/>
      <path d="M112 64 L148 40 L120 74 Z" fill="#bef264"/>
      <!-- Red Eyes -->
      <ellipse cx="65" cy="65" rx="7.5" ry="9.5" fill="#ef4444"/>
      <ellipse cx="95" cy="65" rx="7.5" ry="9.5" fill="#ef4444"/>
      <circle cx="67" cy="62" r="3" fill="#fef08a"/>
      <circle cx="97" cy="62" r="3" fill="#fef08a"/>
      <!-- Fangs -->
      <path d="M72 84 Q80 89 88 84" stroke="#1c1917" stroke-width="2.5" fill="none"/>
      <polygon points="73,84 76,92 78,84" fill="#ffffff"/>
      <polygon points="82,84 84,92 87,84" fill="#ffffff"/>
      <!-- Red Headband -->
      <path d="M40 44 Q80 38 120 44 L122 52 Q80 46 38 52 Z" fill="#dc2626"/>
      <!-- Armor / Tribal Leathers -->
      <path d="M45 110 L80 122 L115 110 L136 160 L24 160 Z" fill="#78716c"/>
      <circle cx="80" cy="128" r="6" fill="#f59e0b"/>
    </svg>
  `,

  sorceress: `
    <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sorc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#9333ea"/>
          <stop offset="100%" stop-color="#3b0764"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#sorc-bg)" rx="10"/>
      <!-- Glowing aura -->
      <circle cx="80" cy="80" r="64" fill="rgba(192, 132, 252, 0.3)"/>
      <!-- Horns -->
      <path d="M36 44 Q18 10 26 4 Q40 22 52 40 Z" fill="#2e1065" stroke="#d8b4fe" stroke-width="2"/>
      <path d="M124 44 Q142 10 134 4 Q120 22 108 40 Z" fill="#2e1065" stroke="#d8b4fe" stroke-width="2"/>
      <!-- Violet Hair -->
      <path d="M30 55 Q16 110 24 155 Q80 165 136 155 Q144 110 130 55 Z" fill="#581c87"/>
      <!-- Pale Face -->
      <path d="M52 52 Q80 114 108 52 Q114 32 80 30 Q46 32 52 52 Z" fill="#fdf4ff"/>
      <!-- Violet Eyes -->
      <ellipse cx="66" cy="65" rx="7.5" ry="9.5" fill="#c084fc"/>
      <ellipse cx="94" cy="65" rx="7.5" ry="9.5" fill="#c084fc"/>
      <circle cx="68" cy="62" r="3" fill="#ffffff"/>
      <circle cx="96" cy="62" r="3" fill="#ffffff"/>
      <!-- Lipstick -->
      <path d="M74 83 Q80 87 86 83" stroke="#581c87" stroke-width="3" fill="none"/>
      <!-- Forehead rune -->
      <polygon points="80,40 83,47 80,54 77,47" fill="#d8b4fe"/>
      <!-- Robe -->
      <path d="M40 108 L80 120 L120 108 L142 160 L18 160 Z" fill="#3b0764"/>
      <path d="M48 98 Q80 118 112 98" stroke="#d8b4fe" stroke-width="2.5" fill="none"/>
    </svg>
  `,

  morgana: `
    <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="morg-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#831843"/>
          <stop offset="100%" stop-color="#18040d"/>
        </radialGradient>
      </defs>
      <rect width="160" height="160" fill="url(#morg-bg)" rx="10"/>
      <!-- Abyssal Crown -->
      <polygon points="50,42 62,20 70,36 80,12 90,36 98,20 110,42" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
      <!-- Raven Hair -->
      <path d="M30 60 Q18 120 25 160 Q80 165 135 160 Q142 120 130 60 Z" fill="#09090b"/>
      <!-- Empress Face -->
      <path d="M52 56 Q80 115 108 56 Q114 36 80 34 Q46 36 52 56 Z" fill="#fce7f3"/>
      <!-- Crimson Glowing Eyes -->
      <ellipse cx="66" cy="68" rx="6" ry="8" fill="#e11d48"/>
      <ellipse cx="94" cy="68" rx="6" ry="8" fill="#e11d48"/>
      <circle cx="68" cy="66" r="2" fill="#ffffff"/>
      <circle cx="96" cy="66" r="2" fill="#ffffff"/>
      <path d="M74 86 Q80 89 86 86" stroke="#9f1239" stroke-width="3" fill="none"/>
      <!-- Royal Dark Empress Robe -->
      <path d="M40 108 L80 120 L120 108 L142 160 L18 160 Z" fill="#4c0519"/>
      <circle cx="80" cy="125" r="7" fill="#f43f5e"/>
    </svg>
  `
};

export function getPortraitSVG(key: string): string {
  return PORTRAITS[key] || PORTRAITS['arza'];
}
