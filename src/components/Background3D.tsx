import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, Cloud, Sparkles, Trail, MeshDistortMaterial, MeshWobbleMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';

type TreeType = 'oak' | 'pine' | 'bush';
type Season = 'summer' | 'autumn' | 'spring';

// --- Space Components ---

function BlackHole() {
  const diskRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (diskRef.current) {
      diskRef.current.rotation.z -= 0.005;
    }
    if (glowRef.current) {
      glowRef.current.rotation.z -= 0.002;
    }
  });

  return (
    <group position={[15, 10, -20]} rotation={[0.4, -0.2, 0]} scale={[1.2, 1.2, 1.2]}>
       {/* Event Horizon (The Black Hole) */}
       <mesh>
         <sphereGeometry args={[2, 64, 64]} />
         <meshBasicMaterial color="#000000" />
       </mesh>
       
       {/* Accretion Disk - Main Bright Ring */}
       <mesh ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
         <torusGeometry args={[3.5, 0.8, 2, 100]} />
         <meshBasicMaterial color="#fb923c" side={THREE.DoubleSide} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
       </mesh>
       
       {/* Outer Glow / Lensing */}
       <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
         <ringGeometry args={[2.1, 6, 64]} />
         <meshBasicMaterial color="#c2410c" side={THREE.DoubleSide} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
       </mesh>

       {/* Vertical Lensing Ring (Interstellar effect) */}
       <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[3.6, 0.1, 16, 100]} />
          <meshBasicMaterial color="#fdba74" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
       </mesh>
    </group>
  );
}

