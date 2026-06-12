import { useRef, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useDGeneratorStore } from '@/store/dGeneratorStore';
import { styleConfigs } from '@/config/styleConfigs';
import { cn } from '@/lib/utils';

interface FurnitureProps {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  delay?: number;
  onClick?: () => void;
  children: React.ReactNode;
}

function AnimatedGroup({ id, position, rotation, delay = 0, onClick, children }: FurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { autoArranged, selectedFurnitureId, setSelectedFurnitureId } = useDGeneratorStore();
  const isSelected = selectedFurnitureId === id;

  const targetY = position[1];
  const startY = useMemo(() => position[1] + 8 + delay * 0.5, [position, delay]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const current = groupRef.current.position.y;
    const target = autoArranged ? targetY : startY;
    const ease = 1 - Math.pow(0.01, delta * 3);
    groupRef.current.position.y += (target - current) * ease;

    if (isSelected && groupRef.current) {
      const s = 1 + Math.sin(performance.now() * 0.003) * 0.02;
      groupRef.current.scale.setScalar(s);
    }
  });

  useEffect(() => {
    if (groupRef.current && !autoArranged) {
      groupRef.current.position.y = startY;
    }
  }, [autoArranged, startY]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSelectedFurnitureId(isSelected ? null : id);
    onClick?.();
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
    >
      {children}
      {isSelected && (
        <Edges threshold={15} color="#CBA356" scale={1.02} />
      )}
    </group>
  );
}

interface FurnitureMeshProps {
  color: string;
  secondaryColor?: string;
  accentColor?: string;
  roughness?: number;
  metalness?: number;
}

function SofaMesh({ color, secondaryColor, accentColor, roughness = 0.85 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[2.8, 0.4, 1.1]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[-1.1, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.5, 1.1]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[1.1, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.5, 1.1]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[0, 0.55, -0.4]}>
        <boxGeometry args={[2.0, 0.6, 0.3]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[-0.5, 0.55, 0.05]}>
        <boxGeometry args={[0.75, 0.35, 0.8]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness + 0.05} />
      </mesh>
      <mesh castShadow position={[0.5, 0.55, 0.05]}>
        <boxGeometry args={[0.75, 0.35, 0.8]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness + 0.05} />
      </mesh>
      <mesh position={[0, 0.8, -0.15]}>
        <boxGeometry args={[0.08, 0.25, 0.35]} />
        <meshStandardMaterial color={accentColor || '#C4623A'} roughness={0.5} />
      </mesh>
    </group>
  );
}

function CoffeeTableMesh({ color, secondaryColor, roughness = 0.6 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.7]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.18, z]}>
          <boxGeometry args={[0.06, 0.36, 0.06]} />
          <meshStandardMaterial color={secondaryColor || color} roughness={roughness} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial color={secondaryColor || '#555452'} roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

function TVCabinetMesh({ color, secondaryColor, accentColor, roughness = 0.7 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[2.4, 0.5, 0.45]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[-0.7, 0.3, 0.23]}>
        <boxGeometry args={[0.9, 0.38, 0.02]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness + 0.1} />
      </mesh>
      <mesh castShadow position={[0.7, 0.3, 0.23]}>
        <boxGeometry args={[0.9, 0.38, 0.02]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness + 0.1} />
      </mesh>
      <mesh position={[0, 0.31, 0.24]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshStandardMaterial color={accentColor || '#CBA356'} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.2, -0.05]}>
        <boxGeometry args={[1.8, 1.0, 0.08]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, -0.005]}>
        <boxGeometry args={[1.72, 0.94, 0.01]} />
        <meshStandardMaterial color="#2E3F48" roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  );
}

function DiningTableMesh({ color, secondaryColor, roughness = 0.55 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      {[[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.35, z]}>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial color={secondaryColor || color} roughness={roughness} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function ChairMesh({ color, secondaryColor, roughness = 0.75 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.42, 0.05, 0.42]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[0, 0.75, -0.18]}>
        <boxGeometry args={[0.42, 0.55, 0.05]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness} />
      </mesh>
      {[[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color={secondaryColor || '#2A2A2A'} roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function BedMesh({ color, secondaryColor, accentColor, roughness = 0.8 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[2.0, 0.3, 2.2]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.85, 0.2, 2.05]} />
        <meshStandardMaterial color={secondaryColor || '#FAF8F5'} roughness={roughness + 0.1} />
      </mesh>
      <mesh castShadow position={[0, 0.58, 0.6]}>
        <boxGeometry args={[1.7, 0.08, 0.9]} />
        <meshStandardMaterial color={accentColor || secondaryColor || '#E8E4DD'} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.45, 0.62, 0.85]}>
        <boxGeometry args={[0.7, 0.18, 0.4]} />
        <meshStandardMaterial color="#FAF8F5" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.45, 0.62, 0.85]}>
        <boxGeometry args={[0.7, 0.18, 0.4]} />
        <meshStandardMaterial color="#FAF8F5" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.85, -1.0]}>
        <boxGeometry args={[2.0, 1.0, 0.12]} />
        <meshStandardMaterial color={color} roughness={roughness - 0.1} />
      </mesh>
      <mesh position={[0, 0.9, -0.93]}>
        <boxGeometry args={[1.7, 0.5, 0.02]} />
        <meshStandardMaterial color={accentColor || color} roughness={roughness} />
      </mesh>
    </group>
  );
}

