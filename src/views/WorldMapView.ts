import { WorldNode } from '../types';
import { WORLD_NODES } from '../data/worldMap';
import { sounds } from '../audio';

export class WorldMapView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: WorldNode[] = WORLD_NODES;
  private currentNodeId: string = 'ravenhold';
  private hoveredNodeId: string | null = null;
  private selectedNodeId: string | null = 'ravenhold';
  private partyPos = { x: 50, y: 50 }; // percent
  private targetPos = { x: 50, y: 50 };
  private isTraveling: boolean = false;
  private onNodeSelected?: (node: WorldNode) => void;
  private onStartBattle?: (node: WorldNode) => void;

  constructor(canvas: HTMLCanvasElement, onNodeSelected?: (node: WorldNode) => void, onStartBattle?: (node: WorldNode) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onNodeSelected = onNodeSelected;
    this.onStartBattle = onStartBattle;

    const startNode = this.nodes.find(n => n.id === this.currentNodeId)!;
    this.partyPos = { x: startNode.x, y: startNode.y };
    this.targetPos = { x: startNode.x, y: startNode.y };

    this.setupEvents();
    this.animate();
  }

  public getCurrentNode(): WorldNode {
    return this.nodes.find(n => n.id === this.currentNodeId)!;
  }

  public getSelectedNode(): WorldNode {
    return this.nodes.find(n => n.id === this.selectedNodeId) || this.getCurrentNode();
  }

  public travelTo(nodeId: string) {
    const target = this.nodes.find(n => n.id === nodeId);
    if (!target || this.isTraveling) return;

    sounds.playClick();
    this.selectedNodeId = nodeId;
    this.targetPos = { x: target.x, y: target.y };
    this.isTraveling = true;
    this.currentNodeId = nodeId;
    this.onNodeSelected?.(target);
  }

  private setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let found: string | null = null;
      for (const node of this.nodes) {
        const nx = (node.x / 100) * this.canvas.width;
        const ny = (node.y / 100) * this.canvas.height;
        const dist = Math.hypot(mx - nx, my - ny);
        if (dist <= 26) {
          found = node.id;
          break;
        }
      }
      this.hoveredNodeId = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.isTraveling || !this.hoveredNodeId) return;
      const clicked = this.nodes.find(n => n.id === this.hoveredNodeId);
      if (clicked) {
        this.travelTo(clicked.id);
      }
    });
  }

  private drawBackground() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Ocean gradient
    const oceanGrad = this.ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.7);
    oceanGrad.addColorStop(0, '#102a43');
    oceanGrad.addColorStop(1, '#061524');
    this.ctx.fillStyle = oceanGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Continental landmass shape (Fantasy archipelago)
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.5, h * 0.5, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1e382b'; // Dark lush continent base
    this.ctx.fill();
    this.ctx.strokeStyle = '#2d5a43';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Biome Overlays
    // 1. Frostpeak (Northwest snow cap)
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.26, h * 0.24, w * 0.16, h * 0.14, -0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
    this.ctx.fill();

    // 2. Abyssal Rift (Northeast volcanic glow)
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.68, h * 0.18, w * 0.12, h * 0.1, 0.1, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    this.ctx.fill();

    // 3. Sunscorch Dunes (East desert)
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.76, h * 0.62, w * 0.15, h * 0.15, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    this.ctx.fill();

    // 4. Moonlit Swamp (Southwest swamp)
    this.ctx.beginPath();
    this.ctx.ellipse(w * 0.32, h * 0.70, w * 0.14, h * 0.12, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(126, 34, 206, 0.35)';
    this.ctx.fill();
  }

  private drawConnections() {
    const drawnPairs = new Set<string>();

    for (const node of this.nodes) {
      const x1 = (node.x / 100) * this.canvas.width;
      const y1 = (node.y / 100) * this.canvas.height;

      for (const targetId of node.connectedTo) {
        const pairKey = [node.id, targetId].sort().join('-');
        if (drawnPairs.has(pairKey)) continue;
        drawnPairs.add(pairKey);

        const target = this.nodes.find(n => n.id === targetId);
        if (!target) continue;

        const x2 = (target.x / 100) * this.canvas.width;
        const y2 = (target.y / 100) * this.canvas.height;

        // White dashed line
        this.ctx.beginPath();
        this.ctx.setLineDash([6, 6]);
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = 'rgba(248, 250, 252, 0.45)';
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Intermediate Waypoint Dots
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        this.ctx.beginPath();
        this.ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fill();
      }
    }
  }

  private drawNodes() {
    for (const node of this.nodes) {
      const nx = (node.x / 100) * this.canvas.width;
      const ny = (node.y / 100) * this.canvas.height;
      const isSelected = this.selectedNodeId === node.id;
      const isHovered = this.hoveredNodeId === node.id;

      // Glow halo
      if (isSelected || isHovered) {
        this.ctx.beginPath();
        this.ctx.arc(nx, ny, 26, 0, Math.PI * 2);
        this.ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(245, 158, 11, 0.35)';
        this.ctx.fill();
      }

      // Outer node ring
      this.ctx.beginPath();
      this.ctx.arc(nx, ny, 18, 0, Math.PI * 2);
      this.ctx.fillStyle = isSelected ? '#0284c7' : '#1e293b';
      this.ctx.fill();
      this.ctx.strokeStyle = isSelected ? '#38bdf8' : (isHovered ? '#fbbf24' : '#64748b');
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      // Icon
      this.ctx.font = '16px "Segoe UI Emoji", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(node.icon, nx, ny);

      // Name banner below node
      this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
      const textWidth = this.ctx.measureText(node.name).width;
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      this.ctx.fillRect(nx - textWidth / 2 - 6, ny + 22, textWidth + 12, 18);
      this.ctx.strokeStyle = '#334155';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(nx - textWidth / 2 - 6, ny + 22, textWidth + 12, 18);

      this.ctx.fillStyle = isSelected ? '#38bdf8' : '#f8fafc';
      this.ctx.fillText(node.name, nx, ny + 32);
    }
  }

  private drawPartyToken() {
    const px = (this.partyPos.x / 100) * this.canvas.width;
    const py = (this.partyPos.y / 100) * this.canvas.height;

    // Pulse wave
    this.ctx.beginPath();
    this.ctx.arc(px, py - 30, 14, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.font = '13px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('👸', px, py - 30);
  }

  private animate = () => {
    // Travel interpolation
    if (this.isTraveling) {
      const dx = this.targetPos.x - this.partyPos.x;
      const dy = this.targetPos.y - this.partyPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.8) {
        this.partyPos.x = this.targetPos.x;
        this.partyPos.y = this.targetPos.y;
        this.isTraveling = false;
        sounds.playClick();
      } else {
        this.partyPos.x += (dx / dist) * 0.9;
        this.partyPos.y += (dy / dist) * 0.9;
      }
    }

    this.drawBackground();
    this.drawConnections();
    this.drawNodes();
    this.drawPartyToken();

    requestAnimationFrame(this.animate);
  };
}