function Comet() {
  const ref = useRef<THREE.Group>(null);
  const speed = useRef(0.8 + Math.random() * 0.5);
  // Start high up and far back
  const startPos = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 60,
    30 + Math.random() * 20,
    -30 + Math.random() * 20
  ));

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      // Move diagonally down-left across the screen
      const progress = (t * speed.current) % 100;
      ref.current.position.x = startPos.current.x - progress * 0.8;
      ref.current.position.y = startPos.current.y - progress * 0.8;
      ref.current.position.z = startPos.current.z + progress * 0.2;
      
      // Reset if too far
      if (ref.current.position.y < -50) {
         // Loop logic handled by modulo mostly, but this keeps it clean
      }
    }
  });

  return (
    <group ref={ref} position={startPos.current}>
      <Trail width={3} length={12} color="#ffffff" attenuation={(t) => t * t}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </Trail>
      {/* Glow head */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// --- Atmosphere Component ---
function FresnelAtmosphere({ color, scale = 1.2, opacity = 0.6 }: { color: string, scale?: number, opacity?: number }) {
  return (
    <mesh scale={[scale, scale, scale]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          glowColor: { value: new THREE.Color(color) },
          opacity: { value: opacity },
        }}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 glowColor;
          uniform float opacity;
          varying vec3 vNormal;
          void main() {
            // Calculate intensity based on the angle between the normal and the view direction (0,0,1 in view space)
            float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
            gl_FragColor = vec4(glowColor, intensity * opacity);
          }
        `}
      />
    </mesh>
  );
}

// --- Interactive Planet Wrapper ---
function InteractivePlanet({ 
  children, 
  name, 
  description 
}: { 
  children: React.ReactNode | ((props: { isDragging: boolean, isActive: boolean }) => React.ReactNode),
  name?: string,
  description?: string
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerMove = (e: any) => {
    if (isDragging && groupRef.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      groupRef.current.rotation.y += deltaX * 0.01;
      groupRef.current.rotation.x += deltaY * 0.01;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    setIsActive(!isActive);
  };

  // Global pointer up listener to catch releases outside the mesh
  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = isActive ? 1.2 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group 
      ref={groupRef} 
      onPointerDown={handlePointerDown} 
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      {typeof children === 'function' ? children({ isDragging, isActive }) : children}
      
      {isActive && name && (
        <Html position={[0, 5, 0]} center distanceFactor={15} zIndexRange={[100, 0]}>
          <div className="pointer-events-none select-none text-center min-w-[150px]">
            <div className="bg-black/60 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-white shadow-xl">
              <h3 className="font-bold text-sm uppercase tracking-wider text-blue-300 mb-1">{name}</h3>
              {description && <p className="text-xs text-white/80 font-light">{description}</p>}
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/60 mx-auto mt-[-1px]"></div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ... (Existing components: BlackHole, Comet) ...

function MainPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
    if (moonRef.current) {
      const t = clock.getElapsedTime() * 0.5;
      moonRef.current.rotation.y = t;
    }
  });

  return (
    <InteractivePlanet name="Kepler-186f" description="Habitable Zone Exoplanet">
      {({ isDragging, isActive }) => (
        <group position={[-6, 4, -12]}>
          <Float 
            speed={2} 
            rotationIntensity={isDragging ? 0 : 0.2} 
            floatIntensity={isDragging ? 0 : 2} 
            floatingRange={[-0.5, 0.5]}
          >
            {/* Main Planet - Perfect Sphere */}
            <mesh ref={meshRef}>
              <sphereGeometry args={[4, 64, 64]} />
              <meshStandardMaterial
                color={isActive ? "#3b82f6" : "#2563eb"} // Brighter when active
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>
            
            {/* Atmosphere Glow */}
            <FresnelAtmosphere color="#60a5fa" scale={1.2} opacity={0.6} />
            
            {/* Orbiting Moon Container */}
            <group ref={moonRef}>
              {/* Moon positioned at radius 7 from center */}
              <mesh position={[7, 0, 0]}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
              </mesh>
            </group>
          </Float>
        </group>
      )}
    </InteractivePlanet>
  );
}

// ... (Other planets wrapped similarly if desired, or just MainPlanet) ...

function IcePlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= 0.005;
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.3) * 0.15;
    }
  });
  return (
    <InteractivePlanet name="Gliese 436 b" description="Ice Giant">
      <Float speed={2} rotationIntensity={1.2} floatIntensity={1}>
        <group position={[8, -25, -35]}>
          <mesh ref={meshRef}>
            <sphereGeometry args={[3, 64, 64]} />
            <meshPhysicalMaterial 
              color="#a5f3fc" 
              roughness={0.1} 
              metalness={0.1} 
              transmission={0.2} // Slight transparency for ice
              thickness={2}
            />
          </mesh>
          {/* Ice Rings */}
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <ringGeometry args={[3.5, 5, 64]} />
            <meshStandardMaterial color="#cffafe" side={THREE.DoubleSide} transparent opacity={0.4} />
          </mesh>
          {/* Atmosphere/Glow */}
          <FresnelAtmosphere color="#e0f2fe" scale={1.15} opacity={0.5} />
          {/* Sparkles for ice crystals */}
          <Sparkles count={30} scale={8} size={2} speed={0.4} opacity={0.6} color="#ffffff" />
        </group>
      </Float>
    </InteractivePlanet>
  );
}

function RedPlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003;
  });
  return (
    <InteractivePlanet name="Proxima Centauri b" description="Red Dwarf Planet">
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[-10, -15, -25]}>
          <mesh ref={meshRef}>
            <sphereGeometry args={[2.5, 64, 64]} />
            {/* Wobble for heat haze / active surface */}
            <MeshWobbleMaterial 
              color="#ef4444" 
              roughness={0.7} 
              metalness={0.1} 
              factor={0.05} 
              speed={1} 
            />
          </mesh>
          <FresnelAtmosphere color="#fca5a5" scale={1.2} opacity={0.4} />
        </group>
      </Float>
    </InteractivePlanet>
  );
}

function PurplePlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.002;
  });
  return (
    <InteractivePlanet name="55 Cancri e" description="Super Earth">
      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={0.8}>
        <group position={[12, -45, -50]}>
          <mesh ref={meshRef}>
            <sphereGeometry args={[4, 64, 64]} />
            <MeshDistortMaterial 
              color="#8b5cf6" 
              roughness={0.5} 
              metalness={0.6} 
              distort={0.2} 
              speed={2} 
            />
          </mesh>
          <FresnelAtmosphere color="#c4b5fd" scale={1.2} opacity={0.5} />
        </group>
      </Float>
    </InteractivePlanet>
  );
}

function OrangePlanet() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y -= 0.003;
  });
  return (
    <InteractivePlanet name="TRAPPIST-1d" description="Dwarf Star Planet">
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.6}>
        <group position={[-15, -60, -70]}>
          <mesh ref={meshRef}>
            <sphereGeometry args={[5, 64, 64]} />
            <meshStandardMaterial color="#f97316" roughness={0.8} metalness={0.2} />
          </mesh>
          <FresnelAtmosphere color="#fdba74" scale={1.15} opacity={0.4} />
        </group>
      </Float>
    </InteractivePlanet>
  );
}


// --- Nature / Earth Components ---

function Bird({ position, speed = 1, offset = 0 }: { position: [number, number, number], speed?: number, offset?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * speed + offset;
      groupRef.current.position.x = position[0] + Math.sin(t) * 8;
      groupRef.current.position.z = position[2] + Math.cos(t) * 3;
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 1;
      groupRef.current.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t));
      groupRef.current.rotation.z = Math.sin(t) * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh rotation={[0, 0, Math.PI / 4]} position={[0.2, 0, 0]}>
        <boxGeometry args={[0.4, 0.05, 0.1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 4]} position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.4, 0.05, 0.1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function DetailedTree({ position, scale = 1, type = 'pine', season = 'summer' }: { position: [number, number, number], scale?: number, type?: TreeType, season?: Season }) {
  
  const foliageColor = useMemo(() => {
    if (type === 'pine') return '#166534'; // Always dark green for pine
    
    // Oak/Bush colors
    switch(season) {
      case 'autumn': return Math.random() > 0.5 ? '#d97706' : '#b45309'; // Orange/Brown
      case 'spring': return '#16a34a'; // Green-600 (Much darker/richer green)
      default: return '#15803d'; // Standard green
    }
  }, [type, season]);


  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      {type !== 'bush' && (
        <mesh position={[0, type === 'pine' ? 1.5 : 1, 0]}>
          <cylinderGeometry args={[0.2, 0.4, type === 'pine' ? 3 : 2, 8]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
        </mesh>
      )}

      {/* Foliage */}
      {type === 'pine' ? (
        <>
          <mesh position={[0, 3, 0]}>
            <coneGeometry args={[2, 2.5, 8]} />
            <meshStandardMaterial color={foliageColor} roughness={0.8} />
          </mesh>
          <mesh position={[0, 4.5, 0]}>
            <coneGeometry args={[1.5, 2, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 5.8, 0]}>
            <coneGeometry args={[1, 1.5, 8]} />
            <meshStandardMaterial color="#22c55e" roughness={0.8} />
          </mesh>
        </>
      ) : type === 'oak' ? (
        // Oak-style (spherical clusters)
        <group position={[0, 2.5, 0]}>
           <mesh position={[0, 0, 0]}>
             <dodecahedronGeometry args={[1.5, 0]} />
             <meshStandardMaterial color={foliageColor} roughness={0.8} />
           </mesh>
           <mesh position={[0.8, 0.5, 0.5]} scale={0.7}>
             <dodecahedronGeometry args={[1.5, 0]} />
             <meshStandardMaterial color={foliageColor} roughness={0.8} />
           </mesh>
           <mesh position={[-0.8, 0.2, -0.5]} scale={0.8}>
             <dodecahedronGeometry args={[1.5, 0]} />
             <meshStandardMaterial color={foliageColor} roughness={0.8} />
           </mesh>
        </group>
      ) : (
        // Bush style
        <group position={[0, 0.5, 0]}>
           <mesh position={[0, 0, 0]}>
             <dodecahedronGeometry args={[1, 0]} />
             <meshStandardMaterial color={foliageColor} roughness={0.8} />
           </mesh>
           <mesh position={[0.6, -0.2, 0.4]} scale={0.8}>
             <dodecahedronGeometry args={[1, 0]} />
             <meshStandardMaterial color={foliageColor} roughness={0.8} />
           </mesh>
           <mesh position={[-0.5, -0.1, -0.4]} scale={0.9}>
             <dodecahedronGeometry args={[1, 0]} />
             <meshStandardMaterial color={foliageColor} roughness={0.8} />
           </mesh>
        </group>
      )}
    </group>
  );
}

function EarthSphere() {
  // A smaller sphere to represent a "Tiny Planet" effect
  const vertexShader = `
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vPosition = modelPosition.xyz;
      
      // Calculate world normal
      vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      
      // Simple noise for terrain variation
      float elevation = sin(modelPosition.x * 0.2) * sin(modelPosition.z * 0.2) * 0.5;
      modelPosition.y += elevation;
      vElevation = elevation;
      
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      // Mix colors: Water (Blue) -> Sand (Yellow) -> Grass (Green)
      vec3 waterColor = vec3(0.0, 0.3, 0.7); // Deeper blue
      vec3 sandColor = vec3(0.9, 0.8, 0.6);
      vec3 grassColorA = vec3(0.05, 0.4, 0.15);
      vec3 grassColorB = vec3(0.2, 0.7, 0.3);
      
      // Create "continents" using noise-like pattern
      float noise = sin(vPosition.x * 0.1) * sin(vPosition.z * 0.1) * sin(vPosition.y * 0.1);
      // Add detail
      noise += sin(vPosition.x * 0.5) * sin(vPosition.z * 0.5) * 0.1;
      
      vec3 finalColor;
      
      if (noise < -0.2) {
        finalColor = waterColor; // Ocean
      } else if (noise < -0.1) {
        finalColor = sandColor; // Beach
      } else {
        // Grass variation
        float mixStrength = (vElevation + 0.5) * 0.8;
        finalColor = mix(grassColorA, grassColorB, mixStrength);
      }

      // --- Atmosphere & Lighting Enhancements ---
      
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      vec3 normal = normalize(vNormal);
      
      // 1. Atmosphere Glow (Fresnel)
      float fresnel = dot(viewDirection, normal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 2.5);
      
      vec3 atmosphereColor = vec3(0.4, 0.7, 1.0);
      finalColor = mix(finalColor, atmosphereColor, fresnel * 0.5);

      // 2. Specular Highlight (Water only)
      if (noise < -0.2) {
         vec3 lightDir = normalize(vec3(5.0, 10.0, 5.0));
         vec3 reflectDir = reflect(-lightDir, normal);
         float spec = pow(max(dot(viewDirection, reflectDir), 0.0), 32.0);
         finalColor += vec3(1.0) * spec * 0.6;
      }
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return (
    <group position={[0, -170, -10]}>
      <mesh rotation={[0, 0, 0]}>
        {/* Reduced radius from 80 to 40 for a smaller "tiny planet" look */}
        <sphereGeometry args={[40, 128, 128]} />
        <shaderMaterial 
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer Atmosphere Glow */}
      <mesh scale={[42, 42, 42]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#4fa1ff" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Stronger Rim Light via FresnelAtmosphere component if needed, but meshBasicMaterial above gives a nice volumetric haze */}
      <FresnelAtmosphere color="#60a5fa" scale={43} opacity={0.4} />
    </group>
  );
}

function Trees() {
  const count = 40; // Reduced tree count for smaller planet
  const trees = useMemo(() => {
    const items = [];
    for (let i = 0; i < count; i++) {
      // Spawn trees on the top surface of the smaller sphere
      // Sphere center is at [0, -170, -10], Radius is 40.
      // Top surface is around Y = -130.
      
      // We want them scattered around the very top "cap" of the sphere
      const angle = Math.random() * Math.PI * 2;
      // Smaller radius for tree spread to keep them on the "island"
      const r = Math.random() * 15; 
      
      const x = Math.sin(angle) * r;
      const z = -10 + Math.cos(angle) * r; // Offset by sphere Z position
      
      // Height adjustment: Top of sphere is at -130 (center Y + radius)
      // We need to place them slightly lower as we move away from center (curvature)
      // Simple approximation: y = -130 - (distance from center)^2 / (2 * radius)
      const dist = Math.sqrt(x*x + (z+10)*(z+10));
      const y = -130 - (dist * dist) / (2 * 40);

      const rand = Math.random();
      const type: TreeType = rand > 0.7 ? 'oak' : rand > 0.4 ? 'pine' : 'bush';
      const season: Season = Math.random() > 0.7 ? 'autumn' : 'summer';
      items.push({ pos: [x, y, z] as [number, number, number], scale: 0.6 + Math.random() * 0.6, type, season });
    }
    return items;
  }, []);

  return (
    <group>
      {trees.map((tree, i) => (
        <DetailedTree 
          key={i} 
          position={tree.pos} 
          scale={tree.scale} 
          type={tree.type}
          season={tree.season}
        />
      ))}
    </group>
  );
}

// --- Controller ---

function SceneController() {
  useFrame(({ camera, scene, clock, pointer }) => {
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollY / (maxScroll * 0.9), 0), 1);

    // Parallax Effect
    const parallaxX = pointer.x * 1.5;
    const parallaxY = pointer.y * 1.5;

    // Camera Movement
    // Start at Y=0 (Space), End at Y=-115 (Earth Level)
    const targetY = THREE.MathUtils.lerp(0, -115, progress);
    const targetZ = THREE.MathUtils.lerp(15, 5, progress);
    
    // Apply parallax to target position
    const finalTargetX = parallaxX;
    const finalTargetY = targetY + parallaxY;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, finalTargetX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, finalTargetY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);

    // Background Color Transition
    const spaceColor = new THREE.Color("#020617");
    // Keep it dark/night-like even near Earth
    const earthNightColor = new THREE.Color("#0f172a"); // Dark slate blue/night sky
    
    const colorProgress = THREE.MathUtils.smoothstep(progress, 0.6, 1.0);
    
    // Transition from deep space black to a slightly lighter night sky
    const currentColor = spaceColor.lerp(earthNightColor, colorProgress);
    
    scene.background = currentColor;
    
    // Dynamic Volumetric Fog
    if (scene.fog) {
      const fog = scene.fog as THREE.Fog;
      fog.color = currentColor;
      
      // As we get closer to earth (progress -> 1), fog gets denser and closer
      // Simulating entering atmosphere but keeping it dark/mysterious
      const targetNear = THREE.MathUtils.lerp(10, 5, colorProgress);
      const targetFar = THREE.MathUtils.lerp(100, 60, colorProgress);
      
      // Add some subtle breathing to the fog
      const time = clock.getElapsedTime();
      const breath = Math.sin(time * 0.5) * 2;

      fog.near = THREE.MathUtils.lerp(fog.near, targetNear, 0.1);
      fog.far = THREE.MathUtils.lerp(fog.far, targetFar + breath, 0.1);
    }
  });
  return null;
}

