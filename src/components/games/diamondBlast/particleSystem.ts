// 60 FPS HTML5 Canvas Particle Engine for Diamond Blast

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'shard' | 'spark' | 'smoke' | 'ring' | 'star';
  maxLife: number;
  life: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
  life: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private densityMultiplier: number = 1.0;

  constructor() {}

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.startLoop();
  }

  public setDensity(density: 'low' | 'medium' | 'high') {
    if (density === 'low') this.densityMultiplier = 0.5;
    else if (density === 'medium') this.densityMultiplier = 1.0;
    else this.densityMultiplier = 1.7;
  }

  public destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.particles = [];
    this.floatingTexts = [];
    this.canvas = null;
    this.ctx = null;
  }

  // Spawn crystal shards when gems are matched
  public emitGemsBurst(x: number, y: number, colorHex: string, count: number = 14) {
    const total = Math.floor(count * this.densityMultiplier);
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 6,
        color: colorHex,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        shape: Math.random() > 0.4 ? 'shard' : 'spark',
        maxLife: 45,
        life: 0
      });
    }
  }

  // Spawn dynamite bomb explosion with fire, shockwave and smoke
  public emitBombExplosion(x: number, y: number) {
    const total = Math.floor(35 * this.densityMultiplier);

    // Expanding shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15,
      color: '#f59e0b',
      alpha: 0.9,
      decay: 0.03,
      rotation: 0,
      vRot: 0,
      shape: 'ring',
      maxLife: 30,
      life: 0
    });

    // Fire sparks
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      const colors = ['#f59e0b', '#ea580c', '#ef4444', '#fbbf24', '#ffffff'];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.025 + Math.random() * 0.025,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        shape: 'spark',
        maxLife: 40,
        life: 0
      });
    }

    // Gray smoke billows
    const smokeTotal = Math.floor(18 * this.densityMultiplier);
    for (let i = 0; i < smokeTotal; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 8 + Math.random() * 14,
        color: '#475569',
        alpha: 0.7,
        decay: 0.015,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.1,
        shape: 'smoke',
        maxLife: 55,
        life: 0
      });
    }
  }

  // Laser Line Blast sweep
  public emitLaserLine(x1: number, y1: number, x2: number, y2: number, isHorizontal: boolean) {
    const total = Math.floor(40 * this.densityMultiplier);
    for (let i = 0; i < total; i++) {
      const progress = Math.random();
      const px = x1 + (x2 - x1) * progress;
      const py = y1 + (y2 - y1) * progress;
      const speed = 1.5 + Math.random() * 4;
      const dir = Math.random() > 0.5 ? 1 : -1;

      this.particles.push({
        x: px,
        y: py,
        vx: isHorizontal ? (Math.random() - 0.5) * 3 : dir * speed,
        vy: isHorizontal ? dir * speed : (Math.random() - 0.5) * 3,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.3 ? '#38bdf8' : '#ffffff',
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03,
        rotation: 0,
        vRot: 0,
        shape: 'spark',
        maxLife: 30,
        life: 0
      });
    }
  }

  // Rainbow Diamond chromatic stars
  public emitRainbowBurst(x: number, y: number) {
    const total = Math.floor(45 * this.densityMultiplier);
    const rainbowColors = ['#f43f5e', '#eab308', '#10b981', '#06b6d4', '#a855f7', '#ec4899'];
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 4 + Math.random() * 6,
        color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        shape: 'star',
        maxLife: 45,
        life: 0
      });
    }
  }

  // Floating score text popup
  public addFloatingText(x: number, y: number, text: string, color: string = '#facc15') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.6,
      scale: 1.2,
      life: 0
    });
  }

  private startLoop() {
    const loop = () => {
      this.updateAndRender();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  private updateAndRender() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Render particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gentle gravity
      p.rotation += p.vRot;
      p.alpha -= p.decay;
      p.life++;

      if (p.alpha <= 0 || p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 + (p.life / p.maxLife) * 4), 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (p.shape === 'shard') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.7, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 + p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const a = (j * Math.PI * 2) / 5;
          const r1 = p.size;
          const r2 = p.size * 0.45;
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.lineTo(Math.cos(a + Math.PI / 5) * r2, Math.sin(a + Math.PI / 5) * r2);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Spark
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      ctx.restore();
    }

    // Render floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life++;
      if (ft.scale > 1.0) ft.scale -= 0.02;
      if (ft.life > 20) ft.alpha -= 0.035;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `bold ${Math.floor(18 * ft.scale)}px sans-serif`;
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);

      // Fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
