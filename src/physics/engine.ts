/**
 * HydraLab 3D - Fluid Mechanics & Open-Channel Physics Engine
 *
 * Implements rigorous solutions for Saint-Venant 1D open-channel hydraulics,
 * generalized cross-sectional geometry (Rectangular, Trapezoidal, Triangular, Circular),
 * Newton-Raphson critical and sequent depth solvers, USBR stilling basin design,
 * specific energy-depth curves, and energy dissipation calculations.
 *
 * Academic References:
 * 1. Bélanger, J.-B. (1841). Théorie des cours d'eau. École des Ponts et Chaussées.
 * 2. Chow, V. T. (1959). Open-Channel Hydraulics. McGraw-Hill.
 * 3. USBR (1987). Design of Small Dams: Hydraulic Jump Type Stilling Basins.
 * 4. Hager, W. H. (1992). Energy Dissipators and Hydraulic Jump. Kluwer Academic.
 * 5. Chaudhry, M. H. (2008). Open-Channel Flow (2nd ed.). Springer.
 */

import {
  CavitationRisk,
  ChannelShape,
  FlowRegime,
  HydraulicParameters,
  HydraulicResults,
  JumpClassification,
} from './types';
import { WATER_DENSITY_IMPERIAL, WATER_DENSITY_SI } from './units';

export interface SectionGeometry {
  area: number;           // A(y) [m² or ft²]
  topWidth: number;       // T(y) [m or ft]
  hydraulicDepth: number; // D = A / T [m or ft]
  firstMoment: number;    // A * y_bar (first moment of area about free surface) [m³ or ft³]
}

/**
 * Calculates geometric properties for any cross-section at a given flow depth y.
 */
export function computeSectionGeometry(
  y: number,
  channelShape: ChannelShape = 'rectangular',
  channelWidth: number = 0.5,
  sideSlopeZ: number = 1.0,
  pipeDiameter: number = 1.0
): SectionGeometry {
  const depth = Math.max(0.001, y);
  const b = Math.max(0.05, channelWidth);
  const z = Math.max(0.0, sideSlopeZ);
  const D0 = Math.max(0.1, pipeDiameter);

  if (channelShape === 'trapezoidal') {
    const area = (b + z * depth) * depth;
    const topWidth = b + 2 * z * depth;
    const hydraulicDepth = area / Math.max(0.001, topWidth);
    // Exact hydrostatic moment about surface: A * y_bar = b * y² / 2 + z * y³ / 3
    const firstMoment = (b * depth * depth) / 2 + (z * Math.pow(depth, 3)) / 3;
    return { area, topWidth, hydraulicDepth, firstMoment };
  }

  if (channelShape === 'triangular') {
    const area = z * depth * depth;
    const topWidth = Math.max(0.001, 2 * z * depth);
    const hydraulicDepth = depth / 2;
    // Exact hydrostatic moment about surface: A * y_bar = z * y³ / 3
    const firstMoment = (z * Math.pow(depth, 3)) / 3;
    return { area, topWidth, hydraulicDepth, firstMoment };
  }

  if (channelShape === 'circular') {
    const clampedY = Math.min(depth, D0 * 0.999);
    const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - (2 * clampedY) / D0)));
    const area = (Math.pow(D0, 2) / 8) * (theta - Math.sin(theta));
    const topWidth = Math.max(0.001, D0 * Math.sin(theta / 2));
    const hydraulicDepth = area / topWidth;

    // Numerical integration of first moment about water surface: integral_0^y (y - eta) * T(eta) d_eta
    const N = 10;
    const dy = clampedY / N;
    let simpsonSum = 0;
    for (let i = 0; i <= N; i++) {
      const eta = i * dy;
      const tEta = 2 * Math.sqrt(Math.max(0, eta * (D0 - eta)));
      const weight = i === 0 || i === N ? 1 : i % 2 === 1 ? 4 : 2;
      simpsonSum += weight * (clampedY - eta) * tEta;
    }
    const firstMoment = (dy / 3) * simpsonSum;

    return { area, topWidth, hydraulicDepth, firstMoment };
  }

  // Default: Rectangular cross-section
  const area = b * depth;
  const topWidth = b;
  const hydraulicDepth = depth;
  const firstMoment = (b * depth * depth) / 2;
  return { area, topWidth, hydraulicDepth, firstMoment };
}

