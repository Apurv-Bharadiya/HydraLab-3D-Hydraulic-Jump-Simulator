/**
 * HydraLab 3D - Physical Laboratory Flume 3D Structure
 *
 * Models a realistic glass/acrylic-walled civil engineering flume:
 * - Transparent sidewalls with metric measurement graduation ticks
 * - Stainless steel structural frame, posts, and flanged joints
 * - Mechanized vertical sluice gate with rack-and-pinion spindle
 * - Inflow head tank and tailwater catch basin
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HydraulicParameters, HydraulicResults } from '../physics/types';

interface FlumeMeshProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  showGlassWalls: boolean;
}

export const FlumeMesh: React.FC<FlumeMeshProps> = ({ params, results, showGlassWalls }) => {
  const { flumeLength, channelWidth, flumeHeight, gateOpening, bedSlope } = params;
  const gateX = results.gatePositionX;

  // High-performance acrylic/glass material (clearcoat without transmission stalls)
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd, // crisp sky blue
      transparent: true,
      opacity: 0.28,
      roughness: 0.04,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  const steelFrameMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x334155, // slate 700
      metalness: 0.8,
      roughness: 0.3,
    });
  }, []);

  const bedMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x1e293b, // slate 800
      metalness: 0.3,
      roughness: 0.7,
    });
  }, []);

  const gateMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x0284c7, // sky 600
      metalness: 0.7,
      roughness: 0.25,
    });
  }, []);

  const brassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xd97706, // amber 600
      metalness: 0.85,
      roughness: 0.3,
    });
  }, []);

  // Half dimensions for centering
  const halfL = flumeLength / 2;
  const halfW = channelWidth / 2;
  const wallThickness = 0.02;

  const shape = params.channelShape || 'rectangular';
  const zSlope = Math.max(0.2, params.sideSlopeZ || 1.0);
  const D0 = Math.max(0.3, params.pipeDiameter || 1.0);
  const R0 = D0 / 2;

  // Slope rotation angle
  const slopeAngle = Math.atan(bedSlope);
  const slantAngle = Math.atan(zSlope);
  const slantWallHeight = Math.sqrt(flumeHeight * flumeHeight + Math.pow(zSlope * flumeHeight, 2));

  // Top half-width of the flume at top elevation y = flumeHeight
  const topHalfW = useMemo(() => {
    if (shape === 'trapezoidal') {
      return halfW + zSlope * flumeHeight;
    }
    if (shape === 'triangular') {
      return zSlope * flumeHeight;
    }
    if (shape === 'circular') {
      return R0;
    }
    return halfW;
  }, [shape, halfW, zSlope, flumeHeight, R0]);

  // Bottom half-width of the channel bed
  const bottomHalfW = useMemo(() => {
    if (shape === 'triangular') return 0;
    if (shape === 'circular') return R0;
    return halfW;
  }, [shape, halfW, R0]);

  // Generate metric tick lines along glass wall
  const tickMarks = useMemo(() => {
    const marks: React.ReactNode[] = [];
    const step = 0.5; // Every 0.5m
    for (let x = 0; x <= flumeLength; x += step) {
      const posX = x - halfL;
      marks.push(
        <group key={`tick-${x}`} position={[posX, 0, topHalfW + 0.005]}>
          {/* Vertical station tick on bottom rail */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.005, 0.04, 0.002]} />
            <meshBasicMaterial color={0x94a3b8} />
          </mesh>
        </group>
      );
    }
    return marks;
  }, [flumeLength, halfL, topHalfW]);

  return (
    <group rotation={[0, 0, -slopeAngle]}>
      {/* --- Channel Bed Floor Slab / Conduit Shell --- */}
      {shape === 'circular' ? (
        <group position={[0, R0, 0]} rotation={[0, 0, Math.PI / 2]}>
          {/* Lower half cradle bed */}
          <mesh material={bedMaterial} receiveShadow>
            <cylinderGeometry
              args={[
                R0 + 0.015,
                R0 + 0.015,
                flumeLength,
                48,
                1,
                true,
                Math.PI,
                Math.PI,
              ]}
            />
          </mesh>
          {/* Upper transparent acrylic half hood */}
          {showGlassWalls && (
            <mesh material={glassMaterial}>
              <cylinderGeometry
                args={[
                  R0,
                  R0,
                  flumeLength,
                  48,
                  1,
                  true,
                  0,
                  Math.PI,
                ]}
              />
            </mesh>
          )}
        </group>
      ) : shape === 'triangular' ? (
        <group>
          {/* V-Notch apex bottom keel rail */}
          <mesh position={[0, -0.02, 0]} material={steelFrameMaterial}>
            <boxGeometry args={[flumeLength, 0.04, 0.04]} />
          </mesh>
          {/* Slanted Glass Walls (Flaring OUTWARD at the top) */}
          {showGlassWalls && (
            <>
              {/* Front +Z Sloping Wall: tilts outward (+Z) with positive rotation */}
              <mesh
                position={[0, flumeHeight / 2, (zSlope * flumeHeight) / 2]}
                rotation={[slantAngle, 0, 0]}
                material={glassMaterial}
              >
                <boxGeometry
                  args={[
                    flumeLength,
                    slantWallHeight,
                    wallThickness,
                  ]}
                />
              </mesh>
              {/* Back -Z Sloping Wall: tilts outward (-Z) with negative rotation */}
              <mesh
                position={[0, flumeHeight / 2, -(zSlope * flumeHeight) / 2]}
                rotation={[-slantAngle, 0, 0]}
                material={glassMaterial}
              >
                <boxGeometry
                  args={[
                    flumeLength,
                    slantWallHeight,
                    wallThickness,
                  ]}
                />
              </mesh>
            </>
          )}
        </group>
      ) : shape === 'trapezoidal' ? (
        <group>
          {/* Bottom Bed Floor Slab */}
          <mesh position={[0, -0.03, 0]} material={bedMaterial} receiveShadow>
            <boxGeometry args={[flumeLength, 0.06, channelWidth]} />
          </mesh>
          {/* Slanted Glass Walls (Flaring OUTWARD at the top) */}
          {showGlassWalls && (
            <>
              {/* Front +Z Sloping Wall: base at +halfW, top at +(halfW + zH) */}
              <mesh
                position={[
                  0,
                  flumeHeight / 2,
                  halfW + (zSlope * flumeHeight) / 2,
                ]}
                rotation={[slantAngle, 0, 0]}
                material={glassMaterial}
              >
                <boxGeometry
                  args={[
                    flumeLength,
                    slantWallHeight,
                    wallThickness,
                  ]}
                />
              </mesh>
              {/* Back -Z Sloping Wall: base at -halfW, top at -(halfW + zH) */}
              <mesh
                position={[
                  0,
                  flumeHeight / 2,
                  -halfW - (zSlope * flumeHeight) / 2,
                ]}
                rotation={[-slantAngle, 0, 0]}
                material={glassMaterial}
              >
                <boxGeometry
                  args={[
                    flumeLength,
                    slantWallHeight,
                    wallThickness,
                  ]}
                />
              </mesh>
            </>
          )}
        </group>
      ) : (
        <group>
          {/* Standard Rectangular Bed Floor Slab */}
          <mesh position={[0, -0.03, 0]} material={bedMaterial} receiveShadow>
            <boxGeometry args={[flumeLength, 0.06, channelWidth]} />
          </mesh>

          {/* Vertical Glass Side Walls */}
          {showGlassWalls && (
            <>
              {/* Front Glass Wall (+Z) */}
              <mesh
                position={[0, flumeHeight / 2, halfW + wallThickness / 2]}
                material={glassMaterial}
              >
                <boxGeometry args={[flumeLength, flumeHeight, wallThickness]} />
              </mesh>

              {/* Back Glass Wall (-Z) */}
              <mesh
                position={[0, flumeHeight / 2, -halfW - wallThickness / 2]}
                material={glassMaterial}
              >
                <boxGeometry args={[flumeLength, flumeHeight, wallThickness]} />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* Station ticks on the glass wall */}
      {tickMarks}

      {/* --- Structural Top & Bottom Longitudinal Rails --- */}
      {shape !== 'circular' && (
        <>
          {/* Front Top Rail */}
          <mesh
            position={[0, flumeHeight + 0.015, topHalfW + wallThickness / 2]}
            material={steelFrameMaterial}
          >
            <boxGeometry args={[flumeLength, 0.03, wallThickness + 0.01]} />
          </mesh>
          {/* Back Top Rail */}
          <mesh
            position={[0, flumeHeight + 0.015, -topHalfW - wallThickness / 2]}
            material={steelFrameMaterial}
          >
            <boxGeometry args={[flumeLength, 0.03, wallThickness + 0.01]} />
          </mesh>

          {/* Bottom Longitudinal Rails */}
          {shape === 'triangular' ? (
            <mesh position={[0, -0.02, 0]} material={steelFrameMaterial}>
              <boxGeometry args={[flumeLength, 0.03, 0.03]} />
            </mesh>
          ) : (
            <>
              {/* Bottom Front Rail */}
              <mesh position={[0, -0.01, bottomHalfW + wallThickness / 2]} material={steelFrameMaterial}>
                <boxGeometry args={[flumeLength, 0.02, wallThickness + 0.01]} />
              </mesh>
              {/* Bottom Back Rail */}
              <mesh position={[0, -0.01, -bottomHalfW - wallThickness / 2]} material={steelFrameMaterial}>
                <boxGeometry args={[flumeLength, 0.02, wallThickness + 0.01]} />
              </mesh>
            </>
          )}
        </>
      )}

      {/* --- Structural Frame Stations along Flume Length --- */}
      {[-halfL, -halfL * 0.5, 0, halfL * 0.5, halfL].map((px, idx) => (
        <group key={`post-${idx}`} position={[px, 0, 0]}>
          {shape === 'circular' ? (
            // Ring collar around circular culvert
            <group position={[0, R0, 0]}>
              <mesh rotation={[0, Math.PI / 2, 0]} material={steelFrameMaterial}>
                <torusGeometry args={[R0 + 0.018, 0.018, 16, 32]} />
              </mesh>
              {/* Pedestal Saddle Legs */}
              <mesh position={[0, -R0 / 2, 0]} material={steelFrameMaterial}>
                <boxGeometry args={[0.06, R0, D0 * 0.9]} />
              </mesh>
            </group>
          ) : shape === 'triangular' ? (
            // V-shaped slanted structural posts
            <group>
              {/* Front Slanted V-Post */}
              <mesh
                position={[0, flumeHeight / 2, topHalfW / 2 + wallThickness / 2]}
                rotation={[slantAngle, 0, 0]}
                material={steelFrameMaterial}
              >
                <boxGeometry args={[0.04, slantWallHeight + 0.03, wallThickness + 0.02]} />
              </mesh>
              {/* Back Slanted V-Post */}
              <mesh
                position={[0, flumeHeight / 2, -topHalfW / 2 - wallThickness / 2]}
                rotation={[-slantAngle, 0, 0]}
                material={steelFrameMaterial}
              >
                <boxGeometry args={[0.04, slantWallHeight + 0.03, wallThickness + 0.02]} />
              </mesh>
              {/* Top Cross-Brace */}
              <mesh position={[0, flumeHeight + 0.015, 0]} material={steelFrameMaterial}>
                <boxGeometry args={[0.04, 0.03, topHalfW * 2 + 0.08]} />
              </mesh>
              {/* Apex base anchor shoe */}
              <mesh position={[0, -0.03, 0]} material={steelFrameMaterial}>
                <boxGeometry args={[0.06, 0.04, 0.08]} />
              </mesh>
            </group>
          ) : shape === 'trapezoidal' ? (
            // Slanted Trapezoidal Post Ribs
            <group>
              {/* Front Slanted Rib */}
              <mesh
                position={[0, flumeHeight / 2, halfW + (zSlope * flumeHeight) / 2 + wallThickness / 2]}
                rotation={[slantAngle, 0, 0]}
                material={steelFrameMaterial}
              >
                <boxGeometry args={[0.04, slantWallHeight + 0.03, wallThickness + 0.02]} />
              </mesh>
              {/* Back Slanted Rib */}
              <mesh
                position={[0, flumeHeight / 2, -halfW - (zSlope * flumeHeight) / 2 - wallThickness / 2]}
                rotation={[-slantAngle, 0, 0]}
                material={steelFrameMaterial}
              >
                <boxGeometry args={[0.04, slantWallHeight + 0.03, wallThickness + 0.02]} />
              </mesh>
              {/* Top Cross-Brace */}
              <mesh position={[0, flumeHeight + 0.015, 0]} material={steelFrameMaterial}>
                <boxGeometry args={[0.04, 0.03, topHalfW * 2 + 0.08]} />
              </mesh>
              {/* Bottom Bed Cross-Brace */}
              <mesh position={[0, -0.03, 0]} material={steelFrameMaterial}>
                <boxGeometry args={[0.04, 0.03, channelWidth + 0.08]} />
              </mesh>
            </group>
          ) : (
            // Standard Rectangular Posts
            <group position={[0, flumeHeight / 2, 0]}>
              <mesh position={[0, 0, halfW + wallThickness / 2]} material={steelFrameMaterial}>
                <boxGeometry args={[0.04, flumeHeight + 0.03, wallThickness + 0.02]} />
              </mesh>
              <mesh position={[0, 0, -halfW - wallThickness / 2]} material={steelFrameMaterial}>
                <boxGeometry args={[0.04, flumeHeight + 0.03, wallThickness + 0.02]} />
              </mesh>
              {/* Top Cross Bridge */}
              <mesh position={[0, flumeHeight / 2 + 0.015, 0]} material={steelFrameMaterial}>
                <boxGeometry args={[0.04, 0.03, channelWidth + 0.08]} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* --- Inflow Head Reservoir Box (Inlet at -halfL) --- */}
      <group position={[-halfL - 0.25, flumeHeight / 2, 0]}>
        {/* Back Wall */}
        <mesh position={[-0.25, 0, 0]} material={steelFrameMaterial}>
          <boxGeometry args={[0.04, flumeHeight + 0.2, topHalfW * 2 + 0.16]} />
        </mesh>
        {/* Sides */}
        <mesh position={[0, 0, topHalfW + 0.06]} material={steelFrameMaterial}>
          <boxGeometry args={[0.5, flumeHeight + 0.2, 0.04]} />
        </mesh>
        <mesh position={[0, 0, -topHalfW - 0.06]} material={steelFrameMaterial}>
          <boxGeometry args={[0.5, flumeHeight + 0.2, 0.04]} />
        </mesh>
        {/* Inflow Pipe */}
        <mesh position={[-0.25, flumeHeight * 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
          <meshStandardMaterial color={0x0284c7} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* --- Outflow Tailwater Tank (Outlet at +halfL) --- */}
      <group position={[halfL + 0.25, flumeHeight * 0.3, 0]}>
        <mesh position={[0, -flumeHeight * 0.2, 0]} material={steelFrameMaterial}>
          <boxGeometry args={[0.5, 0.4, topHalfW * 2 + 0.16]} />
        </mesh>
      </group>

      {/* --- Mechanized Adjustable Sluice Gate --- */}
      <group position={[gateX - halfL, 0, 0]}>
        {/* Gate Guide Side Columns */}
        <mesh
          position={[0, flumeHeight * 0.75, topHalfW + 0.03]}
          material={steelFrameMaterial}
        >
          <boxGeometry args={[0.06, flumeHeight * 1.5, 0.04]} />
        </mesh>
        <mesh
          position={[0, flumeHeight * 0.75, -topHalfW - 0.03]}
          material={steelFrameMaterial}
        >
          <boxGeometry args={[0.06, flumeHeight * 1.5, 0.04]} />
        </mesh>
        {/* Top Motor / Handwheel Bridge */}
        <mesh
          position={[0, flumeHeight * 1.5 + 0.02, 0]}
          material={steelFrameMaterial}
        >
          <boxGeometry args={[0.12, 0.06, topHalfW * 2 + 0.14]} />
        </mesh>
        {/* Brass Handwheel Crank */}
        <mesh
          position={[0, flumeHeight * 1.5 + 0.08, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={brassMaterial}
        >
          <torusGeometry args={[0.07, 0.015, 12, 24]} />
        </mesh>
        {/* Vertical Spindle Rod */}
        <mesh
          position={[0, (flumeHeight * 1.5 + gateOpening) / 2, 0]}
          material={brassMaterial}
        >
          <cylinderGeometry
            args={[0.012, 0.012, flumeHeight * 1.5 - gateOpening, 12]}
          />
        </mesh>

        {/* Dynamic Gate Blade (Physically lifts to gateOpening height) */}
        <group position={[0, gateOpening + (flumeHeight - gateOpening + 0.15) / 2, 0]}>
          <mesh material={gateMaterial} castShadow>
            <boxGeometry
              args={[
                0.025,
                flumeHeight - gateOpening + 0.15,
                shape === 'triangular'
                  ? Math.max(0.04, 2 * zSlope * flumeHeight)
                  : shape === 'trapezoidal'
                  ? channelWidth + 2 * zSlope * flumeHeight - 0.01
                  : topHalfW * 2 - 0.01,
              ]}
            />
          </mesh>
          {/* Beveled Bottom Blade Lip */}
          <mesh
            position={[0, -(flumeHeight - gateOpening + 0.15) / 2 + 0.01, 0]}
            material={brassMaterial}
          >
            <boxGeometry
              args={[
                0.03,
                0.02,
                shape === 'triangular'
                  ? Math.max(0.04, 2 * zSlope * flumeHeight)
                  : shape === 'trapezoidal'
                  ? channelWidth + 2 * zSlope * flumeHeight - 0.01
                  : topHalfW * 2 - 0.01,
              ]}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};
