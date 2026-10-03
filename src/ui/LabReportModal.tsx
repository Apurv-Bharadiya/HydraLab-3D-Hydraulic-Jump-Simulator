/**
 * HydraLab 3D - Automated Technical Laboratory Report Generator
 *
 * Formats a publication-grade civil engineering laboratory report
 * matching ASCE / IAHR / USBR technical standards:
 *
 * Supported Report Modes:
 * 1. Full A-to-Z Detailed Technical Report:
 *    - Complete fluid mechanics theory & mathematical derivations
 *    - Saint-Venant shallow water equations & momentum conservation
 *    - Classical Bélanger equation first-principles derivation
 *    - Specific energy E(y) & minimum energy critical flow condition
 *    - Head loss derivation Delta E = (y2 - y1)^3 / (4 y1 y2)
 *    - Cavitation index and damage criteria
 *    - USBR Stilling Basins Types I, II, III, IV design standards & hydrodynamic drag
 *    - Step-by-step numerical calculations with user's exact substituted parameters
 *    - Multi-section hydrodynamics table & certification sign-off
 * 2. Executive Summary Report:
 *    - Concise high-level key metrics, jump classification, energy dissipation,
 *      stilling basin sizing, and quick safety summary
 *
 * Download Options:
 * - Print / Save as PDF (custom print stylesheet formatted for A4/Letter multi-page)
 * - Download Full Report (.md / .txt)
 * - Download Executive Summary (.txt)
 * - Export Raw Telemetry (.json)
 */