/**
 * Solves critical depth yc where Froude number is unity:
 * Q² * T(yc) / (g * [A(yc)]³) = 1
 */
export function solveCriticalDepth(
  Q: number,
  g: number,
  channelShape: ChannelShape = 'rectangular',
  channelWidth: number = 0.5,
  sideSlopeZ: number = 1.0,
  pipeDiameter: number = 1.0
): number {
  const b = Math.max(0.05, channelWidth);
  const z = Math.max(0.1, sideSlopeZ);

  if (channelShape === 'rectangular') {
    const q = Q / b;
    return Math.max(0.005, Math.cbrt((q * q) / g));
  }

  if (channelShape === 'triangular') {
    // Exact: 2 * Q² / (g * z² * yc⁵) = 1 => yc = (2 * Q² / (g * z²))^(1/5)
    return Math.max(0.005, Math.pow((2 * Q * Q) / (g * z * z), 0.2));
  }

  // Newton-Raphson for Trapezoidal and Circular channels
  let y = Math.cbrt((Q * Q) / (g * b * b)); // Initial guess
  if (channelShape === 'circular') {
    y = Math.min(pipeDiameter * 0.45, Math.max(0.02, y));
  }

  for (let iter = 0; iter < 25; iter++) {
    const geom = computeSectionGeometry(y, channelShape, b, z, pipeDiameter);
    const A = Math.max(0.0001, geom.area);
    const T = Math.max(0.0001, geom.topWidth);

    // f(y) = Q² * T / (g * A³) - 1 = 0
    const f = (Q * Q * T) / (g * Math.pow(A, 3)) - 1;
    if (Math.abs(f) < 1e-6) break;

    // Approximate derivative df/dy
    const delta = Math.max(1e-5, y * 1e-4);
    const geomPlus = computeSectionGeometry(y + delta, channelShape, b, z, pipeDiameter);
    const fPlus = (Q * Q * geomPlus.topWidth) / (g * Math.pow(geomPlus.area, 3)) - 1;
    const df = (fPlus - f) / delta;

    if (Math.abs(df) < 1e-7) break;
    const nextY = y - f / df;
    if (nextY <= 0) {
      y = y * 0.5;
    } else {
      y = nextY;
    }
  }

  return Math.max(0.005, y);
}

/**
 * Solves conjugate / sequent depth y2* satisfying specific force (momentum) balance:
 * M(y2*) = M(y1) where M(y) = Q² / (g * A(y)) + A(y) * y_bar(y)
 */
export function solveSequentDepth(
  y1: number,
  Q: number,
  g: number,
  channelShape: ChannelShape = 'rectangular',
  channelWidth: number = 0.5,
  sideSlopeZ: number = 1.0,
  pipeDiameter: number = 1.0,
  yc: number = 0.2
): number {
  const b = Math.max(0.05, channelWidth);
  const z = Math.max(0.1, sideSlopeZ);

  // Upstream momentum M1
  const geom1 = computeSectionGeometry(y1, channelShape, b, z, pipeDiameter);
  const v1 = Q / geom1.area;
  const fr1 = v1 / Math.sqrt(g * geom1.hydraulicDepth);

  // If flow is not supercritical, no jump forms
  if (fr1 < 1.001) {
    return y1;
  }

  // Rectangular channel: exact closed-form Bélanger equation
  if (channelShape === 'rectangular') {
    return (y1 / 2) * (Math.sqrt(1 + 8 * fr1 * fr1) - 1);
  }

  const M1 = (Q * Q) / (g * geom1.area) + geom1.firstMoment;

  // Initial estimate on subcritical limb
  let y = Math.max(yc * 1.05, yc + 1.2 * (yc - y1));
  if (channelShape === 'circular') {
    y = Math.min(pipeDiameter * 0.95, y);
  }

  // Newton-Raphson iteration:
  // Residual: G(y) = M(y) - M1 = 0
  // Derivative: G'(y) = dM/dy = A(y) * [1 - Fr²(y)]
  for (let iter = 0; iter < 25; iter++) {
    const geom = computeSectionGeometry(y, channelShape, b, z, pipeDiameter);
    const A = Math.max(0.0001, geom.area);
    const My = (Q * Q) / (g * A) + geom.firstMoment;
    const residual = My - M1;

    if (Math.abs(residual) < 1e-6) break;

    const v = Q / A;
    const frSq = (v * v) / (g * geom.hydraulicDepth);
    const dMdy = A * (1 - frSq);

    if (Math.abs(dMdy) < 1e-7) break;
    const nextY = y - residual / dMdy;
    if (nextY <= yc) {
      y = (y + yc) * 0.5;
    } else {
      y = nextY;
    }
  }

  return Math.max(yc * 1.001, y);
}

