/**
 * HydraLab 3D - Hydraulic Jump Aeration & Foam Roller Particles
 *
 * Models the dynamic white-water spray, surface air entrainment,
 * and churning vortex roller characteristic of hydraulic jumps.
 */

import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults } from '../physics/types';

interface FoamParticlesProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  flowSpeed: number;
  isPaused: boolean;
}

function initFoamBuffers(count: number) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  const life = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const r1 = ((i * 173.1) % 100) / 100;
    const r2 = ((i * 281.9) % 100) / 100;
    life[i * 2 + 0] = r1; // age
    life[i * 2 + 1] = 0.6 + r2 * 0.8; // maxLife
  }
  return { positions: pos, velocities: vel, lifetimes: life };
}

export const FoamParticles: React.FC<FoamParticlesProps> = ({
  params,
  results,
  flowSpeed,
  isPaused,
}) => {
  const { flumeLength, channelWidth, bedSlope } = params;
  const halfL = flumeLength / 2;
  const slopeAngle = Math.atan(bedSlope);

  const particleCount = 200;
  const pointsRef = useRef<THREE.Points>(null);

  const initialBuffers = useMemo(() => initFoamBuffers(particleCount), [particleCount]);
  const buffersRef = useRef(initialBuffers);

  useFrame((_, delta) => {
    if (!pointsRef.current || !buffersRef.current) return;
    const { positions, velocities, lifetimes } = buffersRef.current;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;

    const dt = isPaused ? 0 : delta * flowSpeed;
    const jumpToeX = results.jumpToePositionX;
    const rollerL = Math.max(0.2, results.rollerLength);
    const y1 = results.y1;
    const y2 = results.y2;
    const fr1 = results.fr1;

    // If subcritical or no jump, hide foam particles below flume bed
    if (fr1 < 1.1) {
      for (let i = 0; i < particleCount; i++) {
        posAttr.setXYZ(i, 0, -10, 0);
      }
      posAttr.needsUpdate = true;
      return;
    }

    const intensity = Math.min(1.0, Math.max(0.1, (fr1 - 1.0) / 6.0));

    for (let i = 0; i < particleCount; i++) {
      let age = lifetimes[i * 2 + 0];
      const maxLife = lifetimes[i * 2 + 1];

      age += dt;

      if (age >= maxLife) {
        // Respawn inside the hydraulic jump roller
        age = 0;
        // Roller longitudinal distribution
        const spawnXFrac = Math.random();
        const spawnX = jumpToeX + spawnXFrac * rollerL;
        const currentMidY = y1 + (y2 - y1) * (spawnXFrac * 0.85);

        // Position
        positions[i * 3 + 0] = spawnX - halfL;
        positions[i * 3 + 1] = currentMidY + (Math.random() - 0.2) * 0.08 * intensity;
        positions[i * 3 + 2] = (Math.random() - 0.5) * (channelWidth * 0.9);

        // Velocity (churning backward roller vortex + downstream drift)
        velocities[i * 3 + 0] = (Math.random() - 0.35) * 0.4 * intensity; // slight back-roller
        velocities[i * 3 + 1] = (0.2 + Math.random() * 0.6) * intensity; // upward splash
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }

      lifetimes[i * 2 + 0] = age;

      // Integrate motion
      positions[i * 3 + 0] += velocities[i * 3 + 0] * dt;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;

      // Gravity pull on water droplets
      velocities[i * 3 + 1] -= 9.8 * 0.4 * dt;

      posAttr.setXYZ(
        i,
        positions[i * 3 + 0],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
    }

    posAttr.needsUpdate = true;
  });

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[initialBuffers.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={0xffffff}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