function Fireflies() {
  const count = 50;
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 100,
        -110 + Math.random() * 10,
        -20 + (Math.random() - 0.5) * 50
      ]);
    }
    return pos;
  }, []);

  return (
    <group>
      {positions.map((pos, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={0} floatIntensity={2}>
          <mesh position={pos as [number, number, number]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Satellite() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.2;
      // Orbit path
      groupRef.current.position.x = Math.sin(t) * 25;
      groupRef.current.position.z = Math.cos(t) * 10 - 10;
      groupRef.current.position.y = Math.cos(t * 0.5) * 5 + 10;
      
      // Rotation
      groupRef.current.rotation.y += 0.01;
      groupRef.current.rotation.z = Math.sin(t) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Body */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Solar Panels */}
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}


function Spaceship({ onClick }: { onClick?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      
      // Base movement (figure 8)
      const x = Math.sin(t * 0.5) * 8;
      const y = Math.cos(t * 0.3) * 4;
      const z = Math.sin(t * 0.4) * 5 + 5; // Move in/out

      // Mouse influence
      const targetX = x + mousePos.x * 5;
      const targetY = y + mousePos.y * 5;
      
      // Smooth follow
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, z, 0.05);

      // Rotation based on movement
      groupRef.current.rotation.z = -mousePos.x * 0.5;
      groupRef.current.rotation.x = mousePos.y * 0.5;
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Spaceship Model */}
      <group rotation={[0, Math.PI, 0]} scale={hovered ? 0.6 : 0.5}>
        {/* Call to Action Prompt */}
        <Html position={[0, 4, 0]} center distanceFactor={15}>
          <div className="pointer-events-none select-none flex flex-col items-center gap-1">
            <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-sm text-[8px] text-cyan-300 font-mono animate-pulse whitespace-nowrap uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              [ INTERACT_TO_WARP ]
            </div>
            <div className="w-px h-6 bg-gradient-to-b from-cyan-500/50 to-transparent" />
          </div>
        </Html>
        {/* Main Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1, 4, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Cockpit */}
        <mesh position={[0, 0.5, 0.8]}>
          <capsuleGeometry args={[0.4, 1, 4, 8]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Wings */}
        <mesh position={[1.5, -1, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[2, 0.2, 1.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
        </mesh>
        <mesh position={[-1.5, -1, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[2, 0.2, 1.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} />
        </mesh>
        {/* Engines */}
        <mesh position={[1, -1.5, 0.5]}>
          <cylinderGeometry args={[0.3, 0.5, 1.5, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[-1, -1.5, 0.5]}>
          <cylinderGeometry args={[0.3, 0.5, 1.5, 8]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Engine Glow */}
        <mesh position={[1, -2.3, 0.5]}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
        <mesh position={[-1, -2.3, 0.5]}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
        {/* Trail */}
        <Trail width={2} length={8} color="#0ea5e9" attenuation={(t) => t * t}>
           <mesh position={[0, -2, 0]}>
             <sphereGeometry args={[0.1]} />
             <meshBasicMaterial color="transparent" opacity={0} />
           </mesh>
        </Trail>
      </group>
    </group>
  );
}

function Rain() {
  const count = 1000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for(let i = 0; i < count; i++) {
      const speed = 0.5 + Math.random() * 0.5;
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      const y = Math.random() * 100;
      temp.push({ x, y, z, speed });
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      particle.y -= particle.speed * 2; // Fall down
      if (particle.y < 0) {
        particle.y = 100; // Reset to top
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.set(1, 1 + Math.random() * 2, 1);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} position={[0, 20, 0]}>
      <boxGeometry args={[0.05, 1.5, 0.05]} />
      <meshBasicMaterial color="#a5f3fc" transparent opacity={0.3} />
    </instancedMesh>
  );
}


export default function Background3D({ onSpaceshipClick }: { onSpaceshipClick?: () => void }) {
  return (
    <>
      <div className="fixed inset-0 -z-10">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} />
          <SceneController />
          <ambientLight intensity={0.6} />
          <pointLight position={[20, 50, 20]} intensity={1.5} color="#ffffff" />
          
          {/* Space Elements */}
          <group>
            <BlackHole />
            <Comet />
            <Comet />
            <Comet />
            <Comet />
            <MainPlanet />
            <RedPlanet />
            <IcePlanet />
            <PurplePlanet />
            <OrangePlanet />
            <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={200} scale={30} size={2} speed={0.4} opacity={0.5} color="#ffffff" />
            
            <Satellite />
          </group>

          {/* Earth Elements */}
          <group>
            <Trees />
            <EarthSphere />
            <Fireflies />
            
            {/* Clouds - More layers for depth */}
            {/* High altitude clouds for atmosphere entry */}
            <Cloud position={[0, -80, -20]} opacity={0.1} speed={0.4} segments={10} color="#bfdbfe" />
            
            <Cloud position={[-15, -105, -40]} opacity={0.5} speed={0.2} segments={20} color="#ffffff" />
            <Cloud position={[15, -100, -45]} opacity={0.5} speed={0.2} segments={20} color="#ffffff" />
            <Cloud position={[0, -95, -35]} opacity={0.3} speed={0.1} segments={20} color="#ffffff" />
            {/* Low lying mist */}
            <Cloud position={[0, -118, -30]} opacity={0.2} speed={0.05} segments={10} color="#e0f2fe" />

            {/* Birds */}
            <Bird position={[0, -105, -20]} speed={1.2} />
            <Bird position={[5, -102, -25]} speed={1.1} offset={1} />
            <Bird position={[-5, -108, -22]} speed={1.3} offset={2} />
            <Bird position={[10, -100, -30]} speed={1.0} offset={3} />
          </group>

          <fog attach="fog" args={['#020617', 10, 100]} />
        </Canvas>
      </div>
      
      {/* Foreground Overlay Canvas for Spaceship and Falling Star */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <Canvas 
          style={{ pointerEvents: 'none' }} 
          eventSource={typeof document !== 'undefined' ? document.body : undefined}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 15]} />
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Spaceship onClick={onSpaceshipClick} />
        </Canvas>
      </div>
    </>
  );
}
