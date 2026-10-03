/**
 * HydraLab 3D - Physical Stilling Basin & Energy Dissipator Mesh
 *
 * Renders procedural 3D USBR stilling basin appurtenances:
 * 1. Chute Blocks at the jump toe (corrugating incoming supercritical jet)
 * 2. Baffle Piers (Impact blocks exerting dynamic form drag F_D)
 * 3. End Sill (Solid or Dentated sill lifting bottom currents)
 * 4. Hydrodynamic Drag Force Vector callout
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults } from '../physics/types';

interface StillingBasinMeshProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  showBasinBlocks: boolean;
}

export const StillingBasinMesh: React.FC<StillingBasinMeshProps> = ({
  params,
  results,
  showBasinBlocks,
}) => {
  const { flumeLength, channelWidth, bedSlope, hasChuteBlocks, hasBafflePiers, hasEndSill, basinType } =
    params;
  const {
    jumpToePositionX,
    chuteBlockHeight,
    bafflePierHeight,
    endSillHeight,
    baffleStationX,
    endSillStationX,
    baffleDragForce,
    fr1,
  } = results;

  const halfL = flumeLength / 2;
  const halfW = channelWidth / 2;
  const slopeAngle = Math.atan(bedSlope);

  // If Type I (flat apron) and no appurtenances enabled, do not render
  const isBasinActive =
    showBasinBlocks &&
    fr1 > 1.05 &&
    (basinType !== 'Type I (Flat Apron)' || hasChuteBlocks || hasBafflePiers || hasEndSill);

  // High-durability hydraulic concrete material
  const concreteMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Slate 400 concrete
      roughness: 0.85,
      metalness: 0.15,
      bumpScale: 0.02,
    });
  }, []);

  // Granite reinforced impact block material
  const baffleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x64748b, // Slate 500
      roughness: 0.75,
      metalness: 0.25,
    });
  }, []);

  // Reinforced Stilling Basin Bed Apron (Metal/Concrete lining)
  const apronMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate 700
      roughness: 0.6,
      metalness: 0.3,
    });
  }, []);

  // 1. Chute Blocks at Jump Toe
  const chuteBlocks = useMemo(() => {
    if (!hasChuteBlocks && basinType === 'Type I (Flat Apron)') return null;

    const h = Math.max(0.015, Math.min(0.12, chuteBlockHeight));
    const w = h;
    const spacing = h * 1.2;
    const totalBlockPitch = w + spacing;
    const numBlocks = Math.max(2, Math.floor((channelWidth * 0.9) / totalBlockPitch));
    const blockSpan = numBlocks * w + (numBlocks - 1) * spacing;
    const startZ = -blockSpan / 2 + w / 2;

    const xPos = jumpToePositionX - halfL;

    const blocks: React.ReactNode[] = [];
    for (let i = 0; i < numBlocks; i++) {
      const zPos = startZ + i * totalBlockPitch;
      blocks.push(
        <mesh
          key={`chute-${i}`}
          position={[xPos, h / 2, zPos]}
          material={concreteMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[h * 1.5, h, w]} />
        </mesh>
      );
    }
    return blocks;
  }, [hasChuteBlocks, basinType, chuteBlockHeight, channelWidth, jumpToePositionX, halfL, concreteMaterial]);

  // 2. Baffle Piers (Impact Blocks)
  const bafflePiers = useMemo(() => {
    if (!hasBafflePiers && basinType !== 'Type III (Standard Baffles)') return null;

    const h = Math.max(0.02, Math.min(0.16, bafflePierHeight));
    const w = h * 0.75;
    const spacing = h * 0.75;
    const totalPitch = w + spacing;
    const numPiers = Math.max(2, Math.floor((channelWidth * 0.85) / totalPitch));
    const pierSpan = numPiers * w + (numPiers - 1) * spacing;
    const startZ = -pierSpan / 2 + w / 2;

    const xPos = baffleStationX - halfL;

    const piers: React.ReactNode[] = [];
    for (let i = 0; i < numPiers; i++) {
      const zPos = startZ + i * totalPitch;
      piers.push(
        <group key={`baffle-${i}`} position={[xPos, 0, zPos]}>
          {/* Main block */}
          <mesh position={[0, h / 2, 0]} material={baffleMaterial} castShadow receiveShadow>
            <boxGeometry args={[w * 1.2, h, w]} />
          </mesh>
          {/* 45-degree Top Bevel Lip (USBR Standard) */}
          <mesh
            position={[0, h + 0.004, 0]}
            rotation={[0, 0, Math.PI / 4]}
            material={baffleMaterial}
          >
            <boxGeometry args={[w * 0.4, w * 0.4, w]} />
          </mesh>
        </group>
      );
    }
    return piers;
  }, [hasBafflePiers, basinType, bafflePierHeight, channelWidth, baffleStationX, halfL, baffleMaterial]);

  // 3. End Sill (Solid or Dentated)
  const endSill = useMemo(() => {
    if (!hasEndSill && basinType === 'Type I (Flat Apron)') return null;

    const h = Math.max(0.015, Math.min(0.1, endSillHeight));
    const xPos = endSillStationX - halfL;

    if (basinType === 'Type II (High Head)' || basinType === 'Type IV (Low Froude)') {
      // Dentated end sill (teeth)
      const toothW = h * 0.8;
      const toothSpacing = h * 0.8;
      const pitch = toothW + toothSpacing;
      const numTeeth = Math.floor((channelWidth * 0.95) / pitch);
      const span = numTeeth * toothW + (numTeeth - 1) * toothSpacing;
      const startZ = -span / 2 + toothW / 2;

      return (
        <group position={[xPos, 0, 0]}>
          {/* Bottom Continuous Step */}
          <mesh position={[0, h * 0.35, 0]} material={concreteMaterial} castShadow>
            <boxGeometry args={[h * 1.2, h * 0.7, channelWidth - 0.005]} />
          </mesh>
          {/* Dentated Teeth */}
          {Array.from({ length: numTeeth }).map((_, idx) => (
            <mesh
              key={`tooth-${idx}`}
              position={[0, h * 0.7 + h * 0.35, startZ + idx * pitch]}
              material={concreteMaterial}
              castShadow
            >
              <boxGeometry args={[h * 1.2, h * 0.7, toothW]} />
            </mesh>
          ))}
        </group>
      );
    }

    // Standard Solid Triangular/Trapezoidal End Sill (USBR Type III)
    return (
      <group position={[xPos, h / 2, 0]}>
        <mesh material={concreteMaterial} castShadow receiveShadow>
          <boxGeometry args={[h * 1.5, h, channelWidth - 0.005]} />
        </mesh>
      </group>
    );
  }, [hasEndSill, basinType, endSillHeight, endSillStationX, halfL, channelWidth, concreteMaterial]);

  if (!isBasinActive) return null;

  const apronStart = jumpToePositionX - halfL - 0.1;
  const apronEnd = endSillStationX - halfL + 0.15;
  const apronLen = Math.max(0.3, apronEnd - apronStart);
  const apronMidX = (apronStart + apronEnd) / 2;

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {/* --- Reinforced Apron Bed Underlay --- */}
      <mesh position={[apronMidX, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[apronLen, channelWidth - 0.002]} />
        <primitive object={apronMaterial} attach="material" />
      </mesh>

      {/* --- Chute Blocks --- */}
      {chuteBlocks}

      {/* --- Baffle Piers --- */}
      {bafflePiers}

      {/* --- End Sill --- */}
      {endSill}

      {/* --- Hydrodynamic Form Drag Force Vector Callout (F_D) --- */}
      {baffleDragForce > 5 && hasBafflePiers && (
        <group position={[baffleStationX - halfL, bafflePierHeight * 1.8 + 0.05, 0]}>
          {/* Drag Force Arrow (Points upstream, opposing flow) */}
          <mesh position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.24, 8]} />
            <meshBasicMaterial color={0xf97316} />
          </mesh>
          {/* Arrow Head */}
          <mesh position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.022, 0.06, 8]} />
            <meshBasicMaterial color={0xf97316} />
          </mesh>

          {/* Label indicator pole */}
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 0.08, 6]} />
            <meshBasicMaterial color={0xf97316} />
          </mesh>
        </group>
      )}
    </group>
  );
};
