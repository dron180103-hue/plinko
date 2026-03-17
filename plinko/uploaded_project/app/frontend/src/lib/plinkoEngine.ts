// ============================================================
// Plinko Physics Engine — Triangular layout, 3-row multiplier display
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  trail: { x: number; y: number; age: number }[];
  landed: boolean;
  landedSlot: number;
  color: string;
  glow: string;
  trailColor: string;
  bet: number;
  skinId: string;
}

export interface Peg {
  x: number;
  y: number;
  radius: number;
  hitTimer: number;
}

export interface Slot {
  x: number;
  width: number;
  multiplier: number;
  color: string;
  glowColor: string;
  hitTimer: number;
}

export interface SlotRow {
  risk: RiskLevel;
  slots: Slot[];
}

export interface PlinkoBoard {
  pegs: Peg[];
  slots: Slot[];        // active risk slots (used for physics landing)
  allSlotRows: SlotRow[]; // all 3 risk rows for display
  balls: Ball[];
  width: number;
  height: number;
  rows: number;
  pegRadius: number;
  ballRadius: number;
  riskLevel: RiskLevel;
  // Triangle bounds for decorative outline
  triTop: { x: number; y: number };
  triBottomLeft: { x: number; y: number };
  triBottomRight: { x: number; y: number };
}

const GRAVITY = 0.15;
const FRICTION = 0.99;
const BOUNCE_FACTOR = 0.55;
const TRAIL_MAX_LENGTH = 12;

