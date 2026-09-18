import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import aidnModelUrl from '../a.glb';

interface HeroSceneProps {
  revealProgress: number; // 0 to 1
  isRevealComplete: boolean;
  onModelLoaded?: (name: string, stats?: { vertices: number; meshes: number }) => void;
  onLoadProgress?: (percent: number) => void;
  onModelReady?: () => void;
  customModelBuffer?: ArrayBuffer | null;
  modelUrl?: string;
}

export const HeroScene: React.FC<HeroSceneProps> = ({
  revealProgress,
  isRevealComplete,
  onModelLoaded,
  onLoadProgress,
  onModelReady,
  customModelBuffer,
  modelUrl,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References to keep across re-renders without re-initializing Three
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Four Separate Physical Cinematic SpotLights & Targets
  const spot1Ref = useRef<THREE.SpotLight | null>(null);
  const spot1TargetRef = useRef<THREE.Object3D | null>(null);

  const spot2Ref = useRef<THREE.SpotLight | null>(null);
  const spot2TargetRef = useRef<THREE.Object3D | null>(null);

  const spot3Ref = useRef<THREE.SpotLight | null>(null);
  const spot3TargetRef = useRef<THREE.Object3D | null>(null);

  const spot4Ref = useRef<THREE.SpotLight | null>(null);
  const spot4TargetRef = useRef<THREE.Object3D | null>(null);

  const flashLightRef = useRef<THREE.PointLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const baseCameraZRef = useRef<number>(7.6);
  const targetCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const reqIdRef = useRef<number | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const revealProgressRef = useRef<number>(revealProgress);
  revealProgressRef.current = revealProgress;

  // Initialize Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);
    // Subtle distant fog to gracefully blend the horizon into deep obsidian darkness
    scene.fog = new THREE.FogExp2(0x020408, 0.016);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Dark Architectural Floor - Receives localized moving light pool and real dynamic cast shadows
    const floorGeo = new THREE.PlaneGeometry(90, 90);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x020306,
      roughness: 0.86,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.14; // Aligned directly beneath the bottom feet of the A
    floor.receiveShadow = true;
    scene.add(floor);

    // 4b. Dark Architectural Backdrop Wall - Receives background moving spotlight pools and dramatic cast shadows
    const backWallGeo = new THREE.PlaneGeometry(100, 50);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x010204,
      roughness: 0.95,
      metalness: 0.02,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 8, -4.2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // 5. Lighting Setup: Four Independent Moving Physical SpotLights
    // Deep environmental ambient light (deep quiet darkness initially)
    const ambientLight = new THREE.AmbientLight(0x050a14, 0.005);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Helper to configure a physical cinematic SpotLight with real shadow casting
    // Optimized 2048x2048 shadow map, wide room coverage, and calibrated normalBias to prevent acne/flicker
    const createCinematicSpotlight = (
      color: number,
      angle = 0.1265, // +15% radius
      penumbra = 0.38,
      decay = 1.25,
      mapSize = 2048
    ) => {
      const spot = new THREE.SpotLight(color, 0);
      spot.angle = angle;
      spot.penumbra = penumbra;
      spot.decay = decay;
      spot.distance = 36;
      spot.castShadow = true;
      spot.shadow.mapSize.width = mapSize;
      spot.shadow.mapSize.height = mapSize;
      spot.shadow.camera.near = 0.8;
      spot.shadow.camera.far = 32.0;
      spot.shadow.bias = -0.00003;
      spot.shadow.normalBias = 0.040;
      spot.shadow.radius = 1.25;

      const target = new THREE.Object3D();
      scene.add(target);
      spot.target = target;
      scene.add(spot);
      return { spot, target };
    };

    // LIGHT 1: Upper-left / left-front (Primary key light, beam radius +15% ~7.25°)
    const l1 = createCinematicSpotlight(0xf8faff, 0.1265, 0.38);
    spot1Ref.current = l1.spot;
    spot1TargetRef.current = l1.target;

    // LIGHT 2: Upper-right / right-front (Fill / edge sculptor, beam radius +15% ~7.25°)
    const l2 = createCinematicSpotlight(0xe8f2fe, 0.1265, 0.38);
    spot2Ref.current = l2.spot;
    spot2TargetRef.current = l2.target;

    // LIGHT 3: Lower-left / left-rear (Rear-left rim & floor grazer, beam radius +15% ~6.8°)
    const l3 = createCinematicSpotlight(0xdfeaff, 0.1185, 0.35, 1.15);
    spot3Ref.current = l3.spot;
    spot3TargetRef.current = l3.target;

    // LIGHT 4: Lower-right / right-rear (Rear-right rim & floor grazer, beam radius +15% ~6.8°)
    const l4 = createCinematicSpotlight(0xe2edff, 0.1185, 0.35, 1.15);
    spot4Ref.current = l4.spot;
    spot4TargetRef.current = l4.target;

    // Converged Center Ambient Fill: Soft luminous pool at the heart of the AIDN monument
    // Expands smoothly with an additional 10% wider radius (18.2 -> 20.0 units) to warmly illuminate the room
    const flashLight = new THREE.PointLight(0xe8f4ff, 0, 20.0, 1.4);
    flashLight.position.set(0, 0.42, 0.6);
    scene.add(flashLight);
    flashLightRef.current = flashLight;

    // Individual 3D Base Paths for the Four Physical Moving Lights
    // 4 Distinct Starting Corners -> Traverse the WHOLE AREA (wide floor, high sky, void, walls) -> Center Convergence on Logo
    // When centered, all 4 beams converge and fully illuminate the entire 3D logo.

    // 1. LIGHT 1: TOP-LEFT SKY & FLOOR TRAVERSE -> WHOLE AREA -> CENTER CONVERGE
    const lightPath1 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-12.5, 7.5, 3.5), // Act 1: Far Top-Left upper airspace
        new THREE.Vector3(-8.5, 3.2, 5.0),  // Act 2: Swoop low across left floor
        new THREE.Vector3(-5.5, 6.2, 2.5),  // Act 2: Loop high across ceiling
        new THREE.Vector3(-3.4, 4.2, 3.8),  // Act 3: Inward approach
        new THREE.Vector3(-2.5, 3.82, 4.2), // Act 4: Settled Key Light (elevated to frame logo)
      ],
      false,
      'centripetal'
    );
    const targetPath1 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-9.0, -1.14, 2.0), // Act 1: Far left floor pool
        new THREE.Vector3(-5.0, 3.5, -4.0),  // Act 2: High left back wall searchlight
        new THREE.Vector3(-2.5, 0.5, 0.5),   // Act 2: Grazing left quadrant
        new THREE.Vector3(-0.8, 0.6, 0.1),   // Act 3: Drawing inward
        new THREE.Vector3(-0.08, 0.67, 0.0), // Act 4: Center converged: Upper body & Apex (elevated)
      ],
      false,
      'centripetal'
    );

    // 2. LIGHT 2: TOP-RIGHT SKY & FLOOR TRAVERSE -> WHOLE AREA -> CENTER CONVERGE
    const lightPath2 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(12.5, 7.5, 3.5),  // Act 1: Far Top-Right upper airspace
        new THREE.Vector3(8.5, 3.2, 5.0),   // Act 2: Swoop low across right floor
        new THREE.Vector3(5.5, 6.2, 2.5),   // Act 2: Loop high across ceiling
        new THREE.Vector3(3.4, 3.8, 3.8),   // Act 3: Inward approach
        new THREE.Vector3(2.5, 3.42, 4.0),  // Act 4: Settled Fill Light (elevated to frame logo)
      ],
      false,
      'centripetal'
    );
    const targetPath2 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(9.0, -1.14, 2.0),  // Act 1: Far right floor pool
        new THREE.Vector3(5.0, 3.5, -4.0),   // Act 2: High right back wall searchlight
        new THREE.Vector3(2.5, 0.5, 0.5),    // Act 2: Grazing right quadrant
        new THREE.Vector3(0.8, 0.4, 0.1),    // Act 3: Drawing inward
        new THREE.Vector3(0.08, 0.47, 0.0),  // Act 4: Center converged: Crossbar & Right Flank (elevated)
      ],
      false,
      'centripetal'
    );

    // 3. LIGHT 3: BOTTOM-LEFT FLOOR & VOID TRAVERSE -> WHOLE AREA -> CENTER CONVERGE
    const lightPath3 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-11.0, 0.6, -4.0), // Act 1: Deep rear left floor void
        new THREE.Vector3(-7.5, 1.8, 4.5),   // Act 2: Sweeping forward left floor
        new THREE.Vector3(-4.5, 2.5, 1.5),   // Act 2: Rising mid-stage
        new THREE.Vector3(-3.2, 1.6, 3.2),   // Act 3: Inward approach
        new THREE.Vector3(-2.4, 1.62, 3.0),  // Act 4: Settled Lower-Left Rim Light (elevated to frame logo)
      ],
      false,
      'centripetal'
    );
    const targetPath3 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-10.0, -1.14, -1.0), // Act 1: Deep rear floor pool
        new THREE.Vector3(-4.0, -1.14, 4.0),   // Act 2: Forward floor sweep
        new THREE.Vector3(-1.8, -0.5, 0.5),    // Act 2: Raking lower-left
        new THREE.Vector3(-0.8, -0.3, 0.1),    // Act 3: Drawing inward
        new THREE.Vector3(-0.15, 0.07, 0.0),  // Act 4: Center converged: Lower-Left Leg & Base (elevated)
      ],
      false,
      'centripetal'
    );

    // 4. LIGHT 4: BOTTOM-RIGHT FLOOR & VOID TRAVERSE -> WHOLE AREA -> CENTER CONVERGE
    const lightPath4 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(11.0, 0.6, -4.0),  // Act 1: Deep rear right floor void
        new THREE.Vector3(7.5, 1.8, 4.5),    // Act 2: Sweeping forward right floor
        new THREE.Vector3(4.5, 2.5, 1.5),    // Act 2: Rising mid-stage
        new THREE.Vector3(3.2, 1.6, 3.2),    // Act 3: Inward approach
        new THREE.Vector3(2.4, 1.62, 3.0),   // Act 4: Settled Lower-Right Rim Light (elevated to frame logo)
      ],
      false,
      'centripetal'
    );
    const targetPath4 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(10.0, -1.14, -1.0), // Act 1: Deep rear floor pool
        new THREE.Vector3(4.0, -1.14, 4.0),   // Act 2: Forward floor sweep
        new THREE.Vector3(1.8, -0.5, 0.5),    // Act 2: Raking lower-right
        new THREE.Vector3(0.8, -0.3, 0.1),    // Act 3: Drawing inward
        new THREE.Vector3(0.15, 0.07, 0.0),   // Act 4: Center converged: Lower-Right Leg & Aperture (elevated)
      ],
      false,
      'centripetal'
    );

    // 6. Model Root Group - Raised position (+0.42) so bottom typography has breathing room
    const modelGroup = new THREE.Group();
    modelGroup.position.set(0, 0.42, 0);
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetCursorRef.current = { x: nx, y: ny };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Resize handling via ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      
      // Responsive camera distance adjustment for small screens
      if (newW < 640) {
        baseCameraZRef.current = 9.8;
      } else if (newW < 1024) {
        baseCameraZRef.current = 8.4;
      } else {
        baseCameraZRef.current = 7.6;
      }
      cameraRef.current.position.z = baseCameraZRef.current;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    // Render loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Snappy, low-latency cursor tracking (frame-rate independent damping)
      const cursorDamping = 1 - Math.exp(-24 * Math.min(delta, 0.1));
      currentCursorRef.current.x += (targetCursorRef.current.x - currentCursorRef.current.x) * cursorDamping;
      currentCursorRef.current.y += (targetCursorRef.current.y - currentCursorRef.current.y) * cursorDamping;

      // Update animation mixer if model has animations
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Model interaction when reveal complete
      if (modelGroupRef.current) {
        modelGroupRef.current.visible = isLoadedRef.current && revealProgressRef.current > 0.0001;
        if (isLoadedRef.current) {
          // Micro breathing idle motion
          const idleTiltY = Math.sin(time * 0.7) * 0.015;
          const idleTiltX = Math.cos(time * 0.5) * 0.012;

          // Target rotation bounded and restrained
          const targetRotY = currentCursorRef.current.x * 0.28 + idleTiltY;
          const targetRotX = -currentCursorRef.current.y * 0.16 + idleTiltX;

          const rotDamping = 1 - Math.exp(-18 * Math.min(delta, 0.1));
          modelGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            modelGroupRef.current.rotation.y,
            targetRotY,
            rotDamping
          );
          modelGroupRef.current.rotation.x = THREE.MathUtils.lerp(
            modelGroupRef.current.rotation.x,
            targetRotX,
            rotDamping
          );

          // Subtle position parallax with immediate tracking
          const posDamping = 1 - Math.exp(-16 * Math.min(delta, 0.1));
          modelGroupRef.current.position.x = THREE.MathUtils.lerp(
            modelGroupRef.current.position.x,
            currentCursorRef.current.x * 0.12,
            posDamping
          );
          modelGroupRef.current.position.y = THREE.MathUtils.lerp(
            modelGroupRef.current.position.y,
            0.42 + currentCursorRef.current.y * 0.08,
            posDamping
          );
        }
      }

      // Choreographed cinematic lighting reveal with four independent physical lights
      const p = revealProgressRef.current;
      const posVec = new THREE.Vector3();
      const targetVec = new THREE.Vector3();

      const smooth = (val: number) => {
        const c = Math.max(0, Math.min(1, val));
        return c * c * (3 - 2 * c);
      };

      const smootherstep = (edge0: number, edge1: number, x: number) => {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * t * (t * (t * 6 - 15) + 10);
      };

      // Cinematic slow camera dolly-in & vertical settle during lighting journey
      const camDolly = (1 - smootherstep(0.12, 0.96, p)) * 0.48;
      const camElev = (1 - smootherstep(0.12, 0.96, p)) * 0.12;
      camera.position.z = baseCameraZRef.current + camDolly;
      camera.position.y = camElev;
      camera.lookAt(0, 0.32, 0);

      // Dedicated convergence progress (0 to 1 as lights draw together and lock)
      // Begins smoothly at p = 0.78, completes at p = 1.00 with zero velocity & acceleration at boundaries
      const conv = smootherstep(0.78, 1.00, p);
      // Damping factor: completely dissolves wander oscillation as convergence proceeds
      const wanderDamp = Math.pow(1 - conv, 2.5);

      // Act 2: Extended Play Across the Whole Area (floor, ceiling, walls, and void) (p in [0.06, 0.78])
      const playWeight = (smootherstep(0.06, 0.20, p) * (1 - smootherstep(0.70, 0.82, p))) * wanderDamp;

      // Act 3: Tease Contours & Facet Shimmers as lights approach center (p in [0.45, 0.78])
      const teaseWeight = (smootherstep(0.45, 0.55, p) * (1 - smootherstep(0.74, 0.82, p))) * wanderDamp;

      // Coordinated silhouette passes where ALL lights sweep smoothly over and behind the AIDN logo:
      // Pass 1: peaks around p = 0.30 (window p in [0.20, 0.40])
      // Pass 2: peaks around p = 0.60 (window p in [0.50, 0.70])
      // Uses smoother Gaussian decay with gentler transitions to prevent any jerky motion
      const sil1 = Math.exp(-Math.pow((p - 0.30) / 0.075, 2)) * (1 - conv);
      const sil2 = Math.exp(-Math.pow((p - 0.60) / 0.075, 2)) * (1 - conv);
      const silTotal = Math.min(1.0, sil1 + sil2);
      const silRadiusBoost = (sil1 + sil2) * 0.025;

      // Premium, ultra-smooth radius expansion:
      // Instead of an abrupt flash, as lights converge (p in [0.70, 0.98]),
      // the spotlight cone angles smoothly and elegantly open up by an additional 10% (1.40x total) with an expansive, soft penumbra.
      const convRadiusGrowth = smootherstep(0.70, 0.98, p);
      const convAngleExpansion = THREE.MathUtils.lerp(1.00, 1.40, convRadiusGrowth);
      const convPenumbra = THREE.MathUtils.lerp(0.45, 0.85, convRadiusGrowth);

      // Spotlight radius baseline
      const baseAngle12 = 0.145; // ~8.3°
      const baseAngle34 = 0.135; // ~7.7°

      const currentBeamAngle12 = baseAngle12 * convAngleExpansion + silRadiusBoost;
      const currentBeamAngle34 = baseAngle34 * convAngleExpansion + silRadiusBoost;
      if (spot1Ref.current) {
        spot1Ref.current.angle = currentBeamAngle12;
        spot1Ref.current.penumbra = convPenumbra;
      }
      if (spot2Ref.current) {
        spot2Ref.current.angle = currentBeamAngle12;
        spot2Ref.current.penumbra = convPenumbra;
      }
      if (spot3Ref.current) {
        spot3Ref.current.angle = currentBeamAngle34;
        spot3Ref.current.penumbra = convPenumbra;
      }
      if (spot4Ref.current) {
        spot4Ref.current.angle = currentBeamAngle34;
        spot4Ref.current.penumbra = convPenumbra;
      }

      // Harmonic time: gentler, fluid temporal cadence for silky-smooth trajectories
      const ph = p * 12.0;
      const sTime = time * 0.52;

      // Whole-Area Playful Choreography Harmonics (silky-smooth sweeps across floor, air, and walls):
      // 1. Light 1 (Top-Left Sky: Wide swoops through ceiling, high back wall, and left floor)
      const play1PosX = (Math.sin(sTime * 0.95) * 1.5 + Math.cos(sTime * 0.45) * 0.5) * playWeight;
      const play1PosY = (Math.cos(sTime * 0.90) * 1.0 + Math.sin(sTime * 1.4) * 0.35) * playWeight;
      const play1PosZ = (Math.sin(sTime * 0.75) * 0.9) * playWeight;
      const play1TgtX = (Math.sin(sTime * 0.95) * 2.4 + Math.cos(sTime * 0.5) * 0.8) * playWeight;
      const play1TgtY = (Math.cos(sTime * 0.95) * 1.6 + Math.sin(sTime * 1.5) * 0.5) * playWeight;
      const play1TgtZ = (Math.sin(sTime * 0.80) * 1.2) * playWeight;

      // 2. Light 2 (Top-Right Sky: Weaves across right sky, right boundary wall, and right floor)
      const play2PosX = (Math.cos(sTime * 1.0 + 0.8) * 1.5 + Math.sin(sTime * 0.5) * 0.5) * playWeight;
      const play2PosY = (Math.sin(sTime * 1.2) * 0.9) * playWeight;
      const play2PosZ = (Math.cos(sTime * 0.8) * 0.9) * playWeight;
      const play2TgtX = (Math.cos(sTime * 1.0 + 0.8) * 2.4 + Math.sin(sTime * 0.45) * 0.8) * playWeight;
      const play2TgtY = (Math.sin(sTime * 1.2) * 1.6) * playWeight;
      const play2TgtZ = (Math.cos(sTime * 0.85) * 1.2) * playWeight;

      // 3. Light 3 (Bottom-Left Floor: Rolling floor reflections and expansive floor pool sweeps)
      const play3PosX = (Math.sin(sTime * 0.85 + 1.2) * 1.3 + Math.cos(sTime * 0.4) * 0.4) * playWeight;
      const play3PosY = (Math.sin(sTime * 1.4) * 0.45) * playWeight;
      const play3PosZ = (Math.cos(sTime * 0.85 + 1.2) * 1.1) * playWeight;
      const play3TgtX = (Math.sin(sTime * 1.1 + 1.5) * 2.2) * playWeight;
      const play3TgtY = (Math.cos(sTime * 1.1 + 1.5) * 0.6) * playWeight;
      const play3TgtZ = (Math.sin(sTime * 0.75) * 1.3) * playWeight;

      // 4. Light 4 (Bottom-Right Floor: Deep floor arcs, back-wall grazes, and forward sweeps)
      const play4PosX = (Math.sin(sTime * 0.9 + 2.8) * 1.3 + Math.cos(sTime * 0.45) * 0.4) * playWeight;
      const play4PosY = (Math.cos(sTime * 0.75) * 0.5) * playWeight;
      const play4PosZ = (Math.cos(sTime * 0.9 + 2.8) * 1.1) * playWeight;
      const play4TgtX = (Math.cos(sTime * 1.15 + 2.4) * 2.2) * playWeight;
      const play4TgtY = (Math.sin(sTime * 1.15 + 2.4) * 0.7) * playWeight;
      const play4TgtZ = (Math.cos(sTime * 0.8) * 1.3) * playWeight;

      // Act 3: Teasing the Monument Contours (grazing passes along edges and facets)
      // 1. LIGHT 1: Graze left diagonal leg (ph ~ 7.8) & kiss apex pinnacle (ph ~ 10.2)
      const p1a = smooth(Math.max(0, 1 - Math.abs(ph - 7.8) / 1.5));
      const p1b = smooth(Math.max(0, 1 - Math.abs(ph - 10.2) / 1.5));
      const tease1Offset = new THREE.Vector3(
        p1a * -0.5 + p1b * -0.3,
        p1a * -0.2 + p1b * 0.6,
        (p1a + p1b) * 0.2
      );

      // 2. LIGHT 2: Graze crossbar (ph ~ 8.4) & right shoulder chamfer (ph ~ 10.8)
      const p2a = smooth(Math.max(0, 1 - Math.abs(ph - 8.4) / 1.5));
      const p2b = smooth(Math.max(0, 1 - Math.abs(ph - 10.8) / 1.5));
      const tease2Offset = new THREE.Vector3(
        p2a * 0.4 + p2b * 0.5,
        p2a * 0.3 + p2b * -0.4,
        (p2a + p2b) * 0.2
      );

      // 3. LIGHT 3: Rim lower-left pedestal foot (ph ~ 9.0)
      const p3 = smooth(Math.max(0, 1 - Math.abs(ph - 9.0) / 1.5));
      const tease3Offset = new THREE.Vector3(
        p3 * -0.4,
        0,
        p3 * 0.3
      );

      // 4. LIGHT 4: Backlight through central triangular aperture (ph ~ 9.6)
      const p4 = smooth(Math.max(0, 1 - Math.abs(ph - 9.6) / 1.5));
      const tease4Offset = new THREE.Vector3(
        p4 * 0.2,
        p4 * 0.3,
        p4 * 0.3
      );

      // Environmental Ambient Illumination (deep quiet darkness -> subtle architectural air)
      let ambIntensity = 0.001;
      if (p > 0.001 && p <= 0.40) {
        ambIntensity = 0.002 + smooth((p - 0.001) / 0.40) * 0.013;
      } else if (p > 0.40 && p <= 0.65) {
        ambIntensity = 0.015 + smooth((p - 0.40) / 0.25) * 0.010;
      } else if (p > 0.65 && p <= 0.85) {
        ambIntensity = 0.025 + smooth((p - 0.65) / 0.20) * 0.007;
      } else if (p > 0.85) {
        ambIntensity = 0.032 + smooth((p - 0.85) / 0.15) * 0.003;
      }
      if (ambientLightRef.current) ambientLightRef.current.intensity = ambIntensity;

      // Master continuous curve progression along the Catmull-Rom paths (0 to 1)
      const cMaster = smootherstep(0.00, 1.00, p);

      if (flashLightRef.current) {
        // Soft, elegant luminous ambient radiance settling quietly at the heart of the monument once converged (no abrupt flash spike)
        flashLightRef.current.intensity = conv * 1.8;
      }

      // Smooth cursor blend as convergence completes (zero discontinuity at p = 1.0)
      const cursorBlend = smootherstep(0.85, 1.00, p);

      // Spotlights remain completely off (0 intensity) during loading and dark pause (p <= 0.0001)
      // Once reveal begins, intensity smoothly ramps up from 0 to 100% as convergence settles
      const intensityScale = p <= 0.0001 ? 0 : smootherstep(0.00, 0.95, p);

      // 1. LIGHT 1: Top-Left Corner -> Acrobatics -> Apex & Upper Left Sector
      // Targets the pinnacle apex and upper-left diagonal arm so upper monument is visibly bright
      const i1Base = 52.0 * intensityScale;
      const i1 = i1Base + (Math.max(p1a, p1b) * 4.0) * wanderDamp;

      lightPath1.getPoint(cMaster, posVec);
      targetPath1.getPoint(cMaster, targetVec);

      let p1X = posVec.x + play1PosX * (1 - silTotal);
      let p1Y = posVec.y + play1PosY * (1 - silTotal);
      let p1Z = posVec.z + play1PosZ * (1 - silTotal);
      if (sil1 > 0.0005) {
        p1X = THREE.MathUtils.lerp(p1X, -3.2, sil1);
        p1Y = THREE.MathUtils.lerp(p1Y, 3.8, sil1);
        p1Z = THREE.MathUtils.lerp(p1Z, 3.4, sil1);
      }
      if (sil2 > 0.0005) {
        p1X = THREE.MathUtils.lerp(p1X, -2.6, sil2);
        p1Y = THREE.MathUtils.lerp(p1Y, 1.4, sil2);
        p1Z = THREE.MathUtils.lerp(p1Z, 3.6, sil2);
      }

      let t1X = targetVec.x + play1TgtX * (1 - silTotal) + tease1Offset.x * teaseWeight;
      let t1Y = targetVec.y + play1TgtY * (1 - silTotal) + tease1Offset.y * teaseWeight;
      let t1Z = targetVec.z + play1TgtZ * (1 - silTotal) + tease1Offset.z * teaseWeight;
      if (sil1 > 0.0005) {
        t1X = THREE.MathUtils.lerp(t1X, 0.05, sil1);
        t1Y = THREE.MathUtils.lerp(t1Y, 0.55, sil1);
        t1Z = THREE.MathUtils.lerp(t1Z, -2.8, sil1);
      }
      if (sil2 > 0.0005) {
        t1X = THREE.MathUtils.lerp(t1X, 0.20, sil2);
        t1Y = THREE.MathUtils.lerp(t1Y, 0.48, sil2);
        t1Z = THREE.MathUtils.lerp(t1Z, -2.4, sil2);
      }

      if (spot1Ref.current) {
        spot1Ref.current.position.set(p1X, p1Y, p1Z);
        spot1Ref.current.intensity = i1;
        spot1Ref.current.updateMatrixWorld();
      }
      if (spot1TargetRef.current) {
        const cursorX = currentCursorRef.current.x * 0.16 * cursorBlend;
        const cursorY = currentCursorRef.current.y * 0.10 * cursorBlend;
        spot1TargetRef.current.position.set(
          t1X + cursorX,
          t1Y + cursorY,
          t1Z
        );
        spot1TargetRef.current.updateMatrixWorld();
      }

      // 2. LIGHT 2: Top-Right Corner -> Staccato Zigzag -> Right Arm & Crossbar Sector
      // Targets right diagonal arm and crossbar so right shoulder and center bridge are clearly illuminated
      const i2Base = 44.0 * intensityScale;
      const i2 = i2Base + (Math.max(p2a, p2b) * 3.5) * wanderDamp;

      lightPath2.getPoint(cMaster, posVec);
      targetPath2.getPoint(cMaster, targetVec);

      let p2X = posVec.x + play2PosX * (1 - silTotal);
      let p2Y = posVec.y + play2PosY * (1 - silTotal);
      let p2Z = posVec.z + play2PosZ * (1 - silTotal);
      if (sil1 > 0.0005) {
        p2X = THREE.MathUtils.lerp(p2X, 3.2, sil1);
        p2Y = THREE.MathUtils.lerp(p2Y, 3.8, sil1);
        p2Z = THREE.MathUtils.lerp(p2Z, 3.4, sil1);
      }
      if (sil2 > 0.0005) {
        p2X = THREE.MathUtils.lerp(p2X, 2.6, sil2);
        p2Y = THREE.MathUtils.lerp(p2Y, 1.4, sil2);
        p2Z = THREE.MathUtils.lerp(p2Z, 3.6, sil2);
      }

      let t2X = targetVec.x + play2TgtX * (1 - silTotal) + tease2Offset.x * teaseWeight;
      let t2Y = targetVec.y + play2TgtY * (1 - silTotal) + tease2Offset.y * teaseWeight;
      let t2Z = targetVec.z + play2TgtZ * (1 - silTotal) + tease2Offset.z * teaseWeight;
      if (sil1 > 0.0005) {
        t2X = THREE.MathUtils.lerp(t2X, -0.05, sil1);
        t2Y = THREE.MathUtils.lerp(t2Y, 0.40, sil1);
        t2Z = THREE.MathUtils.lerp(t2Z, -2.8, sil1);
      }
      if (sil2 > 0.0005) {
        t2X = THREE.MathUtils.lerp(t2X, -0.20, sil2);
        t2Y = THREE.MathUtils.lerp(t2Y, 0.48, sil2);
        t2Z = THREE.MathUtils.lerp(t2Z, -2.4, sil2);
      }

      if (spot2Ref.current) {
        spot2Ref.current.position.set(p2X, p2Y, p2Z);
        spot2Ref.current.intensity = i2;
        spot2Ref.current.updateMatrixWorld();
      }
      if (spot2TargetRef.current) {
        const cursorX = currentCursorRef.current.x * 0.14 * cursorBlend;
        const cursorY = currentCursorRef.current.y * 0.08 * cursorBlend;
        spot2TargetRef.current.position.set(
          t2X + cursorX,
          t2Y + cursorY,
          t2Z
        );
        spot2TargetRef.current.updateMatrixWorld();
      }

      // 3. LIGHT 3: Bottom-Left Corner -> Floor Skate -> Lower-Left Leg & Foot Sector
      // Targets lower-left pedestal foot and diagonal base for sharp definition and floor reflection
      const i3Base = 38.0 * intensityScale;
      const i3 = i3Base + (p3 * 3.5) * wanderDamp;

      lightPath3.getPoint(cMaster, posVec);
      targetPath3.getPoint(cMaster, targetVec);

      let p3X = posVec.x + play3PosX * (1 - silTotal);
      let p3Y = posVec.y + play3PosY * (1 - silTotal);
      let p3Z = posVec.z + play3PosZ * (1 - silTotal);
      if (sil1 > 0.0005) {
        p3X = THREE.MathUtils.lerp(p3X, -2.0, sil1);
        p3Y = THREE.MathUtils.lerp(p3Y, 0.6, sil1);
        p3Z = THREE.MathUtils.lerp(p3Z, -1.8, sil1);
      }
      if (sil2 > 0.0005) {
        p3X = THREE.MathUtils.lerp(p3X, -1.8, sil2);
        p3Y = THREE.MathUtils.lerp(p3Y, 3.8, sil2);
        p3Z = THREE.MathUtils.lerp(p3Z, -2.0, sil2);
      }

      let t3X = targetVec.x + play3TgtX * (1 - silTotal) + tease3Offset.x * teaseWeight;
      let t3Y = targetVec.y + play3TgtY * (1 - silTotal) + tease3Offset.y * teaseWeight;
      let t3Z = targetVec.z + play3TgtZ * (1 - silTotal) + tease3Offset.z * teaseWeight;
      if (sil1 > 0.0005) {
        t3X = THREE.MathUtils.lerp(t3X, 0.15, sil1);
        t3Y = THREE.MathUtils.lerp(t3Y, 0.38, sil1);
        t3Z = THREE.MathUtils.lerp(t3Z, 1.8, sil1);
      }
      if (sil2 > 0.0005) {
        t3X = THREE.MathUtils.lerp(t3X, 0.10, sil2);
        t3Y = THREE.MathUtils.lerp(t3Y, 0.28, sil2);
        t3Z = THREE.MathUtils.lerp(t3Z, 2.0, sil2);
      }

      if (spot3Ref.current) {
        spot3Ref.current.position.set(p3X, p3Y, p3Z);
        spot3Ref.current.intensity = i3;
        spot3Ref.current.updateMatrixWorld();
      }
      if (spot3TargetRef.current) {
        const cursorX = currentCursorRef.current.x * 0.10 * cursorBlend;
        const cursorY = currentCursorRef.current.y * 0.06 * cursorBlend;
        spot3TargetRef.current.position.set(
          t3X + cursorX,
          t3Y + cursorY,
          t3Z
        );
        spot3TargetRef.current.updateMatrixWorld();
      }

      // 4. LIGHT 4: Bottom-Right Corner -> Pendulum Arc -> Lower-Right Leg & Aperture Sector
      // Targets lower-right leg, right pedestal foot, and backlights the triangular aperture
      const i4Base = 38.0 * intensityScale;
      const i4 = i4Base + (p4 * 3.5) * wanderDamp;

      lightPath4.getPoint(cMaster, posVec);
      targetPath4.getPoint(cMaster, targetVec);

      let p4X = posVec.x + play4PosX * (1 - silTotal);
      let p4Y = posVec.y + play4PosY * (1 - silTotal);
      let p4Z = posVec.z + play4PosZ * (1 - silTotal);
      if (sil1 > 0.0005) {
        p4X = THREE.MathUtils.lerp(p4X, 2.0, sil1);
        p4Y = THREE.MathUtils.lerp(p4Y, 0.6, sil1);
        p4Z = THREE.MathUtils.lerp(p4Z, -1.8, sil1);
      }
      if (sil2 > 0.0005) {
        p4X = THREE.MathUtils.lerp(p4X, 1.8, sil2);
        p4Y = THREE.MathUtils.lerp(p4Y, 3.8, sil2);
        p4Z = THREE.MathUtils.lerp(p4Z, -2.0, sil2);
      }

      let t4X = targetVec.x + play4TgtX * (1 - silTotal) + tease4Offset.x * teaseWeight;
      let t4Y = targetVec.y + play4TgtY * (1 - silTotal) + tease4Offset.y * teaseWeight;
      let t4Z = targetVec.z + play4TgtZ * (1 - silTotal) + tease4Offset.z * teaseWeight;
      if (sil1 > 0.0005) {
        t4X = THREE.MathUtils.lerp(t4X, -0.15, sil1);
        t4Y = THREE.MathUtils.lerp(t4Y, 0.38, sil1);
        t4Z = THREE.MathUtils.lerp(t4Z, 1.8, sil1);
      }
      if (sil2 > 0.0005) {
        t4X = THREE.MathUtils.lerp(t4X, -0.10, sil2);
        t4Y = THREE.MathUtils.lerp(t4Y, 0.28, sil2);
        t4Z = THREE.MathUtils.lerp(t4Z, 2.0, sil2);
      }

      if (spot4Ref.current) {
        spot4Ref.current.position.set(p4X, p4Y, p4Z);
        spot4Ref.current.intensity = i4;
        spot4Ref.current.updateMatrixWorld();
      }
      if (spot4TargetRef.current) {
        const cursorX = currentCursorRef.current.x * 0.10 * cursorBlend;
        const cursorY = currentCursorRef.current.y * 0.06 * cursorBlend;
        spot4TargetRef.current.position.set(
          t4X + cursorX,
          t4Y + cursorY,
          t4Z
        );
        spot4TargetRef.current.updateMatrixWorld();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
      floorGeo.dispose();
      floorMat.dispose();
      if (spot1Ref.current?.shadow?.map) spot1Ref.current.shadow.map.dispose();
      if (spot2Ref.current?.shadow?.map) spot2Ref.current.shadow.map.dispose();
      if (spot3Ref.current?.shadow?.map) spot3Ref.current.shadow.map.dispose();
      if (spot4Ref.current?.shadow?.map) spot4Ref.current.shadow.map.dispose();
    };
  }, []);

  // Load Model effect (either custom buffer or default /aidn.glb)
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return;

    const loader = new GLTFLoader();

    const applyModel = (gltf: any, isCustom = false) => {
      const modelGroup = modelGroupRef.current;
      if (!modelGroup) return;

      // Clear previous model children
      while (modelGroup.children.length > 0) {
        const child = modelGroup.children[0] as any;
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
        modelGroup.remove(child);
      }

      const root = gltf.scene || gltf.scenes[0];

      // Compute bounding box to normalize scale and center
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Desired height ~3.1 units in world space
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = maxDim > 0 ? 3.1 / maxDim : 1;

      root.position.x = -center.x * targetScale;
      root.position.y = -center.y * targetScale;
      root.position.z = -center.z * targetScale;
      root.scale.set(targetScale, targetScale, targetScale);

      let totalVertices = 0;
      let totalMeshes = 0;

      // Handle animations if present in gltf
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(root);
        gltf.animations.forEach((clip: THREE.AnimationClip) => {
          mixer.clipAction(clip).play();
        });
        mixerRef.current = mixer;
      }

      // Preserve the user's authentic materials, colors, and textures while enabling shadows
      root.traverse((node: any) => {
        if (node.isMesh) {
          totalMeshes += 1;
          if (node.geometry && node.geometry.attributes && node.geometry.attributes.position) {
            totalVertices += node.geometry.attributes.position.count;
          }
          node.castShadow = true;
          node.receiveShadow = true;

          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((mat: any) => {
              mat.envMapIntensity = 1.0;
              mat.needsUpdate = true;
            });
          }
        }
      });

      modelGroup.add(root);
      isLoadedRef.current = true;
      setLoadError(null);
      if (onModelLoaded) {
        onModelLoaded('AIDN 3D Model', {
          vertices: totalVertices,
          meshes: totalMeshes,
        });
      }
    };

    if (customModelBuffer) {
      try {
        onLoadProgress?.(30);
        loader.parse(
          customModelBuffer,
          '',
          (gltf) => {
            applyModel(gltf, true);
            onLoadProgress?.(100);
            onModelReady?.();
          },
          (err) => {
            console.error('Failed to parse custom GLB buffer', err);
            setLoadError('Failed to parse 3D model.');
          }
        );
      } catch (err) {
        console.error('Error reading custom buffer', err);
      }
    } else {
      const primaryUrl = modelUrl || aidnModelUrl || '/a.glb';

      // Load model with real streaming progress tracking
      (async () => {
        try {
          onLoadProgress?.(0);
          const res = await fetch(primaryUrl);
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);

          const contentLengthHeader = res.headers.get('content-length');
          const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 7230000;
          const reader = res.body?.getReader();

          let buffer: ArrayBuffer;
          if (reader) {
            let receivedBytes = 0;
            const chunks: Uint8Array[] = [];

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              receivedBytes += value.length;
              const percent = Math.min(95, (receivedBytes / totalBytes) * 100);
              onLoadProgress?.(percent);
            }

            const combined = new Uint8Array(receivedBytes);
            let offset = 0;
            for (const chunk of chunks) {
              combined.set(chunk, offset);
              offset += chunk.length;
            }
            buffer = combined.buffer;
          } else {
            buffer = await res.arrayBuffer();
            onLoadProgress?.(95);
          }

          onLoadProgress?.(98);
          loader.parse(
            buffer,
            '',
            (gltf) => {
              applyModel(gltf, false);
              onLoadProgress?.(100);
              onModelReady?.();
            },
            (parseErr) => {
              console.error('Failed to parse GLB:', parseErr);
              setLoadError('Failed to parse 3D model.');
            }
          );
        } catch (fetchErr) {
          console.warn('Streaming fetch failed, falling back to loader.load:', fetchErr);
          loader.load(
            primaryUrl,
            (gltf) => {
              applyModel(gltf, false);
              onLoadProgress?.(100);
              onModelReady?.();
            },
            (xhr) => {
              if (xhr.lengthComputable && xhr.total > 0) {
                const percent = Math.min(96, (xhr.loaded / xhr.total) * 100);
                onLoadProgress?.(percent);
              }
            },
            (err) => {
              console.error('Model load failed:', err);
              setLoadError('Failed to load 3D model.');
            }
          );
        }
      })();
    }
  }, [customModelBuffer, modelUrl]);

  return (
    <div
      ref={mountRef}
      id="hero-3d-stage"
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ touchAction: 'none' }}
    >
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="max-w-md p-6 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-xl text-center pointer-events-auto shadow-2xl">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full border border-sky-500/30 flex items-center justify-center text-sky-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-zinc-200 mb-1">
              AIDN 3D Model
            </h4>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Place <code className="text-sky-400 font-mono bg-zinc-900 px-1 py-0.5 rounded">aidn.glb</code> in the <code className="text-zinc-300 font-mono">public/</code> directory or drop your GLB file onto this window to link it immediately.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