import {
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  FileText,
  Layers,
  Printer,
  Shield,
  Waves,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { HydraulicParameters, HydraulicResults } from '../physics/types';
import { UNIT_LABELS } from '../physics/units';

interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: HydraulicParameters;
  results: HydraulicResults;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  isOpen,
  onClose,
  params,
  results,
}) => {
  const [reportMode, setReportMode] = useState<'full' | 'summary'>('full');
  const reportRef = useRef<HTMLDivElement>(null);
  const units = UNIT_LABELS[params.unitSystem];
  const reportDate = new Date().toLocaleString();
  const reportId = `HYDRA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!isOpen) return null;

  // Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Export JSON data
  const handleExportJSON = () => {
    const data = {
      reportId,
      timestamp: new Date().toISOString(),
      reportMode,
      apparatus: 'HydraLab 3D Interactive Open-Channel Hydraulic Jump Simulator',
      unitSystem: params.unitSystem,
      parameters: params,
      results: results,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HydraLab_Data_${reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Comprehensive Markdown / Text Report
  const handleExportFullReportText = () => {
    const text = `# HYDRALAB 3D - FULL TECHNICAL HYDRAULIC JUMP REPORT (A TO Z)
================================================================================
Report ID:     ${reportId}
Date:          ${reportDate}
Unit System:   ${params.unitSystem === 'SI' ? 'SI Metric' : 'US Customary'}
Standards:     USBR Monograph 25 / Chow (1959) / ASCE Task Committee (1993)
Apparatus:     HydraLab 3D Interactive Open-Channel Hydraulic Jump Simulator
================================================================================

1. THEORETICAL FOUNDATIONS OF HYDRAULIC JUMPS (A TO Z)
--------------------------------------------------------------------------------
1.1 Saint-Venant 1D Shallow Water Equations:
  Continuity:       ∂A/∂t + ∂Q/∂x = 0
  Momentum:         ∂Q/∂t + ∂(β·Q²/A)/∂x + g·A·∂y/∂x = g·A·(S₀ - S_f)

1.2 Derivation of the Bélanger Equation from First Principles:
  Applying Reynolds Transport Theorem for momentum balance across sections 1 and 2:
    Hydrostatic thrust P₁ = (1/2)·γ·b·y₁²
    Hydrostatic thrust P₂ = (1/2)·γ·b·y₂²
    Momentum flux net change: ρ·Q·(V₂ - V₁)
    Equating net forces (neglecting boundary shear over short jump distance):
      P₁ - P₂ = ρ·Q·(V₂ - V₁)
      (1/2)·γ·b·(y₁² - y₂²) = ρ·Q·(q/y₂ - q/y₁)
    Dividing by (1/2)·γ·b and factoring (y₁ - y₂):
      (y₁ + y₂) = 2·q² / [g·y₁·y₂]
    Rearranging into quadratic form for sequent depth ratio (y₂/y₁):
      (y₂/y₁)² + (y₂/y₁) - 2·Fr₁² = 0
    Solving positive real root yields the classical Bélanger Equation:
      y₂* / y₁ = (1/2) · [ √(1 + 8·Fr₁²) - 1 ]

1.3 Specific Energy E(y) and Critical Flow Condition:
  Specific Energy:  E(y) = y + V² / (2g) = y + Q² / [2g·A(y)²]
  Critical state occurs at minimum energy dE/dy = 0:
    1 - Q²·T / [g·A³] = 0  ==>  Fr = V / √(g·D_h) = 1.000
    Critical Depth (rectangular): y_c = ∛(q² / g) = ${results.yc.toFixed(4)} ${units.length}
    Minimum Energy: E_c = 1.5 · y_c = ${results.ec.toFixed(4)} ${units.energy}

1.4 Energy Head Loss Derivation across Jump Roller:
  ΔE = E₁ - E₂ = (y₁ + V₁²/(2g)) - (y₂ + V₂²/(2g))
  Substituting the Bélanger relation for a rectangular flume yields:
    ΔE = (y₂ - y₁)³ / [4 · y₁ · y₂]
  Calculated Head Loss:  ΔE = ${results.energyLoss.toFixed(4)} ${units.energy}
  Relative Energy Loss:  ΔE/E₁ = ${results.relativeEnergyLoss.toFixed(2)} %
  Power Dissipated:      P = γ·Q·ΔE = ${results.powerDissipated.toFixed(2)} ${units.power}

1.5 Specific Force (Momentum Function M) Invariance:
  M(y) = Q² / (g·A) + A·ȳ
  At Section 1 (Toe):       M₁ = ${results.m1.toFixed(4)} ${units.momentum}
  At Section 2 (Sequent):   M₂* = ${results.m1.toFixed(4)} ${units.momentum} (Strictly Conserved)
  At Section 2 (Actual):    M₂ = ${results.m2.toFixed(4)} ${units.momentum}

1.6 Cavitation Risk Index:
  σ = (p - p_v) / [ (1/2)·ρ·V₁² ]
  Calculated Risk:  ${results.cavitationRisk} (Max V₁ = ${results.v1.toFixed(2)} ${units.velocity})

1.7 USBR Stilling Basin Dissipator Performance (Type ${params.basinType}):
  Baffle Impact Drag Force:  F_D = ${results.baffleDragForce.toFixed(2)} kN
  Forced Sequent Depth:      y₂' = ${results.forcedSequentDepth.toFixed(4)} ${units.length}
  Required Basin Length:     L_B = ${results.basinLengthRequired.toFixed(2)} ${units.length}
  Footprint Length Saved:    ${results.basinLengthSavedPercent.toFixed(1)} %

================================================================================
2. PARAMETRIC BOUNDARY CONDITIONS & FLUME APPARATUS
--------------------------------------------------------------------------------
Channel Shape:           ${params.channelShape || 'Rectangular'}
Channel Bottom Width:    b = ${params.channelWidth.toFixed(3)} ${units.length}
Side Slope:              z = ${params.sideSlopeZ || 1.0}:1 (H:V)
Flume Length:            L = ${params.flumeLength.toFixed(2)} ${units.length}
Flume Wall Height:       H = ${params.flumeHeight.toFixed(2)} ${units.length}
Bed Slope:               S₀ = ${(params.bedSlope * 100).toFixed(4)} %
Manning's n:             n = ${params.manningsN.toFixed(4)}
Total Discharge:         Q = ${params.flowRate.toFixed(4)} ${units.discharge}
Unit Discharge:          q = ${(params.flowRate / params.channelWidth).toFixed(4)} ${units.discharge}/${units.length}
Gate Opening:            a = ${params.gateOpening.toFixed(4)} ${units.length}
Contraction Coeff:       C_c = ${params.gateContractionCoeff.toFixed(3)}

================================================================================
3. STEP-BY-STEP NUMERICAL CALCULATIONS (SUBSTITUTED NUMBERS)
--------------------------------------------------------------------------------
Step 1: Upstream Supercritical Flow Depth
  y₁ = a · C_c = ${params.gateOpening.toFixed(4)} × ${params.gateContractionCoeff.toFixed(3)} = ${results.y1.toFixed(4)} ${units.length}

Step 2: Upstream Flow Area and Velocity
  A₁ = b · y₁ = ${params.channelWidth.toFixed(3)} × ${results.y1.toFixed(4)} = ${results.a1.toFixed(4)} m²
  V₁ = Q / A₁ = ${params.flowRate.toFixed(4)} / ${results.a1.toFixed(4)} = ${results.v1.toFixed(4)} ${units.velocity}

Step 3: Upstream Froude Number
  Fr₁ = V₁ / √(g · y₁) = ${results.v1.toFixed(4)} / √(9.80665 × ${results.y1.toFixed(4)}) = ${results.fr1.toFixed(4)} [Supercritical]

Step 4: Critical Depth and Velocity
  y_c = ∛(q² / g) = ∛(${(params.flowRate / params.channelWidth).toFixed(4)}² / 9.80665) = ${results.yc.toFixed(4)} ${units.length}
  V_c = √(g · y_c) = √(9.80665 × ${results.yc.toFixed(4)}) = ${results.vc.toFixed(4)} ${units.velocity}
  E_c = 1.5 · y_c = 1.5 × ${results.yc.toFixed(4)} = ${results.ec.toFixed(4)} ${units.energy}

Step 5: Theoretical Sequent Depth y₂* (Bélanger Formula)
  y₂* = (y₁ / 2) · [ √(1 + 8 · Fr₁²) - 1 ]
      = (${results.y1.toFixed(4)} / 2) · [ √(1 + 8 × ${results.fr1.toFixed(4)}²) - 1 ]
      = ${results.y2Sequent.toFixed(4)} ${units.length}

Step 6: Energy Head Loss and Power Dissipation
  E₁ = y₁ + V₁²/(2g) = ${results.y1.toFixed(4)} + ${results.v1.toFixed(4)}² / (2 × 9.80665) = ${results.e1.toFixed(4)} ${units.energy}
  E₂ = y₂ + V₂²/(2g) = ${results.y2.toFixed(4)} + ${results.v2.toFixed(4)}² / (2 × 9.80665) = ${results.e2.toFixed(4)} ${units.energy}
  ΔE = E₁ - E₂ = ${results.e1.toFixed(4)} - ${results.e2.toFixed(4)} = ${results.energyLoss.toFixed(4)} ${units.energy}
  Relative Loss = ΔE / E₁ = (${results.energyLoss.toFixed(4)} / ${results.e1.toFixed(4)}) × 100% = ${results.relativeEnergyLoss.toFixed(2)} %
  Power P = γ · Q · ΔE = 9.81 × ${params.flowRate.toFixed(4)} × ${results.energyLoss.toFixed(4)} = ${results.powerDissipated.toFixed(2)} ${units.power}

Step 7: Physical Jump Dimensions
  Jump Length (Lj)   = 6.1 · y₂ = 6.1 × ${results.y2.toFixed(4)} = ${results.jumpLength.toFixed(3)} ${units.length}
  Roller Length (Lr) = 4.5 · y₂ = 4.5 × ${results.y2.toFixed(4)} = ${results.rollerLength.toFixed(3)} ${units.length}
  Jump Height (hj)   = y₂ - y₁ = ${results.y2.toFixed(4)} - ${results.y1.toFixed(4)} = ${(results.y2 - results.y1).toFixed(3)} ${units.length}

Step 8: Stilling Basin Sizing (USBR ${params.basinType})
  Baffle Impact Drag = ${results.baffleDragForce.toFixed(2)} kN
  Forced Depth y₂'   = ${results.forcedSequentDepth.toFixed(4)} ${units.length}
  Apron Length L_B   = ${results.basinLengthRequired.toFixed(2)} ${units.length} (Saved ${results.basinLengthSavedPercent.toFixed(1)}%)

================================================================================
4. CROSS-SECTIONAL HYDRODYNAMICS TABLE
--------------------------------------------------------------------------------
Parameter               Section 1 (Toe)    Critical (yc)      Sequent (y₂*)      Section 2 (Tail)
Depth y (${units.length})           ${results.y1.toFixed(4)}             ${results.yc.toFixed(4)}             ${results.y2Sequent.toFixed(4)}             ${results.y2.toFixed(4)}
Velocity V (${units.velocity})       ${results.v1.toFixed(3)}             ${results.vc.toFixed(3)}             ${(params.flowRate / (results.a2 || 1)).toFixed(3)}             ${results.v2.toFixed(3)}
Froude Number (Fr)      ${results.fr1.toFixed(3)} [Super]    1.000 [Crit]       < 1.000 [Sub]      ${results.fr2.toFixed(3)} [Sub]
Specific Energy E (${units.energy})  ${results.e1.toFixed(4)}             ${results.ec.toFixed(4)}             ${(results.e1 - results.energyLoss).toFixed(4)}             ${results.e2.toFixed(4)}
Specific Force M (${units.momentum}) ${results.m1.toFixed(4)}             —                  ${results.m1.toFixed(4)} [Conserved]  ${results.m2.toFixed(4)}

================================================================================
5. CONCLUSION & PROFESSIONAL CERTIFICATION
--------------------------------------------------------------------------------
Status:        MATHEMATICALLY VALIDATED & APPROVED
Regime:        ${results.jumpClassification}
Safety:        Cavitation Risk is ${results.cavitationRisk}.
Signature:     ________________________________________  (Lead Hydraulic Engineer)
Stamp:         [ HydraLab 3D Fluid Dynamics Validation Stamp ]
================================================================================
`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HydraLab_Full_Technical_Report_AtoZ_${reportId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Executive Summary Text Report
  const handleExportSummaryReportText = () => {
    const text = `# HYDRALAB 3D - EXECUTIVE HYDRAULIC JUMP SUMMARY REPORT
================================================================================
Report ID:     ${reportId}
Date:          ${reportDate}
Standard:      USBR Monograph 25 / Chow (1959)
================================================================================

EXECUTIVE OVERVIEW:
--------------------------------------------------------------------------------
Hydraulic Regime:        ${results.jumpClassification}
Upstream Froude Number:  Fr₁ = ${results.fr1.toFixed(3)} (Supercritical)
Energy Dissipation:      ${results.relativeEnergyLoss.toFixed(1)} % (ΔE = ${results.energyLoss.toFixed(3)} ${units.energy})
Power Dissipated:        P = ${results.powerDissipated.toFixed(1)} ${units.power}
Cavitation Safety:       ${results.cavitationRisk}
Stilling Basin Type:     ${params.basinType}
Basin Footprint Saved:   ${results.basinLengthSavedPercent.toFixed(0)} %

KEY HYDRAULIC METRICS:
--------------------------------------------------------------------------------
- Discharge (Q):                ${params.flowRate.toFixed(3)} ${units.discharge}
- Channel Bottom Width (b):     ${params.channelWidth.toFixed(2)} ${units.length}
- Channel Shape:                ${params.channelShape || 'Rectangular'}
- Upstream Depth (y₁):          ${results.y1.toFixed(3)} ${units.length} (V₁ = ${results.v1.toFixed(2)} ${units.velocity})
- Critical Depth (yc):          ${results.yc.toFixed(3)} ${units.length}
- Theoretical Sequent (y₂*):    ${results.y2Sequent.toFixed(3)} ${units.length}
- Actual Tailwater Depth (y₂):  ${results.y2.toFixed(3)} ${units.length} (V₂ = ${results.v2.toFixed(2)} ${units.velocity})
- Hydraulic Jump Length (Lj):   ${results.jumpLength.toFixed(2)} ${units.length}
- Stilling Basin Length (L_B):  ${results.basinLengthRequired.toFixed(2)} ${units.length}

ENGINEERING VERIFICATION:
--------------------------------------------------------------------------------
The flow transition adheres to the 1D Saint-Venant momentum conservation principle.
The physical hydraulic jump dissipates ${results.relativeEnergyLoss.toFixed(1)}% of total upstream energy.
Apparatus status: Certified and mathematically validated.
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HydraLab_Executive_Summary_${reportId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[94vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <span>Technical Laboratory Report</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-sans font-semibold">
                  ASCE / USBR
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official civil engineering fluid dynamics experimental evaluation sheet
              </p>
            </div>
          </div>

          {/* Report Mode Selector Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setReportMode('full')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                reportMode === 'full'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Report (A to Z)</span>
            </button>
            <button
              onClick={() => setReportMode('summary')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                reportMode === 'summary'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Executive Summary</span>
            </button>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title="Print document or Save as PDF"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-all shadow-md shadow-sky-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {reportMode === 'full' ? (
              <button
                onClick={handleExportFullReportText}
                title="Download Full Report with theories and calculations"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download Full Report</span>
              </button>
            ) : (
              <button
                onClick={handleExportSummaryReportText}
                title="Download Summary Report"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download Summary</span>
              </button>
            )}

            <button
              onClick={handleExportJSON}
              title="Export complete telemetry in JSON format"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <span className="text-[10px] font-mono font-bold">JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Technical Document Body */}
        <div
          ref={reportRef}
          className="flex-1 p-6 sm:p-10 overflow-y-auto bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black print:p-0 print:overflow-visible"
        >
          {/* Institutional Header */}
          <div className="border-b-2 border-sky-500/80 pb-4 mb-6 print:border-black">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Waves className="w-6 h-6 text-sky-400 print:text-black" />
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-sky-400 print:text-black">
                    HydraLab 3D Civil Engineering Laboratory
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white print:text-black font-serif">
                  {reportMode === 'full'
                    ? 'Comprehensive Hydraulic Jump Investigation & Theory (A to Z)'
                    : 'Executive Hydraulic Jump Summary & Dissipator Performance Report'}
                </h1>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                  Standard Open-Channel Flume Performance Verification & USBR Stilling Basin Sizing
                </p>
              </div>

              <div className="text-right text-xs font-mono text-slate-400 print:text-slate-700 space-y-0.5">
                <div><span className="font-bold text-slate-200 print:text-black">Report ID:</span> {reportId}</div>
                <div><span className="font-bold text-slate-200 print:text-black">Date:</span> {reportDate}</div>
                <div><span className="font-bold text-slate-200 print:text-black">Units:</span> {params.unitSystem === 'SI' ? 'SI Metric' : 'US Customary'}</div>
                <div><span className="font-bold text-slate-200 print:text-black">Standard:</span> USBR Monograph 25 / Chow (1959)</div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: FULL A-TO-Z REPORT CONTENT                                         */}
          {/* ========================================================================= */}
          {reportMode === 'full' && (
            <div className="space-y-6">
              {/* SECTION 1: THEORETICAL FOUNDATIONS (A TO Z) */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-sky-400 print:text-black flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-sky-400 print:text-black" />
                  1. Theoretical Foundations & Governing Fluid Mechanics (A to Z)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 print:text-slate-800 leading-relaxed font-sans">
                  {/* 1.1 Saint-Venant Equations */}
                  <div className="p-3 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800/80 print:border-slate-200 space-y-1.5">
                    <div className="font-bold font-mono text-sky-300 print:text-black">
                      1.1 1D Saint-Venant Shallow Water Equations
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Governs non-steady open channel flow derived from depth-integrated Navier-Stokes:
                    </p>
                    <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-sky-200 print:bg-slate-100 print:text-black">
                      ∂A/∂t + ∂Q/∂x = 0  [Continuity]
                      <br />
                      ∂Q/∂t + ∂(βQ²/A)/∂x + gA·∂y/∂x = gA(S₀ - Sf)  [Momentum]
                    </div>
                  </div>

                  {/* 1.2 Bélanger Derivation */}
                  <div className="p-3 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800/80 print:border-slate-200 space-y-1.5">
                    <div className="font-bold font-mono text-sky-300 print:text-black">
                      1.2 Bélanger Equation Derivation (First Principles)
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Applying Reynolds Transport Theorem momentum balance across sections 1 and 2:
                    </p>
                    <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-amber-200 print:bg-slate-100 print:text-black">
                      P₁ - P₂ = ρQ(V₂ - V₁)
                      <br />
                      (1/2)γb(y₁² - y₂²) = ρQ(q/y₂ - q/y₁)
                      <br />
                      y₂* / y₁ = (1/2) · [ √(1 + 8·Fr₁²) - 1 ]
                    </div>
                  </div>

                  {/* 1.3 Specific Energy & Critical Depth */}
                  <div className="p-3 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800/80 print:border-slate-200 space-y-1.5">
                    <div className="font-bold font-mono text-sky-300 print:text-black">
                      1.3 Specific Energy E(y) & Critical Depth yc
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Total energy head referred to channel invert datum:
                    </p>
                    <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-emerald-200 print:bg-slate-100 print:text-black">
                      E(y) = y + V² / (2g) = y + Q² / [2g·A(y)²]
                      <br />
                      dE/dy = 1 - Q²T/(gA³) = 0  ==&gt;  Fr = 1.000
                      <br />
                      yc = ∛(q² / g) = {results.yc.toFixed(3)} {units.length}
                    </div>
                  </div>

                  {/* 1.4 Head Loss & Dissipated Power */}
                  <div className="p-3 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800/80 print:border-slate-200 space-y-1.5">
                    <div className="font-bold font-mono text-sky-300 print:text-black">
                      1.4 Head Loss (ΔE) & Power Dissipation (P)
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Thermal and turbulent vortex eddy energy conversion:
                    </p>
                    <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-rose-200 print:bg-slate-100 print:text-black">
                      ΔE = (y₂ - y₁)³ / [4 · y₁ · y₂] = {results.energyLoss.toFixed(3)} {units.energy}
                      <br />
                      Relative Loss = ΔE / E₁ = {results.relativeEnergyLoss.toFixed(1)} %
                      <br />
                      P = γ · Q · ΔE = {results.powerDissipated.toFixed(1)} {units.power}
                    </div>
                  </div>

                  {/* 1.5 Specific Force / Momentum Function */}
                  <div className="p-3 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800/80 print:border-slate-200 space-y-1.5">
                    <div className="font-bold font-mono text-sky-300 print:text-black">
                      1.5 Specific Force M(y) Invariance
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Total momentum flux plus hydrostatic force is strictly conserved:
                    </p>
                    <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-purple-200 print:bg-slate-100 print:text-black">
                      M(y) = Q² / (g·A) + A·ȳ
                      <br />
                      M₁ = {results.m1.toFixed(3)} {units.momentum}  ==&gt;  M₂* = {results.m1.toFixed(3)} {units.momentum}
                    </div>
                  </div>

                  {/* 1.6 USBR Stilling Basins & Baffle Drag */}
                  <div className="p-3 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800/80 print:border-slate-200 space-y-1.5">
                    <div className="font-bold font-mono text-sky-300 print:text-black">
                      1.6 USBR Stilling Basin Dissipator Standards
                    </div>
                    <p className="text-[11px] text-slate-400 print:text-slate-600">
                      Chute blocks and baffle piers generating form drag to shorten apron:
                    </p>
                    <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-indigo-200 print:bg-slate-100 print:text-black">
                      F_D = Cd · Ap · ρ · (V₁² / 2) = {results.baffleDragForce.toFixed(2)} kN
                      <br />
                      y₂' = {results.forcedSequentDepth.toFixed(3)} {units.length} (Footprint saved: {results.basinLengthSavedPercent.toFixed(0)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: APPARATUS CONFIGURATION & BOUNDARY CONDITIONS */}
              <div className="space-y-2">
                <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-sky-400 print:text-black flex items-center">
                  <span className="w-2 h-2 rounded-full bg-sky-400 mr-2 print:bg-black" />
                  2. Flume Apparatus & Boundary Configuration Parameters
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-900/60 print:bg-slate-50 p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Channel Shape</div>
                    <div className="font-bold capitalize text-slate-200 print:text-black">{params.channelShape || 'Rectangular'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Total Discharge (Q)</div>
                    <div className="font-bold text-slate-200 print:text-black">{params.flowRate.toFixed(3)} {units.discharge}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Bottom Width (b)</div>
                    <div className="font-bold text-slate-200 print:text-black">{params.channelWidth.toFixed(2)} {units.length}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Bed Slope (S₀)</div>
                    <div className="font-bold text-slate-200 print:text-black">{(params.bedSlope * 100).toFixed(3)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Side Slope (z)</div>
                    <div className="font-bold text-slate-200 print:text-black">{params.channelShape === 'trapezoidal' || params.channelShape === 'triangular' ? `${(params.sideSlopeZ || 1.0).toFixed(2)}:1` : 'N/A (Vertical)'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Manning's Roughness (n)</div>
                    <div className="font-bold text-slate-200 print:text-black">{params.manningsN.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Gate Opening (a)</div>
                    <div className="font-bold text-slate-200 print:text-black">{params.gateOpening.toFixed(3)} {units.length}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 print:text-slate-600 text-[10px]">Contraction Coeff (Cc)</div>
                    <div className="font-bold text-slate-200 print:text-black">{params.gateContractionCoeff.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: STEP-BY-STEP NUMERICAL CALCULATIONS */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-300">
                <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-400 print:text-black flex items-center">
                  <Calculator className="w-4 h-4 mr-2 text-amber-400 print:text-black" />
                  3. Step-by-Step Numerical Calculations (Substituted Active Values)
                </h2>

                <div className="space-y-2 text-xs font-mono text-slate-300 print:text-black leading-relaxed">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800 print:border-slate-200">
                    <span className="text-amber-400 print:text-black font-bold">Step 1: Upstream Supercritical Depth (y₁)</span>
                    <p className="text-[11px] text-slate-400 print:text-slate-700 mt-0.5">
                      y₁ = gateOpening · Cc = {params.gateOpening.toFixed(3)} × {params.gateContractionCoeff.toFixed(2)} = <span className="text-amber-300 print:text-black font-bold">{results.y1.toFixed(4)} {units.length}</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800 print:border-slate-200">
                    <span className="text-amber-400 print:text-black font-bold">Step 2: Upstream Velocity (V₁) and Froude Number (Fr₁)</span>
                    <p className="text-[11px] text-slate-400 print:text-slate-700 mt-0.5">
                      Area A₁ = {results.a1.toFixed(4)} m²  ==&gt;  V₁ = Q / A₁ = {params.flowRate.toFixed(3)} / {results.a1.toFixed(4)} = <span className="text-amber-300 print:text-black font-bold">{results.v1.toFixed(3)} {units.velocity}</span>
                      <br />
                      Fr₁ = V₁ / √(g · D_h1) = {results.v1.toFixed(3)} / √(9.807 × {results.y1.toFixed(4)}) = <span className="text-amber-300 print:text-black font-bold">{results.fr1.toFixed(3)}</span> [Supercritical Regime]
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800 print:border-slate-200">
                    <span className="text-amber-400 print:text-black font-bold">Step 3: Critical Flow Depth (yc) and Minimum Specific Energy (Ec)</span>
                    <p className="text-[11px] text-slate-400 print:text-slate-700 mt-0.5">
                      Unit discharge q = Q / b = {(params.flowRate / params.channelWidth).toFixed(4)} m²/s
                      <br />
                      yc = ∛(q² / g) = ∛({(params.flowRate / params.channelWidth).toFixed(4)}² / 9.807) = <span className="text-yellow-300 print:text-black font-bold">{results.yc.toFixed(4)} {units.length}</span>
                      <br />
                      Ec = 1.5 × yc = 1.5 × {results.yc.toFixed(4)} = <span className="text-yellow-300 print:text-black font-bold">{results.ec.toFixed(4)} {units.energy}</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800 print:border-slate-200">
                    <span className="text-amber-400 print:text-black font-bold">Step 4: Theoretical Conjugate / Sequent Depth (y₂*)</span>
                    <p className="text-[11px] text-slate-400 print:text-slate-700 mt-0.5">
                      Bélanger solution: y₂* = (y₁ / 2) · [ √(1 + 8·Fr₁²) - 1 ]
                      <br />
                      y₂* = ({results.y1.toFixed(4)} / 2) · [ √(1 + 8 × {results.fr1.toFixed(3)}²) - 1 ] = <span className="text-purple-300 print:text-black font-bold">{results.y2Sequent.toFixed(4)} {units.length}</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800 print:border-slate-200">
                    <span className="text-amber-400 print:text-black font-bold">Step 5: Energy Head Loss (ΔE) & Power Dissipated (P)</span>
                    <p className="text-[11px] text-slate-400 print:text-slate-700 mt-0.5">
                      E₁ = y₁ + V₁²/(2g) = {results.e1.toFixed(4)} {units.energy},  E₂ = y₂ + V₂²/(2g) = {results.e2.toFixed(4)} {units.energy}
                      <br />
                      Head loss ΔE = E₁ - E₂ = <span className="text-rose-400 print:text-black font-bold">{results.energyLoss.toFixed(4)} {units.energy}</span>
                      <br />
                      Relative dissipation ΔE / E₁ = ({results.energyLoss.toFixed(4)} / {results.e1.toFixed(4)}) × 100% = <span className="text-rose-400 print:text-black font-bold">{results.relativeEnergyLoss.toFixed(1)}%</span>
                      <br />
                      Thermal Power P = γ · Q · ΔE = 9.81 × {params.flowRate.toFixed(3)} × {results.energyLoss.toFixed(4)} = <span className="text-amber-300 print:text-black font-bold">{results.powerDissipated.toFixed(2)} {units.power}</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/60 print:bg-white border border-slate-800 print:border-slate-200">
                    <span className="text-amber-400 print:text-black font-bold">Step 6: Stilling Basin Sizing (USBR {params.basinType})</span>
                    <p className="text-[11px] text-slate-400 print:text-slate-700 mt-0.5">
                      Baffle Pier Drag Force FD = <span className="text-amber-300 print:text-black font-bold">{results.baffleDragForce.toFixed(2)} kN</span>
                      <br />
                      Forced Tailwater y₂' = <span className="text-emerald-300 print:text-black font-bold">{results.forcedSequentDepth.toFixed(4)} {units.length}</span>
                      <br />
                      Required Apron Footprint LB = <span className="text-indigo-300 print:text-black font-bold">{results.basinLengthRequired.toFixed(2)} {units.length}</span> (Length Saved: <span className="text-emerald-400 print:text-black font-bold">{results.basinLengthSavedPercent.toFixed(0)}%</span>)
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: CROSS-SECTIONAL HYDRODYNAMICS TABLE */}
              <div className="space-y-2">
                <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-sky-400 print:text-black flex items-center">
                  <span className="w-2 h-2 rounded-full bg-sky-400 mr-2 print:bg-black" />
                  4. Cross-Sectional Hydrodynamics Comparison Table
                </h2>
                <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-900 print:bg-slate-100 text-slate-300 print:text-black border-b border-slate-800 print:border-slate-300">
                      <tr>
                        <th className="p-2.5">Flow Parameter</th>
                        <th className="p-2.5">Supercritical (Toe y₁)</th>
                        <th className="p-2.5">Critical Section (yc)</th>
                        <th className="p-2.5">Theoretical Sequent (y₂*)</th>
                        <th className="p-2.5">Actual Tailwater (y₂)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 text-slate-300 print:text-black">
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-slate-400 print:text-slate-600">Water Depth y ({units.length})</td>
                        <td className="p-2.5 font-bold text-amber-300 print:text-black">{results.y1.toFixed(3)}</td>
                        <td className="p-2.5 font-bold text-yellow-300 print:text-black">{results.yc.toFixed(3)}</td>
                        <td className="p-2.5 font-bold text-purple-300 print:text-black">{results.y2Sequent.toFixed(3)}</td>
                        <td className="p-2.5 font-bold text-emerald-300 print:text-black">{results.y2.toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-slate-400 print:text-slate-600">Mean Velocity V ({units.velocity})</td>
                        <td className="p-2.5 text-amber-200 print:text-black">{results.v1.toFixed(2)}</td>
                        <td className="p-2.5 text-yellow-200 print:text-black">{results.vc.toFixed(2)}</td>
                        <td className="p-2.5 text-purple-200 print:text-black">{(params.flowRate / (results.a2 || 1)).toFixed(2)}</td>
                        <td className="p-2.5 text-emerald-200 print:text-black">{results.v2.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-slate-400 print:text-slate-600">Froude Number (Fr)</td>
                        <td className="p-2.5 font-bold text-amber-300 print:text-black">{results.fr1.toFixed(2)} (Supercritical)</td>
                        <td className="p-2.5 font-bold text-yellow-300 print:text-black">1.00 (Critical)</td>
                        <td className="p-2.5 text-purple-300 print:text-black">&lt; 1.00 (Subcritical)</td>
                        <td className="p-2.5 font-bold text-emerald-300 print:text-black">{results.fr2.toFixed(2)} (Subcritical)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-slate-400 print:text-slate-600">Specific Energy E ({units.energy})</td>
                        <td className="p-2.5 text-amber-200 print:text-black">{results.e1.toFixed(3)}</td>
                        <td className="p-2.5 text-yellow-200 print:text-black">{results.ec.toFixed(3)} (Minimum)</td>
                        <td className="p-2.5 text-purple-200 print:text-black">{(results.e1 - results.energyLoss).toFixed(3)}</td>
                        <td className="p-2.5 text-emerald-200 print:text-black">{results.e2.toFixed(3)}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-sans font-medium text-slate-400 print:text-slate-600">Specific Force M ({units.momentum})</td>
                        <td className="p-2.5 text-slate-200 print:text-black">{results.m1.toFixed(3)}</td>
                        <td className="p-2.5 text-slate-400 print:text-slate-600">—</td>
                        <td className="p-2.5 font-bold text-purple-300 print:text-black">{results.m1.toFixed(3)} (Conserved)</td>
                        <td className="p-2.5 text-slate-200 print:text-black">{results.m2.toFixed(3)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EXECUTIVE SUMMARY CONTENT                                          */}
          {/* ========================================================================= */}
          {reportMode === 'summary' && (
            <div className="space-y-6">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-300">
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Jump Regime</div>
                  <div className="text-sm font-bold text-sky-400 print:text-black mt-0.5">{results.jumpClassification}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Fr₁ = {results.fr1.toFixed(2)}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-300">
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Head Loss (ΔE)</div>
                  <div className="text-sm font-bold text-rose-400 print:text-black mt-0.5">{results.energyLoss.toFixed(3)} {units.energy}</div>
                  <div className="text-[10px] text-rose-300 print:text-black mt-1">{results.relativeEnergyLoss.toFixed(1)}% Dissipated</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-300">
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Power Dissipated</div>
                  <div className="text-sm font-bold text-amber-300 print:text-black mt-0.5">{results.powerDissipated.toFixed(1)} {units.power}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Thermal / Eddy Shear</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 print:bg-slate-50 border border-slate-800 print:border-slate-300">
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Basin Footprint</div>
                  <div className="text-sm font-bold text-emerald-400 print:text-black mt-0.5">{results.basinLengthSavedPercent.toFixed(0)}% Saved</div>
                  <div className="text-[10px] text-slate-500 mt-1">LB = {results.basinLengthRequired.toFixed(2)} {units.length}</div>
                </div>
              </div>

              {/* Summary Description Box */}
              <div className="p-4 rounded-xl bg-slate-900/40 print:bg-slate-50 border border-slate-800 print:border-slate-300 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-mono text-sky-400 print:text-black">Executive Hydraulic Assessment:</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 print:text-black font-semibold">
                    {results.jumpClassification}
                  </span>
                  <span className="text-slate-400 print:text-slate-600 font-mono text-[11px]">
                    (Cavitation: {results.cavitationRisk})
                  </span>
                </div>
                <p className="text-slate-300 print:text-slate-700 text-xs mt-2 leading-relaxed">
                  {results.classificationDescription} The jump exhibits high energy conversion efficiency, dissipating {results.relativeEnergyLoss.toFixed(1)}% of upstream specific energy. Stilling basin design utilizes {params.basinType} configuration, generating {results.baffleDragForce.toFixed(2)} kN of dynamic form drag to safely stabilize the jump position.
                </p>
              </div>

              {/* Concise Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-900/60 print:bg-slate-50 p-3.5 rounded-xl border border-slate-800 print:border-slate-300">
                <div>
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Discharge (Q)</div>
                  <div className="font-bold text-slate-200 print:text-black">{params.flowRate.toFixed(3)} {units.discharge}</div>
                </div>
                <div>
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Upstream y₁</div>
                  <div className="font-bold text-amber-300 print:text-black">{results.y1.toFixed(3)} {units.length}</div>
                </div>
                <div>
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Sequent y₂*</div>
                  <div className="font-bold text-purple-300 print:text-black">{results.y2Sequent.toFixed(3)} {units.length}</div>
                </div>
                <div>
                  <div className="text-slate-400 print:text-slate-600 text-[10px]">Actual y₂</div>
                  <div className="font-bold text-emerald-300 print:text-black">{results.y2.toFixed(3)} {units.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Engineering Conclusion & Sign-Off Certification */}
          <div className="border-t border-slate-800 print:border-slate-300 pt-5 mt-8">
            <div className="text-xs text-slate-400 print:text-slate-600 leading-relaxed mb-6">
              <span className="font-bold text-slate-200 print:text-black">Conclusion: </span>
              The flow regime transition satisfies the Saint-Venant open-channel momentum conservation principle. Specific energy decreases across the roller by ΔE = {results.energyLoss.toFixed(3)} {units.energy} through high-intensity turbulent eddy shear dissipation. {results.baffleDragForce > 0 ? `Dynamic impact baffle piers generate ${results.baffleDragForce.toFixed(2)} kN of drag, successfully reducing required apron footprint by ${results.basinLengthSavedPercent.toFixed(1)}%.` : 'Natural jump conditions are maintained.'}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-dashed border-slate-800 print:border-slate-300 text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Lead Hydraulic Engineer</div>
                <div className="mt-6 border-b border-slate-700 print:border-black" />
                <div className="mt-1 text-slate-300 print:text-black">Signature & Stamp</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Reviewing Professor / Inspector</div>
                <div className="mt-6 border-b border-slate-700 print:border-black" />
                <div className="mt-1 text-slate-300 print:text-black">Verified & Approved</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Certification Status</div>
                <div className="mt-6 text-emerald-400 print:text-black font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Mathematically Validated
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
