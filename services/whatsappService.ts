import { TradeSignal, TradeStatus, User } from '../types';

export interface WhatsAppConfig {
  groupLink: string;
  autoDispatchNewLink: boolean;
  gatewayType: 'DIRECT' | 'CALLMEBOT' | 'CUSTOM_WEBHOOK';
  callmebotKey: string;
  callmebotPhone: string;
  webhookUrl: string;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  groupLink: 'https://chat.whatsapp.com/IKEJXh5U635J8H88sB7Tyc-',
  autoDispatchNewLink: true,
  gatewayType: 'DIRECT',
  callmebotKey: '',
  callmebotPhone: '',
  webhookUrl: '',
};

const CONFIG_KEY = 'libra_whatsapp_config_cached';

export const getWhatsAppConfig = (): WhatsAppConfig => {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_WHATSAPP_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_WHATSAPP_CONFIG;
    }
  }
  return DEFAULT_WHATSAPP_CONFIG;
};

export const saveWhatsAppConfig = (config: WhatsAppConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

/**
 * Helper to draw a visually perfect rounded rectangle across all browser canvas environments safely.
 */
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string | CanvasGradient,
  stroke?: string,
  strokeWidth: number = 1
) => {
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
};

/**
 * Renders an exact high-fidelity visual clone of the live SignalCard component.
 * Features realistic padding, typography pairing, grid sections, live markers, PNL pills, and PRL target cards.
 */
