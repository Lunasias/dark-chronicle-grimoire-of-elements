import { Unit, Skill } from '../types';
import { sounds } from '../audio';
import { getPortraitSVG } from '../portraits';

export class CombatView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private units: Unit[] = [];
  private activeUnitIndex: number = 0;
  private selectedSkill: Skill | null = null;
  private actionMode: 'move' | 'attack' | 'skill' | 'idle' = 'move';
  private hoveredTile: { x: number; y: number } = { x: -1, y: -1 };
  private hoveredUnit: Unit | null = null;
  private targetUnit: Unit | null = null;
  private turnCount: number = 1;
  private isEnemyTurn: boolean = false;
  private floatingTexts: Array<{ x: number; y: number; text: string; color: string; alpha: number }> = [];

  // Isometric constants
  private readonly GRID_SIZE = 8;
  private readonly TILE_W = 68;
  private readonly TILE_H = 34;
  private originX = 410;
  private originY = 120;

  // Map terrain: 0: Cobblestone, 1: Water/Channel, 2: Ruin Pillar, 3: Mystic Seal
  private mapGrid: number[][] = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 2, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 2, 0, 3, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  private onStateChange?: () => void;
  private onVictory?: () => void;

  constructor(canvas: HTMLCanvasElement, initialUnits: Unit[], onStateChange?: () => void, onVictory?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.units = JSON.parse(JSON.stringify(initialUnits));
    this.targetUnit = this.units.find(u => !u.isPlayer) || null;
    this.onStateChange = onStateChange;
    this.onVictory = onVictory;

    this.setupEvents();
    this.selectedSkill = this.getActiveUnit()?.skills[0] || null;
    this.animate();
  }

  public getActiveUnit(): Unit | null {
    const living = this.units.filter(u => !u.isDead && u.isPlayer);
    return living[this.activeUnitIndex % living.length] || null;
  }

  public getAllUnits(): Unit[] {
    return this.units;
  }

  public getTargetUnit(): Unit | null {
    return this.targetUnit || this.hoveredUnit;
  }

  public getTurnCount(): number {
    return this.turnCount;
  }

  public getIsEnemyTurn(): boolean {
    return this.isEnemyTurn;
  }

  public setMode(mode: 'move' | 'attack' | 'skill' | 'idle', skill?: Skill) {
    this.actionMode = mode;
    if (skill) {
      this.selectedSkill = skill;
    }
    sounds.playClick();
    this.onStateChange?.();
  }

  public getSelectedSkill(): Skill | null {
    return this.selectedSkill;
  }

  public getActionMode(): string {
    return this.actionMode;
  }

  public resetBattle(newUnits: Unit[]) {
    this.units = JSON.parse(JSON.stringify(newUnits));
    this.activeUnitIndex = 0;
    this.turnCount = 1;
    this.isEnemyTurn = false;
    this.targetUnit = null;
    this.actionMode = 'move';
    this.selectedSkill = this.getActiveUnit()?.skills[0] || null;
    this.onStateChange?.();
  }

  private gridToScreen(gx: number, gy: number, elevation = 0) {
    const sx = this.originX + (gx - gy) * (this.TILE_W / 2);
    const sy = this.originY + (gx + gy) * (this.TILE_H / 2) - elevation;
    return { x: sx, y: sy };
  }

  private screenToGrid(sx: number, sy: number) {
    const dx = sx - this.originX;
    const dy = sy - this.originY;
    const gx = (dy / (this.TILE_H / 2) + dx / (this.TILE_W / 2)) / 2;
    const gy = (dy / (this.TILE_H / 2) - dx / (this.TILE_W / 2)) / 2;
    return { x: Math.floor(gx), y: Math.floor(gy) };
  }

  private inMoveRange(gx: number, gy: number): boolean {
    const active = this.getActiveUnit();
    if (!active || this.isEnemyTurn || active.isDead) return false;
    const dist = Math.abs(active.gridX - gx) + Math.abs(active.gridY - gy);
    const isOccupied = this.units.some(u => !u.isDead && u.gridX === gx && u.gridY === gy);
    return dist <= 2 && dist > 0 && this.mapGrid[gy]?.[gx] !== 1 && this.mapGrid[gy]?.[gx] !== 2 && !isOccupied;
  }

  private inActionRange(gx: number, gy: number): boolean {
    const active = this.getActiveUnit();
    if (!active || this.isEnemyTurn || active.isDead) return false;
    const range = this.selectedSkill ? this.selectedSkill.range : 1;
    const dist = Math.abs(active.gridX - gx) + Math.abs(active.gridY - gy);
    return dist <= range && dist > 0;
  }

  private setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      const g = this.screenToGrid(mx, my);
      if (g.x >= 0 && g.x < this.GRID_SIZE && g.y >= 0 && g.y < this.GRID_SIZE) {
        this.hoveredTile = g;
        this.hoveredUnit = this.units.find(u => !u.isDead && u.gridX === g.x && u.gridY === g.y) || null;
      } else {
        this.hoveredTile = { x: -1, y: -1 };
        this.hoveredUnit = null;
      }
      this.onStateChange?.();
    });

    this.canvas.addEventListener('click', () => {
      if (this.isEnemyTurn || this.hoveredTile.x === -1) return;
      const active = this.getActiveUnit();
      if (!active || active.isDead) return;

      const hx = this.hoveredTile.x;
      const hy = this.hoveredTile.y;
      const clickedUnit = this.units.find(u => !u.isDead && u.gridX === hx && u.gridY === hy);

      if (clickedUnit) {
        this.targetUnit = clickedUnit;
        this.onStateChange?.();
      }

      // Movement
      if (this.actionMode === 'move' && this.inMoveRange(hx, hy)) {
        active.gridX = hx;
        active.gridY = hy;
        sounds.playClick();
        this.spawnDamageText(hx, hy, 'Moved!', '#38bdf8');
        this.actionMode = 'attack';
        this.onStateChange?.();
        return;
      }

      // Skill or Attack
      if ((this.actionMode === 'attack' || this.actionMode === 'skill') && this.inActionRange(hx, hy)) {
        if (clickedUnit) {
          this.executeSkillOnUnit(active, clickedUnit);
        }
      }
    });
  }

  private executeSkillOnUnit(caster: Unit, target: Unit) {
    const skill = this.selectedSkill || caster.skills[0];
    if (caster.mp < skill.mpCost) {
      const pos = this.gridToScreen(caster.gridX, caster.gridY);
      this.floatingTexts.push({ x: pos.x, y: pos.y - 30, text: 'No MP!', color: '#94a3b8', alpha: 1 });
      return;
    }

    caster.mp -= skill.mpCost;

    if (skill.type === 'damage') {
      if (target.isPlayer) return; // Don't hurt allies
      sounds.playSlash();
      if (skill.element !== 'physical') sounds.playMagic();

      const rawDmg = Math.max(10, caster.atk + skill.power - target.def);
      const isCrit = Math.random() < 0.25;
      const finalDmg = isCrit ? Math.floor(rawDmg * 1.5) : rawDmg;

      target.hp = Math.max(0, target.hp - finalDmg);
      const tPos = this.gridToScreen(target.gridX, target.gridY);
      this.floatingTexts.push({
        x: tPos.x,
        y: tPos.y - 45,
        text: isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`,
        color: isCrit ? '#f59e0b' : '#ef4444',
        alpha: 1
      });

      if (target.hp <= 0) {
        target.isDead = true;
        this.floatingTexts.push({ x: tPos.x, y: tPos.y - 65, text: 'Defeated!', color: '#cbd5e1', alpha: 1 });
        this.checkVictory();
      }
    } else if (skill.type === 'heal') {
      sounds.playHeal();
      const healAmt = skill.power + Math.floor(caster.matk * 0.8);
      target.hp = Math.min(target.maxHp, target.hp + healAmt);
      const tPos = this.gridToScreen(target.gridX, target.gridY);
      this.floatingTexts.push({ x: tPos.x, y: tPos.y - 45, text: `+${healAmt} HP`, color: '#10b981', alpha: 1 });
    } else if (skill.type === 'buff') {
      sounds.playHeal();
      target.def += skill.power;
      const tPos = this.gridToScreen(target.gridX, target.gridY);
      this.floatingTexts.push({ x: tPos.x, y: tPos.y - 45, text: `DEF +${skill.power}`, color: '#38bdf8', alpha: 1 });
    }

    this.onStateChange?.();
  }

  public endTurn() {
    if (this.isEnemyTurn) return;
    sounds.playClick();

    // Check if next player unit exists
    const livingPlayers = this.units.filter(u => !u.isDead && u.isPlayer);
    if (this.activeUnitIndex < livingPlayers.length - 1) {
      this.activeUnitIndex++;
      this.actionMode = 'move';
      this.selectedSkill = this.getActiveUnit()?.skills[0] || null;
      this.onStateChange?.();
      return;
    }

    // Otherwise, Enemy Phase
    this.isEnemyTurn = true;
    this.onStateChange?.();

    setTimeout(() => {
      this.runEnemyTurn();
    }, 800);
  }

  private runEnemyTurn() {
    const livingEnemies = this.units.filter(u => !u.isDead && !u.isPlayer);
    const livingPlayers = this.units.filter(u => !u.isDead && u.isPlayer);

    livingEnemies.forEach((enemy, idx) => {
      setTimeout(() => {
        if (enemy.isDead || livingPlayers.length === 0) return;

        // Find nearest heroine
        let nearestHero = livingPlayers[0];
        let minDist = 999;
        livingPlayers.forEach(hero => {
          const d = Math.abs(hero.gridX - enemy.gridX) + Math.abs(hero.gridY - enemy.gridY);
          if (d < minDist) {
            minDist = d;
            nearestHero = hero;
          }
        });

        // Step closer if not adjacent
        if (minDist > 1) {
          const stepX = enemy.gridX > nearestHero.gridX ? -1 : (enemy.gridX < nearestHero.gridX ? 1 : 0);
          const stepY = enemy.gridY > nearestHero.gridY ? -1 : (enemy.gridY < nearestHero.gridY ? 1 : 0);

          const targetX = enemy.gridX + (Math.abs(enemy.gridX - nearestHero.gridX) >= Math.abs(enemy.gridY - nearestHero.gridY) ? stepX : 0);
          const targetY = enemy.gridY + (Math.abs(enemy.gridX - nearestHero.gridX) < Math.abs(enemy.gridY - nearestHero.gridY) ? stepY : 0);

          const occupied = this.units.some(u => !u.isDead && u.gridX === targetX && u.gridY === targetY);
          if (!occupied && this.mapGrid[targetY]?.[targetX] === 0) {
            enemy.gridX = targetX;
            enemy.gridY = targetY;
          }
        }

        // Attack if within reach 1
        const curDist = Math.abs(enemy.gridX - nearestHero.gridX) + Math.abs(enemy.gridY - nearestHero.gridY);
        if (curDist <= 1) {
          sounds.playSlash();
          const dmg = Math.max(8, enemy.atk + 10 - nearestHero.def);
          nearestHero.hp = Math.max(0, nearestHero.hp - dmg);
          const hPos = this.gridToScreen(nearestHero.gridX, nearestHero.gridY);
          this.floatingTexts.push({ x: hPos.x, y: hPos.y - 45, text: `-${dmg}`, color: '#ef4444', alpha: 1 });

          if (nearestHero.hp <= 0) {
            nearestHero.isDead = true;
          }
        }
      }, idx * 600);
    });

    setTimeout(() => {
      // Restore turn to players
      this.isEnemyTurn = false;
      this.turnCount++;
      this.activeUnitIndex = 0;
      this.actionMode = 'move';
      this.selectedSkill = this.getActiveUnit()?.skills[0] || null;

      // Small MP regeneration
      this.units.filter(u => !u.isDead && u.isPlayer).forEach(p => {
        p.mp = Math.min(p.maxMp, p.mp + 4);
      });

      this.onStateChange?.();
    }, livingEnemies.length * 600 + 400);
  }

  private checkVictory() {
    const enemies = this.units.filter(u => !u.isDead && !u.isPlayer);
    if (enemies.length === 0) {
      sounds.playFanfare();
      setTimeout(() => {
        this.onVictory?.();
      }, 500);
    }
  }

  private spawnDamageText(gx: number, gy: number, text: string, color: string) {
    const pos = this.gridToScreen(gx, gy);
    this.floatingTexts.push({ x: pos.x, y: pos.y - 35, text, color, alpha: 1 });
  }

  private drawTile(gx: number, gy: number) {
    const type = this.mapGrid[gy][gx];
    const isPillar = type === 2;
    const isWater = type === 1;
    const isSeal = type === 3;
    const height = isPillar ? 24 : 8;

    const pos = this.gridToScreen(gx, gy);
    const topY = pos.y - (isPillar ? 24 : 0);

    // Block side faces (Isometric depth)
    if (!isWater) {
      // Left Face
      this.ctx.fillStyle = isPillar ? '#475569' : '#263345';
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x - this.TILE_W / 2, topY);
      this.ctx.lineTo(pos.x, topY + this.TILE_H / 2);
      this.ctx.lineTo(pos.x, topY + this.TILE_H / 2 + height);
      this.ctx.lineTo(pos.x - this.TILE_W / 2, topY + height);
      this.ctx.closePath();
      this.ctx.fill();

      // Right Face
      this.ctx.fillStyle = isPillar ? '#334155' : '#1c2635';
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, topY + this.TILE_H / 2);
      this.ctx.lineTo(pos.x + this.TILE_W / 2, topY);
      this.ctx.lineTo(pos.x + this.TILE_W / 2, topY + height);
      this.ctx.lineTo(pos.x, topY + this.TILE_H / 2 + height);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Top diamond face
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, topY - this.TILE_H / 2);
    this.ctx.lineTo(pos.x + this.TILE_W / 2, topY);
    this.ctx.lineTo(pos.x, topY + this.TILE_H / 2);
    this.ctx.lineTo(pos.x - this.TILE_W / 2, topY);
    this.ctx.closePath();

    if (isPillar) {
      this.ctx.fillStyle = '#64748b';
    } else if (isWater) {
      this.ctx.fillStyle = '#0284c7';
    } else if (isSeal) {
      this.ctx.fillStyle = '#8b5cf6';
    } else {
      // Crisp checkered stone tiles with light reflections
      this.ctx.fillStyle = (gx + gy) % 2 === 0 ? '#44536b' : '#39465b';
    }
    this.ctx.fill();

    // Subtle edge highlight
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Movement Range Highlight (Blue diamond)
    if (this.actionMode === 'move' && this.inMoveRange(gx, gy)) {
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Action / Skill Range Highlight (Red diamond)
    if ((this.actionMode === 'attack' || this.actionMode === 'skill') && this.inActionRange(gx, gy)) {
      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#f87171';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Hover wireframe
    if (this.hoveredTile.x === gx && this.hoveredTile.y === gy) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fill();
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawUnit(unit: Unit) {
    if (unit.isDead) return;

    const isPillar = this.mapGrid[unit.gridY][unit.gridX] === 2;
    const elev = isPillar ? 24 : 0;
    const pos = this.gridToScreen(unit.gridX, unit.gridY, elev);

    // Oval base shadow
    this.ctx.beginPath();
    this.ctx.ellipse(pos.x, pos.y, 16, 8, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fill();

    const charY = pos.y - 22;

    // Active unit glowing halo ring
    const active = this.getActiveUnit();
    if (active && active.id === unit.id && !this.isEnemyTurn) {
      this.ctx.beginPath();
      this.ctx.ellipse(pos.x, pos.y, 22, 11, 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();
    }

    // 2.5D Chibi Token
    this.ctx.beginPath();
    this.ctx.arc(pos.x, charY, 18, 0, Math.PI * 2);
    this.ctx.fillStyle = unit.color;
    this.ctx.fill();
    this.ctx.strokeStyle = unit.isPlayer ? '#93c5fd' : '#fca5a5';
    this.ctx.lineWidth = 2.5;
    this.ctx.stroke();

    // Emblem or Icon inside token
    this.ctx.font = '16px "Segoe UI Emoji", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    const icon = unit.isPlayer ? (unit.id === 'arza' ? '⚔️' : unit.id === 'lyria' ? '✨' : '🏹') : (unit.id.includes('goblin') ? '🗡️' : '🔮');
    this.ctx.fillText(icon, pos.x, charY + 1);

    // Miniature HP Bar above head
    const barW = 34;
    const barH = 5;
    const barX = pos.x - barW / 2;
    const barY = charY - 26;

    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    const pct = Math.max(0, unit.hp / unit.maxHp);
    this.ctx.fillStyle = unit.isPlayer ? '#10b981' : '#ef4444';
    this.ctx.fillRect(barX, barY, barW * pct, barH);
  }

  private animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render tiles and units in Isometric painter order
    for (let y = 0; y < this.GRID_SIZE; y++) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        this.drawTile(x, y);

        const unitOnTile = this.units.find(u => !u.isDead && u.gridX === x && u.gridY === y);
        if (unitOnTile) {
          this.drawUnit(unitOnTile);
        }
      }
    }

    // Floating text render & update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
      ft.y -= 0.7;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    requestAnimationFrame(this.animate);
  };
}
