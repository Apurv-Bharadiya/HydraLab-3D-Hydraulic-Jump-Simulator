/**
 * HydraLab 3D - High-Precision Interactive Specific Energy & Momentum Diagram
 *
 * Implements high-DPI engineering canvas rendering for:
 * 1. E-y Specific Energy Curve: E(y) = y + q²/(2gy²)
 * 2. M-y Specific Force (Momentum) Curve: M(y) = q²/(gy) + y²/2
 * 3. Bidirectional interactive depth adjustment (drag points on canvas)
 * 4. Customizable layers (Asymptote, Critical, Alternate, Sequent, ΔE vector, Grid, Regimes)
 * 5. Collision-free pill badge text rendering to prevent messy overlaps
 * 6. Responsive sizing (Docked, Expanded, and Fullscreen modes)
 */

import {
  ChevronDown,
  Layers,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { computeSectionGeometry, momentumFunctionAtDepth, specificEnergyAtDepth } from '../physics/engine';
import { HydraulicParameters, HydraulicResults } from '../physics/types';
import { UNIT_LABELS } from '../physics/units';

export interface EyChartCustomizations {
  showAsymptote: boolean;
  showCritical: boolean;
  showAlternateDepth: boolean;
  showEnergyLoss: boolean;
  showSequentPoint: boolean;
  showGrid: boolean;
  showRegimes: boolean;
  labelDensity: 'detailed' | 'clean';
}

interface EyDiagramProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  onDepthChange?: (depth: number, isUpstream: boolean) => void;
  viewMode?: 'docked' | 'expanded' | 'fullscreen';
  onToggleViewMode?: (mode: 'docked' | 'expanded' | 'fullscreen') => void;
  onCollapse?: () => void;
}

