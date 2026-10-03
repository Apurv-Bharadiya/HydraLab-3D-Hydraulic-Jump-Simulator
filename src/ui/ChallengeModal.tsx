/**
 * HydraLab 3D - Interactive Educational Challenge Mode
 *
 * Provides 4 realistic open-channel engineering problem scenarios:
 * 1. Dam Spillway Tailwater Sizing (Bélanger Conjugate Depth)
 * 2. Stilling Basin Dissipator Optimization (USBR Type III & Baffle Drag)
 * 3. Sluice Gate Calibration for Target Froude Number
 * 4. Trapezoidal Canal Transition (Non-Rectangular Momentum Conservation)
 *
 * Features live auto-evaluation, real-time score tracker, problem setup loader,
 * and step-by-step mathematical derivations.
 */

import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { HydraulicParameters, HydraulicResults } from '../physics/types';
import { UNIT_LABELS } from '../physics/units';

export interface ChallengeScenario {
  id: string;
  title: string;
  category: 'Dam Engineering' | 'Energy Dissipators' | 'Gate Hydraulics' | 'Canal Transitions';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  objective: string;
  setupParams: Partial<HydraulicParameters>;
  checkSuccess: (params: HydraulicParameters, results: HydraulicResults) => boolean;
  getHint: (params: HydraulicParameters, results: HydraulicResults) => string;
  derivation: {
    governingEquation: string;
    steps: string[];
    theoreticalSolution: string;
  };
}

