/**
 * HydraLab 3D - Water Surface Profile & Spatial Flow Field Generator
 *
 * Discretizes the 1D open channel longitudinal profile into spatial points
 * for the 3D deformable water mesh, velocity vectors, and streamline particles.
 *
 * Implements:
 * - Upstream headwater reservoir profile
 * - Contraction under sluice gate to vena contracta
 * - Supercritical approach stream
 * - Hydraulic jump roller profile with hyperbolic tangent / sigmoid transition
 * - Surface turbulence & foam aeration intensity distribution
 * - Subcritical tailwater recovery zone
 */

import { computeSectionGeometry } from './engine';
import { HydraulicParameters, HydraulicResults, WaterProfilePoint } from './types';

/**
 * Computes a discretized array of points representing the water profile along the flume.
 *
 * @param params Hydraulic channel boundary parameters
 * @param results Calculated hydraulic results
 * @param numPoints Discretization resolution (default 120 points)
 * @returns Array of WaterProfilePoint along the longitudinal x-axis
 */
export function generateWaterProfile(
  params: HydraulicParameters,
  results: HydraulicResults,
  numPoints: number = 128
): WaterProfilePoint[] {
  const { flumeLength, bedSlope, gravity } = params;
  const {
    q,
    y1,
    y2,
    fr1,
    jumpToePositionX,
    jumpLength,
    rollerLength,
    gatePositionX,
    e1,
  } = {
    q: results.unitDischarge,
    y1: results.y1,
    y2: results.y2,
    fr1: results.fr1,
    jumpToePositionX: results.jumpToePositionX,
    jumpLength: Math.max(0.2, results.jumpLength),
    rollerLength: Math.max(0.15, results.rollerLength),
    gatePositionX: results.gatePositionX,
    e1: results.e1,
  };

  const g = gravity;
  const points: WaterProfilePoint[] = [];

  // Vena contracta location (slightly downstream of gate)
  const xVena = gatePositionX + 0.25;

  // Headwater depth behind sluice gate (based on specific energy E1 + minor gate loss)
  const headwaterDepth = Math.max(y1 * 2.2, Math.min(params.flumeHeight * 0.88, e1 * 0.98 + 0.1));

  // Actual jump toe & end
  const xJumpToe = Math.max(xVena + 0.05, jumpToePositionX);
  const xJumpEnd = Math.min(flumeLength, xJumpToe + jumpLength);

  for (let i = 0; i < numPoints; i++) {
    const fraction = i / (numPoints - 1);
    const x = fraction * flumeLength;

    // Bed elevation: z_bed = (flumeLength - x) * S0 (flume slopes downward from inlet to outlet)
    const bedZ = (flumeLength - x) * bedSlope;

    let y: number;
    let foamIntensity = 0;

    if (x <= gatePositionX) {
      // 1. Upstream headwater pool behind sluice gate
      // Smooth drawdown curve as water approaches the gate opening
      const distToGate = gatePositionX - x;
      const drawdown = Math.exp(-distToGate * 4) * (headwaterDepth - params.gateOpening * 1.05);
      y = headwaterDepth - drawdown;
      foamIntensity = 0.02;
    } else if (x <= xVena) {
      // 2. Gate lip contraction to vena contracta
      const t = (x - gatePositionX) / (xVena - gatePositionX);
      // Hermite smoothstep interpolation
      const smoothT = t * t * (3 - 2 * t);
      const gateExitDepth = params.gateOpening * 0.98;
      y = gateExitDepth + (y1 - gateExitDepth) * smoothT;
      foamIntensity = 0.15 * t;
    } else if (x <= xJumpToe) {
      // 3. Supercritical reach (vena contracta to jump toe)
      // Slight expansion / resistance drawdown or horizontal flow
      const t = (x - xVena) / Math.max(0.01, xJumpToe - xVena);
      y = y1 * (1 + 0.03 * t);
      foamIntensity = 0.08;
    } else if (x <= xJumpEnd) {
      // 4. Hydraulic Jump Roller Transition Zone
      const t = (x - xJumpToe) / Math.max(0.01, xJumpEnd - xJumpToe);

      if (fr1 < 1.0) {
        // Subcritical throughout: no jump, gentle transition
        y = y1 + (y2 - y1) * t;
        foamIntensity = 0;
      } else if (fr1 <= 1.7) {
        // Undular Jump: sinusoidal standing waves superimposed on transition
        const base = y1 + (y2 - y1) * (0.5 + 0.5 * Math.sin((t - 0.5) * Math.PI));
        const waveFreq = 3.5 * Math.PI;
        const waveAmp = (y2 - y1) * 0.28 * Math.exp(-t * 2.0);
        y = base + waveAmp * Math.sin(t * waveFreq);
        foamIntensity = 0.25 * Math.max(0, Math.sin(t * waveFreq));
      } else {
        // Classical Hydraulic Jump Roller: Sigmoid / Tanh profile
        // The roller steepens sharply at the toe then rounds off
        const tanhArg = (t - 0.35) * 4.5;
        const sigmoid = 0.5 * (Math.tanh(tanhArg) + 1.0);
        y = y1 + (y2 - y1) * sigmoid;

        // Foam intensity peaks near the roller crest (t ≈ 0.25 - 0.55)
        const rollerNorm = (x - xJumpToe) / Math.max(0.01, rollerLength);
        if (rollerNorm <= 1.2) {
          foamIntensity = Math.exp(-Math.pow((rollerNorm - 0.4) * 2.8, 2));
          // Scale foam by Froude number (higher Froude = more violent white foam)
          const froudeFactor = Math.min(1.0, Math.max(0.2, (fr1 - 1.0) / 7.0));
          foamIntensity *= froudeFactor;
        } else {
          // Decaying bubble drift downstream of roller
          foamIntensity = 0.25 * Math.exp(-(x - (xJumpToe + rollerLength)) * 1.5);
        }
      }
    } else {
      // 5. Downstream tailwater recovery
      // Gentle surface recovery to y2
      const t = (x - xJumpEnd) / Math.max(0.01, flumeLength - xJumpEnd);
      y = y2 + (y2 - y1) * 0.02 * Math.exp(-t * 3) * Math.cos(t * 8);
      foamIntensity = Math.max(0, 0.15 * Math.exp(-t * 3));
    }

    // Local cross-sectional geometry and kinematics
    const geom = computeSectionGeometry(
      y,
      params.channelShape,
      params.channelWidth,
      params.sideSlopeZ,
      params.pipeDiameter
    );
    const velocity = params.flowRate / Math.max(0.0001, geom.area);
    const froude = velocity / Math.sqrt(g * Math.max(0.001, geom.hydraulicDepth));
    const surfaceElevation = bedZ + y;
    const egl = surfaceElevation + (velocity * velocity) / (2 * g);

    points.push({
      x,
      y,
      bedZ,
      surfaceElevation,
      velocity,
      froude,
      egl,
      foamIntensity: Math.min(1.0, Math.max(0.0, foamIntensity)),
    });
  }

  return points;
}
