/**
 * HydraLab 3D - Open-Channel Flow & Hydraulic Jump Simulator
 * Physical Types & Engineering Data Structures
 *
 * References:
 * - Chow, V. T. (1959). Open-Channel Hydraulics. McGraw-Hill.
 * - Henderson, F. M. (1966). Open Channel Flow. Macmillan.
 * - Chaudhry, M. H. (2008). Open-Channel Flow (2nd ed.). Springer.
 * - USBR (1987). Design of Small Dams - Stilling Basins and Energy Dissipators.
 */

export type UnitSystem = 'SI' | 'Imperial';

export type FlowRegime = 'subcritical' | 'critical' | 'supercritical';

export type JumpClassification =
  | 'Subcritical (No Jump)'
  | 'Critical Flow'
  | 'Undular Jump'
  | 'Weak Jump'
  | 'Oscillating Jump'
  | 'Steady Jump'
  | 'Strong Jump';

export type CavitationRisk = 'Negligible' | 'Low' | 'Moderate' | 'High' | 'Severe';

export type StillingBasinType =
  | 'Type I (Flat Apron)'
  | 'Type II (High Head)'
  | 'Type II (High Fr)'
  | 'Type III (Standard Baffles)'
  | 'Type III (Baffle Piers)'
  | 'Type IV (Low Froude)'
  | 'Type IV (Low Fr)';

export type DyeColor = 'fluorescein' | 'rhodamine' | 'methylene' | 'uranine';

export type ChannelShape = 'rectangular' | 'trapezoidal' | 'triangular' | 'circular';

/**
 * Primary user-adjustable input parameters for the hydraulic flume.
 */
export interface HydraulicParameters {
  /** Cross-sectional channel shape */
  channelShape: ChannelShape;
  /** Side slope z (horizontal : 1 vertical) for trapezoidal & triangular channels */
  sideSlopeZ: number;
  /** Pipe diameter D0 for circular flume / culvert (m or ft) */
  pipeDiameter: number;
  /** Upstream water depth y1 (m or ft) - at vena contracta / supercritical section */
  upstreamDepth: number;
  /** Downstream tailwater depth y2 (m or ft) */
  downstreamDepth: number;
  /** Total volumetric discharge Q (m³/s or cfs) */
  flowRate: number;
  /** Bottom channel width b (m or ft) for rectangular & trapezoidal channels */
  channelWidth: number;
  /** Channel bottom slope S0 (dimensionless, m/m) */
  bedSlope: number;
  /** Sluice gate opening height a (m or ft) */
  gateOpening: number;
  /** Sluice gate contraction coefficient Cc (typically 0.60 - 0.64) */
  gateContractionCoeff: number;
  /** Manning's roughness coefficient n (e.g. 0.010 for smooth glass/perspex flume) */
  manningsN: number;
  /** Gravitational acceleration g (m/s² or ft/s²) */
  gravity: number;
  /** Active unit system */
  unitSystem: UnitSystem;
  /** Flume total physical length (m or ft) */
  flumeLength: number;
  /** Flume wall height (m or ft) */
  flumeHeight: number;
  /** Calculation mode: 'gate-driven' (y1 computed from gate) or 'depth-driven' (direct y1 control) */
  controlMode: 'depth-driven' | 'gate-driven';
  /** USBR Stilling basin configuration */
  basinType: StillingBasinType;
  /** Whether chute blocks are active at the jump toe */
  hasChuteBlocks: boolean;
  /** Whether impact baffle piers are active on the apron */
  hasBafflePiers: boolean;
  /** Whether an end sill (solid or dentated) is active at the basin exit */
  hasEndSill: boolean;
}

/**
 * Comprehensive results calculated by the hydraulic physics engine.
 */
export interface HydraulicResults {
  /** Unit discharge q = Q / b (m²/s or ft²/s) */
  unitDischarge: number;

  // --- Upstream (Section 1) Conditions ---
  /** Flow depth y1 (m or ft) */
  y1: number;
  /** Flow cross-sectional area A1 (m² or ft²) */
  a1: number;
  /** Top water surface width T1 (m or ft) */
  topWidth1: number;
  /** Hydraulic mean depth D1 = A1 / T1 (m or ft) */
  hydraulicDepth1: number;
  /** Mean flow velocity V1 = Q / A1 (m/s or ft/s) */
  v1: number;
  /** Froude number Fr1 = V1 / sqrt(g * D1) */
  fr1: number;
  /** Specific energy E1 = y1 + V1² / (2g) (m or ft) */
  e1: number;
  /** Specific force (momentum function) M1 = Q²/(g*A1) + A1*y_bar1 */
  m1: number;
  /** Upstream flow regime */
  regime1: FlowRegime;

