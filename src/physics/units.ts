/**
 * HydraLab 3D - Engineering Unit Conversion Utilities
 * Handles seamless switching between International System of Units (SI)
 * and US Customary / Imperial units.
 */

import { UnitSystem } from './types';

export const GRAVITY_SI = 9.80665; // m/s²
export const GRAVITY_IMPERIAL = 32.174; // ft/s²
export const WATER_DENSITY_SI = 1000.0; // kg/m³
export const WATER_DENSITY_IMPERIAL = 62.428; // lbf/ft³ (specific weight)

export interface UnitLabels {
  length: string;
  velocity: string;
  discharge: string;
  unitDischarge: string;
  energy: string;
  power: string;
  slope: string;
  momentum: string;
}

export const UNIT_LABELS: Record<UnitSystem, UnitLabels> = {
  SI: {
    length: 'm',
    velocity: 'm/s',
    discharge: 'm³/s',
    unitDischarge: 'm²/s',
    energy: 'm',
    power: 'kW',
    slope: 'm/m',
    momentum: 'm²',
  },
  Imperial: {
    length: 'ft',
    velocity: 'ft/s',
    discharge: 'cfs (ft³/s)',
    unitDischarge: 'ft²/s',
    energy: 'ft',
    power: 'HP',
    slope: 'ft/ft',
    momentum: 'ft²',
  },
};

/**
 * Converts length between meters and feet.
 */
export function convertLength(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'SI' ? val * 3.28084 : val / 3.28084;
}

/**
 * Converts discharge between m³/s and cfs (ft³/s).
 */
export function convertDischarge(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'SI' ? val * 35.3147 : val / 35.3147;
}

/**
 * Formats a numeric value with specified decimal places and optional units.
 */
export function formatUnit(val: number, decimals: number = 2, unit?: string): string {
  if (isNaN(val) || !isFinite(val)) return '—';
  const formatted = val.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}