function NightstandMesh({ color, secondaryColor, roughness = 0.6 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.55, 0.42]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh position={[0, 0.45, 0.22]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
        <meshStandardMaterial color={secondaryColor || '#CBA356'} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
        <meshStandardMaterial color="#FAF8F5" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#FFF5E6" emissive="#FFD4A3" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function WardrobeMesh({ color, secondaryColor, accentColor, roughness = 0.7 }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[1.8, 2.2, 0.6]} />
        <meshStandardMaterial color={color} roughness={roughness} />
      </mesh>
      <mesh position={[-0.45, 1.1, 0.31]}>
        <boxGeometry args={[0.85, 2.0, 0.02]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness + 0.05} />
      </mesh>
      <mesh position={[0.45, 1.1, 0.31]}>
        <boxGeometry args={[0.85, 2.0, 0.02]} />
        <meshStandardMaterial color={secondaryColor || color} roughness={roughness + 0.05} />
      </mesh>
      {[-0.02, 0.02].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 0.32]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
          <meshStandardMaterial color={accentColor || '#CBA356'} roughness={0.3} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function RugMesh({ color, roughness = 0.95 }: FurnitureMeshProps) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <boxGeometry args={[3.5, 0.02, 2.5]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

function PlantMesh({ color, secondaryColor }: FurnitureMeshProps) {
  return (
    <group>
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.22, 0.17, 0.36, 16]} />
        <meshStandardMaterial color={secondaryColor || '#DE8F69'} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color={color || '#6B8E5A'} roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.7, 0.1]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={color || '#7A9F68'} roughness={0.9} />
      </mesh>
      <mesh position={[-0.12, 0.65, -0.1]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color={color || '#5E8350'} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function FurnitureSet() {
  const { selectedStyle, materials, selectedMaterials, setSelectedFurnitureId } = useDGeneratorStore();
  const styleColors = styleConfigs[selectedStyle];

  const floorMat = materials.floor.find(m => m.id === selectedMaterials.floor);
  const furnitureMat = materials.furniture.find(m => m.id === selectedMaterials.furniture);

  const furnColor = furnitureMat?.color || styleColors.furniture;
  const furnRough = furnitureMat?.roughness ?? 0.7;
  const furnMetal = furnitureMat?.metalness ?? 0;

  void floorMat;
  void setSelectedFurnitureId;

  return (
    <group
      onClick={() => setSelectedFurnitureId(null)}
    >
      <AnimatedGroup id="sofa" position={[-1.5, 0, 1.5]} delay={0}>
        <SofaMesh
          color={furnColor}
          secondaryColor={styleColors.furnitureSecondary}
          accentColor={styleColors.accent}
          roughness={furnRough}
        />
      </AnimatedGroup>

      <AnimatedGroup id="coffee-table" position={[-1.5, 0, -0.2]} delay={1}>
        <CoffeeTableMesh
          color={furnColor}
          secondaryColor={styleColors.furnitureSecondary}
          roughness={furnRough}
          metalness={furnMetal}
        />
      </AnimatedGroup>

      <AnimatedGroup id="tv-cabinet" position={[-1.5, 0, -3.2]} delay={2}>
        <TVCabinetMesh
          color={furnColor}
          secondaryColor={styleColors.furnitureSecondary}
          accentColor={styleColors.accent}
          roughness={furnRough}
        />
      </AnimatedGroup>

      <AnimatedGroup id="rug" position={[-1.5, 0, 0]} delay={0.5}>
        <RugMesh color={styleColors.furnitureSecondary} roughness={0.95} />
      </AnimatedGroup>

      <AnimatedGroup id="dining-table" position={[2.8, 0, 1.2]} delay={3}>
        <DiningTableMesh
          color={furnColor}
          secondaryColor={styleColors.furnitureSecondary}
          roughness={furnRough}
        />
      </AnimatedGroup>

      {[[0, 0.8], [0, -0.8], [1.2, 0.8], [1.2, -0.8]].map((off, i) => (
        <AnimatedGroup
          key={`chair-${i}`}
          id={`chair-${i}`}
          position={[2.2 + off[0] * 0.8, 0, 1.2 + off[1]]}
          rotation={[0, off[1] < 0 ? Math.PI : 0, 0] as any}
          delay={3.5 + i * 0.3}
        >
          <ChairMesh
            color={furnColor}
            secondaryColor={styleColors.furnitureSecondary}
            roughness={furnRough}
          />
        </AnimatedGroup>
      ))}

      <AnimatedGroup id="bed" position={[3, 0, -2.2]} delay={5}>
        <BedMesh
          color={furnColor}
          secondaryColor={styleColors.furnitureSecondary}
          accentColor={styleColors.accent}
          roughness={furnRough}
        />
      </AnimatedGroup>

      <AnimatedGroup id="nightstand" position={[4.2, 0, -1.5]} delay={6}>
        <NightstandMesh
          color={furnColor}
          secondaryColor={styleColors.accent}
          roughness={furnRough}
        />
      </AnimatedGroup>

      <AnimatedGroup id="wardrobe" position={[4.2, 0, -3.4]} delay={7}>
        <WardrobeMesh
          color={furnColor}
          secondaryColor={styleColors.furnitureSecondary}
          accentColor={styleColors.accent}
          roughness={furnRough}
        />
      </AnimatedGroup>

      <AnimatedGroup id="plant-1" position={[-4.2, 0, -3]} delay={4}>
        <PlantMesh
          color="#6B8E5A"
          secondaryColor={styleColors.accent}
        />
      </AnimatedGroup>

      <AnimatedGroup id="plant-2" position={[4.3, 0, 2.8]} delay={4.5}>
        <PlantMesh
          color="#7A9F68"
          secondaryColor={styleColors.accent}
        />
      </AnimatedGroup>
    </group>
  );
}