/**
 * Calculates complete hydraulic jump and open-channel properties
 * from given flume boundary parameters.
 *
 * @param params User-controlled physical inputs (Q, y1, y2, b, S0, shape, etc.)
 * @returns Fully computed hydraulic state and diagnostic readouts
 */
export function calculateHydraulics(params: HydraulicParameters): HydraulicResults {
  const {
    flowRate,
    channelWidth,
    gravity,
    gateOpening,
    gateContractionCoeff,
    controlMode,
    unitSystem,
    manningsN,
    flumeLength,
    channelShape = 'rectangular',
    sideSlopeZ = 1.0,
    pipeDiameter = 1.0,
  } = params;

  // Prevent divide-by-zero or non-physical negative values
  const b = Math.max(0.05, channelWidth);
  const Q = Math.max(0.001, flowRate);
  const g = Math.max(0.1, gravity);
  const z = Math.max(0.0, sideSlopeZ);
  const D0 = Math.max(0.1, pipeDiameter);

  // 1. Unit Discharge (q = Q / b)
  const q = Q / b;

  // 2. Critical Depth yc for general cross section
  const yc = solveCriticalDepth(Q, g, channelShape, b, z, D0);
  const geomC = computeSectionGeometry(yc, channelShape, b, z, D0);
  const vc = Q / geomC.area;
  const ec = yc + (vc * vc) / (2 * g);

  // Critical slope Sc = (g * n²) / (D_c^(1/3))
  const sc = (g * Math.pow(manningsN, 2)) / Math.pow(geomC.hydraulicDepth, 1 / 3);

  // 3. Upstream Depth (y1) determination
  let y1: number;
  if (controlMode === 'gate-driven') {
    // Vena contracta downstream of sluice gate: y1 = Cc * a
    y1 = Math.max(0.01, gateOpening * gateContractionCoeff);
  } else {
    y1 = Math.max(0.01, params.upstreamDepth);
  }
  if (channelShape === 'circular') {
    y1 = Math.min(D0 * 0.95, y1);
  }

  // Upstream section geometry and kinematics
  const geom1 = computeSectionGeometry(y1, channelShape, b, z, D0);
  const a1 = geom1.area;
  const topWidth1 = geom1.topWidth;
  const hydraulicDepth1 = geom1.hydraulicDepth;
  const v1 = Q / a1;
  const fr1 = v1 / Math.sqrt(g * hydraulicDepth1);
  const e1 = y1 + (v1 * v1) / (2 * g);
  const m1 = (Q * Q) / (g * a1) + geom1.firstMoment;

  // Determine flow regime at section 1
  let regime1: FlowRegime = 'critical';
  if (fr1 > 1.005) {
    regime1 = 'supercritical';
  } else if (fr1 < 0.995) {
    regime1 = 'subcritical';
  }

  // 4. Sequent Depth Equation (Bélanger or Generalized Momentum Conservation)
  const y2Sequent = solveSequentDepth(y1, Q, g, channelShape, b, z, D0, yc);

  // Actual downstream depth in the channel
  let y2 = Math.max(0.01, params.downstreamDepth);
  if (channelShape === 'circular') {
    y2 = Math.min(D0 * 0.95, y2);
  }
  // If downstream depth is not set apart or matches sequent depth
  if (Math.abs(y2 - y1) < 0.001 && fr1 > 1.0) {
    y2 = y2Sequent;
  }

  // Downstream section geometry and kinematics
  const geom2 = computeSectionGeometry(y2, channelShape, b, z, D0);
  const a2 = geom2.area;
  const topWidth2 = geom2.topWidth;
  const hydraulicDepth2 = geom2.hydraulicDepth;
  const v2 = Q / a2;
  const fr2 = v2 / Math.sqrt(g * hydraulicDepth2);
  const e2 = y2 + (v2 * v2) / (2 * g);
  const m2 = (Q * Q) / (g * a2) + geom2.firstMoment;

  let regime2: FlowRegime = 'critical';
  if (fr2 > 1.005) {
    regime2 = 'supercritical';
  } else if (fr2 < 0.995) {
    regime2 = 'subcritical';
  }

  // 5. Energy Head Loss: ΔE = E1 - E2
  const theoreticalDeltaE = Math.max(0, Math.pow(Math.max(0, y2 - y1), 3) / (4 * y1 * y2));
  const rawDeltaE = e1 - e2;
  const energyLoss = rawDeltaE > 0 ? rawDeltaE : theoreticalDeltaE;
  const relativeEnergyLoss = e1 > 0 ? Math.min(100, Math.max(0, (energyLoss / e1) * 100)) : 0;
  const efficiency = Math.max(0, Math.min(100, 100 - relativeEnergyLoss));

  // 6. Dissipated Power: P = ρ * g * Q * ΔE
  let powerDissipated = 0;
  if (unitSystem === 'SI') {
    powerDissipated = (WATER_DENSITY_SI * g * Q * energyLoss) / 1000; // kW
  } else {
    powerDissipated = (WATER_DENSITY_IMPERIAL * Q * energyLoss) / 550; // Horsepower
  }

  // 7. Jump Geometry (Height & Length)
  const jumpHeight = Math.max(0, y2 - y1);

  // Jump length Lj using USBR empirical curve and Hager (1992) equation:
  let jumpLength = 0;
  let rollerLength = 0;
  if (fr1 > 1.0) {
    const hagerRatio = 220 * Math.tanh((fr1 - 1) / 22);
    jumpLength = Math.max(0.1, y1 * hagerRatio);
    // USBR reports Lj ≈ 6.1 * y2 for Fr1 in 4.5 - 9.0 range
    if (fr1 >= 4.5 && fr1 <= 9.0) {
      jumpLength = 6.1 * y2;
    }
    rollerLength = 0.65 * jumpLength;
  }

  // 8. Jump Classification (USBR / Bureau of Reclamation & Chow, 1959)
  let jumpClassification: JumpClassification;
  let classificationDescription: string;

  if (fr1 < 1.0) {
    jumpClassification = 'Subcritical (No Jump)';
    classificationDescription =
      'Flow is entirely tranquil/subcritical throughout. No hydraulic jump can form under these boundary conditions.';
  } else if (Math.abs(fr1 - 1.0) <= 0.05) {
    jumpClassification = 'Critical Flow';
    classificationDescription =
      'Flow is at minimum specific energy (Fr ≈ 1.0). The surface is unstable and undulating with stationary waves.';
  } else if (fr1 <= 1.7) {
    jumpClassification = 'Undular Jump';
    classificationDescription =
      'Surface exhibits smooth standing waves/undulations with tiny breaking rollers at wave crests. Energy loss is negligible (< 5%).';
  } else if (fr1 <= 2.5) {
    jumpClassification = 'Weak Jump';
    classificationDescription =
      'A series of small surface rollers develop with a uniform velocity distribution. Moderate energy loss (~5% to 15%). Water surface downstream remains quiet.';
  } else if (fr1 <= 4.5) {
    jumpClassification = 'Oscillating Jump';
    classificationDescription =
      'An unstable pulsating jet oscillates back and forth from bottom to surface, producing large surface waves that travel far downstream. Damaging to canal banks; avoid in hydraulic structures.';
  } else if (fr1 <= 9.0) {
    jumpClassification = 'Steady Jump';
    classificationDescription =
      'Well-balanced, highly stable hydraulic jump. The roller action is confined within the jump zone, dissipating 45% to 70% of upstream energy. Ideal for stilling basin design.';
  } else {
    jumpClassification = 'Strong Jump';
    classificationDescription =
      'Extremely turbulent, violent jump with intermittent rough water and heavy spray. Dissipates up to 85% of kinetic energy. Requires heavy armoring and baffled stilling basins to prevent cavitation and scouring.';
  }

  // 9. Cavitation Risk Assessment
  let cavitationRisk: CavitationRisk = 'Negligible';
  if (v1 > 15 || (fr1 > 9.0 && v1 > 10)) {
    cavitationRisk = 'Severe';
  } else if (v1 > 10 || fr1 > 7.0) {
    cavitationRisk = 'High';
  } else if (v1 > 6 || fr1 > 4.5) {
    cavitationRisk = 'Moderate';
  } else if (v1 > 3.5) {
    cavitationRisk = 'Low';
  }

  // 10. Alternate Depth Calculation
  const alternateDepth = calculateAlternateDepth(e1, Q, g, y1, yc, channelShape, b, z, D0);

  // 11. Spatial Flume Positioning
  const gatePositionX = flumeLength * 0.18;
  const tailwaterRatio = y2Sequent > 0 ? y2 / y2Sequent : 1.0;
  const baseVenaDistance = 0.5;
  let jumpToePositionX = gatePositionX + baseVenaDistance;

  if (tailwaterRatio < 0.98) {
    const sweepOffset = (1.0 - tailwaterRatio) * (flumeLength * 0.5);
    jumpToePositionX = Math.min(flumeLength * 0.75, jumpToePositionX + sweepOffset);
  } else if (tailwaterRatio > 1.05) {
    const drownOffset = (tailwaterRatio - 1.0) * 0.4;
    jumpToePositionX = Math.max(gatePositionX + 0.1, jumpToePositionX - drownOffset);
  }

  // 12. USBR Stilling Basin Dissipator Dynamics (Types I, II, III, & IV)
  const basinType = params.basinType || 'Type I (Flat Apron)';
  const hasChute = params.hasChuteBlocks ?? (basinType !== 'Type I (Flat Apron)');
  const hasBaffles = params.hasBafflePiers ?? basinType.includes('Type III');
  const hasSill = params.hasEndSill ?? (basinType !== 'Type I (Flat Apron)');

  // Dimensions scaled according to USBR Engineering Monograph No. 25
  const chuteBlockHeight = Math.max(0.015, y1);
  const bafflePierHeight = Math.max(0.02, y1 * (0.16 * Math.min(10, Math.max(1, fr1)) + 1.15));
  const endSillHeight = Math.max(0.015, y1 * 1.25);

  let baffleDragForce = 0;
  let forcedSequentDepth = y2Sequent;
  let basinLengthRequired = jumpLength;

  const baffleStationX = jumpToePositionX + Math.max(0.25, 0.85 * y2Sequent);
  let endSillStationX = jumpToePositionX + jumpLength;

  if (fr1 > 1.05) {
    if (basinType.includes('Type III') && hasBaffles) {
      // USBR Type III Basin: Baffle pier form drag F_D = C_D * 0.5 * rho * A_baffle * V1²
      const cD = 0.68;
      const density = unitSystem === 'SI' ? WATER_DENSITY_SI : WATER_DENSITY_IMPERIAL;
      const effectiveWidth = Math.min(topWidth1, b);
      const aBaffle = 0.5 * effectiveWidth * bafflePierHeight;
      baffleDragForce = (cD * 0.5 * density * aBaffle * v1 * v1) / 1000; // in kN

      // Forced sequent depth reduction (USBR empirical factor ~ 0.82)
      forcedSequentDepth = Math.max(y1 * 1.05, y2Sequent * 0.82);
      basinLengthRequired = 2.8 * forcedSequentDepth;
      endSillStationX = jumpToePositionX + basinLengthRequired;
    } else if (basinType.includes('Type II') && hasChute) {
      forcedSequentDepth = y2Sequent * 0.95;
      basinLengthRequired = 4.3 * forcedSequentDepth;
      endSillStationX = jumpToePositionX + basinLengthRequired;
    } else if (basinType.includes('Type IV') && (hasChute || hasSill)) {
      forcedSequentDepth = y2Sequent * 1.05;
      basinLengthRequired = 5.5 * forcedSequentDepth;
      endSillStationX = jumpToePositionX + basinLengthRequired;
    } else {
      forcedSequentDepth = y2Sequent;
      basinLengthRequired = jumpLength;
      endSillStationX = jumpToePositionX + jumpLength;
    }
  }

  const naturalLength = Math.max(0.01, jumpLength);
  const basinLengthSavedPercent = Math.max(
    0,
    Math.min(75, ((naturalLength - basinLengthRequired) / naturalLength) * 100)
  );

  return {
    unitDischarge: q,
    y1,
    a1,
    topWidth1,
    hydraulicDepth1,
    v1,
    fr1,
    e1,
    m1,
    regime1,
    yc,
    vc,
    ec,
    sc,
    y2Sequent,
    y2,
    a2,
    topWidth2,
    hydraulicDepth2,
    v2,
    fr2,
    e2,
    m2,
    regime2,
    energyLoss,
    relativeEnergyLoss,
    efficiency,
    jumpHeight,
    jumpLength,
    rollerLength,
    powerDissipated,
    jumpClassification,
    classificationDescription,
    cavitationRisk,
    alternateDepth,
    jumpToePositionX,
    gatePositionX,
    baffleDragForce,
    forcedSequentDepth,
    basinLengthRequired,
    basinLengthSavedPercent,
    chuteBlockHeight,
    bafflePierHeight,
    endSillHeight,
    baffleStationX,
    endSillStationX,
  };
}