// Reference image multiplier values for 14 rows (15 slots)
const MULTIPLIER_CONFIGS: Record<RiskLevel, Record<number, number[]>> = {
  low: {
    8:  [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [12, 3.2, 1.6, 1.3, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.3, 1.6, 3.2, 12],
    14: [18, 3.2, 1.6, 1.3, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.3, 1.6, 3.2, 18],
    16: [18, 3.2, 1.6, 1.3, 1.2, 1.1, 1, 0.5, 0.5, 1, 1.1, 1.2, 1.3, 1.6, 3.2, 18],
  },
  medium: {
    8:  [12, 3.2, 1, 0.7, 0.2, 0.7, 1, 3.2, 12],
    12: [33, 12, 5.6, 3.2, 1.6, 1, 0.7, 0.2, 0.7, 1, 1.6, 3.2, 5.6, 12, 33],
    14: [55, 12, 5.6, 3.2, 1.6, 1, 0.7, 0.2, 0.7, 1, 1.6, 3.2, 5.6, 12, 55],
    16: [55, 12, 5.6, 3.2, 1.6, 1, 0.7, 0.2, 0.2, 0.7, 1, 1.6, 3.2, 5.6, 12, 55],
  },
  high: {
    8:  [29, 5.3, 0.5, 0.2, 0.2, 0.2, 0.5, 5.3, 29],
    12: [170, 49, 14, 5.3, 2.1, 0.5, 0.2, 0.2, 0.5, 2.1, 5.3, 14, 49, 170],
    14: [353, 49, 14, 5.3, 2.1, 0.5, 0.2, 0.2, 0.2, 0.5, 2.1, 5.3, 14, 49, 353],
    16: [353, 49, 14, 5.3, 2.1, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 2.1, 5.3, 14, 49, 353],
  },
};

function getSlotColor(mult: number): { bg: string; glow: string } {
  if (mult >= 100) return { bg: '#F44336', glow: 'rgba(244,67,54,0.7)' };
  if (mult >= 20)  return { bg: '#FF5722', glow: 'rgba(255,87,34,0.6)' };
  if (mult >= 5)   return { bg: '#FF9800', glow: 'rgba(255,152,0,0.5)' };
  if (mult >= 2)   return { bg: '#FFC107', glow: 'rgba(255,193,7,0.4)' };
  if (mult >= 1)   return { bg: '#FFEB3B', glow: 'rgba(255,235,59,0.3)' };
  if (mult >= 0.5) return { bg: '#8BC34A', glow: 'rgba(139,195,74,0.3)' };
  return { bg: '#4CAF50', glow: 'rgba(76,175,80,0.4)' };
}

let ballIdCounter = 0;

export function getMultipliers(risk: RiskLevel, rows: number): number[] {
  return MULTIPLIER_CONFIGS[risk][rows] || MULTIPLIER_CONFIGS[risk][14] || MULTIPLIER_CONFIGS[risk][12];
}

function buildSlotRow(risk: RiskLevel, rows: number, boardWidth: number, width: number): SlotRow {
  const multipliers = getMultipliers(risk, rows);
  const slotCount = multipliers.length;
  const bw = boardWidth * 0.88;
  const slotWidth = bw / slotCount;
  const startX = (width - bw) / 2;

  const slots: Slot[] = multipliers.map((mult, i) => {
    const colors = getSlotColor(mult);
    return {
      x: startX + i * slotWidth,
      width: slotWidth,
      multiplier: mult,
      color: colors.bg,
      glowColor: colors.glow,
      hitTimer: 0,
    };
  });
  return { risk, slots };
}

export function createBoard(width: number, height: number, rows: number = 14, risk: RiskLevel = 'medium'): PlinkoBoard {
  const pegRadius = Math.max(2.5, Math.min(3.5, width * 0.008));
  const ballRadius = Math.max(5, Math.min(7, width * 0.015));

  const pegs: Peg[] = [];
  const topPadding = height * 0.06;
  const bottomPadding = height * 0.22; // more room for 3 slot rows
  const usableHeight = height - topPadding - bottomPadding;
  const rowSpacing = usableHeight / (rows + 1);

  // Triangle peg layout
  const boardUsableWidth = width * 0.85;
  let triTopY = Infinity, triBottomY = 0;
  let triLeftX = Infinity, triRightX = 0;

  for (let row = 0; row < rows; row++) {
    const pegsInRow = row + 3;
    const rowFraction = (row + 1) / (rows + 1);
    const rowWidth = boardUsableWidth * (0.15 + 0.85 * rowFraction);
    const pegSpacing = rowWidth / (pegsInRow - 1 || 1);
    const startX = (width - rowWidth) / 2;
    const y = topPadding + (row + 1) * rowSpacing;

    for (let col = 0; col < pegsInRow; col++) {
      const x = pegsInRow === 1 ? width / 2 : startX + col * pegSpacing;
      pegs.push({ x, y, radius: pegRadius, hitTimer: 0 });
      if (x < triLeftX) triLeftX = x;
      if (x > triRightX) triRightX = x;
    }
    if (y < triTopY) triTopY = y;
    if (y > triBottomY) triBottomY = y;
  }

  // Build all 3 risk rows
  const risks: RiskLevel[] = ['low', 'medium', 'high'];
  const allSlotRows = risks.map(r => buildSlotRow(r, rows, width, width));

  // Active slots = current risk
  const activeRow = allSlotRows.find(r => r.risk === risk)!;

  return {
    pegs,
    slots: activeRow.slots,
    allSlotRows,
    balls: [],
    width,
    height,
    rows,
    pegRadius,
    ballRadius,
    riskLevel: risk,
    triTop: { x: width / 2, y: triTopY - rowSpacing * 0.5 },
    triBottomLeft: { x: triLeftX - 15, y: triBottomY + rowSpacing * 0.4 },
    triBottomRight: { x: triRightX + 15, y: triBottomY + rowSpacing * 0.4 },
  };
}

function getRtpBias(rtp: number): number {
  return Math.max(0, Math.min(0.9, (95 - rtp) / 50));
}

export function dropBall(
  board: PlinkoBoard,
  bet: number = 10,
  rtp: number = 75,
  skinColor: string = '#FFD700',
  skinGlow: string = 'rgba(255,215,0,0.6)',
  skinTrail: string = 'rgba(255,200,50,0.4)',
  skinId: string = 'gold',
  hotStreak: boolean = false,
): Ball {
  const id = ++ballIdCounter;
  const bias = getRtpBias(rtp);
  const centerX = board.width / 2;
  const effectiveBias = hotStreak ? bias * 0.6 : bias;
  const spread = 8 * (1 - effectiveBias * 0.7);
  const randomOffset = (Math.random() - 0.5) * spread;

  const ball: Ball = {
    id,
    x: centerX + randomOffset,
    y: 6,
    vx: (Math.random() - 0.5) * 0.2,
    vy: 0,
    radius: board.ballRadius,
    active: true,
    trail: [],
    landed: false,
    landedSlot: -1,
    color: skinColor,
    glow: skinGlow,
    trailColor: skinTrail,
    bet,
    skinId,
  };
  board.balls.push(ball);
  return ball;
}

export function updateBoard(board: PlinkoBoard, deltaTime: number, rtp: number = 75): Ball[] {
  const landedBalls: Ball[] = [];
  const dt = Math.min(deltaTime, 3);
  const bias = getRtpBias(rtp);
  const centerX = board.width / 2;

  for (const peg of board.pegs) {
    if (peg.hitTimer > 0) peg.hitTimer = Math.max(0, peg.hitTimer - 0.05 * dt);
  }
  for (const slot of board.slots) {
    if (slot.hitTimer > 0) slot.hitTimer = Math.max(0, slot.hitTimer - 0.03 * dt);
  }

  for (const ball of board.balls) {
    if (!ball.active) continue;

    ball.vy += GRAVITY * dt;
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    if (bias > 0) {
      const distFromCenter = ball.x - centerX;
      const pullStrength = bias * 0.03 * dt;
      ball.vx -= distFromCenter * pullStrength * 0.015;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    ball.trail.push({ x: ball.x, y: ball.y, age: 0 });
    if (ball.trail.length > TRAIL_MAX_LENGTH) ball.trail.shift();
    for (const tr of ball.trail) tr.age += 0.07;

    // Wall collision using triangle bounds
    const progress = Math.min(1, ball.y / (board.triBottomLeft.y));
    const leftBound = board.triTop.x - (board.triTop.x - board.triBottomLeft.x) * progress;
    const rightBound = board.triTop.x + (board.triBottomRight.x - board.triTop.x) * progress;

    if (ball.x - ball.radius < leftBound) {
      ball.x = leftBound + ball.radius;
      ball.vx = Math.abs(ball.vx) * BOUNCE_FACTOR;
    }
    if (ball.x + ball.radius > rightBound) {
      ball.x = rightBound - ball.radius;
      ball.vx = -Math.abs(ball.vx) * BOUNCE_FACTOR;
    }

    // Peg collision
    for (const peg of board.pegs) {
      const dx = ball.x - peg.x;
      const dy = ball.y - peg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = ball.radius + peg.radius;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx;
        ball.vy -= 2 * dot * ny;
        ball.vx *= BOUNCE_FACTOR;
        ball.vy *= BOUNCE_FACTOR;

        const baseRandom = (Math.random() - 0.5) * 0.35;
        const centerPull = -Math.sign(ball.x - centerX) * bias * 0.25;
        ball.vx += baseRandom + centerPull;

        peg.hitTimer = 1;
      }
    }

    // Landing detection
    const slotY = board.triBottomLeft.y + 8;
    if (ball.y >= slotY && !ball.landed) {
      ball.landed = true;
      ball.active = false;

      for (let i = 0; i < board.slots.length; i++) {
        const slot = board.slots[i];
        if (ball.x >= slot.x && ball.x < slot.x + slot.width) {
          ball.landedSlot = i;
          slot.hitTimer = 1;
          break;
        }
      }

      if (ball.landedSlot === -1) {
        let minDist = Infinity;
        for (let i = 0; i < board.slots.length; i++) {
          const slotCenter = board.slots[i].x + board.slots[i].width / 2;
          const d = Math.abs(ball.x - slotCenter);
          if (d < minDist) { minDist = d; ball.landedSlot = i; }
        }
        if (ball.landedSlot >= 0) board.slots[ball.landedSlot].hitTimer = 1;
      }

      landedBalls.push(ball);
    }

    if (ball.y > board.height + 50) ball.active = false;
  }

  if (board.balls.length > 30) {
    board.balls = board.balls.filter(b => b.active).concat(board.balls.filter(b => !b.active).slice(-5));
  }

  return landedBalls;
}

export function getSlotMultiplier(board: PlinkoBoard, slotIndex: number): number {
  if (slotIndex < 0 || slotIndex >= board.slots.length) return 0.1;
  return board.slots[slotIndex].multiplier;
}