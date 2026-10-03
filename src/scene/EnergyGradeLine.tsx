/**
 * HydraLab 3D - Energy Grade Line (EGL) & Hydraulic Grade Line (HGL) 3D Overlay
 *
 * Renders glowing spatial lines along the flume profile:
 * - HGL (Cyan line): Water surface piezometric head
 * - EGL (Magenta line): Total specific energy head = y + V²/(2g)
 * - Energy loss bracket (ΔE) clearly demonstrating head loss across the jump
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults, WaterProfilePoint } from '../physics/types';

interface EnergyGradeLineProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  profilePoints: WaterProfilePoint[];
}

export const EnergyGradeLine: React.FC<EnergyGradeLineProps> = ({
  params,
  results,
  profilePoints,
}) => {
  const { flumeLength, bedSlope } = params;
  const halfL = flumeLength / 2;
  const slopeAngle = Math.atan(bedSlope);

  // Generate 3D Line points for HGL and EGL
  const { hglCurve, eglCurve } = useMemo(() => {
    if (!profilePoints || profilePoints.length === 0) {
      return { hglCurve: [], eglCurve: [] };
    }

    const hglPts: THREE.Vector3[] = [];
    const eglPts: THREE.Vector3[] = [];

    // Offset slightly forward (+Z) so it floats just in front of the center plane
    const zOffset = 0.02;

    for (let i = 0; i < profilePoints.length; i++) {
      const pt = profilePoints[i];
      const renderX = pt.x - halfL;

      // HGL sits on the water surface
      hglPts.push(new THREE.Vector3(renderX, pt.y + 0.005, zOffset));

      // EGL sits above the surface by the velocity head: V² / (2g)
      const velocityHead = (pt.velocity * pt.velocity) / (2 * params.gravity);
      eglPts.push(new THREE.Vector3(renderX, pt.y + velocityHead, zOffset));
    }

    return {
      hglCurve: hglPts,
      eglCurve: eglPts,
    };
  }, [profilePoints, halfL, params.gravity]);

  // Construct LineGeometries
  const hglGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(hglCurve);
    return geo;
  }, [hglCurve]);

  const eglGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(eglCurve);
    return geo;
  }, [eglCurve]);

  // Position of Energy Loss Callout near the jump
  const jumpCalloutX = results.jumpToePositionX - halfL + results.jumpLength * 0.5;
  const jumpCalloutY1 = results.e1;
  const jumpCalloutY2 = results.e2;

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {/* --- Hydraulic Grade Line (HGL) --- */}
      <primitive object={new THREE.Line(hglGeometry, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }))} />

      {/* --- Energy Grade Line (EGL) --- */}
      <primitive object={new THREE.Line(eglGeometry, new THREE.LineBasicMaterial({ color: 0xf43f5e, linewidth: 3 }))} />

      {/* --- Energy Head Loss Drop Line (ΔE) in 3D --- */}
      {results.fr1 > 1.05 && (
        <group position={[jumpCalloutX, 0, 0.05]}>
          <mesh position={[0, (jumpCalloutY1 + jumpCalloutY2) / 2, 0]}>
            <cylinderGeometry
              args={[0.006, 0.006, Math.max(0.01, jumpCalloutY1 - jumpCalloutY2), 8]}
            />
            <meshBasicMaterial color={0xfb7185} />
          </mesh>
          {/* Top marker */}
          <mesh position={[0, jumpCalloutY1, 0]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color={0xf43f5e} />
          </mesh>
          {/* Bottom marker */}
          <mesh position={[0, jumpCalloutY2, 0]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color={0x10b981} />
          </mesh>
        </group>
      )}
    </group>
  );
};
