/**
 * HydraLab 3D - Engineering Theory & Mathematical Reference Modal
 *
 * Detailed documentation of open-channel hydraulics, Saint-Venant principles,
 * Bélanger's equation, and USBR classification criteria.
 */

import { BookOpen, X } from 'lucide-react';
import React from 'react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-text">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white font-sans">
              Fluid Mechanics Theory & Hydraulic Formulations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* Section 1: Introduction */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 font-mono">
              1. Fundamentals of Hydraulic Jumps
            </h3>
            <p>
              A <strong>hydraulic jump</strong> is a rapid, stationary transition in open-channel
              flow from a high-velocity <em>supercritical</em> state (Froude number{' '}
              <code className="text-amber-300 font-mono">Fr₁ &gt; 1</code>) to a tranquil{' '}
              <em>subcritical</em> state (
              <code className="text-emerald-300 font-mono">Fr₂ &lt; 1</code>). Because the
              transition occurs with intense turbulent shear and air entrainment, substantial kinetic
              energy is converted into thermal dissipation and sound, making hydraulic jumps the
              primary energy-dissipating mechanism designed below dam spillways and sluice gates.
            </p>
          </section>

          {/* Section 2: Core Equations */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 font-mono">
              2. Core Mathematical Formulations (Rectangular Channel)
            </h3>

            {/* Formula Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Continuity */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200">Continuity & Unit Discharge</div>
                <div className="font-mono text-sky-300 text-sm bg-slate-900/90 p-2 rounded border border-slate-800">
                  q = Q / b = V₁ · y₁ = V₂ · y₂
                </div>
                <div className="text-[11px] text-slate-400">
                  Where <span className="font-mono">Q</span> is total discharge (m³/s) and{' '}
                  <span className="font-mono">b</span> is flume width (m).
                </div>
              </div>

              {/* Froude Number */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200">Froude Number (Fr)</div>
                <div className="font-mono text-amber-300 text-sm bg-slate-900/90 p-2 rounded border border-slate-800">
                  Fr = V / √(g · y) = q / √(g · y³)
                </div>
                <div className="text-[11px] text-slate-400">
                  Fr &gt; 1: Supercritical | Fr = 1: Critical | Fr &lt; 1: Subcritical.
                </div>
              </div>

              {/* Specific Energy */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200">Specific Energy (E)</div>
                <div className="font-mono text-cyan-300 text-sm bg-slate-900/90 p-2 rounded border border-slate-800">
                  E = y + V² / (2g) = y + q² / (2g · y²)
                </div>
                <div className="text-[11px] text-slate-400">
                  Critical depth <span className="font-mono">yc = (q²/g)^(1/3)</span> yields minimum
                  energy <span className="font-mono">Ec = 1.5 · yc</span>.
                </div>
              </div>

              {/* Bélanger Equation */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200">Bélanger Sequent Depth Ratio</div>
                <div className="font-mono text-emerald-300 text-sm bg-slate-900/90 p-2 rounded border border-slate-800">
                  y₂ / y₁ = 0.5 · (√(1 + 8·Fr₁²) - 1)
                </div>
                <div className="text-[11px] text-slate-400">
                  Derived from momentum conservation (<span className="font-mono">M₁ = M₂</span>)
                  neglecting boundary friction.
                </div>
              </div>

              {/* Energy Head Loss */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200">Energy Head Loss (ΔE)</div>
                <div className="font-mono text-rose-300 text-sm bg-slate-900/90 p-2 rounded border border-slate-800">
                  ΔE = E₁ - E₂ = (y₂ - y₁)³ / (4 · y₁ · y₂)
                </div>
                <div className="text-[11px] text-slate-400">
                  Direct consequence of internal turbulent dissipation in the jump roller.
                </div>
              </div>

              {/* Dissipated Power */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-slate-200">Dissipated Power (P)</div>
                <div className="font-mono text-purple-300 text-sm bg-slate-900/90 p-2 rounded border border-slate-800">
                  P = γ · Q · ΔE = ρ · g · Q · ΔE
                </div>
                <div className="text-[11px] text-slate-400">
                  Where water density <span className="font-mono">ρ = 1000 kg/m³</span> and{' '}
                  <span className="font-mono">g = 9.807 m/s²</span>.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: USBR Jump Classification */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 font-mono">
              3. USBR Classification of Hydraulic Jumps (Chow, 1959)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950/80 text-slate-300 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Froude Range (Fr₁)</th>
                    <th className="p-2.5">Classification</th>
                    <th className="p-2.5">Energy Loss (ΔE/E₁)</th>
                    <th className="p-2.5">Physical Characteristics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  <tr>
                    <td className="p-2.5 font-mono text-amber-300 font-bold">1.0 &lt; Fr₁ ≤ 1.7</td>
                    <td className="p-2.5 font-semibold text-slate-200">Undular Jump</td>
                    <td className="p-2.5 text-slate-400">&lt; 5%</td>
                    <td className="p-2.5 text-slate-400">
                      Smooth surface waves/undulations without breaking rollers.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-amber-300 font-bold">1.7 &lt; Fr₁ ≤ 2.5</td>
                    <td className="p-2.5 font-semibold text-slate-200">Weak Jump</td>
                    <td className="p-2.5 text-slate-400">5% – 15%</td>
                    <td className="p-2.5 text-slate-400">
                      Series of small surface rollers; water surface downstream remains quiet.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-amber-300 font-bold">2.5 &lt; Fr₁ ≤ 4.5</td>
                    <td className="p-2.5 font-semibold text-orange-300">Oscillating Jump</td>
                    <td className="p-2.5 text-slate-400">15% – 45%</td>
                    <td className="p-2.5 text-slate-400">
                      Pulsating jet moves between bed and surface; produces damaging downstream waves.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-emerald-400 font-bold">4.5 &lt; Fr₁ ≤ 9.0</td>
                    <td className="p-2.5 font-semibold text-emerald-300">Steady Jump</td>
                    <td className="p-2.5 text-emerald-400 font-bold">45% – 70%</td>
                    <td className="p-2.5 text-slate-400">
                      Stable, well-balanced roller confined to jump zone. Optimal for stilling basins.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-rose-400 font-bold">Fr₁ &gt; 9.0</td>
                    <td className="p-2.5 font-semibold text-rose-300">Strong / Choppy Jump</td>
                    <td className="p-2.5 text-rose-400 font-bold">&gt; 70% – 85%</td>
                    <td className="p-2.5 text-slate-400">
                      Violent, rough roller with heavy spray. High risk of cavitation and bed scour.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Academic References */}
          <section className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Academic References & Standard Literature
            </h3>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>
                Bélanger, J.-B. (1841). <em>Notes sur le cours d'hydraulique</em>. École des Ponts et
                Chaussées, Paris.
              </li>
              <li>
                Chow, V. T. (1959). <em>Open-Channel Hydraulics</em>. McGraw-Hill Book Company.
              </li>
              <li>
                Henderson, F. M. (1966). <em>Open Channel Flow</em>. Macmillan Series in Civil
                Engineering.
              </li>
              <li>
                Chaudhry, M. H. (2008). <em>Open-Channel Flow</em> (2nd ed.). Springer New York.
              </li>
              <li>
                United States Bureau of Reclamation (USBR). (1987).{' '}
                <em>Design of Small Dams: Hydraulic Jump Type Stilling Basins</em>.
              </li>
              <li>
                Hager, W. H. (1992). <em>Energy Dissipators and Hydraulic Jump</em>. Kluwer Academic
                Publishers.
              </li>
            </ul>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            HydraLab 3D Fluid Dynamics Simulation Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
