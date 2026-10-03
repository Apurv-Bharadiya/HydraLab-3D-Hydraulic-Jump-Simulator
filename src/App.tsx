/**
 * HydraLab 3D - Interactive Open-Channel Hydraulic Jump Simulator
 *
 * Flagship portfolio application combining React, React Three Fiber, Three.js,
 * Tailwind CSS, and rigorous Saint-Venant / Bélanger open-channel fluid mechanics.
 */

import {
  BarChart3,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { EyDiagram } from './charts/EyDiagram';
import { useHydraulicPhysics } from './hooks/useHydraulicPhysics';
import { HYDRAULIC_PRESETS } from './physics/presets';
import { FlumeScene } from './scene/FlumeScene';
import { ChallengeModal } from './ui/ChallengeModal';
import { ControlPanel } from './ui/ControlPanel';
import { Header } from './ui/Header';
import { LabReportModal } from './ui/LabReportModal';
import { ReadoutPanel } from './ui/ReadoutPanel';
import { TheoryModal } from './ui/TheoryModal';

export function App() {
  const {
    params,
    results,
    profilePoints,
    visuals,
    activePresetId,
    updateParam,
    updateParams,
    updateVisual,
    syncSequentDepth,
    loadPreset,
    toggleUnitSystem,
    resetDefaults,
  } = useHydraulicPhysics();

  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<'docked' | 'expanded' | 'fullscreen'>('docked');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show transient toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const found = HYDRAULIC_PRESETS.find((p) => p.id === presetId);
    if (found) {
      loadPreset(found);
      showToast(`Loaded Preset: ${found.name}`);
    }
  };

  // Bidirectional interaction from E-y / M-y Diagram
  const handleDiagramDepthChange = (newDepth: number, isUpstream: boolean) => {
    if (isUpstream) {
      // User is adjusting upstream depth y1 (supercritical limb)
      updateParam('upstreamDepth', Math.max(0.01, newDepth));
    } else {
      // User is adjusting tailwater depth y2 (subcritical limb)
      updateParam('downstreamDepth', Math.max(0.02, newDepth));
    }
  };

  // Screenshot Capture Utility
  const handleCaptureScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      showToast('Could not find 3D canvas');
      return;
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `HydraLab3D_Simulation_Fr${results.fr1.toFixed(2)}_${Date.now()}.png`;
      a.click();
      showToast('📸 Simulation screenshot exported!');
    } catch {
      showToast('Canvas capture unavailable');
    }
  };

  // Keyboard Shortcuts (Space to pause/play, R to reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        updateVisual('isPaused', !visuals.isPaused);
        showToast(visuals.isPaused ? 'Simulation Resumed' : 'Simulation Paused');
      } else if (e.key === 'r' || e.key === 'R') {
        resetDefaults();
        showToast('Reset to Default Laboratory Flume');
      } else if (e.key === 't' || e.key === 'T') {
        setIsTheoryOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visuals.isPaused, updateVisual, resetDefaults, showToast]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER NAVIGATION */}
      <Header
        params={params}
        visuals={visuals}
        activePresetId={activePresetId}
        onUpdateVisual={updateVisual}
        onToggleUnitSystem={() => {
          toggleUnitSystem();
          showToast(`Switched to ${params.unitSystem === 'SI' ? 'Imperial' : 'SI'} Units`);
        }}
        onSelectPreset={handleSelectPreset}
        onReset={() => {
          resetDefaults();
          showToast('Reset flume to benchmark conditions');
        }}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
        onOpenChallenges={() => setIsChallengesOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* 2. MAIN VIEWPORT: 3D SCENE & FLOATING UI DOCKS */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full-bleed 3D Flume & Fluid Dynamics Visualization */}
        <div className="absolute inset-0 z-0">
          <FlumeScene
            params={params}
            results={results}
            profilePoints={profilePoints}
            visuals={visuals}
          />
        </div>

        {/* Floating Left: Interactive Hydraulic Control Panel */}
        <div className="absolute top-3 left-3 z-10 w-80 sm:w-88 max-w-[calc(100vw-24px)] pointer-events-auto">
          <ControlPanel
            params={params}
            results={results}
            visuals={visuals}
            onUpdateParam={updateParam}
            onUpdateVisual={updateVisual}
            onSyncSequentDepth={() => {
              syncSequentDepth();
              showToast(`Synced y₂ to Bélanger Sequent Depth (${results.y2Sequent.toFixed(3)} m)`);
            }}
          />
        </div>

        {/* Floating Right: Telemetry & Diagnostic HUD */}
        <div className="absolute top-3 right-3 z-10 w-80 sm:w-92 max-w-[calc(100vw-24px)] pointer-events-auto hidden md:block">
          <ReadoutPanel params={params} results={results} />
        </div>

        {/* Floating Bottom Center/Left: Synchronized Specific Energy Curve (E-y Diagram) */}
        {chartViewMode !== 'fullscreen' && (
          <div
            className={`absolute bottom-3 right-3 md:right-auto md:left-3 z-10 pointer-events-auto transition-all duration-300 ease-in-out ${
              isChartCollapsed
                ? 'h-10 w-auto'
                : chartViewMode === 'expanded'
                ? 'w-full sm:w-[680px] max-w-[calc(100vw-24px)] h-[450px] max-h-[82vh]'
                : 'w-full sm:w-[500px] max-w-[calc(100vw-24px)] h-[330px]'
            }`}
          >
            {isChartCollapsed ? (
              <div
                onClick={() => setIsChartCollapsed(false)}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 shadow-xl cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Specific Energy &amp; Momentum Diagram
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    (Fr₁={results.fr1.toFixed(2)})
                  </span>
                </div>
                <ChevronUp className="w-4 h-4 text-slate-400 ml-3" />
              </div>
            ) : (
              <EyDiagram
                params={params}
                results={results}
                onDepthChange={handleDiagramDepthChange}
                viewMode={chartViewMode}
                onToggleViewMode={(mode) => setChartViewMode(mode)}
                onCollapse={() => setIsChartCollapsed(true)}
              />
            )}
          </div>
        )}

        {/* Fullscreen Diagnostic Diagram Modal */}
        {chartViewMode === 'fullscreen' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl">
              <EyDiagram
                params={params}
                results={results}
                onDepthChange={handleDiagramDepthChange}
                viewMode="fullscreen"
                onToggleViewMode={(mode) => setChartViewMode(mode)}
                onCollapse={() => {
                  setChartViewMode('docked');
                  setIsChartCollapsed(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Viewport Floating Info Pill: Quick Orbit Controls Legend */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800/80 backdrop-blur-md text-[10px] text-slate-400 font-mono shadow-lg">
          <span>🖱️ Left Click: Rotate</span>
          <span>•</span>
          <span>Right Click: Pan</span>
          <span>•</span>
          <span>Scroll: Zoom</span>
          <span>•</span>
          <span>[Space]: Pause/Resume</span>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-sky-500/40 text-slate-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* 3. FLUID MECHANICS THEORY & FORMULA MODAL */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />

      {/* 4. EDUCATIONAL CHALLENGE MODE MODAL */}
      <ChallengeModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        params={params}
        results={results}
        onApplyParams={(newParams) => {
          updateParams(newParams);
          showToast('Loaded challenge problem setup into flume');
        }}
      />

      {/* 5. TECHNICAL LABORATORY PDF REPORT MODAL */}
      <LabReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        params={params}
        results={results}
      />
    </div>
  );
}

export default App;