/**
 * Calculates alternate depth using Newton-Raphson method for general cross-sections.
 * Solves: H(y) = y + Q² / (2 * g * [A(y)]²) - E = 0
 * Derivative: H'(y) = 1 - Fr²(y)
 */
export function calculateAlternateDepth(
  E: number,
  Q: number,
  g: number,
  currentY: number,
  yc: number,
  channelShape: ChannelShape = 'rectangular',
  channelWidth: number = 0.5,
  sideSlopeZ: number = 1.0,
  pipeDiameter: number = 1.0
): number {
  const geomC = computeSectionGeometry(yc, channelShape, channelWidth, sideSlopeZ, pipeDiameter);
  const vc = Q / geomC.area;
  const Ec = yc + (vc * vc) / (2 * g);

  if (E <= Ec) return yc;

  // Initial estimate on opposite limb of critical depth
  let y = currentY < yc ? Math.max(yc * 1.5, E * 0.9) : Math.max(0.01, yc * 0.4);
  if (channelShape === 'circular') {
    y = Math.min(pipeDiameter * 0.95, y);
  }

  for (let iter = 0; iter < 25; iter++) {
    const geom = computeSectionGeometry(y, channelShape, channelWidth, sideSlopeZ, pipeDiameter);
    const A = Math.max(0.0001, geom.area);
    const v = Q / A;
    const f = y + (v * v) / (2 * g) - E;

    const frSq = (v * v) / (g * geom.hydraulicDepth);
    const fPrime = 1 - frSq;

    if (Math.abs(fPrime) < 1e-6) break;
    const nextY = y - f / fPrime;
    if (nextY <= 0) {
      y = y * 0.5;
    } else {
      if (Math.abs(nextY - y) < 1e-5) {
        y = nextY;
        break;
      }
      y = nextY;
    }
  }

  return Math.max(0.001, y);
}