  // --- Critical Flow Conditions ---
  /** Critical depth yc = (q² / g)^(1/3) (m or ft) */
  yc: number;
  /** Critical velocity Vc = sqrt(g * yc) (m/s or ft/s) */
  vc: number;
  /** Minimum specific energy Ec = 1.5 * yc (m or ft) */
  ec: number;
  /** Critical slope Sc = g * n² / (yc^(1/3)) */
  sc: number;

  // --- Downstream (Section 2) Theoretical Sequent / Conjugate Conditions ---
  /** Theoretical sequent depth y2* from momentum conservation (m or ft) */
  y2Sequent: number;
  /** Actual downstream depth y2 in channel (m or ft) */
  y2: number;
  /** Flow cross-sectional area A2 (m² or ft²) */
  a2: number;
  /** Top water surface width T2 (m or ft) */
  topWidth2: number;
  /** Hydraulic mean depth D2 = A2 / T2 (m or ft) */
  hydraulicDepth2: number;
  /** Mean flow velocity V2 = Q / A2 (m/s or ft/s) */
  v2: number;
  /** Froude number Fr2 = V2 / sqrt(g * D2) */
  fr2: number;
  /** Specific energy E2 = y2 + V2² / (2g) (m or ft) */
  e2: number;
  /** Specific force M2 = Q²/(g*A2) + A2*y_bar2 */
  m2: number;
  /** Downstream flow regime */
  regime2: FlowRegime;

  // --- Hydraulic Jump Characteristics ---
  /** Energy head loss across jump ΔE = E1 - E2 (m or ft) */
  energyLoss: number;
  /** Relative energy loss ΔE / E1 (percentage 0 - 100%) */
  relativeEnergyLoss: number;
  /** Jump efficiency E2 / E1 (percentage 0 - 100%) */
  efficiency: number;
  /** Jump height hj = y2 - y1 (m or ft) */
  jumpHeight: number;
  /** Jump length Lj based on USBR empirical formulation (m or ft) */
  jumpLength: number;
  /** Hydraulic jump roller length Lr (m or ft) */
  rollerLength: number;
  /** Total dissipated power P = ρ * g * Q * ΔE (kW or HP) */
  powerDissipated: number;
  /** USBR jump classification type */
  jumpClassification: JumpClassification;
  /** Detailed engineering explanation of this regime */
  classificationDescription: string;
  /** Risk of cavitation damage to channel boundary */
  cavitationRisk: CavitationRisk;

  // --- Alternate Depth ---
  /** Alternate depth y_alt on upper limb with exact same specific energy E1 */
  alternateDepth: number;

  // --- Spatial Positioning ---
  /** Longitudinal position of hydraulic jump toe along the flume (m or ft) */
  jumpToePositionX: number;
  /** Flume station of sluice gate (m or ft) */
  gatePositionX: number;

  // --- Stilling Basin & Energy Dissipator Dynamics ---
  /** Net hydrodynamic form drag force exerted by baffle piers F_D (N or lbf) */
  baffleDragForce: number;
  /** Reduced sequent depth required with dissipators y2' (m or ft) */
  forcedSequentDepth: number;
  /** Basin apron length required under USBR design standard (m or ft) */
  basinLengthRequired: number;
  /** Percentage reduction in required basin length compared to natural jump */
  basinLengthSavedPercent: number;
  /** Chute block height h1 (m or ft) */
  chuteBlockHeight: number;
  /** Baffle pier height h3 (m or ft) */
  bafflePierHeight: number;
  /** End sill height h4 (m or ft) */
  endSillHeight: number;
  /** Longitudinal station of baffle piers (m or ft) */
  baffleStationX: number;
  /** Longitudinal station of end sill (m or ft) */
  endSillStationX: number;
}

/**
 * Coordinate point along the free water surface profile.
 */
export interface WaterProfilePoint {
  /** Distance from flume entrance x (m) */
  x: number;
  /** Water surface depth y (m) */
  y: number;
  /** Bed elevation z_bed (m) considering slope */
  bedZ: number;
  /** Total surface elevation z_surface = bedZ + y (m) */
  surfaceElevation: number;
  /** Local mean velocity V(x) = q / y (m/s) */
  velocity: number;
  /** Local Froude number Fr(x) */
  froude: number;
  /** Local energy grade line EGL = z_surface + V²/(2g) */
  egl: number;
  /** Turbulence / foam intensity scalar [0.0 - 1.0] */
  foamIntensity: number;
}

/**
 * Pre-configured hydraulic engineering scenarios for rapid evaluation.
 */
export interface HydraulicPreset {
  id: string;
  name: string;
  category: 'Laboratory' | 'Dam Spillway' | 'Canal Control' | 'Extreme Dynamics';
  description: string;
  parameters: Partial<HydraulicParameters>;
}
