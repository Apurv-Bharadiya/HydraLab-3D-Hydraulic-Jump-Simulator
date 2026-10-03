/**
 * HydraLab 3D - Hydraulic Physics State Management Hook
 *
 * Centralizes real-time hydraulic parameters, calculation engine execution,
 * visualization display flags, and performance-optimized memoization.
 */

import { useCallback, useMemo, useState } from 'react';
import { calculateHydraulics } from '../physics/engine';
import { HYDRAULIC_PRESETS } from '../physics/presets';
import { HydraulicParameters, HydraulicPreset, UnitSystem } from '../physics/types';
import { GRAVITY_IMPERIAL, GRAVITY_SI, convertDischarge, convertLength } from '../physics/units';
import { generateWaterProfile } from '../physics/waterProfile';

export interface SceneVisualOptions {
  showVectors: boolean;
  showStreamlines: boolean;
  showFoam: boolean;
  showEGL: boolean;
  showRuler: boolean;
  showGlassWalls: boolean;
  showBasinBlocks: boolean;
  showDyeTracer: boolean;
  dyeColor: 'fluorescein' | 'rhodamine' | 'methylene' | 'uranine';
  dyeMode: 'pulse' | 'stream' | 'off';
  wireframe: boolean;
  flowSpeed: number; // 0.1 to 3.0
  isPaused: boolean;
  cameraPreset: 'iso' | 'elevation' | 'downstream' | 'top' | 'gate';
}

const DEFAULT_PARAMETERS_SI: HydraulicParameters = {
  upstreamDepth: 0.08,
  downstreamDepth: 0.58,
  flowRate: 0.16,
  channelWidth: 0.5,
  bedSlope: 0.0,
  gateOpening: 0.13,
  gateContractionCoeff: 0.62,
  manningsN: 0.01,
  gravity: GRAVITY_SI,
  unitSystem: 'SI',
  flumeLength: 8.0,
  flumeHeight: 1.0,
  controlMode: 'depth-driven',
  channelShape: 'rectangular',
  sideSlopeZ: 1.0,
  pipeDiameter: 1.0,
  basinType: 'Type I (Flat Apron)',
  hasChuteBlocks: false,
  hasBafflePiers: false,
  hasEndSill: false,
};

export function useHydraulicPhysics() {
  const [params, setParams] = useState<HydraulicParameters>(DEFAULT_PARAMETERS_SI);

  const [visuals, setVisuals] = useState<SceneVisualOptions>({
    showVectors: true,
    showStreamlines: true,
    showFoam: true,
    showEGL: false, // Default hidden to keep 3D flume view clean and realistic
    showRuler: false,
    showGlassWalls: true,
    showBasinBlocks: true,
    showDyeTracer: true,
    dyeColor: 'fluorescein',
    dyeMode: 'stream', // Active continuous dye stream by default
    wireframe: false,
    flowSpeed: 1.0,
    isPaused: false,
    cameraPreset: 'iso',
  });

  const [activePresetId, setActivePresetId] = useState<string>('lab-classic');

  // Compute hydraulic results whenever parameters change
  const results = useMemo(() => {
    return calculateHydraulics(params);
  }, [params]);

  // Generate discretized 1D longitudinal water profile
  const profilePoints = useMemo(() => {
    return generateWaterProfile(params, results, 128);
  }, [params, results]);

  // Update a single parameter with safety clamping
  const updateParam = useCallback(
    <K extends keyof HydraulicParameters>(key: K, value: HydraulicParameters[K]) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        // If gate opening changes in gate-driven mode, update y1 accordingly
        if (key === 'gateOpening' && next.controlMode === 'gate-driven') {
          next.upstreamDepth = Number(value) * next.gateContractionCoeff;
        }
        return next;
      });
      setActivePresetId(''); // clear preset indicator on manual edit
    },
    []
  );

  // Update multiple parameters at once
  const updateParams = useCallback((newParams: Partial<HydraulicParameters>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
    setActivePresetId('');
  }, []);

  // Synchronize downstream depth to theoretical sequent depth
  const syncSequentDepth = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      downstreamDepth: results.y2Sequent,
    }));
  }, [results.y2Sequent]);

  // Load a pre-configured engineering preset
  const loadPreset = useCallback((preset: HydraulicPreset) => {
    setParams((prev) => ({
      ...prev,
      ...preset.parameters,
    }));
    setActivePresetId(preset.id);
  }, []);

  // Toggle unit system between SI and Imperial with value conversions
  const toggleUnitSystem = useCallback(() => {
    setParams((prev) => {
      const nextUnit: UnitSystem = prev.unitSystem === 'SI' ? 'Imperial' : 'SI';
      const isSwitchingToImperial = nextUnit === 'Imperial';

      return {
        ...prev,
        unitSystem: nextUnit,
        gravity: isSwitchingToImperial ? GRAVITY_IMPERIAL : GRAVITY_SI,
        upstreamDepth: convertLength(prev.upstreamDepth, prev.unitSystem, nextUnit),
        downstreamDepth: convertLength(prev.downstreamDepth, prev.unitSystem, nextUnit),
        channelWidth: convertLength(prev.channelWidth, prev.unitSystem, nextUnit),
        flumeLength: convertLength(prev.flumeLength, prev.unitSystem, nextUnit),
        flumeHeight: convertLength(prev.flumeHeight, prev.unitSystem, nextUnit),
        gateOpening: convertLength(prev.gateOpening, prev.unitSystem, nextUnit),
        pipeDiameter: convertLength(prev.pipeDiameter, prev.unitSystem, nextUnit),
        flowRate: convertDischarge(prev.flowRate, prev.unitSystem, nextUnit),
      };
    });
  }, []);

  // Toggle visual option
  const updateVisual = useCallback(
    <K extends keyof SceneVisualOptions>(key: K, value: SceneVisualOptions[K]) => {
      setVisuals((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Reset to default textbook laboratory flume state
  const resetDefaults = useCallback(() => {
    const classic = HYDRAULIC_PRESETS[0];
    setParams({
      ...DEFAULT_PARAMETERS_SI,
      ...classic.parameters,
    });
    setActivePresetId(classic.id);
    setVisuals({
      showVectors: true,
      showStreamlines: true,
      showFoam: true,
      showEGL: false,
      showRuler: false,
      showGlassWalls: true,
      showBasinBlocks: true,
      showDyeTracer: true,
      dyeColor: 'fluorescein',
      dyeMode: 'stream',
      wireframe: false,
      flowSpeed: 1.0,
      isPaused: false,
      cameraPreset: 'iso',
    });
  }, []);

  return {
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
  };
}

export type UseHydraulicPhysicsReturn = ReturnType<typeof useHydraulicPhysics>;
