/**
 * HydraLab 3D - Engineering Readout & Telemetry HUD Panel
 *
 * Displays live diagnostic values for continuity, specific energy, momentum,
 * Froude numbers, energy loss, jump length, and USBR regime classification.
 */

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  Gauge,
  Shield,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { HydraulicParameters, HydraulicResults } from '../physics/types';
import { UNIT_LABELS } from '../physics/units';

interface ReadoutPanelProps {
  params: HydraulicParameters;
  results: HydraulicResults;
}

export const ReadoutPanel: React.FC<ReadoutPanelProps> = ({ params, results }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const units = UNIT_LABELS[params.unitSystem];

  // Helper for regime color coding
  const getRegimeBadge = (regime: string, fr: number) => {
    if (regime === 'supercritical') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Flame className="w-3 h-3 mr-1 text-amber-400" />
          Supercritical (Fr = {fr.toFixed(2)} &gt; 1)
        </span>
      );
    }
    if (regime === 'subcritical') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
          Subcritical (Fr = {fr.toFixed(2)} &lt; 1)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
        Critical (Fr ≈ 1.0)
      </span>
    );
  };

  // Cavitation risk badge styling
  const getCavitationBadge = (risk: string) => {
    switch (risk) {
      case 'Severe':
        return (
          <span className="flex items-center text-rose-400 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 animate-bounce" />
            Severe Risk (Scour / Cavitation Damage)
          </span>
        );
      case 'High':
        return (
          <span className="flex items-center text-orange-400 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            High Risk (Needs Chute Blocks)
          </span>
        );
      case 'Moderate':
        return <span className="text-yellow-400">Moderate Risk</span>;
      default:
        return <span className="text-slate-400">Negligible</span>;
    }
  };

  // Export current telemetry summary to JSON file
  const exportTelemetry = () => {
    const data = {
      timestamp: new Date().toISOString(),
      parameters: params,
      results: results,
      unitSystem: params.unitSystem,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HydraLab3D_Report_Fr${results.fr1.toFixed(2)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out flex flex-col bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden ${
        isCollapsed ? 'h-12' : 'max-h-[82vh]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 cursor-pointer select-none">
        <div
          className="flex items-center space-x-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Gauge className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            Hydraulic Telemetry & Diagnostics
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {!isCollapsed && (
            <button
              onClick={exportTelemetry}
              title="Export Full Calculation Report as JSON"
              className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
            >
              <Download className="w-3 h-3 text-sky-400" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* 1. HERO REGIME & USBR CLASSIFICATION BANNER */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-sky-950/30 border border-sky-900/40 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                USBR Hydraulic Regime
              </span>
              <span className="flex items-center text-[10px] font-bold text-sky-300 font-mono">
                <Award className="w-3.5 h-3.5 mr-1 text-amber-400" />
                {results.jumpClassification}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              {results.classificationDescription}
            </p>

            {/* Regime Pills: Section 1 vs Section 2 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Section 1 (Toe):</span>
                {getRegimeBadge(results.regime1, results.fr1)}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Section 2 (Tail):</span>
                {getRegimeBadge(results.regime2, results.fr2)}
              </div>
            </div>

            {/* Energy Dissipation Efficiency Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <div className="flex justify-between text-[10px] mb-1 font-mono">
                <span className="text-slate-400">Energy Head Loss (ΔE / E₁):</span>
                <span className="text-rose-400 font-bold">
                  {results.relativeEnergyLoss.toFixed(1)}% Dissipated
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-200"
                  style={{ width: `${results.relativeEnergyLoss}%` }}
                />
                <div
                  className="h-full bg-emerald-500/80 transition-all duration-200"
                  style={{ width: `${results.efficiency}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                <span>Loss: {results.energyLoss.toFixed(3)} {units.energy}</span>
                <span>Remaining Efficiency η: {results.efficiency.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* 2. DISSIPATED POWER & CAVITATION METRIC */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono mb-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Power Dissipated</span>
              </div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                {results.powerDissipated.toFixed(1)} <span className="text-xs text-slate-400">{units.power}</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                P = ρgQ·ΔE
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono mb-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Cavitation Risk</span>
              </div>
              <div className="text-[11px] font-mono">
                {getCavitationBadge(results.cavitationRisk)}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Max V₁ = {results.v1.toFixed(2)} {units.velocity}
              </div>
            </div>
          </div>

          {/* 3. KEY DEPTHS & JUMP GEOMETRY TABLE */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Depths & Sequent Relations
            </span>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-mono">
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Upstream y₁:</span>
                <span className="text-amber-300 font-semibold">{results.y1.toFixed(3)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Critical yc:</span>
                <span className="text-yellow-300 font-semibold">{results.yc.toFixed(3)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Sequent y₂*:</span>
                <span className="text-emerald-300 font-semibold">{results.y2Sequent.toFixed(3)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Actual y₂:</span>
                <span className="text-emerald-400 font-semibold">{results.y2.toFixed(3)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Jump Height hj:</span>
                <span className="text-sky-300">{results.jumpHeight.toFixed(3)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Jump Length Lj:</span>
                <span className="text-purple-300">{results.jumpLength.toFixed(2)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Alternate y_alt:</span>
                <span className="text-sky-400">{results.alternateDepth.toFixed(3)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Roller Length Lr:</span>
                <span className="text-purple-400">{results.rollerLength.toFixed(2)} {units.length}</span>
              </div>
            </div>
          </div>

          {/* 4. STILLING BASIN PERFORMANCE & DRAG FORCE */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-indigo-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center">
                <Shield className="w-3 h-3 text-indigo-400 mr-1" />
                <span>USBR Stilling Basin Dissipator</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {params.basinType.split(' ')[0]} {params.basinType.split(' ')[1]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-mono">
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Basin Length LB:</span>
                <span className="text-indigo-300 font-semibold">{results.basinLengthRequired.toFixed(2)} {units.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Length Saved:</span>
                <span className="text-emerald-400 font-semibold">{results.basinLengthSavedPercent.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Baffle Drag FD:</span>
                <span className="text-amber-300 font-semibold">{results.baffleDragForce.toFixed(2)} kN</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Forced y₂':</span>
                <span className="text-emerald-300 font-semibold">{results.forcedSequentDepth.toFixed(3)} {units.length}</span>
              </div>
            </div>
            {results.baffleDragForce > 0 && (
              <div className="text-[9px] text-slate-400 font-sans italic pt-0.5">
                Dynamic baffle pier drag reduces required tailwater depth by ~18% and apron footprint by {results.basinLengthSavedPercent.toFixed(0)}%.
              </div>
            )}
          </div>

          {/* 5. SPECIFIC ENERGY & MOMENTUM CONSERVATION TABLE */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Energy & Momentum Balance
            </span>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-mono">
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Upstream E₁:</span>
                <span className="text-amber-300 font-semibold">{results.e1.toFixed(3)} {units.energy}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Downstream E₂:</span>
                <span className="text-emerald-300 font-semibold">{results.e2.toFixed(3)} {units.energy}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Min Energy Ec:</span>
                <span className="text-yellow-300 font-semibold">{results.ec.toFixed(3)} {units.energy}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Head Loss ΔE:</span>
                <span className="text-rose-400 font-semibold">{results.energyLoss.toFixed(3)} {units.energy}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Momentum M₁:</span>
                <span className="text-purple-300">{results.m1.toFixed(3)} {units.momentum}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span className="text-slate-400">Momentum M₂:</span>
                <span className="text-purple-300">{results.m2.toFixed(3)} {units.momentum}</span>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-sans italic pt-1">
              Note: Momentum is conserved (M₁ ≈ M₂) across the jump, while specific energy decreases by ΔE due to turbulent eddy shear.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
