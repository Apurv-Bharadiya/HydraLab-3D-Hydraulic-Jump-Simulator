/**
 * HydraLab 3D - Interactive Lagrangian Virtual Dye Tracer Lab
 *
 * High-fidelity virtual dye advection, turbulent vortex recirculation,
 * and spatial dispersion inside the hydraulic jump roller.
 *
 * Supported tracers:
 * - Fluorescein Neon Green (UV dye, lambda = 521 nm)
 * - Rhodamine B Pink (high-contrast hydraulic tracer, lambda = 580 nm)
 * - Methylene Blue (classical laboratory aqueous dye)
 * - Uranine Amber (sodium fluorescein)
 */

import { useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SceneVisualOptions } from '../hooks/useHydraulicPhysics';
import { DyeColor, HydraulicParameters, HydraulicResults, WaterProfilePoint } from '../physics/types';

interface DyeTracerLabProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  profilePoints: WaterProfilePoint[];
  visuals: SceneVisualOptions;
}

const DYE_PALETTE: Record<DyeColor, { hex: number; rgb: [number, number, number] }> = {
  fluorescein: { hex: 0x22c55e, rgb: [0.13, 0.95, 0.37] }, // Neon emerald/green
  rhodamine: { hex: 0xf43f5e, rgb: [0.96, 0.25, 0.45] }, // Brilliant magenta/pink
  methylene: { hex: 0x0ea5e9, rgb: [0.05, 0.65, 0.95] }, // Deep ocean blue
  uranine: { hex: 0xf59e0b, rgb: [0.96, 0.62, 0.04] }, // Glowing amber/orange
};

function initDyeBuffers(count: number) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const metadata = new Float32Array(count * 3); // [age, maxLife, active]

  for (let i = 0; i < count; i++) {
    // Hide initially beneath floor
    positions[i * 3 + 0] = 0;
    positions[i * 3 + 1] = -20;
    positions[i * 3 + 2] = 0;

    colors[i * 3 + 0] = 0.13;
    colors[i * 3 + 1] = 0.95;
    colors[i * 3 + 2] = 0.37;

    metadata[i * 3 + 0] = 0;
    metadata[i * 3 + 1] = 5.0;
    metadata[i * 3 + 2] = 0; // inactive
  }

  return { positions, velocities, colors, metadata };
}

