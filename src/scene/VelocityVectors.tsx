/**
 * HydraLab 3D - 3D Velocity Vector Field Visualization
 *
 * Renders directional arrows along the flume centerline.
 * Arrow length, scale, and color reflect local flow speed V(x) = q / y(x).
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults, WaterProfilePoint } from '../physics/types';

interface VelocityVectorsProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  profilePoints: WaterProfilePoint[];
}

export const VelocityVectors: React.FC<VelocityVectorsProps> = ({
  params,
  profilePoints,
}) => {
  const { flumeLength, bedSlope } = params;
  const halfL = flumeLength / 2;
  const slopeAngle = Math.atan(bedSlope);

  // Subsample profile points for clean arrow spacing (e.g., 20 arrows along flume)
  const vectorGlyphs = useMemo(() => {
    if (!profilePoints || profilePoints.length === 0) return [];

    const numArrows = 22;
    const glyphs: Array<{
      id: number;
      x: number;
      y: number;
      vel: number;
      froude: number;
      color: THREE.Color;
      length: number;
    }> = [];

    const step = Math.floor(profilePoints.length / numArrows);

    for (let i = 0; i < numArrows; i++) {
      const ptIdx = Math.min(profilePoints.length - 1, i * step + 2);
      const pt = profilePoints[ptIdx];

      // Mid-depth in water column
      const arrowY = pt.y * 0.5;
      const arrowX = pt.x - halfL;

      // Color mapping based on velocity (0.2 m/s to 5 m/s)
      const vNorm = Math.min(1.0, Math.max(0.0, (pt.velocity - 0.2) / 4.5));
      const col = new THREE.Color();
      if (pt.froude > 1.0) {
        // Supercritical: Bright Amber to Neon Orange/Red
        col.setHSL(0.08 - vNorm * 0.08, 1.0, 0.55);
      } else {
        // Subcritical: Emerald Green to Cyan
        col.setHSL(0.55 - vNorm * 0.2, 0.9, 0.55);
      }

      // Arrow length proportional to velocity
      const arrowLen = Math.min(0.38, Math.max(0.12, pt.velocity * 0.08));

      glyphs.push({
        id: i,
        x: arrowX,
        y: arrowY,
        vel: pt.velocity,
        froude: pt.froude,
        color: col,
        length: arrowLen,
      });
    }

    return glyphs;
  }, [profilePoints, halfL]);

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {vectorGlyphs.map((glyph) => (
        <group
          key={glyph.id}
          position={[glyph.x, glyph.y, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          {/* Arrow Shaft (Cylinder) */}
          <mesh position={[0, glyph.length * 0.4, 0]}>
            <cylinderGeometry args={[0.008, 0.008, glyph.length * 0.8, 8]} />
            <meshBasicMaterial color={glyph.color} />
          </mesh>
          {/* Arrow Head (Cone) */}
          <mesh position={[0, glyph.length * 0.9, 0]}>
            <coneGeometry args={[0.022, glyph.length * 0.35, 10]} />
            <meshBasicMaterial color={glyph.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