export const generateSignalCardCanvas = (signal: TradeSignal, heading: string = "TARGET ACHIEVED"): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 620;
  canvas.height = 510;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const isBuy = signal.action === 'BUY';
  const isActive = signal.status === TradeStatus.ACTIVE || signal.status === TradeStatus.PARTIAL;
  const isExited = signal.status === TradeStatus.EXITED || signal.status === TradeStatus.STOPPED || signal.status === TradeStatus.ALL_TARGET;
  const isSLHit = signal.status === TradeStatus.STOPPED;
  const isAllTarget = signal.status === TradeStatus.ALL_TARGET;
  const isBTST = !!signal.isBTST;
  
  // Outer Ambient Canvas Background - Deep Slate Blue 950
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 620, 510);
  
  // Core Shadow / Card Container boundaries
  const cardX = 20;
  const cardY = 20;
  const cardW = 580;
  const cardH = 470;
  
  // 1. Sleek Gradient Card Background matching App Card (bg-slate-900 with subtle BTST theme)
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  if (isBTST) {
    cardGrad.addColorStop(0, '#0f172a'); // slate-900
    cardGrad.addColorStop(1, '#1c1917'); // warm amber/stone-900 hint
  } else {
    cardGrad.addColorStop(0, '#0f172a'); // slate-900
    cardGrad.addColorStop(1, '#0b0f19'); // slate-950
  }
  
  // Frame Border colors
  let cardBorderColor = '#334155'; // default slate-700
  if (isBTST) {
    cardBorderColor = 'rgba(245, 158, 11, 0.4)'; // amber border
  } else if (isAllTarget) {
    cardBorderColor = 'rgba(16, 185, 129, 0.5)'; // emerald green glow border
  }
  
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 14, cardGrad, cardBorderColor, 1.5);
  
  // 1.5 Professional Diagonal Repeating Watermark
  ctx.save();
  // Clip to card boundaries so watermark does not spill outside the rounded card corner
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(cardX, cardY, cardW, cardH, 14);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.clip();

  const watermarkText = `INSIGHT • POWERED BY LIBRA FIN-TECH SOLUTIONS • FOR SUBSCRIBE INSIGHT APP CONTACT 9539407707`;

  ctx.fillStyle = 'rgba(148, 163, 184, 0.09)'; // Enhanced visibility slate watermark
  ctx.font = '900 13px "JetBrains Mono", monospace'; // Bigger font size
  ctx.textAlign = 'center';

  // Translate to center of card, rotate, and draw tiled columns/rows
  ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
  ctx.rotate(-22 * Math.PI / 180);

  for (let row = -4; row <= 4; row++) {
    const yOffset = row * 76; // increased row vertical spacing due to bigger font size
    // Interlaced column offset for a perfect brick-pattern staggered look
    const xOffset = (row % 2 === 0) ? -120 : 120;
    
    ctx.fillText(watermarkText, xOffset, yOffset);
    ctx.fillText(watermarkText, xOffset - 720, yOffset);
    ctx.fillText(watermarkText, xOffset + 720, yOffset);
  }
  ctx.restore();
  
  // 2. BTST Overnight Ribbon in Top-Right
  if (isBTST) {
    ctx.save();
    // Clip to the cards path so ribbon is perfectly constrained inside card's top-right corner
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(cardX, cardY, cardW, cardH, 14);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.clip();
    
    // Draw rotated ribbon
    ctx.translate(cardX + cardW, cardY);
    ctx.rotate(45 * Math.PI / 180);
    ctx.fillStyle = '#f59e0b'; // amber-500
    ctx.fillRect(-60, 15, 120, 24);
    
    ctx.fillStyle = '#020617';
    ctx.font = '900 9px "Inter", "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OVERNIGHT', 0, 27);
    ctx.restore();
  }
  
  // 3. Render Custom Header Section with Arrows, Instrument Names, and Action Type
  // Arrow Container Box Style
  const arrowBoxX = cardX + 24;
  const arrowBoxY = cardY + 24;
  const arrowBoxW = 44;
  const arrowBoxH = 44;
  const arrowFill = isBuy ? 'rgba(6, 78, 59, 0.4)' : 'rgba(153, 27, 27, 0.4)';
  const arrowStroke = isBuy ? '#10b981' : '#f87171';
  drawRoundedRect(ctx, arrowBoxX, arrowBoxY, arrowBoxW, arrowBoxH, 10, arrowFill, arrowStroke, 1);
  
  // Draw Unicode High-Res Arrow Inside Box
  ctx.fillStyle = isBuy ? '#34d399' : '#f87171';
  ctx.font = '900 24px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isBuy ? '↗' : '↘', arrowBoxX + 22, arrowBoxY + 22);
  
  // Instrument / Symbol details
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 20px "JetBrains Mono", monospace';
  ctx.fillText(signal.instrument, arrowBoxX + 58, arrowBoxY + 22);
  
  // Row of info badges under instrument name
  const textY = arrowBoxY + 40;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 11px "Inter", sans-serif';
  ctx.fillText(signal.symbol.toUpperCase(), arrowBoxX + 58, textY);
  
  // Draw option type pill (CE / PE)
  const symWidth = ctx.measureText(signal.symbol.toUpperCase()).width;
  const typePillX = arrowBoxX + 58 + symWidth + 8;
  const typePillFill = signal.type === 'CE' ? 'rgba(6, 78, 59, 0.6)' : 'rgba(153, 27, 27, 0.6)';
  const typePillText = signal.type === 'CE' ? '#86efac' : '#fca5a5';
  drawRoundedRect(ctx, typePillX, textY - 11, 28, 14, 4, typePillFill);
  ctx.fillStyle = typePillText;
  ctx.font = '900 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(signal.type, typePillX + 14, textY - 1);
  
  // Draw Potential UP / DOWN solid badge next to type info
  const actionX = typePillX + 36;
  const actionFill = isBuy ? '#16a34a' : '#dc2626';
  drawRoundedRect(ctx, actionX, textY - 11, 88, 14, 4, actionFill);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 8px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isBuy ? 'POTENTIAL UP 🟢' : 'POTENTIAL DOWN 🔴', actionX + 44, textY - 1);
  
  // 4. Render State Badge on Top-Right Corner of signal card
  const statusX = cardX + cardW - 120;
  const statusY = cardY + 24;
  let statusBg = 'rgba(30, 41, 59, 0.5)';
  let statusTextCol = '#94a3b8';
  let statusBorder = 'rgba(71, 85, 105, 0.3)';
  
  if (isAllTarget) {
    statusBg = 'rgba(16, 185, 129, 0.2)';
    statusTextCol = '#34d399';
    statusBorder = 'rgba(16, 185, 129, 0.4)';
  } else if (signal.status === TradeStatus.ACTIVE) {
    statusBg = 'rgba(16, 185, 129, 0.15)';
    statusTextCol = '#10b981';
    statusBorder = 'rgba(16, 185, 129, 0.2)';
  } else if (signal.status === TradeStatus.PARTIAL) {
    statusBg = 'rgba(59, 130, 246, 0.15)';
    statusTextCol = '#60a5fa';
    statusBorder = 'rgba(59, 130, 246, 0.2)';
  } else if (signal.status === TradeStatus.STOPPED) {
    statusBg = 'rgba(239, 68, 68, 0.15)';
    statusTextCol = '#f87171';
    statusBorder = 'rgba(239, 68, 68, 0.2)';
  }
  
  drawRoundedRect(ctx, statusX, statusY, 96, 22, 6, statusBg, statusBorder, 1);
  ctx.fillStyle = statusTextCol;
  ctx.font = '900 9px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((isAllTarget ? '🏆 ' : '• ') + signal.status, statusX + 48, statusY + 14);
  
  // Render Risk-Reward under status badge
  let calcRR = 0;
  const entryPriceVal = Number(signal.entryPrice || 0);
  const stopLossVal = Number(signal.stopLoss || 0);
  if (signal.targets && signal.targets.length > 0 && entryPriceVal > 0) {
    const risk = Math.abs(entryPriceVal - (stopLossVal || 1));
    if (risk > 0) {
      calcRR = isBuy 
        ? (Number(signal.targets[0]) - entryPriceVal) / risk
        : (entryPriceVal - Number(signal.targets[0])) / risk;
    }
  }
  
  drawRoundedRect(ctx, statusX + 32, statusY + 28, 64, 15, 4, 'rgba(30, 41, 59, 0.8)', 'rgba(71, 85, 105, 0.4)');
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.fillText(`RR 1:${calcRR.toFixed(1)}`, statusX + 64, statusY + 38);
  
  // 5. Divider Line Before Core Grid Section
  const gridY = cardY + 84;
  ctx.strokeStyle = '#1e293b'; // slate-800 divider
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, gridY);
  ctx.lineTo(cardX + cardW, gridY);
  ctx.stroke();
  
  // 6. Draw 3-Column Metrics Grid (Base Level, Invalidation Point, EXIT/CMP)
  const colW = cardW / 3;
  
  // Column 1: Base Level (Entry price)
  const col1X = cardX;
  ctx.fillStyle = '#64748b';
  ctx.font = '900 8px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BASE LEVEL', col1X + 24, gridY + 20);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "JetBrains Mono", monospace';
  ctx.fillText(`₹${entryPriceVal.toFixed(2)}`, col1X + 24, gridY + 44);
  
  if (signal.quantity) {
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 9px "Inter", sans-serif';
    ctx.fillText(`💼 Size: ${signal.quantity}`, col1X + 24, gridY + 59);
  }
  
  // Column 2: Invalidation Point (Stop Loss & Protection)
  const col2X = cardX + colW;
  ctx.fillStyle = '#64748b';
  ctx.font = '900 8px "Inter", sans-serif';
  ctx.fillText('INVALIDATION POINT', col2X + 20, gridY + 20);
  
  ctx.fillStyle = '#f87171';
  ctx.font = '900 18px "JetBrains Mono", monospace';
  ctx.fillText(`₹${stopLossVal.toFixed(2)}`, col2X + 20, gridY + 44);
  
  // TSL Protection label
  const displayTrail = signal.trailingSL;
  ctx.fillStyle = displayTrail ? '#fbbf24' : '#64748b';
  ctx.font = 'bold 9px "Inter", sans-serif';
  ctx.fillText(`🛡️ Protection: ${displayTrail != null ? `₹${Number(displayTrail).toFixed(1)}` : '--'}`, col2X + 20, gridY + 59);
  
  // Column 3: EXIT or CMP (Current price)
  const col3X = cardX + (colW * 2);
  let currentCMP = isNaN(Number(signal.cmp)) || signal.cmp === undefined || signal.cmp === null ? entryPriceVal : Number(signal.cmp);
  if (isSLHit) {
    currentCMP = stopLossVal;
  } else if (isAllTarget && signal.targets && signal.targets.length > 0) {
    currentCMP = Number(signal.targets[signal.targets.length - 1]);
  }
  
  ctx.fillStyle = '#64748b';
  ctx.font = '900 8px "Inter", sans-serif';
  ctx.fillText(isExited ? 'EXIT' : 'CMP', col3X + 20, gridY + 20);
  
  // LIVE badge inside the grid if active
  if (isActive) {
    drawRoundedRect(ctx, col3X + 110, gridY + 11, 32, 11, 3, 'rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.3)');
    ctx.fillStyle = '#10b981';
    ctx.font = '900 7px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LIVE', col3X + 126, gridY + 19);
    ctx.textAlign = 'left';
  }
  
  const cmpProfit = currentCMP > 0 && entryPriceVal > 0 ? (isBuy ? currentCMP > entryPriceVal : currentCMP < entryPriceVal) : false;
  const cmpLoss = currentCMP > 0 && entryPriceVal > 0 ? (isBuy ? currentCMP < entryPriceVal : currentCMP > entryPriceVal) : false;
  ctx.fillStyle = (cmpProfit && isActive) ? '#34d399' : (cmpLoss && isActive) ? '#f87171' : '#ffffff';
  ctx.font = '900 18px "JetBrains Mono", monospace';
  ctx.fillText(`₹${currentCMP.toFixed(2)}`, col3X + 20, gridY + 44);
  
  // 7. Divider lines for columns
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(col2X, gridY + 8);
  ctx.lineTo(col2X, gridY + 68);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(col3X, gridY + 8);
  ctx.lineTo(col3X, gridY + 68);
  ctx.stroke();
  
  // Border below the central grid
  const gridEndY = gridY + 76;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, gridEndY);
  ctx.lineTo(cardX + cardW, gridEndY);
  ctx.stroke();
  
  // 8. P&L Banner strip (Realized or Unrealized points)
  let nextY = gridEndY;
  if (isExited || (signal.pnlPoints !== undefined && signal.pnlPoints !== null)) {
    const pnlVal = Number(signal.pnlPoints || 0);
    const isProfit = pnlVal >= 0;
    const pnlBg = isProfit ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)';
    ctx.fillStyle = pnlBg;
    ctx.fillRect(cardX, nextY, cardW, 58);
    
    // Draw the green or red round status/trend badge (matches the original card circle)
    const badgeX = cardX + 35;
    const badgeY = nextY + 29; // Centered vertically in 58px height
    const radius = 12; // slightly larger for matching reference image
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    ctx.fill();
    ctx.strokeStyle = isProfit ? '#10b981' : '#f87171'; // red round mark for loss or green for profit
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw real vector Trend Arrow inside the round badge matching original card
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = isProfit ? '#34d399' : '#f87171';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (isProfit) {
      // Wavy up trend line: starts bottom-left, goes up, down, then up-right with arrow tip
      ctx.moveTo(badgeX - 6, badgeY + 4);
      ctx.lineTo(badgeX - 2, badgeY + 1);
      ctx.lineTo(badgeX + 1, badgeY + 3);
      ctx.lineTo(badgeX + 6, badgeY - 4);
      // Arrow head:
      ctx.lineTo(badgeX + 2, badgeY - 4);
      ctx.moveTo(badgeX + 6, badgeY - 4);
      ctx.lineTo(badgeX + 6, badgeY);
    } else {
      // Down trend line: starts top-left, goes down, up, then down-right with arrow tip
      ctx.moveTo(badgeX - 6, badgeY - 4);
      ctx.lineTo(badgeX - 2, badgeY - 1);
      ctx.lineTo(badgeX + 1, badgeY - 3);
      ctx.lineTo(badgeX + 6, badgeY + 4);
      // Arrow head:
      ctx.lineTo(badgeX + 2, badgeY + 4);
      ctx.moveTo(badgeX + 6, badgeY + 4);
      ctx.lineTo(badgeX + 6, badgeY);
    }
    ctx.stroke();
    ctx.restore();
    
    // Draw realized title next to the round badge
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 10px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(isExited ? 'REALIZED P&L' : 'UNREALIZED', cardX + 58, nextY + 29);
    
    // Draw realized points text (top line, crisp and heavy weight as original card)
    ctx.fillStyle = isProfit ? '#34d399' : '#f87171';
    ctx.font = '900 20px "JetBrains Mono", monospace'; // exact professional sizing
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    const ptsText = `${pnlVal >= 0 ? '+' : ''}${pnlVal.toFixed(1)} pts`;
    ctx.fillText(ptsText, cardX + cardW - 24, nextY + 26);
    
    // Draw cash rupees equivalent stacked perfectly below the points (as in original card)
    let pnlHighlightW = 0;
    let pnlHighlightH = 0;
    let pnlCenterX = 0;
    let pnlCenterY = 0;

    if (signal.pnlRupees != null) {
      const rupeesVal = Number(signal.pnlRupees);
      const prefix = rupeesVal >= 0 ? '+' : '-';
      const rupeesText = `${prefix}₹${Math.abs(rupeesVal).toLocaleString('en-IN', { minimumFractionDigits: 1 })}`;
      
      ctx.fillStyle = rupeesVal >= 0 ? '#10b981' : '#f87171';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(rupeesText, cardX + cardW - 24, nextY + 44);
      
      // Draw requested circular status dot indicator right beside the P&L amount
      const rupeesWidth = ctx.measureText(rupeesText).width;
      const redDotX = cardX + cardW - 24 - rupeesWidth - 10;
      const redDotY = nextY + 39;
      
      ctx.beginPath();
      ctx.arc(redDotX, redDotY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = rupeesVal >= 0 ? '#10b981' : '#ef4444'; // green for profit, red round mark for loss
      ctx.fill();

      // Set bounding measurements covering BOTH points and rupees text
      const ptsWidth = ctx.measureText(ptsText).width;
      const maxPnlW = Math.max(ptsWidth, rupeesWidth + 18);
      pnlHighlightW = maxPnlW;
      pnlHighlightH = 43; // spans vertically from top of points to bottom of rupees
      pnlCenterX = (cardX + cardW - 24) - maxPnlW / 2;
      pnlCenterY = nextY + 25.5;
    } else {
      const ptsWidth = ctx.measureText(ptsText).width;
      pnlHighlightW = ptsWidth;
      pnlHighlightH = 24;
      pnlCenterX = (cardX + cardW - 24) - ptsWidth / 2;
      pnlCenterY = nextY + 16;
    }

    // Draw the Red Coloured Circle Pencil Mark highlighting P&L
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'; // Vivid Crimson Red Pencil
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Subtle shadow for realistic organic ink depth
    ctx.shadowColor = 'rgba(239, 68, 68, 0.2)';
    ctx.shadowBlur = 1.5;

    const radiusX = pnlHighlightW / 2 + 10;
    const radiusY = pnlHighlightH / 2 + 5;

    ctx.beginPath();
    const steps = 60;
    const angleStart = -Math.PI / 4; // top-right start
    const angleEnd = 2.18 * Math.PI + angleStart; // overlap slightly to mimic hand circular doodle

    for (let i = 0; i <= steps; i++) {
      const theta = angleStart + (angleEnd - angleStart) * (i / steps);
      
      // Simulate microscopic pencil lead jitter or natural hand shake
      const jitterX = Math.sin(theta * 3.5) * 1.6 + (Math.sin(theta * 9) * 0.4);
      const jitterY = Math.cos(theta * 2.2) * 1.4 + (Math.cos(theta * 7) * 0.3);
      
      const currentRadiusX = radiusX + jitterX;
      const currentRadiusY = radiusY + jitterY;
      
      const strokeX = pnlCenterX + currentRadiusX * Math.cos(theta);
      const strokeY = pnlCenterY + currentRadiusY * Math.sin(theta);
      
      if (i === 0) {
        ctx.moveTo(strokeX, strokeY);
      } else {
        ctx.lineTo(strokeX, strokeY);
      }
    }
    ctx.stroke();
    ctx.restore();
    
    nextY += 58;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX, nextY);
    ctx.lineTo(cardX + cardW, nextY);
    ctx.stroke();
  }
  
  // 9. Targets section (Projected Resistance Levels PRL Cards)
  const targetsSectionY = nextY + 16;
  ctx.fillStyle = '#64748b';
  ctx.font = '900 8.5px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PROJECTED RESISTANCE LEVEL (PRLs)', cardX + 24, targetsSectionY);
  
  const targetColW = (cardW - 48) / 3; // exact columns with spacing
  const targetGridY = targetsSectionY + 10;
  const targetCardH = 46;
  
  if (signal.targets && signal.targets.length > 0) {
    const maxTargetsHit = signal.targetsHit || 0;
    signal.targets.slice(0, 3).forEach((t, i) => {
      const tX = cardX + 24 + (i * (targetColW + 12));
      const isHit = isAllTarget || maxTargetsHit > i;
      
      const cardFill = isHit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.4)';
      const cardStroke = isHit ? 'rgba(16, 185, 129, 0.45)' : 'rgba(51, 65, 85, 0.3)';
      
      drawRoundedRect(ctx, tX, targetGridY, targetColW, targetCardH, 6, cardFill, cardStroke, 1);
      
      // Target Label
      ctx.fillStyle = isHit ? '#10b981' : '#64748b';
      ctx.font = '900 8px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isHit ? `LVL ${i + 1} TESTED` : `LVL ${i + 1}`, tX + 10, targetGridY + 16);
      
      // Target Value
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px "JetBrains Mono", monospace';
      ctx.fillText(`₹${Number(t).toFixed(1)}`, tX + 10, targetGridY + 34);
      
      // Done badge inside tested targets
      if (isHit) {
        ctx.fillStyle = '#10b981';
        ctx.font = '900 14px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('✓', tX + targetColW - 12, targetGridY + 23);
        
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 7px "Inter", sans-serif';
        ctx.fillText('ARCHIVED', tX + targetColW - 10, targetGridY + 36);
      }
    });
  }
  
  // 10. Comment / Message block if it exists
  const nextSectionY = targetGridY + targetCardH + 14;
  if (signal.comment) {
    const commentBoxY = nextSectionY;
    const commentBoxH = 34;
    const commentBg = (isSLHit || signal.status === TradeStatus.STOPPED)
      ? 'rgba(153, 27, 27, 0.15)' 
      : isAllTarget 
      ? 'rgba(6, 78, 59, 0.15)' 
      : 'rgba(15, 23, 42, 0.5)';
      
    const commentBorder = 'rgba(71, 85, 105, 0.2)';
    drawRoundedRect(ctx, cardX + 24, commentBoxY, cardW - 48, commentBoxH, 6, commentBg, commentBorder, 1);
    
    ctx.fillStyle = (isSLHit || signal.status === TradeStatus.STOPPED) 
      ? '#ef4444' 
      : isAllTarget 
      ? '#34d399' 
      : '#94a3b8';
    ctx.font = 'italic 500 9.5px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`" ${signal.comment} "`, cardX + 36, commentBoxY + 20);
  }
  
  // 11. Minimal Slate Footer Panel
  const footerY = cardH - 12;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 24, footerY);
  ctx.lineTo(cardX + cardW - 24, footerY);
  ctx.stroke();
  
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  const obsTime = new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(`OBSERVED AT ${obsTime} • VERIFIED BY TERMINAL`, cardX + 24, footerY + 16);
  
  ctx.textAlign = 'right';
  ctx.fillStyle = '#475569';
  ctx.font = '900 8.5px "Inter", sans-serif';
  ctx.fillText('LIBRA FIN-TECH SOLUTIONS', cardX + cardW - 24, footerY + 16);
  
  // 12. Elegant Status Stamp Overlaid on Closed Trades
  if (isExited) {
    ctx.save();
    
    const isTSLHit = isExited && !isAllTarget && (signal.comment?.toUpperCase().includes('TSL') || (signal.status === TradeStatus.EXITED && (Number(signal.pnlPoints || 0)) > 0 && signal.comment?.toUpperCase().includes('TRAILING')));
    
    let stampText = 'VIEW CLOSED';
    let stampColor = '#94a3b8'; // slate-400
    
    if (isAllTarget) {
      stampText = 'COMPLETED';
      stampColor = '#10b981'; // emerald-500
    } else if (isSLHit) {
      stampText = 'INVALIDATED';
      stampColor = '#f87171'; // rose-400
    } else if (isTSLHit) {
      stampText = 'PROTECTION HIT';
      stampColor = '#f59e0b'; // amber-500
    }
    
    // Position the stamp at the lower side of the card
    const stampCX = cardX + cardW / 2;
    const stampCY = cardY + cardH - 125;
    
    ctx.translate(stampCX, stampCY);
    ctx.rotate(-15 * Math.PI / 180);
    
    // Measure stamp width based on font size and text length
    ctx.font = '800 24px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(stampText).width;
    const paddingX = 28;
    const stampW = Math.max(textWidth + paddingX * 2, 220);
    const stampH = 74; // Accommodate the secondary "SYSTEM ARCHIVING" text
    
    // Draw background (semi-transparent deep slate) with thick borders
    drawRoundedRect(
      ctx,
      -stampW / 2,
      -stampH / 2,
      stampW,
      stampH,
      8,
      'rgba(15, 23, 42, 0.9)',
      stampColor,
      3.5
    );
    
    // Draw inner inset border contour (matching CSS: inset 0 0 0 2px currentColor)
    ctx.strokeStyle = stampColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundedRect(
      ctx,
      -stampW / 2 + 5,
      -stampH / 2 + 5,
      stampW - 10,
      stampH - 10,
      5,
      undefined,
      stampColor,
      1.5
    );
    
    // Draw Primary Stamp Text
    ctx.fillStyle = stampColor;
    ctx.font = '800 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(stampText, 0, -2);
    
    // Draw Secondary "SYSTEM ARCHIVED" badge text mimicking UI
    ctx.fillStyle = stampColor;
    ctx.globalAlpha = 0.6; // opacity-60
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ SYSTEM ARCHIVED', 0, 8);
    
    ctx.restore();
  }
  
  return canvas;
};

