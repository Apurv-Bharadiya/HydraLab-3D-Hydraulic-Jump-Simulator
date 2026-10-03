/**
 * HydraLab 3D - Top Application Navigation & Global Controls Header
 */

import {
  Activity,
  BookOpen,
  Camera,
  FileText,
  FlaskConical,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Waves,
} from 'lucide-react';
import React, { useState } from 'react';
import { SceneVisualOptions } from '../hooks/useHydraulicPhysics';
import { HYDRAULIC_PRESETS } from '../physics/presets';
import { HydraulicParameters } from '../physics/types';

interface HeaderProps {
  params: HydraulicParameters;
  visuals: SceneVisualOptions;
  activePresetId: string;
  onUpdateVisual: <K extends keyof SceneVisualOptions>(key: K, value: SceneVisualOptions[K]) => void;
  onToggleUnitSystem: () => void;
  onSelectPreset: (presetId: string) => void;
  onReset: () => void;
  onOpenTheory: () => void;
  onCaptureScreenshot: () => void;
  onOpenChallenges: () => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  params,
  visuals,
  activePresetId,
  onUpdateVisual,
  onToggleUnitSystem,
  onSelectPreset,
  onReset,
  onOpenTheory,
  onCaptureScreenshot,
  onOpenChallenges,
  onOpenReport,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="relative z-20 flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/95 border-b border-slate-800/90 backdrop-blur-md shadow-lg select-none flex-nowrap overflow-x-auto">
      {/* Brand Title & Description */}
      <div className="flex items-center space-x-2.5 flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-500 text-white shadow-md shadow-sky-500/20">
          <Waves className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-sm font-extrabold tracking-tight text-white font-sans">
              HydraLab <span className="text-sky-400 font-mono font-medium">3D</span>
            </h1>
            <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 hidden lg:inline-block">
              Simulator
            </span>
          </div>
        </div>
      </div>

      {/* Center Controls: Presets & Camera Views */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {/* Engineering Presets Selector */}
        <div className="flex items-center space-x-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 shadow-inner flex-shrink-0">
          <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <select
            value={activePresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">
              Custom Parameters...
            </option>
            {HYDRAULIC_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Camera Views Dropdown / Buttons */}
        <div className="hidden lg:flex items-center space-x-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-xs flex-shrink-0">
          {(
            [
              { id: 'iso', label: '3D' },
              { id: 'elevation', label: 'Side' },
              { id: 'downstream', label: 'Tail' },
              { id: 'top', label: 'Top' },
              { id: 'gate', label: 'Gate' },
            ] as const
          ).map((view) => (
            <button
              key={view.id}
              onClick={() => onUpdateVisual('cameraPreset', view.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                visuals.cameraPreset === view.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Playback, Units, Snapshot, Theory, Fullscreen */}
      <div className="flex items-center space-x-2">
        {/* Play / Pause Toggle */}
        <button
          onClick={() => onUpdateVisual('isPaused', !visuals.isPaused)}
          title={visuals.isPaused ? 'Resume Flow Simulation' : 'Pause Flow Simulation'}
          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
            visuals.isPaused
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          {visuals.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Unit Switcher */}
        <button
          onClick={onToggleUnitSystem}
          title="Toggle SI (Metric) and US Customary (Imperial) Units"
          className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition-all shadow-sm"
        >
          {params.unitSystem === 'SI' ? 'SI [m, m³/s]' : 'IMP [ft, cfs]'}
        </button>

        {/* Snapshot */}
        <button
          onClick={onCaptureScreenshot}
          title="Export 3D Visualization Screenshot"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all"
        >
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Capture</span>
        </button>

        {/* Quick Virtual Dye Lab Toolbar */}
        <div className="flex items-center space-x-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 text-xs">
          <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-slate-400 hidden xl:inline">Dye:</span>
          <button
            onClick={() => {
              const dyes: Array<'fluorescein' | 'rhodamine' | 'methylene' | 'uranine'> = [
                'fluorescein',
                'rhodamine',
                'methylene',
                'uranine',
              ];
              const next = dyes[(dyes.indexOf(visuals.dyeColor) + 1) % dyes.length];
              onUpdateVisual('dyeColor', next);
            }}
            title="Cycle Dye: Fluorescein / Rhodamine / Methylene / Uranine"
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                visuals.dyeColor === 'fluorescein'
                  ? 'bg-emerald-400'
                  : visuals.dyeColor === 'rhodamine'
                  ? 'bg-rose-400'
                  : visuals.dyeColor === 'methylene'
                  ? 'bg-sky-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] capitalize font-medium">{visuals.dyeColor.slice(0, 4)}</span>
          </button>
          <button
            onClick={() => {
              onUpdateVisual('showDyeTracer', true);
              onUpdateVisual('dyeMode', 'pulse');
              setTimeout(() => onUpdateVisual('dyeMode', 'off'), 1500);
            }}
            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[10px] transition-colors"
          >
            Pulse
          </button>
          <button
            onClick={() => {
              onUpdateVisual('showDyeTracer', true);
              onUpdateVisual('dyeMode', visuals.dyeMode === 'stream' ? 'off' : 'stream');
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              visuals.dyeMode === 'stream'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Stream
          </button>
        </div>

        {/* Quick EGL Toggle */}
        <button
          onClick={() => onUpdateVisual('showEGL', !visuals.showEGL)}
          title={visuals.showEGL ? 'Hide Energy Grade Line (EGL)' : 'Show Energy Grade Line (EGL)'}
          className={`flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-lg border transition-all ${
            visuals.showEGL
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden xl:inline">{visuals.showEGL ? 'EGL: On' : 'EGL: Off'}</span>
        </button>

        {/* Challenges Mode Button */}
        <button
          onClick={onOpenChallenges}
          title="Interactive Educational Hydraulic Challenges"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all shadow-sm shadow-amber-500/10"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Challenges</span>
        </button>

        {/* Technical Lab Report Button */}
        <button
          onClick={onOpenReport}
          title="Generate Technical Laboratory PDF Report"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/60 transition-all shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Report</span>
        </button>

        {/* Theory & Math Reference Modal Button */}
        <button
          onClick={onOpenTheory}
          title="Fluid Mechanics Theory & Formulas"
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Theory</span>
        </button>

        {/* Reset Defaults */}
        <button
          onClick={onReset}
          title="Reset Parameters to Benchmark Laboratory Defaults"
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Mode"
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
