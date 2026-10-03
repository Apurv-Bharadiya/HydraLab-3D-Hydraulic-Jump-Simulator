/**
 * HydraLab 3D - Streamline Flow Tracer Particles
 *
 * Simulates Lagrangian fluid particle trajectories through the flume.
 * Particle velocities are coupled directly to local hydraulic velocity V(x) = q / y(x),
 * visually demonstrating fluid acceleration under the gate and deceleration at the jump.
 */

import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults, WaterProfilePoint } from '../physics/types';

interface FlowParticlesProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  profilePoints: WaterProfilePoint[];
  flowSpeed: number;
  isPaused: boolean;
}

function initParticleState(count: number, length: number, width: number): Float32Array {
  const arr = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const r1 = ((i * 137.5) % 360) / 360;
    const r2 = ((i * 222.3) % 100) / 100;
    const r3 = ((i * 357.1) % 100) / 100;
    const r4 = ((i * 181.7) % 100) / 100;
    arr[i * 4 + 0] = r1 * length;
    arr[i * 4 + 1] = 0.15 + r2 * 0.7;
    arr[i * 4 + 2] = (r3 - 0.5) * (width * 0.85);
    arr[i * 4 + 3] = 0.85 + r4 * 0.3;
  }
  return arr;
}

export const FlowParticles: React.FC<FlowParticlesProps> = ({
  params,
  profilePoints,
  flowSpeed,
  isPaused,
}) => {
  const { flumeLength, channelWidth, bedSlope } = params;
  const halfL = flumeLength / 2;
  const slopeAngle = Math.atan(bedSlope);

  const particleCount = 280;
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Internal particle state array: [posX, posYNorm, posZ, seedSpeed]
  // posYNorm is normalized depth in [0.08, 0.92] of the water column
  const particleStateRef = useRef<Float32Array>(
    initParticleState(particleCount, flumeLength, channelWidth)
  );

  // Sample depth and velocity along flume
  const sampleData = (x: number) => {
    if (!profilePoints || profilePoints.length === 0) return { y: 0.2, v: 1.0 };
    const clampedX = Math.max(0, Math.min(flumeLength, x));
    const fraction = clampedX / flumeLength;
    const indexFloat = fraction * (profilePoints.length - 1);
    const idx0 = Math.floor(indexFloat);
    const idx1 = Math.min(profilePoints.length - 1, idx0 + 1);
    const alpha = indexFloat - idx0;

    const p0 = profilePoints[idx0];
    const p1 = profilePoints[idx1];

    return {
      y: p0.y + (p1.y - p0.y) * alpha,
      v: p0.velocity + (p1.velocity - p0.velocity) * alpha,
    };
  };

  useFrame((_, delta) => {
    if (!instancedMeshRef.current || !particleStateRef.current) return;
    const mesh = instancedMeshRef.current;
    const particleState = particleStateRef.current;

    const dt = isPaused ? 0 : delta * flowSpeed;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 4;
      let x = particleState[idx + 0];
      const yNorm = particleState[idx + 1];
      const z = particleState[idx + 2];
      const speedFactor = particleState[idx + 3];

      // Physical velocity at this X location
      const { y: localDepth, v: localVel } = sampleData(x);

      // Advance particle along flow direction X (scaled for visual ergonomics)
      const visualSpeed = localVel * 0.85 * speedFactor;
      x += visualSpeed * dt;

      // Recycle to flume entrance once reaching flume exit
      if (x > flumeLength) {
        x = 0.05 + Math.random() * 0.2;
        particleState[idx + 1] = 0.15 + Math.random() * 0.7;
        particleState[idx + 2] = (Math.random() - 0.5) * (channelWidth * 0.85);
      }
      particleState[idx + 0] = x;

      // Vertical position Y inside water column
      const actualY = localDepth * yNorm;

      // Center around origin [-halfL, halfL]
      const renderX = x - halfL;
      const renderY = actualY;
      const renderZ = z;

      dummy.position.set(renderX, renderY, renderZ);

      // Orient elongated streak in flow direction
      dummy.scale.set(0.06 + Math.min(0.12, visualSpeed * 0.04), 0.015, 0.015);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color mapping: Cyan (slow) to Yellow/Orange (fast)
      const velNorm = Math.min(1.0, Math.max(0.0, (localVel - 0.5) / 5.0));
      mesh.setColorAt(
        i,
        new THREE.Color().setRGB(
          0.1 + 0.9 * velNorm,
          0.8 - 0.2 * velNorm,
          1.0 - 0.8 * velNorm
        )
      );
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, particleCount]}
      >
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