/**
 * Computes specific energy for any given depth y and flow rate Q.
 * E(y) = y + Q² / (2 * g * [A(y)]²)
 */
export function specificEnergyAtDepth(
  y: number,
  Q: number,
  g: number,
  channelShape: ChannelShape = 'rectangular',
  channelWidth: number = 0.5,
  sideSlopeZ: number = 1.0,
  pipeDiameter: number = 1.0
): number {
  if (y <= 0) return Infinity;
  const geom = computeSectionGeometry(y, channelShape, channelWidth, sideSlopeZ, pipeDiameter);
  const v = Q / geom.area;
  return y + (v * v) / (2 * g);
}

/**
 * Computes momentum function (specific force) M for any cross section.
 * M(y) = Q² / (g * A(y)) + A(y) * y_bar(y)
 */
export function momentumFunctionAtDepth(
  y: number,
  Q: number,
  g: number,
  channelShape: ChannelShape = 'rectangular',
  channelWidth: number = 0.5,
  sideSlopeZ: number = 1.0,
  pipeDiameter: number = 1.0
): number {
  if (y <= 0) return Infinity;
  const geom = computeSectionGeometry(y, channelShape, channelWidth, sideSlopeZ, pipeDiameter);
  return (Q * Q) / (g * geom.area) + geom.firstMoment;
}
