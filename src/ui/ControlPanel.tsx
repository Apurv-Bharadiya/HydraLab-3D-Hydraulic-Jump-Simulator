/**
 * HydraLab 3D - Interactive Hydraulic Control Panel
 *
 * Provides responsive sliders, precision numeric inputs, and toggle switches
 * for real-time parameter tuning: y1, y2, S0, gate opening, discharge, width,
 * and 3D visual overlays.
 */

import {
  Activity,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Gauge,
  Shield,
  Sliders,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { SceneVisualOptions } from '../hooks/useHydraulicPhysics';
import { HydraulicParameters, HydraulicResults } from '../physics/types';
import { UNIT_LABELS } from '../physics/units';

interface ControlPanelProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  visuals: SceneVisualOptions;
  onUpdateParam: <K extends keyof HydraulicParameters>(key: K, value: HydraulicParameters[K]) => void;
  onUpdateVisual: <K extends keyof SceneVisualOptions>(key: K, value: SceneVisualOptions[K]) => void;
  onSyncSequentDepth: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  results,
  visuals,
  onUpdateParam,
  onUpdateVisual,
  onSyncSequentDepth,
}) => {
  const [activeTab, setActiveTab] = useState<'hydraulics' | 'channel' | 'basin' | 'visuals'>('hydraulics');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const units = UNIT_LABELS[params.unitSystem];

  return (
    <div
      className={`transition-all duration-300 ease-in-out flex flex-col bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden ${
        isCollapsed ? 'h-12' : 'max-h-[82vh]'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 cursor-pointer select-none">
        <div
          className="flex items-center space-x-2"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
            Hydraulic Controls
          </h2>
        </div>

        <div className="flex items-center space-x-1">
          {/* Quick tab switcher when expanded */}
          {!isCollapsed && (
            <div className="flex items-center p-0.5 bg-slate-800/80 rounded-lg text-[11px] font-medium border border-slate-700/60 mr-2">
              <button
                onClick={() => setActiveTab('hydraulics')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'hydraulics'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hydraulics
              </button>
              <button
                onClick={() => setActiveTab('channel')}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeTab === 'channel'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Channel
              </button>
              <button
                onClick={() => setActiveTab('basin')}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeTab === 'basin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Basin
              </button>
              <button
                onClick={() => setActiveTab('visuals')}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeTab === 'visuals'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Visuals
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* TAB 1: HYDRAULIC PARAMETERS */}
          {activeTab === 'hydraulics' && (
            <div className="space-y-4">
              {/* Control Mode Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">Control Mode</span>
                <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
                  <button
                    onClick={() => onUpdateParam('controlMode', 'depth-driven')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      params.controlMode === 'depth-driven'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Depth y₁
                  </button>
                  <button
                    onClick={() => onUpdateParam('controlMode', 'gate-driven')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      params.controlMode === 'gate-driven'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Gate Opening (a)
                  </button>
                </div>
              </div>

              {/* Sluice Gate Opening Height (a) */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Sluice Gate Opening (a)</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0.02}
                      max={0.8}
                      step={0.01}
                      value={Number(params.gateOpening.toFixed(3))}
                      onChange={(e) => onUpdateParam('gateOpening', parseFloat(e.target.value) || 0.05)}
                      className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">{units.length}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.6}
                  step={0.005}
                  value={params.gateOpening}
                  onChange={(e) => onUpdateParam('gateOpening', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.02 {units.length}</span>
                  <span className="text-slate-400">Vena contracta: {(params.gateOpening * params.gateContractionCoeff).toFixed(3)} {units.length}</span>
                  <span>0.60 {units.length}</span>
                </div>
              </div>

              {/* Upstream Depth (y1) - Supercritical section */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Upstream Depth (y₁)</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0.01}
                      max={0.7}
                      step={0.005}
                      value={Number(params.upstreamDepth.toFixed(3))}
                      onChange={(e) => onUpdateParam('upstreamDepth', parseFloat(e.target.value) || 0.05)}
                      className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">{units.length}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.5}
                  step={0.005}
                  value={params.upstreamDepth}
                  onChange={(e) => onUpdateParam('upstreamDepth', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.02 {units.length}</span>
                  <span className="text-amber-300">Fr₁ = {results.fr1.toFixed(2)}</span>
                  <span>0.50 {units.length}</span>
                </div>
              </div>

              {/* Downstream Depth (y2) - Tailwater */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Downstream Tailwater (y₂)</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0.05}
                      max={0.9}
                      step={0.01}
                      value={Number(params.downstreamDepth.toFixed(3))}
                      onChange={(e) => onUpdateParam('downstreamDepth', parseFloat(e.target.value) || 0.3)}
                      className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-emerald-200 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">{units.length}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.85}
                  step={0.005}
                  value={params.downstreamDepth}
                  onChange={(e) => onUpdateParam('downstreamDepth', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>0.05 {units.length}</span>
                  <button
                    onClick={onSyncSequentDepth}
                    title="Snap y2 to the exact theoretical Bélanger sequent depth"
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
                  >
                    <Zap className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Sync Sequent y₂* ({results.y2Sequent.toFixed(2)})</span>
                  </button>
                  <span>0.85 {units.length}</span>
                </div>
              </div>

              {/* Total Discharge (Q) */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Volumetric Flow Rate (Q)</span>
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0.01}
                      max={0.8}
                      step={0.01}
                      value={Number(params.flowRate.toFixed(3))}
                      onChange={(e) => onUpdateParam('flowRate', parseFloat(e.target.value) || 0.1)}
                      className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">{units.discharge}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.5}
                  step={0.005}
                  value={params.flowRate}
                  onChange={(e) => onUpdateParam('flowRate', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.02</span>
                  <span className="text-slate-400">Unit discharge q = {results.unitDischarge.toFixed(3)} {units.unitDischarge}</span>
                  <span>0.50</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANNEL GEOMETRY & BED SLOPE */}
          {activeTab === 'channel' && (
            <div className="space-y-3.5">
              {/* Channel Cross-Section Shape */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 text-xs">Cross-Section Profile</label>
                  <span className="text-[10px] font-mono text-sky-400 capitalize">{params.channelShape || 'Rectangular'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'rectangular', name: 'Rectangular', desc: 'b × y prism' },
                    { id: 'trapezoidal', name: 'Trapezoidal', desc: 'b + z·y banks' },
                    { id: 'triangular', name: 'Triangular', desc: '2z·y V-notch' },
                    { id: 'circular', name: 'Circular', desc: 'D₀ pipe culvert' },
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => onUpdateParam('channelShape', shape.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        (params.channelShape || 'rectangular') === shape.id
                          ? 'bg-sky-950/70 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                      }`}
                    >
                      <div className="text-xs font-semibold">{shape.name}</div>
                      <div className="text-[9px] text-slate-500">{shape.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side Slope (z:1 H:V) for Trapezoidal and Triangular */}
              {(params.channelShape === 'trapezoidal' || params.channelShape === 'triangular') && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-200 text-xs">Side Slope z (H : 1 V)</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min={0.2}
                        max={3.0}
                        step={0.1}
                        value={Number((params.sideSlopeZ || 1.0).toFixed(2))}
                        onChange={(e) => onUpdateParam('sideSlopeZ', parseFloat(e.target.value) || 1.0)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.25}
                    max={2.5}
                    step={0.05}
                    value={params.sideSlopeZ || 1.0}
                    onChange={(e) => onUpdateParam('sideSlopeZ', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.25:1 (Steep)</span>
                    <span>z = {(params.sideSlopeZ || 1.0).toFixed(2)}:1</span>
                    <span>2.5:1 (Gentle)</span>
                  </div>
                </div>
              )}

              {/* Pipe Diameter (D0) for Circular Channel */}
              {params.channelShape === 'circular' && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-200 text-xs">Conduit Diameter (D₀)</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min={0.3}
                        max={2.0}
                        step={0.05}
                        value={Number((params.pipeDiameter || 1.0).toFixed(2))}
                        onChange={(e) => onUpdateParam('pipeDiameter', parseFloat(e.target.value) || 1.0)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{units.length}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={1.6}
                    step={0.05}
                    value={params.pipeDiameter || 1.0}
                    onChange={(e) => onUpdateParam('pipeDiameter', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.40 {units.length}</span>
                    <span>D₀ = {(params.pipeDiameter || 1.0).toFixed(2)} {units.length}</span>
                    <span>1.60 {units.length}</span>
                  </div>
                </div>
              )}

              {/* Channel Bottom Width (b) for Rectangular & Trapezoidal */}
              {params.channelShape !== 'triangular' && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-200 text-xs">
                      {params.channelShape === 'trapezoidal' ? 'Bottom Width (b)' : 'Channel Width (b)'}
                    </label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min={0.2}
                        max={1.5}
                        step={0.05}
                        value={Number(params.channelWidth.toFixed(2))}
                        onChange={(e) => onUpdateParam('channelWidth', parseFloat(e.target.value) || 0.5)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{units.length}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.2}
                    step={0.05}
                    value={params.channelWidth}
                    onChange={(e) => onUpdateParam('channelWidth', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.20 {units.length}</span>
                    <span>1.20 {units.length}</span>
                  </div>
                </div>
              )}

              {/* Bed Slope (S0) */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200">Bed Slope (S₀)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0.0}
                      max={0.05}
                      step={0.001}
                      value={Number(params.bedSlope.toFixed(4))}
                      onChange={(e) => onUpdateParam('bedSlope', parseFloat(e.target.value) || 0.0)}
                      className="w-20 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">{units.slope}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={0.025}
                  step={0.0005}
                  value={params.bedSlope}
                  onChange={(e) => onUpdateParam('bedSlope', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Horizontal (0.000)</span>
                  <span>Slope: {(params.bedSlope * 100).toFixed(2)}%</span>
                  <span>0.025 (Steep)</span>
                </div>
              </div>

              {/* Manning's Roughness (n) */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200">Manning's Roughness (n)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={0.008}
                      max={0.04}
                      step={0.001}
                      value={Number(params.manningsN.toFixed(3))}
                      onChange={(e) => onUpdateParam('manningsN', parseFloat(e.target.value) || 0.01)}
                      className="w-16 px-1.5 py-0.5 text-right font-mono bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0.008}
                  max={0.025}
                  step={0.001}
                  value={params.manningsN}
                  onChange={(e) => onUpdateParam('manningsN', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.008 (Glass)</span>
                  <span>0.013 (Concrete)</span>
                  <span>0.025 (Gravel)</span>
                </div>
              </div>

              {/* Contraction Coefficient (Cc) */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200">Sluice Contraction (Cc)</label>
                  <span className="font-mono text-slate-300">{params.gateContractionCoeff.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.55}
                  max={0.7}
                  step={0.01}
                  value={params.gateContractionCoeff}
                  onChange={(e) => onUpdateParam('gateContractionCoeff', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: STILLING BASIN & DISSIPATOR APPURTENANCES */}
          {activeTab === 'basin' && (
            <div className="space-y-3.5">
              {/* Basin Type Selector */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>USBR Stilling Basin Type</span>
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                    Standard USBR
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {[
                    {
                      id: 'Type I (Flat Apron)',
                      name: 'USBR Type I (Flat Apron)',
                      desc: 'Natural jump on flat apron. No blocks. LB ≈ 6.0·y2',
                      blocks: false,
                      baffles: false,
                      sill: false,
                    },
                    {
                      id: 'Type II (High Fr)',
                      name: 'USBR Type II (High Dam Chutes)',
                      desc: 'V1 > 15 m/s, Fr1 > 4.5. Chute blocks + dentated sill (33% shorter)',
                      blocks: true,
                      baffles: false,
                      sill: true,
                    },
                    {
                      id: 'Type III (Baffle Piers)',
                      name: 'USBR Type III (Baffle Piers)',
                      desc: 'V1 < 15 m/s, Fr1 > 4.5. Dynamic form drag FD saves >50% length',
                      blocks: true,
                      baffles: true,
                      sill: true,
                    },
                    {
                      id: 'Type IV (Low Fr)',
                      name: 'USBR Type IV (Oscillating Jump)',
                      desc: '2.5 < Fr1 < 4.5. Large wave-suppressing chute blocks',
                      blocks: true,
                      baffles: false,
                      sill: false,
                    },
                  ].map((basin) => (
                    <button
                      key={basin.id}
                      onClick={() => {
                        onUpdateParam('basinType', basin.id as any);
                        onUpdateParam('hasChuteBlocks', basin.blocks);
                        onUpdateParam('hasBafflePiers', basin.baffles);
                        onUpdateParam('hasEndSill', basin.sill);
                      }}
                      className={`text-left p-2 rounded-lg border transition-all text-xs ${
                        params.basinType === basin.id
                          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/60 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-[11px] text-indigo-300">{basin.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{basin.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Appurtenances Toggles */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Dissipator Appurtenances
                </span>

                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Chute Blocks (Toe)</div>
                      <div className="text-[10px] text-slate-400">h₁ = {results.chuteBlockHeight.toFixed(3)} {units.length}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={params.hasChuteBlocks}
                      onChange={(e) => onUpdateParam('hasChuteBlocks', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-800 cursor-pointer accent-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Baffle Impact Piers</div>
                      <div className="text-[10px] text-slate-400">h₃ = {results.bafflePierHeight.toFixed(3)} {units.length} | Drag FD = {results.baffleDragForce.toFixed(2)} kN</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={params.hasBafflePiers}
                      onChange={(e) => onUpdateParam('hasBafflePiers', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-800 cursor-pointer accent-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">End Sill</div>
                      <div className="text-[10px] text-slate-400">h₄ = {results.endSillHeight.toFixed(3)} {units.length} (Lifts bottom currents)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={params.hasEndSill}
                      onChange={(e) => onUpdateParam('hasEndSill', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-800 cursor-pointer accent-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">3D Basin Overlay</div>
                      <div className="text-[10px] text-slate-400">Render concrete apron & drag vectors</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={visuals.showBasinBlocks}
                      onChange={(e) => onUpdateVisual('showBasinBlocks', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 bg-slate-800 cursor-pointer accent-indigo-500"
                    />
                  </label>
                </div>
              </div>

              {/* Virtual Dye Tracer Laboratory */}
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lagrangian Virtual Dye Lab</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visuals.showDyeTracer}
                      onChange={(e) => onUpdateVisual('showDyeTracer', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {visuals.showDyeTracer && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 font-mono">Dye Compound:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'fluorescein', name: 'Fluorescein', color: 'bg-emerald-500', wl: '521 nm' },
                          { id: 'rhodamine', name: 'Rhodamine B', color: 'bg-rose-500', wl: '580 nm' },
                          { id: 'methylene', name: 'Methylene Blue', color: 'bg-sky-500', wl: '668 nm' },
                          { id: 'uranine', name: 'Uranine Amber', color: 'bg-amber-500', wl: '491 nm' },
                        ].map((dye) => (
                          <button
                            key={dye.id}
                            onClick={() => onUpdateVisual('dyeColor', dye.id as any)}
                            className={`flex items-center space-x-2 p-1.5 rounded-lg border text-left text-[11px] transition-all ${
                              visuals.dyeColor === dye.id
                                ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${dye.color} shadow-sm`} />
                            <div>
                              <div className="leading-none text-[11px]">{dye.name}</div>
                              <div className="text-[9px] text-slate-500">{dye.wl}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center space-x-2">
                      <button
                        onClick={() => onUpdateVisual('dyeMode', visuals.dyeMode === 'stream' ? 'off' : 'stream')}
                        className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          visuals.dyeMode === 'stream'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                        }`}
                      >
                        {visuals.dyeMode === 'stream' ? 'Stream: Active' : 'Continuous Stream'}
                      </button>
                      <button
                        onClick={() => {
                          onUpdateVisual('dyeMode', 'pulse');
                          setTimeout(() => onUpdateVisual('dyeMode', 'off'), 1500);
                        }}
                        className="py-1 px-3 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all"
                      >
                        Pulse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 3D VISUAL OVERLAYS & SIMULATION SPEED */}
          {activeTab === 'visuals' && (
            <div className="space-y-3">
              {/* Simulation Flow Speed */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    <span>Flow Animation Speed</span>
                  </label>
                  <span className="font-mono text-sky-400 font-semibold">{visuals.flowSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={2.5}
                  step={0.1}
                  value={visuals.flowSpeed}
                  onChange={(e) => onUpdateVisual('flowSpeed', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Toggles List */}
              <div className="space-y-2 pt-1">
                {[
                  { key: 'showVectors', label: '3D Velocity Vector Field', desc: 'Direction & magnitude arrows' },
                  { key: 'showStreamlines', label: 'Streamline Tracer Particles', desc: 'Lagrangian fluid particles' },
                  { key: 'showFoam', label: 'Roller Aeration & Foam Spray', desc: 'Vortex white-water churn' },
                  { key: 'showEGL', label: 'Energy Grade Line (EGL / HGL)', desc: 'Total & hydraulic head in 3D' },
                  { key: 'showRuler', label: 'Engineering Depth Calipers', desc: 'y1, yc, y2 dimension marks' },
                  { key: 'showGlassWalls', label: 'Transparent Acrylic Walls', desc: 'Flume sidewall panels' },
                  { key: 'wireframe', label: 'Water Surface Wireframe', desc: 'Computational mesh topology' },
                ].map(({ key, label, desc }) => {
                  const val = visuals[key as keyof SceneVisualOptions] as boolean;
                  return (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-950/80 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{label}</div>
                        <div className="text-[10px] text-slate-400">{desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          onUpdateVisual(key as keyof SceneVisualOptions, e.target.checked as any)
                        }
                        className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-800 cursor-pointer accent-sky-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
