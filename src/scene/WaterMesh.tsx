/**
 * HydraLab 3D - Deformable Water Surface & Volumetric Mesh
 *
 * Implements a 60 FPS responsive 3D water surface mesh that dynamically
 * deforms to match 1D Saint-Venant hydraulic jump profiles.
 *
 * Features:
 * - Dynamic vertex displacement responding to flow depth y(x)
 * - Animated turbulent roller waves & aeration foam vertex colors
 * - Water volume side skirts and bed bottom for complete enclosure
 * - Wireframe mode for computational mesh inspection
 */

import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults, WaterProfilePoint } from '../physics/types';

interface WaterMeshProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  profilePoints: WaterProfilePoint[];
  wireframe: boolean;
  flowSpeed: number;
  isPaused: boolean;
}

export const WaterMesh: React.FC<WaterMeshProps> = ({
  params,
  results,
  profilePoints,
  wireframe,
  flowSpeed,
  isPaused,
}) => {
  const { flumeLength, channelWidth, bedSlope } = params;
  const halfW = channelWidth / 2;
  const slopeAngle = Math.atan(bedSlope);

  // Mesh refs
  const surfaceMeshRef = useRef<THREE.Mesh>(null);
  const leftSkirtMeshRef = useRef<THREE.Mesh>(null);
  const rightSkirtMeshRef = useRef<THREE.Mesh>(null);

  // Optimized discretization resolution for 60 FPS smoothness
  const segmentsX = 96;
  const segmentsZ = 12;

  // Create surface plane geometry
  const surfaceGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(flumeLength, channelWidth, segmentsX, segmentsZ);
    // Rotate plane so X is flow direction, Z is channel cross-section, Y is vertical depth
    geo.rotateX(-Math.PI / 2);

    // Initialize vertex color attribute for foam aeration rendering
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.08; // R
      colors[i * 3 + 1] = 0.55; // G
      colors[i * 3 + 2] = 0.85; // B
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [flumeLength, channelWidth, segmentsX, segmentsZ]);

  // Skirt geometries for water side walls inside transparent glass
  const leftSkirtGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(flumeLength, 1.0, segmentsX, 1);
    return geo;
  }, [flumeLength, segmentsX]);

  const rightSkirtGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(flumeLength, 1.0, segmentsX, 1);
    return geo;
  }, [flumeLength, segmentsX]);

  // High-performance aquatic physical materials (zero transmission render target stalls)
  const waterMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // vibrant deep ocean azure
      emissive: 0x0369a1,
      emissiveIntensity: 0.22,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.84,
      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe: wireframe,
      depthWrite: false,
    });
  }, [wireframe]);

  const skirtMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // Interpolate water profile depth and foam at any longitudinal coordinate x
  const sampleProfile = (x: number) => {
    if (!profilePoints || profilePoints.length === 0) {
      return { y: 0.2, foam: 0, vel: 1.0 };
    }
    const clampedX = Math.max(0, Math.min(flumeLength, x));
    const fraction = clampedX / flumeLength;
    const indexFloat = fraction * (profilePoints.length - 1);
    const idx0 = Math.floor(indexFloat);
    const idx1 = Math.min(profilePoints.length - 1, idx0 + 1);
    const alpha = indexFloat - idx0;

    const p0 = profilePoints[idx0];
    const p1 = profilePoints[idx1];

    const y = p0.y + (p1.y - p0.y) * alpha;
    const foam = p0.foamIntensity + (p1.foamIntensity - p0.foamIntensity) * alpha;
    const vel = p0.velocity + (p1.velocity - p0.velocity) * alpha;

    return { y, foam, vel };
  };

  // Cumulative time tracker
  const timeRef = useRef<number>(0);

  // Cached column sampling buffer to eliminate redundant CPU lookups per frame
  const colSamplesRef = useRef<{ y: number; foam: number; vel: number }[]>([]);

  // Animation Loop (60 FPS Deformable Surface Update)
  useFrame((_, delta) => {
    if (!isPaused) {
      timeRef.current += delta * flowSpeed;
    }
    const t = timeRef.current;

    const cols = segmentsX + 1;
    const rows = segmentsZ + 1;

    // 0. Pre-sample columns once along the flume length
    if (colSamplesRef.current.length !== cols) {
      colSamplesRef.current = new Array(cols);
    }
    for (let c = 0; c < cols; c++) {
      const fraction = c / segmentsX;
      const xDist = fraction * flumeLength;
      colSamplesRef.current[c] = sampleProfile(xDist);
    }
    const colSamples = colSamplesRef.current;

    // 1. Update Top Surface Mesh Vertices
    if (surfaceMeshRef.current) {
      const geo = surfaceMeshRef.current.geometry;
      const pos = geo.attributes.position;
      const colorAttr = geo.attributes.color;

      const shape = params.channelShape || 'rectangular';
      const z = params.sideSlopeZ || 1.0;
      const D0 = params.pipeDiameter || 1.0;

      for (let r = 0; r < rows; r++) {
        const rNorm = (r / segmentsZ) - 0.5; // -0.5 to +0.5

        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const fraction = c / segmentsX;
          const xDist = fraction * flumeLength;
          const sampled = colSamples[c];

          // Compute local top half-width based on cross section geometry
          let wHalf = halfW;
          if (shape === 'trapezoidal') {
            wHalf = (channelWidth + 2 * z * sampled.y) / 2;
          } else if (shape === 'triangular') {
            wHalf = Math.max(0.01, z * sampled.y);
          } else if (shape === 'circular') {
            wHalf = Math.max(0.01, Math.sqrt(Math.max(0, sampled.y * (D0 - sampled.y))));
          }

          const localZ = rNorm * 2 * wHalf;
          pos.setZ(i, localZ);

          // Turbulent Wave Displacement
          let waveY = 0;
          const foam = sampled.foam;
          const vel = sampled.vel;

          if (foam > 0.05) {
            // Hydraulic Jump Roller Zone: Highly turbulent breaking wave oscillations
            const wave1 = Math.sin(xDist * 14.0 - t * 7.0) * Math.cos(localZ * 18.0);
            const wave2 = Math.sin(xDist * 28.0 + t * 9.0) * 0.5;
            const rollerVortex = Math.sin((xDist - results.jumpToePositionX) * 8.0 - t * 4.0);
            waveY = foam * 0.035 * (wave1 + wave2 + rollerVortex);
          } else if (xDist < results.jumpToePositionX) {
            // Supercritical Thin Sheet: Fast high-frequency downstream ripples
            waveY = 0.003 * Math.sin(xDist * 32.0 - t * vel * 6.0);
          } else {
            // Subcritical Tailwater: Gentle slow undulating surface waves
            waveY = 0.007 * Math.sin(xDist * 5.0 - t * 2.5) * Math.cos(localZ * 8.0);
          }

          const finalY = Math.max(0.005, sampled.y + waveY);
          pos.setY(i, finalY);

          // Dynamic Aeration Foam Vertex Colors
          const foamAmount = Math.min(1.0, foam * 1.35);
          const redVal = 0.05 * (1 - foamAmount) + 0.98 * foamAmount;
          const greenVal = 0.65 * (1 - foamAmount) + 0.99 * foamAmount;
          const blueVal = 0.95 * (1 - foamAmount) + 1.0 * foamAmount;

          colorAttr.setXYZ(i, redVal, greenVal, blueVal);
        }
      }

      pos.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }

    // 2. Update Left and Right Side Skirts to match surface elevation & channel banks
    if (leftSkirtMeshRef.current && rightSkirtMeshRef.current) {
      const leftPos = leftSkirtMeshRef.current.geometry.attributes.position;
      const rightPos = rightSkirtMeshRef.current.geometry.attributes.position;
      const shape = params.channelShape || 'rectangular';
      const z = params.sideSlopeZ || 1.0;
      const D0 = params.pipeDiameter || 1.0;

      for (let c = 0; c < cols; c++) {
        const sampled = colSamples[c];
        const topIdx = c;
        const botIdx = c + cols;

        let wHalf = halfW;
        if (shape === 'trapezoidal') {
          wHalf = (channelWidth + 2 * z * sampled.y) / 2;
        } else if (shape === 'triangular') {
          wHalf = Math.max(0.01, z * sampled.y);
        } else if (shape === 'circular') {
          wHalf = Math.max(0.01, Math.sqrt(Math.max(0, sampled.y * (D0 - sampled.y))));
        }

        leftPos.setY(topIdx, sampled.y);
        rightPos.setY(topIdx, sampled.y);
        leftPos.setY(botIdx, 0.0);
        rightPos.setY(botIdx, 0.0);

        leftPos.setZ(topIdx, +wHalf - 0.002);
        rightPos.setZ(topIdx, -wHalf + 0.002);
        leftPos.setZ(botIdx, shape === 'triangular' || shape === 'circular' ? 0 : +halfW - 0.002);
        rightPos.setZ(botIdx, shape === 'triangular' || shape === 'circular' ? 0 : -halfW + 0.002);
      }

      leftPos.needsUpdate = true;
      rightPos.needsUpdate = true;
    }
  });

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {/* --- Main Deformable Water Surface --- */}
      <mesh
        ref={surfaceMeshRef}
        geometry={surfaceGeometry}
        material={waterMaterial}
        receiveShadow
      />

      {/* --- Left Skirt (+Z side inside glass wall) --- */}
      <mesh
        ref={leftSkirtMeshRef}
        geometry={leftSkirtGeometry}
        material={skirtMaterial}
        position={[0, 0, 0]}
      />

      {/* --- Right Skirt (-Z side inside glass wall) --- */}
      <mesh
        ref={rightSkirtMeshRef}
        geometry={rightSkirtGeometry}
        material={skirtMaterial}
        position={[0, 0, 0]}
      />

      {/* --- Channel Bed Water Underlay --- */}
      {params.channelShape !== 'triangular' && (
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[flumeLength, channelWidth]} />
          <meshBasicMaterial color={0x0369a1} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