/**
 * Renders the trading card to a PNG blob and attempts to write it to the clipboard.
 * This enables one-click copy and paste sharing for direct WhatsApp redirection.
 */
export const copySignalCardToClipboard = async (signal: TradeSignal, heading?: string): Promise<boolean> => {
  try {
    if (typeof navigator.clipboard === 'undefined' || typeof ClipboardItem === 'undefined') {
      console.warn("Navigator clipboard or ClipboardItem is not supported on this platform.");
      return false;
    }
    
    // Check if the document has focus before attempting to write to the clipboard.
    // This prevents the browser from throwing the "Document is not focused" error.
    if (!document.hasFocus()) {
      console.warn("Clipboard copy skipped: Document is not focused.");
      return false;
    }
    
    const canvas = generateSignalCardCanvas(signal, heading);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    
    const dataItem = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([dataItem]);
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes("Document is not focused") || errMsg.includes("NotAllowedError") || errMsg.includes("focus")) {
      console.warn("Clipboard copy blocked by browser security (focus or user gesture required):", errMsg);
    } else {
      console.error("Error copy card screenshot to clipboard:", err);
    }
    return false;
  }
};

/**
 * Format a beautiful, highly scannable institutional-grade alert for WhatsApp
 */
export const formatSignalMessage = (signal: TradeSignal, isNew: boolean = true): string => {
  const isBuy = signal.action === 'BUY';
  const actionLabel = isBuy ? 'POTENTIAL UP' : 'POTENTIAL DOWN';
  const directionEmoji = isBuy ? '🟢' : '🔴';
  
  if (isNew) {
    let text = `📊 *INSIGHT APP NOTIFICATION* 📊\n`;
    text += `==================================\n\n`;
    text += `${directionEmoji} *Action:* ${actionLabel}\n`;
    text += `📈 *Instrument:* ${signal.instrument}\n`;
    text += `🔍 *Symbol:* ${signal.symbol}\n`;
    text += `🏷️ *Option Type:* ${signal.type}\n`;
    text += `💵 *Base Level:* ₹${Number(signal.entryPrice || 0).toFixed(2)}\n`;
    
    if (signal.stopLoss) {
      text += `🛡️ *Invalidation:* ₹${Number(signal.stopLoss).toFixed(2)}\n`;
    }
    
    if (signal.trailingSL) {
      text += `🧠 *Trailing Protection SL:* ₹${Number(signal.trailingSL).toFixed(2)}\n`;
    }
    
    if (signal.targets && signal.targets.length > 0) {
      text += `🎯 *PRL:* ${signal.targets.map((t, i) => `[PRL ${i+1}] ₹${Number(t).toFixed(1)}`).join(', ')}\n`;
    }
    
    if (signal.quantity) {
      text += `📦 *Quantity / Size:* ${signal.quantity}\n`;
    }
    
    text += `🌙 *Overnight BTST:* ${signal.isBTST ? 'YES (OVERNIGHT)' : 'NO'}\n`;
    
    if (signal.comment) {
      text += `💬 *Intel Comment:* "${signal.comment}"\n`;
    }
    
    text += `\n⏰ *Time:* ${new Date(signal.timestamp).toLocaleString('en-IN')}\n`;
    text += `\n⚠️ *Disclaimer:* Educational research only. Derivative trading carries structural capital risks.`;
    return text;
  } else {
    // Format an update alert
    let text = `🎯 *LIBRA SYSTEM SIGNAL UPDATE* 🎯\n`;
    text += `==================================\n\n`;
    text += `📈 *Trade:* ${signal.instrument} ${signal.symbol} ${signal.type}\n`;
    text += `📢 *New Status:* *${signal.status}*\n`;
    
    if (signal.pnlPoints !== undefined && signal.pnlPoints !== null) {
      const isProfit = Number(signal.pnlPoints) >= 0;
      const pnlEmoji = isProfit ? '💰' : '📉';
      text += `${pnlEmoji} *Realized PnL:* ${isProfit ? '+' : ''}${Number(signal.pnlPoints).toFixed(1)} Pts\n`;
    }
    
    if (signal.targetsHit !== undefined && signal.targetsHit > 0) {
      text += `🎯 *Levels Achieved:* Lvl ${signal.targetsHit} Done\n`;
    }
    
    if (signal.comment) {
      text += `💬 *Commentary:* "${signal.comment}"\n`;
    }
    
    text += `\n⏰ *Update Time:* ${new Date().toLocaleString('en-IN')}\n`;
    text += `🔐 *Terminal Secure Link:* Libra Quant Solutions`;
    return text;
  }
};

