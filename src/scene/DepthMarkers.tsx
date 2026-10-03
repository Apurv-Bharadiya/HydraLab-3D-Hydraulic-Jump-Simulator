/**
 * HydraLab 3D - Engineering Depth Callouts & Datum Markers
 *
 * Visualizes 3D spatial dimension markers for:
 * - Upstream depth y1 (Supercritical)
 * - Critical depth yc datum
 * - Downstream depth y2 (Subcritical)
 * - Jump length Lj along the channel bed
 */

import React from 'react';
import { HydraulicParameters, HydraulicResults } from '../physics/types';

interface DepthMarkersProps {
  params: HydraulicParameters;
  results: HydraulicResults;
}

export const DepthMarkers: React.FC<DepthMarkersProps> = ({ params, results }) => {
  const { flumeLength, channelWidth, bedSlope } = params;
  const halfL = flumeLength / 2;
  const halfW = channelWidth / 2;
  const slopeAngle = Math.atan(bedSlope);

  const y1 = results.y1;
  const y2 = results.y2;
  const yc = results.yc;
  const jumpToeX = results.jumpToePositionX - halfL;
  const jumpEndX = jumpToeX + results.jumpLength;

  // Longitudinal location for y1 marker (just downstream of gate vena contracta)
  const y1MarkerX = results.gatePositionX - halfL + 0.35;
  // Longitudinal location for y2 marker (downstream of jump)
  const y2MarkerX = Math.min(halfL - 0.5, jumpEndX + 0.5);

  const zPos = halfW + 0.08;

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {/* --- Upstream Depth y1 Caliper --- */}
      <group position={[y1MarkerX, 0, zPos]}>
        {/* Vertical ruler line */}
        <mesh position={[0, y1 / 2, 0]}>
          <cylinderGeometry args={[0.004, 0.004, y1, 8]} />
          <meshBasicMaterial color={0xf59e0b} />
        </mesh>
        {/* Top tick */}
        <mesh position={[0, y1, 0]}>
          <boxGeometry args={[0.04, 0.004, 0.01]} />
          <meshBasicMaterial color={0xf59e0b} />
        </mesh>
        {/* Bottom tick */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.004, 0.01]} />
          <meshBasicMaterial color={0xf59e0b} />
        </mesh>
      </group>

      {/* --- Downstream Depth y2 Caliper --- */}
      <group position={[y2MarkerX, 0, zPos]}>
        {/* Vertical ruler line */}
        <mesh position={[0, y2 / 2, 0]}>
          <cylinderGeometry args={[0.004, 0.004, y2, 8]} />
          <meshBasicMaterial color={0x10b981} />
        </mesh>
        {/* Top tick */}
        <mesh position={[0, y2, 0]}>
          <boxGeometry args={[0.04, 0.004, 0.01]} />
          <meshBasicMaterial color={0x10b981} />
        </mesh>
        {/* Bottom tick */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.04, 0.004, 0.01]} />
          <meshBasicMaterial color={0x10b981} />
        </mesh>
      </group>

      {/* --- Critical Depth yc Reference Line across flume --- */}
      <group position={[0, yc, -halfW]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[flumeLength * 0.9, 0.003, 0.003]} />
          <meshBasicMaterial color={0xfacc15} transparent opacity={0.65} />
        </mesh>
      </group>

      {/* --- Jump Length Lj Indicator on Bed Floor --- */}
      {results.fr1 > 1.05 && (
        <group position={[(jumpToeX + jumpEndX) / 2, -0.01, zPos - 0.04]}>
          <mesh>
            <boxGeometry args={[Math.max(0.1, results.jumpLength), 0.005, 0.01]} />
            <meshBasicMaterial color={0xa855f7} />
          </mesh>
          {/* Start tick */}
          <mesh position={[-results.jumpLength / 2, 0, 0]}>
            <boxGeometry args={[0.005, 0.02, 0.02]} />
            <meshBasicMaterial color={0xa855f7} />
          </mesh>
          {/* End tick */}
          <mesh position={[results.jumpLength / 2, 0, 0]}>
            <boxGeometry args={[0.005, 0.02, 0.02]} />
            <meshBasicMaterial color={0xa855f7} />
          </mesh>
        </group>
      )}
    </group>
  );
};
