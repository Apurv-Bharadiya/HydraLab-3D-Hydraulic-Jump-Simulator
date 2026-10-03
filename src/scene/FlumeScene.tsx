/**
 * HydraLab 3D - Main R3F Three.js Scene Container
 *
 * Assembles flume geometry, deformable water mesh, velocity vectors,
 * particle systems, camera presets, and laboratory studio lighting.
 */

import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SceneVisualOptions } from '../hooks/useHydraulicPhysics';
import { HydraulicParameters, HydraulicResults, WaterProfilePoint } from '../physics/types';
import { DepthMarkers } from './DepthMarkers';
import { DyeTracerLab } from './DyeTracerLab';
import { EnergyGradeLine } from './EnergyGradeLine';
import { FlowParticles } from './FlowParticles';
import { FlumeMesh } from './FlumeMesh';
import { FoamParticles } from './FoamParticles';
import { StillingBasinMesh } from './StillingBasinMesh';
import { VelocityVectors } from './VelocityVectors';
import { WaterMesh } from './WaterMesh';

interface FlumeSceneProps {
  params: HydraulicParameters;
  results: HydraulicResults;
  profilePoints: WaterProfilePoint[];
  visuals: SceneVisualOptions;
}

// Sub-component to manage smooth camera transitions for presets
const CameraController: React.FC<{
  cameraPreset: SceneVisualOptions['cameraPreset'];
  flumeLength: number;
}> = ({ cameraPreset, flumeLength }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    switch (cameraPreset) {
      case 'elevation': // Pure 2D-like side elevation view
        camera.position.set(0, 0.4, flumeLength * 0.95);
        controls.target.set(0, 0.35, 0);
        break;

      case 'downstream': // Looking upstream towards approaching jump
        camera.position.set(flumeLength * 0.7, 0.8, 0.9);
        controls.target.set(-flumeLength * 0.1, 0.3, 0);
        break;

      case 'top': // Plan view from above
        camera.position.set(0, flumeLength * 0.85, 0.01);
        controls.target.set(0, 0, 0);
        break;

      case 'gate': // Close-up on sluice gate and vena contracta
        camera.position.set(-flumeLength * 0.32 + 0.6, 0.45, 0.9);
        controls.target.set(-flumeLength * 0.32, 0.25, 0);
        break;

      case 'iso': // Standard perspective 3D lab view
      default:
        camera.position.set(-flumeLength * 0.2, 2.2, flumeLength * 0.75);
        controls.target.set(0, 0.3, 0);
        break;
    }

    controls.update();
  }, [cameraPreset, camera, flumeLength]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 + 0.05} // don't flip upside down under floor
      minDistance={0.5}
      maxDistance={25.0}
    />
  );
};

export const FlumeScene: React.FC<FlumeSceneProps> = ({
  params,
  results,
  profilePoints,
  visuals,
}) => {
  const { flumeLength } = params;

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{
          position: [-flumeLength * 0.2, 2.2, flumeLength * 0.75],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        {/* --- Studio Lighting Setup --- */}
        <color attach="background" args={['#090d16']} />
        <ambientLight intensity={0.65} color="#cbd5e1" />

        {/* Key Directional Sunlight with Soft Shadows */}
        <directionalLight
          position={[6, 9, 8]}
          intensity={1.3}
          color="#f8fafc"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0002}
        />

        {/* Flume Blue Rim Light for Water Highlights */}
        <directionalLight position={[-8, 4, -6]} intensity={0.9} color="#38bdf8" />

        {/* Warm Fill Light */}
        <directionalLight position={[0, -2, 5]} intensity={0.2} color="#fed7aa" />

        {/* Spot Light above Hydraulic Jump zone */}
        <spotLight
          position={[results.jumpToePositionX - flumeLength / 2, 3.5, 0]}
          intensity={1.2}
          angle={0.6}
          penumbra={0.8}
          color="#e0f2fe"
        />

        {/* --- Camera Controller & OrbitControls --- */}
        <CameraController cameraPreset={visuals.cameraPreset} flumeLength={flumeLength} />

        {/* --- Laboratory Floor Grid --- */}
        <group position={[0, -0.95, 0]}>
          <gridHelper
            args={[24, 48, 0x1e293b, 0x0f172a]}
            position={[0, 0.01, 0]}
          />
          {/* Subtle Reflective Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#050811" roughness={0.7} metalness={0.2} />
          </mesh>
        </group>

        {/* --- Physical Flume Structure --- */}
        <FlumeMesh
          params={params}
          results={results}
          showGlassWalls={visuals.showGlassWalls}
        />

        {/* --- Deformable Water Surface Mesh --- */}
        <WaterMesh
          params={params}
          results={results}
          profilePoints={profilePoints}
          wireframe={visuals.wireframe}
          flowSpeed={visuals.flowSpeed}
          isPaused={visuals.isPaused}
        />

        {/* --- Streamline Flow Particles --- */}
        {visuals.showStreamlines && (
          <FlowParticles
            params={params}
            results={results}
            profilePoints={profilePoints}
            flowSpeed={visuals.flowSpeed}
            isPaused={visuals.isPaused}
          />
        )}

        {/* --- Aeration Spray & Roller Foam Particles --- */}
        {visuals.showFoam && (
          <FoamParticles
            params={params}
            results={results}
            flowSpeed={visuals.flowSpeed}
            isPaused={visuals.isPaused}
          />
        )}

        {/* --- 3D Velocity Vector Field --- */}
        {visuals.showVectors && (
          <VelocityVectors
            params={params}
            results={results}
            profilePoints={profilePoints}
          />
        )}

        {/* --- Energy Grade Line (EGL) & HGL --- */}
        {visuals.showEGL && (
          <EnergyGradeLine
            params={params}
            results={results}
            profilePoints={profilePoints}
          />
        )}

        {/* --- Stilling Basin Physical Dissipators --- */}
        <StillingBasinMesh
          params={params}
          results={results}
          showBasinBlocks={visuals.showBasinBlocks}
        />

        {/* --- Interactive Lagrangian Virtual Dye Tracer Lab --- */}
        {visuals.showDyeTracer && (
          <DyeTracerLab
            params={params}
            results={results}
            profilePoints={profilePoints}
            visuals={visuals}
          />
        )}
      </Canvas>
    </div>
  );
};