export const DyeTracerLab: React.FC<DyeTracerLabProps> = ({
  params,
  results,
  profilePoints,
  visuals,
}) => {
  const { flumeLength, channelWidth, bedSlope, flumeHeight } = params;
  const halfL = flumeLength / 2;
  const slopeAngle = Math.atan(bedSlope);

  const particleCount = 1200;
  const pointsRef = useRef<THREE.Points>(null);

  const initialBuffers = useMemo(() => initDyeBuffers(particleCount), [particleCount]);
  const buffersRef = useRef(initialBuffers);

  // Soft glowing radial particle texture for realistic liquid dye appearance
  const dyeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  // Sample local water depth and mean velocity
  const sampleProfile = (xDist: number) => {
    if (!profilePoints || profilePoints.length === 0) return { y: 0.15, v: 1.0 };
    const clampedX = Math.max(0, Math.min(flumeLength, xDist));
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

  // Spawn pointer index for circular buffer
  const spawnCursorRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const pulseBurstRemainingRef = useRef(0);

  // Spawn a batch of dye particles
  const spawnDyeBatch = (countToSpawn: number, spawnX?: number) => {
    const { positions, velocities, colors, metadata } = buffersRef.current;
    const xBase = spawnX !== undefined ? spawnX : results.gatePositionX + 0.35;
    const dyeRgb = DYE_PALETTE[visuals.dyeColor || 'fluorescein'].rgb;

    for (let k = 0; k < countToSpawn; k++) {
      const idx = spawnCursorRef.current;
      spawnCursorRef.current = (spawnCursorRef.current + 1) % particleCount;

      const { y: localY, v: localV } = sampleProfile(xBase);

      // Random jitter around injection nozzle
      const jitterX = (Math.random() - 0.5) * 0.06;
      const jitterY = (0.2 + Math.random() * 0.65) * Math.max(0.04, localY);
      const spanZ = (channelWidth * 0.4);
      const jitterZ = (Math.random() - 0.5) * spanZ;

      positions[idx * 3 + 0] = xBase + jitterX - halfL;
      positions[idx * 3 + 1] = Math.max(0.005, jitterY);
      positions[idx * 3 + 2] = jitterZ;

      velocities[idx * 3 + 0] = localV * (0.92 + Math.random() * 0.2);
      velocities[idx * 3 + 1] = (Math.random() - 0.5) * 0.06;
      velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.05;

      colors[idx * 3 + 0] = dyeRgb[0];
      colors[idx * 3 + 1] = dyeRgb[1];
      colors[idx * 3 + 2] = dyeRgb[2];

      metadata[idx * 3 + 0] = 0; // age
      metadata[idx * 3 + 1] = 5.0 + Math.random() * 3.0; // maxLife
      metadata[idx * 3 + 2] = 1; // active
    }
  };

  // Trigger pulse spawn when dyeMode transitions to pulse
  useEffect(() => {
    if (visuals.dyeMode === 'pulse') {
      spawnDyeBatch(240);
      pulseBurstRemainingRef.current = 160;
    }
  }, [visuals.dyeMode]);

  // Main advection and vortex recirculation loop
  useFrame((state, delta) => {
    if (!pointsRef.current || !visuals.showDyeTracer) return;
    const { positions, velocities, metadata } = buffersRef.current;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colorAttr = pointsRef.current.geometry.attributes.color;

    const dt = visuals.isPaused ? 0 : delta * visuals.flowSpeed;

    // Handle ongoing pulse bursts
    if (pulseBurstRemainingRef.current > 0 && !visuals.isPaused) {
      const burstSize = Math.min(20, pulseBurstRemainingRef.current);
      spawnDyeBatch(burstSize);
      pulseBurstRemainingRef.current -= burstSize;
    }

    // Continuous stream injection
    if (visuals.dyeMode === 'stream' && !visuals.isPaused) {
      const now = state.clock.getElapsedTime();
      if (now - lastSpawnTimeRef.current > 0.04) {
        lastSpawnTimeRef.current = now;
        spawnDyeBatch(16);
      }
    }

    const jumpToeX = results.jumpToePositionX;
    const rollerLen = Math.max(0.2, results.rollerLength);
    const rollerEndX = jumpToeX + rollerLen;
    const fr1 = results.fr1;
    const dyeRgb = DYE_PALETTE[visuals.dyeColor || 'fluorescein'].rgb;

    for (let i = 0; i < particleCount; i++) {
      if (metadata[i * 3 + 2] === 0) {
        posAttr.setXYZ(i, 0, -20, 0);
        continue;
      }

      let age = metadata[i * 3 + 0] + dt;
      const maxLife = metadata[i * 3 + 1];

      if (age >= maxLife) {
        metadata[i * 3 + 2] = 0;
        positions[i * 3 + 1] = -20;
        posAttr.setXYZ(i, 0, -20, 0);
        continue;
      }
      metadata[i * 3 + 0] = age;

      // Current coordinates in flume reference
      let flumeX = positions[i * 3 + 0] + halfL;
      let currY = positions[i * 3 + 1];
      let currZ = positions[i * 3 + 2];

      const { y: localDepth, v: localMeanV } = sampleProfile(flumeX);

      // --- Vortex Roller Dynamics ---
      let vx = localMeanV;
      let vy = velocities[i * 3 + 1];
      let vz = velocities[i * 3 + 2];

      if (fr1 > 1.15 && flumeX >= jumpToeX && flumeX <= rollerEndX) {
        const rollerNormX = (flumeX - jumpToeX) / rollerLen;
        const normY = Math.max(0, Math.min(1.0, currY / Math.max(0.01, localDepth)));

        // Upper surface roller recirculation: reverse flow (Vx < 0) near the surface
        if (normY > 0.45) {
          const backFlowStrength = (normY - 0.45) * 2.2 * Math.sin(rollerNormX * Math.PI);
          vx = -localMeanV * backFlowStrength;
          vy -= 0.35 * dt;
        } else {
          // High-velocity forward jet beneath the roller
          vx = localMeanV * 1.4;
          vy += 0.3 * dt;
        }

        // Violent turbulent eddy diffusion inside jump
        const turbScale = 0.1 * (fr1 - 1.0);
        vx += (Math.random() - 0.5) * turbScale;
        vy += (Math.random() - 0.5) * turbScale * 0.9;
        vz += (Math.random() - 0.5) * turbScale * 0.6;
      } else {
        // Standard turbulent boundary layer dispersion
        vz += (Math.random() - 0.5) * 0.012;
      }

      // Advect position
      flumeX += vx * dt;
      currY += vy * dt;
      currZ += vz * dt;

      // Boundary collisions & containment
      if (flumeX > flumeLength || flumeX < 0) {
        metadata[i * 3 + 2] = 0;
        currY = -20;
      } else {
        // Keep within water depth
        currY = Math.max(0.003, Math.min(localDepth * 0.97, currY));

        // Lateral wall boundaries matching channel profile
        let maxZ = channelWidth / 2 - 0.01;
        if (params.channelShape === 'trapezoidal') {
          maxZ = (channelWidth + 2 * (params.sideSlopeZ || 1.0) * currY) / 2 - 0.01;
        } else if (params.channelShape === 'triangular') {
          maxZ = Math.max(0.01, (params.sideSlopeZ || 1.0) * currY - 0.01);
        }

        if (Math.abs(currZ) > maxZ) {
          currZ = Math.sign(currZ) * maxZ;
          vz = -vz * 0.5;
        }
      }

      positions[i * 3 + 0] = flumeX - halfL;
      positions[i * 3 + 1] = currY;
      positions[i * 3 + 2] = currZ;

      velocities[i * 3 + 0] = vx;
      velocities[i * 3 + 1] = vy;
      velocities[i * 3 + 2] = vz;

      posAttr.setXYZ(i, flumeX - halfL, currY, currZ);

      // Fade dye color intensity as it ages and diffuses
      const alpha = Math.max(0.05, 1.0 - Math.pow(age / maxLife, 1.4));
      colorAttr.setXYZ(i, dyeRgb[0] * alpha, dyeRgb[1] * alpha, dyeRgb[2] * alpha);
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  const injectionX = results.gatePositionX + 0.35 - halfL;
  const activeColorHex = DYE_PALETTE[visuals.dyeColor || 'fluorescein'].hex;

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {/* --- Physical Chrome Dye Injection Dropper Assembly --- */}
      <group position={[injectionX, 0, 0]}>
        {/* Overhead mounting bridge */}
        <mesh position={[0, flumeHeight + 0.03, 0]}>
          <boxGeometry args={[0.04, 0.02, channelWidth + 0.08]} />
          <meshStandardMaterial color={0x475569} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Syringe body & fluid reservoir */}
        <group position={[0, flumeHeight - 0.04, 0]}>
          {/* Glass tube */}
          <mesh>
            <cylinderGeometry args={[0.022, 0.022, 0.12, 16]} />
            <meshPhysicalMaterial
              color={0xffffff}
              transparent
              opacity={0.4}
              roughness={0.1}
              metalness={0.1}
              clearcoat={1.0}
            />
          </mesh>
          {/* Fluorescent dye liquid inside barrel */}
          <mesh>
            <cylinderGeometry args={[0.019, 0.019, 0.09, 16]} />
            <meshBasicMaterial color={activeColorHex} />
          </mesh>
          {/* Top chrome plunger */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.04, 16]} />
            <meshStandardMaterial color={0x94a3b8} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Stainless steel injection needle */}
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.12, 12]} />
            <meshStandardMaterial color={0xe2e8f0} metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Glowing dye droplet at nozzle tip */}
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.008, 12, 12]} />
            <meshBasicMaterial color={activeColorHex} />
          </mesh>
        </group>
      </group>

      {/* --- Lagrangian Advecting Dye Particles --- */}
      <points ref={pointsRef} renderOrder={15}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[initialBuffers.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[initialBuffers.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          map={dyeTexture || undefined}
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
    </group>
  );
};