export const EyDiagram: React.FC<EyDiagramProps> = ({
  params,
  results,
  onDepthChange,
  viewMode = 'docked',
  onToggleViewMode,
  onCollapse,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeCurve, setActiveCurve] = useState<'energy' | 'momentum'>('energy');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Layer Customization Options
  const [customs, setCustoms] = useState<EyChartCustomizations>({
    showAsymptote: true,
    showCritical: true,
    showAlternateDepth: true,
    showEnergyLoss: true,
    showSequentPoint: true,
    showGrid: true,
    showRegimes: true,
    labelDensity: 'detailed',
  });

  const toggleCustom = (key: keyof EyChartCustomizations) => {
    setCustoms((prev) => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key],
    }));
  };

  const [hoverData, setHoverData] = useState<{
    xVal: number;
    yVal: number;
    frVal: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<'y1' | 'y2' | null>(null);

  const units = UNIT_LABELS[params.unitSystem];
  const q = results.unitDischarge;
  const g = params.gravity;
  const yc = results.yc;
  const ec = results.ec;
  const y1 = results.y1;
  const y2 = results.y2;
  const y2Seq = results.y2Sequent;
  const e1 = results.e1;
  const e2 = results.e2;
  const m1 = results.m1;
  const m2 = results.m2;
  const yAlt = results.alternateDepth;
  const deltaE = results.energyLoss;

  // Maximum scale bounds
  const yMax = Math.max(0.85, Math.max(y2 * 1.35, yc * 2.3, yAlt * 1.15, y2Seq * 1.2));
  const xMax =
    activeCurve === 'energy'
      ? Math.max(1.1, Math.max(e1 * 1.25, ec * 1.7, yMax * 1.15))
      : Math.max(0.6, Math.max(m1 * 1.3, m2 * 1.3));

  // Helper to draw clean rounded badge with text on canvas
  const drawPillBadge = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    bgColor: string,
    borderColor: string,
    textColor: string,
    align: 'left' | 'center' | 'right' = 'left',
    fontSize: number = 10
  ) => {
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const paddingX = 6;
    const paddingY = 3.5;
    const badgeW = textWidth + paddingX * 2;
    const badgeH = fontSize + paddingY * 2;

    let rectX = x;
    if (align === 'center') rectX = x - badgeW / 2;
    else if (align === 'right') rectX = x - badgeW;

    const rectY = y - badgeH / 2;
    const r = 4;

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, badgeW, badgeH, r);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rectX + paddingX, y);
  };

  // Main Canvas Render Logic
  const renderDiagram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Padding (generous to prevent edge collision)
    const padding = {
      top: 26,
      right: 38,
      bottom: 40,
      left: 58,
    };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    if (plotWidth <= 10 || plotHeight <= 10) return;

    // Coordinate mapping functions
    const toCanvasX = (val: number) => padding.left + (val / xMax) * plotWidth;
    const toCanvasY = (val: number) => padding.top + plotHeight - (val / yMax) * plotHeight;

    const ycCanvasY = toCanvasY(yc);

    // 1. Regime Background Shading
    if (customs.showRegimes) {
      // Subcritical zone (above yc)
      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.fillRect(padding.left, padding.top, plotWidth, Math.max(0, ycCanvasY - padding.top));

      // Supercritical zone (below yc)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.fillRect(
        padding.left,
        ycCanvasY,
        plotWidth,
        Math.max(0, padding.top + plotHeight - ycCanvasY)
      );
    }

    // 2. Coordinate Grid Lines
    if (customs.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;

      // Vertical grid lines (X axis)
      const xStep = xMax > 2 ? 0.5 : xMax > 1 ? 0.2 : 0.1;
      for (let x = xStep; x <= xMax; x += xStep) {
        const cx = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(cx, padding.top);
        ctx.lineTo(cx, padding.top + plotHeight);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(x.toFixed(1), cx, padding.top + plotHeight + 6);
      }

      // Horizontal grid lines (Y axis)
      const yStep = yMax > 1.2 ? 0.2 : 0.1;
      for (let y = yStep; y <= yMax; y += yStep) {
        const cy = toCanvasY(y);
        ctx.beginPath();
        ctx.moveTo(padding.left, cy);
        ctx.lineTo(padding.left + plotWidth, cy);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(y.toFixed(2), padding.left - 8, cy);
      }
    }

    // 3. Main Coordinate Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xLabel =
      activeCurve === 'energy'
        ? `Specific Energy E (${units.energy}) = y + V²/(2g)`
        : `Specific Force M (${units.momentum}) = Q²/(gA) + A·ȳ`;
    ctx.fillText(xLabel, padding.left + plotWidth / 2, padding.top + plotHeight + 22);

    ctx.save();
    ctx.translate(16, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Flow Depth y (${units.length})`, 0, 0);
    ctx.restore();

    // 4. Asymptote Line: E = y (45-degree potential energy line)
    if (activeCurve === 'energy' && customs.showAsymptote) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const asymEnd = Math.min(xMax, yMax);
      ctx.moveTo(toCanvasX(0), toCanvasY(0));
      ctx.lineTo(toCanvasX(asymEnd), toCanvasY(asymEnd));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        'E = y (V = 0)',
        toCanvasX(asymEnd * 0.72) + 4,
        toCanvasY(asymEnd * 0.72) - 4
      );
    }

    // 5. Theoretical Hydraulic Curve
    ctx.strokeStyle = activeCurve === 'energy' ? '#38bdf8' : '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const curveSteps = 240;
    const yMin = 0.015;
    let started = false;

    for (let i = 0; i <= curveSteps; i++) {
      const depth = yMin + (i / curveSteps) * (yMax - yMin);
      const val =
        activeCurve === 'energy'
          ? specificEnergyAtDepth(depth, params.flowRate, g, params.channelShape, params.channelWidth, params.sideSlopeZ, params.pipeDiameter)
          : momentumFunctionAtDepth(depth, params.flowRate, g, params.channelShape, params.channelWidth, params.sideSlopeZ, params.pipeDiameter);

      if (val > 0 && val <= xMax * 1.5) {
        const cx = toCanvasX(val);
        const cy = toCanvasY(depth);

        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
    }
    ctx.stroke();

    // 6. Critical Depth Point (yc, Ec)
    const minVal = activeCurve === 'energy' ? ec : momentumFunctionAtDepth(yc, params.flowRate, g, params.channelShape, params.channelWidth, params.sideSlopeZ, params.pipeDiameter);
    const minCx = toCanvasX(minVal);
    const minCy = toCanvasY(yc);

    if (customs.showCritical) {
      // Dashed horizontal critical line
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, minCy);
      ctx.lineTo(minCx, minCy);
      ctx.lineTo(minCx, padding.top + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Critical point node
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(minCx, minCy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Critical point label badge
      if (customs.labelDensity === 'detailed') {
        drawPillBadge(
          ctx,
          `Critical (yc = ${yc.toFixed(2)})`,
          minCx + 8,
          minCy - 12,
          'rgba(15, 23, 42, 0.92)',
          'rgba(250, 204, 21, 0.5)',
          '#fef08a',
          'left',
          9
        );
      }
    }

    // Operating point 1 coordinates (y1)
    const pt1Val = activeCurve === 'energy' ? e1 : m1;
    const pt1Cx = toCanvasX(pt1Val);
    const pt1Cy = toCanvasY(y1);

    // Operating point 2 coordinates (y2)
    const pt2Val = activeCurve === 'energy' ? e2 : m2;
    const pt2Cx = toCanvasX(pt2Val);
    const pt2Cy = toCanvasY(y2);

    // 7. Energy Loss Vector (ΔE)
    if (activeCurve === 'energy' && deltaE > 0.005 && customs.showEnergyLoss) {
      // Horizontal bar between E2 and E1 at y2 elevation
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pt2Cx, pt2Cy);
      ctx.lineTo(pt1Cx, pt2Cy);
      ctx.stroke();

      // Vertical drop connector from (E1, y2) to (E1, y1)
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.moveTo(pt1Cx, pt2Cy);
      ctx.lineTo(pt1Cx, pt1Cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowheads on horizontal ΔE bar
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(pt2Cx, pt2Cy);
      ctx.lineTo(pt2Cx + 6, pt2Cy - 3);
      ctx.lineTo(pt2Cx + 6, pt2Cy + 3);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pt1Cx, pt2Cy);
      ctx.lineTo(pt1Cx - 6, pt2Cy - 3);
      ctx.lineTo(pt1Cx - 6, pt2Cy + 3);
      ctx.fill();

      // Clean ΔE Pill Badge (rendered cleanly above the line to NEVER collide with y2 label)
      const midE = (pt1Cx + pt2Cx) / 2;
      drawPillBadge(
        ctx,
        `ΔE = ${deltaE.toFixed(2)} ${units.energy}`,
        midE,
        pt2Cy - 14,
        'rgba(30, 27, 75, 0.95)',
        'rgba(244, 63, 94, 0.8)',
        '#fda4af',
        'center',
        10
      );
    }

    // Momentum Diagram Transition Line: M1 = M2
    if (activeCurve === 'momentum') {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pt1Cx, pt1Cy);
      ctx.lineTo(pt1Cx, pt2Cy);
      ctx.stroke();
      ctx.setLineDash([]);

      drawPillBadge(
        ctx,
        'M₁ = M₂ (Momentum Conserved)',
        pt1Cx + 8,
        (pt1Cy + pt2Cy) / 2,
        'rgba(15, 23, 42, 0.92)',
        'rgba(168, 85, 247, 0.6)',
        '#e9d5ff',
        'left',
        9
      );
    }

    // 8. Alternate Depth Point (yAlt on upper limb with same E1)
    if (activeCurve === 'energy' && yAlt > yc && customs.showAlternateDepth) {
      const altCy = toCanvasY(yAlt);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.setLineDash([2, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pt1Cx, pt1Cy);
      ctx.lineTo(pt1Cx, altCy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Alternate point marker
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.beginPath();
      ctx.arc(pt1Cx, altCy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (customs.labelDensity === 'detailed') {
        drawPillBadge(
          ctx,
          `y_alt = ${yAlt.toFixed(2)}`,
          pt1Cx + 6,
          altCy - 10,
          'rgba(15, 23, 42, 0.9)',
          'rgba(56, 189, 248, 0.4)',
          '#7dd3fc',
          'left',
          9
        );
      }
    }

    // 9. Theoretical Bélanger Sequent Depth Point (y2*)
    if (activeCurve === 'energy' && customs.showSequentPoint && y2Seq > yc) {
      const e2Seq = specificEnergyAtDepth(y2Seq, params.flowRate, g, params.channelShape, params.channelWidth, params.sideSlopeZ, params.pipeDiameter);
      const seqCx = toCanvasX(e2Seq);
      const seqCy = toCanvasY(y2Seq);

      ctx.fillStyle = '#a855f7'; // purple
      ctx.beginPath();
      ctx.arc(seqCx, seqCy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (customs.labelDensity === 'detailed' && Math.abs(seqCy - pt2Cy) > 18) {
        drawPillBadge(
          ctx,
          `Sequent y₂* = ${y2Seq.toFixed(2)}`,
          seqCx + 8,
          seqCy + 2,
          'rgba(15, 23, 42, 0.9)',
          'rgba(168, 85, 247, 0.5)',
          '#d8b4fe',
          'left',
          9
        );
      }
    }

    // 10. Operating Point 1: Upstream Supercritical (y1)
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pt1Cx, pt1Cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Smart positioning for Point 1 to avoid cutting into bottom border
    const isY1NearBottom = padding.top + plotHeight - pt1Cy < 24;
    const y1BadgeY = isY1NearBottom ? pt1Cy - 14 : pt1Cy + 2;

    drawPillBadge(
      ctx,
      customs.labelDensity === 'detailed'
        ? `(1) Supercritical y₁ = ${y1.toFixed(2)}`
        : `y₁ = ${y1.toFixed(2)}`,
      pt1Cx + 9,
      y1BadgeY,
      'rgba(15, 23, 42, 0.92)',
      'rgba(245, 158, 11, 0.7)',
      '#fcd34d',
      'left',
      9.5
    );

    // 11. Operating Point 2: Downstream Subcritical (y2)
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pt2Cx, pt2Cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Position Point 2 below/right so it NEVER collides with ΔE
    drawPillBadge(
      ctx,
      customs.labelDensity === 'detailed'
        ? `(2) Subcritical y₂ = ${y2.toFixed(2)}`
        : `y₂ = ${y2.toFixed(2)}`,
      pt2Cx + 10,
      pt2Cy + 14,
      'rgba(15, 23, 42, 0.92)',
      'rgba(16, 185, 129, 0.7)',
      '#6ee7b7',
      'left',
      9.5
    );

    // 12. Crosshair Hover Indicator
    if (hoverData) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoverData.canvasX, padding.top);
      ctx.lineTo(hoverData.canvasX, padding.top + plotHeight);
      ctx.moveTo(padding.left, hoverData.canvasY);
      ctx.lineTo(padding.left + plotWidth, hoverData.canvasY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hoverData.canvasX, hoverData.canvasY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [
    activeCurve,
    customs,
    deltaE,
    e1,
    e2,
    ec,
    g,
    hoverData,
    m1,
    m2,
    q,
    units.energy,
    units.length,
    units.momentum,
    xMax,
    y1,
    y2,
    y2Seq,
    yAlt,
    yc,
    yMax,
  ]);

  // Handle Resize with High-DPI support
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      // Calculate available canvas area (subtract header and legend height)
      const headerH = 40;
      const footerH = 34;
      const availableW = Math.floor(rect.width);
      const availableH = Math.max(160, Math.floor(rect.height - headerH - footerH));

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = availableW * dpr;
      canvas.height = availableH * dpr;
      canvas.style.width = `${availableW}px`;
      canvas.style.height = `${availableH}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      renderDiagram();
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [renderDiagram]);

  // Redraw when parameters change
  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  // Pointer Interaction (Hover & Drag)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const padding = { top: 26, right: 38, bottom: 40, left: 58 };
    const plotWidth = rect.width - padding.left - padding.right;
    const plotHeight = rect.height - padding.top - padding.bottom;

    if (
      clientX < padding.left ||
      clientX > rect.width - padding.right ||
      clientY < padding.top ||
      clientY > rect.height - padding.bottom
    ) {
      setHoverData(null);
      return;
    }

    const currY = ((padding.top + plotHeight - clientY) / plotHeight) * yMax;
    const currX = ((clientX - padding.left) / plotWidth) * xMax;

    const geom = computeSectionGeometry(
      currY,
      params.channelShape,
      params.channelWidth,
      params.sideSlopeZ,
      params.pipeDiameter
    );
    const localV = params.flowRate / Math.max(0.0001, geom.area);
    const localFr = localV / Math.sqrt(g * Math.max(0.001, geom.hydraulicDepth));

    setHoverData({
      xVal: currX,
      yVal: currY,
      frVal: localFr,
      canvasX: clientX,
      canvasY: clientY,
    });

    if (isDragging && onDepthChange) {
      const newDepth = Math.max(0.01, Math.min(yMax * 0.95, currY));
      onDepthChange(Number(newDepth.toFixed(3)), isDragging === 'y1');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onDepthChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientY = e.clientY - rect.top;
    const padding = { top: 26, right: 38, bottom: 40, left: 58 };
    const plotHeight = rect.height - padding.top - padding.bottom;

    const clickedDepth = ((padding.top + plotHeight - clientY) / plotHeight) * yMax;
    const target = clickedDepth < yc ? 'y1' : 'y2';
    setIsDragging(target);
    onDepthChange(Number(clickedDepth.toFixed(3)), target === 'y1');
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full bg-slate-900/95 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
    >
      {/* 1. Header & Controls */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 border-b border-slate-800/80 select-none">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            {activeCurve === 'energy' ? 'Specific Energy (E-y)' : 'Momentum Diagram (M-y)'}
          </h3>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800/80 text-sky-300 border border-slate-700/60">
            Fr₁={results.fr1.toFixed(2)}
          </span>
        </div>

        {/* Action Buttons: Curve Toggle, Customization, View Modes, Collapse */}
        <div className="flex items-center space-x-1.5">
          {/* Curve Toggle (E-y vs M-y) */}
          <div className="flex items-center p-0.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-[11px]">
            <button
              onClick={() => setActiveCurve('energy')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                activeCurve === 'energy'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              E-y
            </button>
            <button
              onClick={() => setActiveCurve('momentum')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                activeCurve === 'momentum'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              M-y
            </button>
          </div>

          {/* Customizations / Layers Toggle Button */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            title="Diagram Layers & Customization"
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center space-x-1 ${
              isSettingsOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px] font-medium">Layers</span>
          </button>

          {/* Expand / Restore Button */}
          {onToggleViewMode && (
            <button
              onClick={() =>
                onToggleViewMode(
                  viewMode === 'docked' ? 'expanded' : viewMode === 'expanded' ? 'fullscreen' : 'docked'
                )
              }
              title={
                viewMode === 'docked'
                  ? 'Expand Diagram Size'
                  : viewMode === 'expanded'
                  ? 'Fullscreen Diagram'
                  : 'Dock Diagram'
              }
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-colors"
            >
              {viewMode === 'fullscreen' ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Collapse Button */}
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Minimize Diagram"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Layers & Customization Dropdown Panel */}
      {isSettingsOpen && (
        <div className="absolute top-11 right-3 z-30 p-3 w-72 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Diagram Customization</span>
            </span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-0.5 rounded text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Potential Asymptote (E = y)</span>
              <input
                type="checkbox"
                checked={customs.showAsymptote}
                onChange={() => toggleCustom('showAsymptote')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Critical Depth Line (yc)</span>
              <input
                type="checkbox"
                checked={customs.showCritical}
                onChange={() => toggleCustom('showCritical')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Alternate Depth (y_alt)</span>
              <input
                type="checkbox"
                checked={customs.showAlternateDepth}
                onChange={() => toggleCustom('showAlternateDepth')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Energy Loss Vector (ΔE)</span>
              <input
                type="checkbox"
                checked={customs.showEnergyLoss}
                onChange={() => toggleCustom('showEnergyLoss')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Bélanger Sequent Point (y₂*)</span>
              <input
                type="checkbox"
                checked={customs.showSequentPoint}
                onChange={() => toggleCustom('showSequentPoint')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Coordinate Grid Lines</span>
              <input
                type="checkbox"
                checked={customs.showGrid}
                onChange={() => toggleCustom('showGrid')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer select-none py-1 hover:text-slate-100">
              <span className="text-slate-300">Regime Shading (Fr &gt; 1 / &lt; 1)</span>
              <input
                type="checkbox"
                checked={customs.showRegimes}
                onChange={() => toggleCustom('showRegimes')}
                className="rounded accent-sky-500 w-4 h-4 cursor-pointer"
              />
            </label>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Label Style:</span>
              <div className="flex rounded-md bg-slate-800 p-0.5 text-[10px]">
                <button
                  onClick={() => setCustoms((prev) => ({ ...prev, labelDensity: 'detailed' }))}
                  className={`px-2 py-0.5 rounded ${
                    customs.labelDensity === 'detailed'
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  Detailed
                </button>
                <button
                  onClick={() => setCustoms((prev) => ({ ...prev, labelDensity: 'clean' }))}
                  className={`px-2 py-0.5 rounded ${
                    customs.labelDensity === 'clean'
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  Clean
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Diagram Canvas Area */}
      <div className="relative flex-1 w-full min-h-[170px] cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoverData(null);
            setIsDragging(null);
          }}
          className="absolute inset-0 w-full h-full block"
        />

        {/* Real-time Hover HUD Tooltip */}
        {hoverData && (
          <div
            className="absolute pointer-events-none z-20 px-2.5 py-1.5 text-[10px] font-mono bg-slate-950/95 text-slate-100 rounded-lg border border-sky-500/50 shadow-xl backdrop-blur-md"
            style={{
              left: `${Math.min(hoverData.canvasX + 12, 280)}px`,
              top: `${Math.max(12, hoverData.canvasY - 38)}px`,
            }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Depth y:</span>
              <span className="text-sky-300 font-bold">{hoverData.yVal.toFixed(3)}</span>
              <span className="text-slate-500">{units.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">{activeCurve === 'energy' ? 'Energy E:' : 'Force M:'}</span>
              <span className="text-emerald-300 font-bold">{hoverData.xVal.toFixed(3)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Froude Fr:</span>
              <span className={hoverData.frVal > 1 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                {hoverData.frVal.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-400">
                ({hoverData.frVal > 1 ? 'Supercritical' : 'Subcritical'})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Dedicated HTML Footer Legend (Outside canvas area to prevent text collision) */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-slate-950/85 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono select-none">
        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
          <span className="flex items-center space-x-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-300/90 font-medium">y₁ Super (Fr₁={results.fr1.toFixed(2)})</span>
          </span>
          <span className="flex items-center space-x-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-300/90 font-medium">y₂ Sub (Fr₂={results.fr2.toFixed(2)})</span>
          </span>
          <span className="flex items-center space-x-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-300/90 font-medium">yc Critical ({yc.toFixed(2)})</span>
          </span>
          {customs.showSequentPoint && (
            <span className="flex items-center space-x-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-purple-300/90 font-medium">y₂* Sequent ({y2Seq.toFixed(2)})</span>
            </span>
          )}
        </div>
        <div className="hidden md:inline-block text-[9px] text-slate-400 italic">
          💡 Click &amp; drag dots on curve to adjust depths
        </div>
      </div>
    </div>
  );
};
