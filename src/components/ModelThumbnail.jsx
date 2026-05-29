import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

export default function ModelThumbnail({ modelUrl, className = '' }) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.15, 3], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <ambientLight intensity={0.65} />
        <hemisphereLight intensity={0.55} color="#ffffff" groundColor="#8b8078" />
        <directionalLight position={[3, 4, 3]} intensity={1.45} />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          <ThumbnailModel modelUrl={modelUrl} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function ThumbnailModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);
  const { invalidate } = useThree();

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return cloneSkeleton(scene);
  }, [scene]);

  const transform = useMemo(() => {
    if (!clonedScene) return { scale: 1, offset: [0, 0, 0] };

    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.55 / maxDim;

    return {
      scale,
      offset: [
        -center.x * scale,
        -center.y * scale,
        -center.z * scale,
      ],
    };
  }, [clonedScene]);

  useEffect(() => {
    if (!clonedScene) return;
    invalidate();
  }, [clonedScene, invalidate]);

  if (!clonedScene) return null;

  return (
    <group
      position={transform.offset}
      scale={transform.scale}
      rotation={[0.25, Math.PI / 5, 0]}
    >
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
}