export const CHALLENGES: ChallengeScenario[] = [
  {
    id: 'challenge-1',
    title: 'Spillway Tailwater Sizing for Stable Jump',
    category: 'Dam Engineering',
    difficulty: 'Beginner',
    description:
      'A spillway chute discharges Q = 0.16 m³/s into a rectangular channel of width b = 0.50 m. The supercritical jet emerges at y₁ = 0.080 m (Fr₁ ≈ 5.66). If the tailwater depth y₂ is too low, the jump will sweep out and erode the downstream riverbed; if it is too high, it will drown the jump and reduce discharge.',
    objective:
      'Adjust downstream tailwater depth y₂ to match theoretical sequent depth y₂* within ±0.02 m.',
    setupParams: {
      upstreamDepth: 0.08,
      downstreamDepth: 0.35, // Deliberately mismatched (too low)
      flowRate: 0.16,
      channelWidth: 0.5,
      bedSlope: 0.0,
      controlMode: 'depth-driven',
      channelShape: 'rectangular',
      basinType: 'Type I (Flat Apron)',
      hasChuteBlocks: false,
      hasBafflePiers: false,
      hasEndSill: false,
    },
    checkSuccess: (params, results) => {
      return (
        results.fr1 > 2.0 &&
        Math.abs(params.downstreamDepth - results.y2Sequent) <= 0.025
      );
    },
    getHint: (params, results) => {
      const diff = results.y2Sequent - params.downstreamDepth;
      if (diff > 0.025) {
        return `Tailwater is too shallow! Jump is swept downstream. Increase y₂ towards ~${results.y2Sequent.toFixed(3)} m.`;
      }
      if (diff < -0.025) {
        return `Tailwater is too deep! Jump is drowned. Decrease y₂ towards ~${results.y2Sequent.toFixed(3)} m.`;
      }
      return 'Jump is perfectly balanced on the apron!';
    },
    derivation: {
      governingEquation: 'y₂* = (y₁ / 2) · [√(1 + 8·Fr₁²) - 1]',
      steps: [
        '1. Compute unit discharge: q = Q / b = 0.16 / 0.50 = 0.320 m²/s.',
        '2. Compute supercritical velocity: V₁ = q / y₁ = 0.320 / 0.080 = 4.00 m/s.',
        '3. Compute upstream Froude number: Fr₁ = V₁ / √(g·y₁) = 4.00 / √(9.81 × 0.08) = 4.516.',
        '4. Substitute into Bélanger sequent depth equation: y₂* = (0.08 / 2) · [√(1 + 8 × 4.516²) - 1] = 0.04 · [√(1 + 163.15) - 1] ≈ 0.472 m.',
      ],
      theoreticalSolution: 'Theoretical Sequent Depth y₂* ≈ 0.472 m',
    },
  },
  {
    id: 'challenge-2',
    title: 'USBR Stilling Basin Dissipator Optimization',
    category: 'Energy Dissipators',
    difficulty: 'Intermediate',
    description:
      'High incoming velocities (Fr₁ > 6.0) require an excessively long Type I flat concrete apron (> 3.5 m). Real estate and excavation constraints require reducing the stilling basin footprint by at least 50% without allowing scouring tailwater velocities.',
    objective:
      'Configure a USBR Type III stilling basin with chute blocks and baffle piers to achieve ≥ 50% basin length reduction with active hydrodynamic drag (FD > 0).',
    setupParams: {
      upstreamDepth: 0.05,
      downstreamDepth: 0.52,
      flowRate: 0.18,
      channelWidth: 0.6,
      bedSlope: 0.002,
      controlMode: 'depth-driven',
      channelShape: 'rectangular',
      basinType: 'Type I (Flat Apron)',
      hasChuteBlocks: false,
      hasBafflePiers: false,
      hasEndSill: false,
    },
    checkSuccess: (params, results) => {
      return (
        results.fr1 > 4.5 &&
        params.hasBafflePiers &&
        results.baffleDragForce > 0.05 &&
        results.basinLengthSavedPercent >= 50
      );
    },
    getHint: (params, results) => {
      if (!params.hasBafflePiers) {
        return 'Go to the "Basin" tab in Hydraulic Controls and switch to USBR Type III or enable Baffle Piers.';
      }
      if (results.baffleDragForce <= 0.05) {
        return 'Ensure upstream flow is supercritical (Fr₁ > 4.5) to mobilize dynamic impact form drag.';
      }
      return 'USBR Type III basin successfully mobilized! Apron footprint reduced by >50%.';
    },
    derivation: {
      governingEquation: 'P₁ - P₂ - F_D = ρ·Q·(V₂ - V₁)',
      steps: [
        '1. Natural hydraulic jump length on flat apron: L_natural ≈ 6.1 · y₂* ≈ 6.1 × 0.52 = 3.17 m.',
        '2. Baffle piers exert form drag: F_D = C_D · 0.5·ρ·A_baffle·V₁² opposing supercritical jet thrust.',
        '3. This dynamic back-thrust reduces required forced tailwater depth: y₂\' ≈ 0.82 · y₂*.',
        '4. Required USBR Type III basin length: L_B = 2.8 · y₂\' ≈ 2.8 × (0.82 × 0.52) ≈ 1.19 m.',
        '5. Footprint reduction: (3.17 - 1.19) / 3.17 ≈ 62.5% length saved!',
      ],
      theoreticalSolution: 'USBR Type III Apron Length L_B ≈ 1.19 m (62.5% reduction)',
    },
  },
  {
    id: 'challenge-3',
    title: 'Sluice Gate Calibration for Target Froude Number',
    category: 'Gate Hydraulics',
    difficulty: 'Intermediate',
    description:
      'A calibration flume needs to reproduce an oscillating jump regime benchmark (Fr₁ = 4.50 ± 0.20) under a constant total discharge Q = 0.15 m³/s in a channel of width b = 0.50 m.',
    objective:
      'Adjust the upstream depth y₁ (or gate opening) so that Fr₁ settles between 4.30 and 4.70.',
    setupParams: {
      upstreamDepth: 0.14, // Fr1 ~ 2.1 (Weak jump)
      downstreamDepth: 0.45,
      flowRate: 0.15,
      channelWidth: 0.5,
      bedSlope: 0.0,
      controlMode: 'depth-driven',
      channelShape: 'rectangular',
    },
    checkSuccess: (_params, results) => {
      return Math.abs(results.fr1 - 4.5) <= 0.25;
    },
    getHint: (_params, results) => {
      if (results.fr1 < 4.25) {
        return `Current Fr₁ = ${results.fr1.toFixed(2)}. Froude number is too low! Decrease y₁ to increase velocity.`;
      }
      if (results.fr1 > 4.75) {
        return `Current Fr₁ = ${results.fr1.toFixed(2)}. Froude number is too high! Increase y₁ to moderate velocity.`;
      }
      return `Target calibrated! Fr₁ = ${results.fr1.toFixed(2)} is within 4.50 ± 0.25.`;
    },
    derivation: {
      governingEquation: 'Fr₁ = (q / y₁) / √(g·y₁) = q / √(g·y₁³)',
      steps: [
        '1. Target Fr₁ = 4.50. Unit discharge q = 0.15 / 0.50 = 0.30 m²/s.',
        '2. Rearrange Froude equation for y₁: y₁³ = q² / (g · Fr₁²).',
        '3. Substitute values: y₁³ = (0.30)² / [9.81 × (4.50)²] = 0.09 / (9.81 × 20.25) = 0.09 / 198.65 = 0.000453.',
        '4. Take cube root: y₁ = (0.000453)^(1/3) ≈ 0.0768 m (≈ 7.7 cm).',
      ],
      theoreticalSolution: 'Target Upstream Depth y₁ ≈ 0.077 m (7.7 cm)',
    },
  },
  {
    id: 'challenge-4',
    title: 'Trapezoidal Canal Non-Rectangular Momentum Balance',
    category: 'Canal Transitions',
    difficulty: 'Advanced',
    description:
      'In a trapezoidal irrigation canal with bottom width b = 0.40 m and 1:1 side slopes (z = 1.0), the simple rectangular Bélanger equation is no longer valid. Hydrostatic pressure distribution is non-linear, and water spreads transversely as depth increases.',
    objective:
      'Set channel shape to "Trapezoidal", side slope z = 1.0, and adjust tailwater y₂ so momentum is conserved (M₁ ≈ M₂ within 2%).',
    setupParams: {
      channelShape: 'trapezoidal',
      sideSlopeZ: 1.0,
      channelWidth: 0.4,
      upstreamDepth: 0.08,
      downstreamDepth: 0.25, // Deliberately unbalanced
      flowRate: 0.18,
      bedSlope: 0.001,
      controlMode: 'depth-driven',
    },
    checkSuccess: (params, results) => {
      const momentumError = Math.abs(results.m2 - results.m1) / Math.max(0.001, results.m1);
      return (
        params.channelShape === 'trapezoidal' &&
        results.fr1 > 1.8 &&
        momentumError <= 0.035
      );
    },
    getHint: (params, results) => {
      if (params.channelShape !== 'trapezoidal') {
        return 'Go to the "Channel" tab in Hydraulic Controls and select the "Trapezoidal" profile.';
      }
      const momentumError = Math.abs(results.m2 - results.m1) / results.m1;
      if (momentumError > 0.035) {
        return `Current momentum difference: ${(momentumError * 100).toFixed(1)}%. Adjust y₂ towards sequent depth y₂* = ${results.y2Sequent.toFixed(3)} m.`;
      }
      return 'Momentum successfully conserved across trapezoidal hydraulic jump!';
    },
    derivation: {
      governingEquation: 'M(y) = Q² / (g·A) + b·y²/2 + z·y³/3 = Const.',
      steps: [
        '1. For trapezoidal cross-section: A(y) = (b + z·y)·y = 0.40·y + 1.0·y².',
        '2. Upstream section (y₁ = 0.08 m): A₁ = (0.40 + 0.08) × 0.08 = 0.0384 m².',
        '3. First moment of area: A₁·ȳ₁ = 0.40 × (0.08)²/2 + 1.0 × (0.08)³/3 = 0.00128 + 0.000171 = 0.00145 m³.',
        '4. Upstream momentum: M₁ = (0.18)² / (9.81 × 0.0384) + 0.00145 = 0.0859 + 0.00145 = 0.0874 m³.',
        '5. Solve M(y₂*) = 0.0874 via Newton-Raphson: yields y₂* ≈ 0.388 m.',
      ],
      theoreticalSolution: 'Non-Rectangular Conjugate Depth y₂* ≈ 0.388 m',
    },
  },
];

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: HydraulicParameters;
  results: HydraulicResults;
  onApplyParams: (newParams: Partial<HydraulicParameters>) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  params,
  results,
  onApplyParams,
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('challenge-1');
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({});
  const [expandedDerivation, setExpandedDerivation] = useState<boolean>(false);

  const units = UNIT_LABELS[params.unitSystem];
  const activeChallenge =
    CHALLENGES.find((c) => c.id === selectedChallengeId) || CHALLENGES[0];

  // Evaluate current challenge in real-time
  const isCurrentSuccessful = activeChallenge.checkSuccess(params, results);

  // If solved, record completion
  React.useEffect(() => {
    if (isCurrentSuccessful && !completedChallenges[activeChallenge.id]) {
      setCompletedChallenges((prev) => ({ ...prev, [activeChallenge.id]: true }));
    }
  }, [isCurrentSuccessful, activeChallenge.id, completedChallenges]);

  const numCompleted = Object.values(completedChallenges).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono">
                  Educational Hydraulic Challenges
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {numCompleted} / {CHALLENGES.length} Completed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Solve realistic engineering problem scenarios by calibrating flume parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar (List) + Right Content (Active Challenge) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left Challenge Selector */}
          <div className="w-full md:w-72 bg-slate-950/50 border-b md:border-b-0 md:border-r border-slate-800/80 p-3 space-y-2 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-2 block">
              Problem Scenarios
            </span>
            {CHALLENGES.map((ch, idx) => {
              const isSelected = ch.id === activeChallenge.id;
              const isSolved = !!completedChallenges[ch.id];
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChallengeId(ch.id);
                    setExpandedDerivation(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start space-x-2.5 ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500/80 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <div className="pt-0.5">
                    {isSolved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-sky-400 font-medium">
                        Case 0{idx + 1}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          ch.difficulty === 'Beginner'
                            ? 'text-emerald-300 bg-emerald-500/10'
                            : ch.difficulty === 'Intermediate'
                            ? 'text-amber-300 bg-amber-500/10'
                            : 'text-rose-300 bg-rose-500/10'
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate mt-0.5">{ch.title}</div>
                    <div className="text-[10px] text-slate-400">{ch.category}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Challenge Workspace */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* Title & Setup Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white font-mono">{activeChallenge.title}</h3>
                  {completedChallenges[activeChallenge.id] && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Award className="w-3 h-3 mr-1" />
                      Solved
                    </span>
                  )}
                </div>
                <div className="text-xs text-sky-400 font-medium mt-0.5">{activeChallenge.category}</div>
              </div>

              <button
                onClick={() => onApplyParams(activeChallenge.setupParams)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-600/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Load Problem Setup</span>
              </button>
            </div>

            {/* Description & Objective */}
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <p>{activeChallenge.description}</p>
              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/50 text-sky-200">
                <span className="font-bold text-sky-400 font-mono uppercase tracking-wider text-[10px] block mb-1">
                  Required Objective:
                </span>
                {activeChallenge.objective}
              </div>
            </div>

            {/* Live Real-time Evaluation Status Banner */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isCurrentSuccessful
                  ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200 shadow-lg shadow-emerald-500/10'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {isCurrentSuccessful ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0 animate-bounce" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider">
                    {isCurrentSuccessful
                      ? 'Challenge Completed Successfully!'
                      : 'Live Simulator Status & Engineering Guidance:'}
                  </div>
                  <div className="text-xs mt-1 text-slate-300">
                    {activeChallenge.getHint(params, results)}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Physical Telemetry Snapshot */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/70 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Current Flume Telemetry
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Upstream y₁</div>
                  <div className="text-amber-300 font-bold">{results.y1.toFixed(3)} {units.length}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Tailwater y₂</div>
                  <div className="text-emerald-400 font-bold">{params.downstreamDepth.toFixed(3)} {units.length}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Sequent y₂*</div>
                  <div className="text-emerald-300 font-bold">{results.y2Sequent.toFixed(3)} {units.length}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Froude Fr₁</div>
                  <div className="text-sky-300 font-bold">{results.fr1.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Mathematical Derivation Walkthrough */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
              <button
                onClick={() => setExpandedDerivation(!expandedDerivation)}
                className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-200 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Step-by-Step Mathematical Derivation & Theory</span>
                </div>
                {expandedDerivation ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {expandedDerivation && (
                <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs text-slate-300 font-sans">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-sky-300">
                    <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold mb-0.5">
                      Governing Formulation:
                    </span>
                    {activeChallenge.derivation.governingEquation}
                  </div>

                  <div className="space-y-1.5 pl-1">
                    {activeChallenge.derivation.steps.map((step, sIdx) => (
                      <div key={sIdx} className="text-slate-300">
                        {step}
                      </div>
                    ))}
                  </div>

                  <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/40 font-mono text-[11px] text-emerald-300 font-bold">
                    {activeChallenge.derivation.theoreticalSolution}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