/**
 * Dispatches a WhatsApp notification to the group or registered subscribers.
 * Integrates direct browser deep-linking or background automated gateway APIs.
 */
export const dispatchWhatsAppMessage = async (
  message: string,
  targetPhone?: string,
  signalObj?: TradeSignal
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const config = getWhatsAppConfig();
  const cleanPhone = targetPhone ? targetPhone.replace(/[^\d]/g, '') : '';
  
  // Optionally copy trade card snapshot image to system clipboard so they can hit Ctrl+V
  if (config.gatewayType === 'DIRECT' && signalObj) {
    try {
      const headingText = signalObj.status === TradeStatus.ALL_TARGET ? "ALL TARGET DONE" : "TARGET ACHIEVED";
      await copySignalCardToClipboard(signalObj, headingText);
    } catch (_) {}
  }
  
  if (config.gatewayType === 'DIRECT') {
    // Direct link deep redirection
    let webUrl = '';
    if (cleanPhone) {
      webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    } else {
      // Group Link
      webUrl = config.groupLink;
      // Since WhatsApp group links do not accept '?text=...' natively, we can prompt/instruct or
      // copy message to clipboard and open group page.
      try {
        await navigator.clipboard.writeText(message);
      } catch (e) {
        console.warn("Clipboard copy failed, using URL fallback", e);
      }
    }
    return { success: true, url: webUrl };
  } else if (config.gatewayType === 'CALLMEBOT') {
    // CallMeBot Automated Direct Messaging API (Free WhatsApp automated gateway)
    const apiKey = config.callmebotKey || '';
    const phone = targetPhone || config.callmebotPhone || '';
    
    if (!apiKey || !phone) {
      return { success: false, error: 'CallMeBot Phone Number or API Key missing.' };
    }
    
    const cleanSendPhone = phone.replace(/[^\d+]/g, '');
    const apiEndpoint = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanSendPhone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
    
    try {
      // POST or GET request to the automated CallMeBot API
      const res = await fetch(apiEndpoint, { mode: 'no-cors' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'CallMeBot dispatch failed' };
    }
  } else if (config.gatewayType === 'CUSTOM_WEBHOOK') {
    // Custom webhook automated broadcast (Pipedream, Make, Zapier or proprietary gate)
    const url = config.webhookUrl;
    if (!url) {
      return { success: false, error: 'Custom Webhook URL has not been defined.' };
    }
    
    let cardImageBase64 = '';
    if (signalObj) {
      try {
        const hText = signalObj.status === TradeStatus.ALL_TARGET ? "ALL TARGET DONE" : "TARGET ACHIEVED";
        const canvas = generateSignalCardCanvas(signalObj, hText);
        cardImageBase64 = canvas.toDataURL('image/png');
      } catch (ce) {
        console.error("Canvas drawing failed for base64", ce);
      }
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          recipient: cleanPhone || 'GROUP',
          timestamp: new Date().toISOString(),
          groupLink: config.groupLink,
          cardImageBase64: cardImageBase64 || null,
          signalDetails: signalObj || null
        })
      });
      
      if (response.ok) {
        return { success: true };
      }
      return { success: false, error: `Webhook returned status code ${response.status}` };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Custom Webhook POST failed' };
    }
  }
  
  return { success: false, error: 'Unknown gateway config' };
};

