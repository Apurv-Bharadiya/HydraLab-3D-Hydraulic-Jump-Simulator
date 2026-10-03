/**
 * HydraLab 3D - Engineering Presets
 * Pre-configured hydraulic engineering scenarios matching textbook case studies.
 */

import { HydraulicPreset } from './types';

export const HYDRAULIC_PRESETS: HydraulicPreset[] = [
  {
    id: 'lab-classic',
    name: 'Classic Laboratory Flume',
    category: 'Laboratory',
    description:
      'Standard civil engineering university flume experiment demonstrating a stable, steady hydraulic jump with high energy dissipation (Fr₁ ≈ 5.5).',
    parameters: {
      upstreamDepth: 0.08,
      downstreamDepth: 0.58,
      flowRate: 0.16,
      channelWidth: 0.5,
      bedSlope: 0.0,
      gateOpening: 0.13,
      controlMode: 'depth-driven',
    },
  },
  {
    id: 'usbr-type-iii',
    name: 'Dam Spillway Stilling Basin (USBR Type III)',
    category: 'Dam Spillway',
    description:
      'High-energy dissipation stilling basin at the toe of a spillway. Steady jump (Fr₁ ≈ 7.8) dissipating over 65% of upstream kinetic energy.',
    parameters: {
      upstreamDepth: 0.05,
      downstreamDepth: 0.52,
      flowRate: 0.18,
      channelWidth: 0.6,
      bedSlope: 0.002,
      gateOpening: 0.08,
      controlMode: 'depth-driven',
      basinType: 'Type III (Standard Baffles)',
      hasChuteBlocks: true,
      hasBafflePiers: true,
      hasEndSill: true,
    },
  },
  {
    id: 'undular-jump',
    name: 'Undular Jump in Irrigation Canal',
    category: 'Canal Control',
    description:
      'Low Froude condition (Fr₁ ≈ 1.35) exhibiting characteristic standing waves and ripples without a breaking surface roller.',
    parameters: {
      upstreamDepth: 0.22,
      downstreamDepth: 0.33,
      flowRate: 0.16,
      channelWidth: 0.5,
      bedSlope: 0.001,
      gateOpening: 0.24,
      controlMode: 'depth-driven',
    },
  },
  {
    id: 'oscillating-jump',
    name: 'Oscillating Jump (Pulsating Wave)',
    category: 'Extreme Dynamics',
    description:
      'Instability range (Fr₁ ≈ 3.2). Pulsating jet shifts between channel bed and surface, creating periodic downstream surge waves.',
    parameters: {
      upstreamDepth: 0.11,
      downstreamDepth: 0.44,
      flowRate: 0.15,
      channelWidth: 0.5,
      bedSlope: 0.0,
      gateOpening: 0.18,
      controlMode: 'depth-driven',
    },
  },
  {
    id: 'strong-jump',
    name: 'Violent / Strong Jump (High Head)',
    category: 'Extreme Dynamics',
    description:
      'Extreme supercritical flow (Fr₁ > 9.5) with violent turbulence, white water aeration, and extreme cavitation risk.',
    parameters: {
      upstreamDepth: 0.035,
      downstreamDepth: 0.46,
      flowRate: 0.17,
      channelWidth: 0.5,
      bedSlope: 0.005,
      gateOpening: 0.055,
      controlMode: 'depth-driven',
    },
  },
  {
    id: 'submerged-jump',
    name: 'Drowned / Submerged Jump',
    category: 'Canal Control',
    description:
      'Tailwater elevation exceeds theoretical sequent depth (y₂ > y₂*). The jump roller is pushed backward towards the sluice gate.',
    parameters: {
      upstreamDepth: 0.09,
      downstreamDepth: 0.68,
      flowRate: 0.16,
      channelWidth: 0.5,
      bedSlope: 0.0,
      gateOpening: 0.14,
      controlMode: 'depth-driven',
      channelShape: 'rectangular',
    },
  },
  {
    id: 'trapezoidal-canal',
    name: 'Trapezoidal Irrigation Canal (z = 1:1)',
    category: 'Canal Control',
    description:
      'Engineered trapezoidal earthen canal with 1:1 side slopes. Demonstrates non-rectangular momentum function and outward lateral water spreading.',
    parameters: {
      upstreamDepth: 0.08,
      downstreamDepth: 0.42,
      flowRate: 0.18,
      channelWidth: 0.4,
      bedSlope: 0.001,
      gateOpening: 0.12,
      controlMode: 'depth-driven',
      channelShape: 'trapezoidal',
      sideSlopeZ: 1.0,
    },
  },
  {
    id: 'circular-culvert',
    name: 'Circular Storm Culvert / Barrel',
    category: 'Canal Control',
    description:
      'Partially filled circular conduit (D₀ = 0.85 m) under high velocity inlet flow transitioning to subcritical tailwater.',
    parameters: {
      upstreamDepth: 0.09,
      downstreamDepth: 0.52,
      flowRate: 0.14,
      channelWidth: 0.5,
      pipeDiameter: 0.85,
      bedSlope: 0.002,
      gateOpening: 0.14,
      controlMode: 'depth-driven',
      channelShape: 'circular',
    },
  },
];
