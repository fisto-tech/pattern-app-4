import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Canvas as R3FCanvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

const packageColors = [
  { id: 'cream', color: '#f5e6d3' },
  { id: 'tan', color: '#c9a96e' },
  { id: 'brown', color: '#8b7355' },
  { id: 'darkbrown', color: '#4a3728' },
  { id: 'green', color: '#4a7c59' },
  { id: 'silver', color: '#d4d4d8' },
];

export default function RightPanel({
  textureCanvasRef,
  textureVersion,
  modelUrl,
  wireframe,
  setWireframe,
  showUv,
  setShowUv,
  bgColor,
  setBgColor,
}) {
  const [openClose, setOpenClose] = useState(75);
  const [activeView, setActiveView] = useState('outside');
  const [selectedColor, setSelectedColor] = useState('cream');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const customColorInputRef = useRef(null);
  const lastColorUpdate = useRef(0);
  const colorTimeoutRef = useRef(null);
  const glCanvasRef = useRef(null);
  const captureRef = useRef(null);

  const handleExportCanvasPNG = () => {
    const canvas = textureCanvasRef?.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'texture-canvas.png';
    a.click();
    setShowExportMenu(false);
  };

  const handleExportModelPNG = () => {
    if (!captureRef.current) return;
    captureRef.current.capture();
    setShowExportMenu(false);
  };

  const handleExportGLB = () => {
    if (!modelUrl || !textureCanvasRef?.current) return;
    setExporting(true);
    setShowExportMenu(false);
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      const scene = gltf.scene;
      const texture = new THREE.CanvasTexture(textureCanvasRef.current);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.needsUpdate = true;
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (mat && 'map' in mat) { mat.map = texture; mat.needsUpdate = true; }
        });
      });
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (glb) => {
          const blob = new Blob([glb], { type: 'model/gltf-binary' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'model-export.glb';
          a.click();
          URL.revokeObjectURL(url);
          setExporting(false);
        },
        (err) => { console.error('GLTFExporter error:', err); setExporting(false); },
        { binary: true }
      );
    }, undefined, () => setExporting(false));
  };

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setSelectedColor('custom');
    
    const now = Date.now();
    if (now - lastColorUpdate.current >= 50) {
      setBgColor(newColor);
      lastColorUpdate.current = now;
    } else {
      clearTimeout(colorTimeoutRef.current);
      colorTimeoutRef.current = setTimeout(() => {
        setBgColor(newColor);
        lastColorUpdate.current = Date.now();
      }, 50);
    }
  };

  return (
    <aside className="
      w-[250px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-y-auto
      max-[1024px]:w-[230px]
      max-[640px]:w-[270px]
    ">
      {/* Save Button */}
      <div className="p-3 pb-1">
        <button
          className="w-full py-2.5 rounded-xl text-white font-bold text-[15px] border-none cursor-pointer transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
          style={{ background: '#c0623a' }}
        >
          Save
        </button>
      </div>

      {/* Export Button + Dropdown */}
      <div className="px-3 pb-2 relative">
        <button
          onClick={() => setShowExportMenu((v) => !v)}
          disabled={exporting}
          className="w-full py-2 rounded-xl font-semibold text-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ borderColor: '#c0623a', color: '#c0623a', background: exporting ? '#fdf0eb' : 'transparent' }}
        >
          {exporting ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Exporting…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export
            </>
          )}
        </button>

        {/* Export dropdown */}
        {showExportMenu && (
          <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.14)] border border-gray-100 overflow-hidden">
            {/* GLB */}
            <button
              onClick={handleExportGLB}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 font-semibold hover:bg-orange-50 transition-colors border-none cursor-pointer bg-transparent text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#c0623a" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </span>
              <div>
                <p className="m-0 leading-tight">Export as .GLB</p>
                <p className="m-0 text-[10px] text-gray-400 font-normal leading-tight mt-0.5">3D model with texture baked in</p>
              </div>
            </button>
            <div className="h-px bg-gray-100 mx-3" />
            {/* Model PNG */}
            <button
              onClick={handleExportModelPNG}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 font-semibold hover:bg-purple-50 transition-colors border-none cursor-pointer bg-transparent text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#7c3aed" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </span>
              <div>
                <p className="m-0 leading-tight">Model as .PNG</p>
                <p className="m-0 text-[10px] text-gray-400 font-normal leading-tight mt-0.5">3D render screenshot with texture</p>
              </div>
            </button>
            <div className="h-px bg-gray-100 mx-3" />
            {/* Canvas PNG */}
            <button
              onClick={handleExportCanvasPNG}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 font-semibold hover:bg-blue-50 transition-colors border-none cursor-pointer bg-transparent text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </span>
              <div>
                <p className="m-0 leading-tight">Canvas as .PNG</p>
                <p className="m-0 text-[10px] text-gray-400 font-normal leading-tight mt-0.5">Flat texture image (2048×2048)</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 2 Controls */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-center gap-4 bg-white border border-gray-100 px-3 py-2 rounded-xl text-[11px] shadow-sm">
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-700">
            <input type="checkbox" checked={showUv} onChange={(e) => setShowUv(e.target.checked)} className="cursor-pointer" />
            Show UV
          </label>
          <div className="w-px h-4 bg-gray-200" />
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-700">
            <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} className="cursor-pointer" />
            Wireframe
          </label>
        </div>
      </div>

      {/* 3D Preview */}
      <div className="px-3 pb-2">
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #c8c0b8, #a8a098)', height: 240 }}
        >
          <R3FCanvas
            className="w-full h-full"
            camera={{ position: [0, 0.2, 3.2], fov: 40 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.25;
              gl.setClearColor(new THREE.Color('#b4aca4'), 1);
            }}
          >
            <ambientLight intensity={1.05} />
            <hemisphereLight intensity={0.75} color="#ffffff" groundColor="#8b8b8b" />
            <directionalLight position={[3, 4, 3]} intensity={1.55} />
            <directionalLight position={[-3, 2, -2]} intensity={0.9} />
            <Environment preset="city" />
            <Suspense fallback={null}>
              {modelUrl && (
                <AutoSizedModel
                  key={modelUrl}
                  modelUrl={modelUrl}
                  textureCanvasRef={textureCanvasRef}
                  textureVersion={textureVersion}
                  wireframe={wireframe}
                />
              )}
            </Suspense>
            <ScreenshotHelper ref={captureRef} />
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
            />
          </R3FCanvas>
          {/* Refresh button */}
          <button className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/70 backdrop-blur-sm border-none cursor-pointer flex items-center justify-center text-gray-500 hover:bg-white transition-colors" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.681.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-.908l.84.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44.908l-.84-.84v1.462a.75.75 0 0 1-1.5 0V9.348a.75.75 0 0 1 .75-.75h3.182a.75.75 0 0 1 0 1.5H3.981l.84.841a4.5 4.5 0 0 0 7.08-.681.75.75 0 0 1 1.025-.274Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Open / Close slider */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Open</span>
          <input
            type="range" min="0" max="100"
            value={openClose}
            onChange={(e) => setOpenClose(Number(e.target.value))}
            className="slider-dark flex-1 cursor-pointer"
          />
          <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Close</span>
        </div>
      </div>

      {/* Outside / Inside toggle */}
      <div className="px-3 pb-3">
        <div className="flex rounded-full p-[3px]" style={{ background: '#f8ddd0' }}>
          {['outside', 'inside'].map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`flex-1 py-[7px] rounded-full text-[11px] font-semibold border-none cursor-pointer transition-all duration-200 ${
                activeView === v
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'bg-transparent text-gray-600'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Package Color */}
      <div className="px-3 pb-3">
        <h3 className="text-[12px] font-semibold text-gray-800 mb-2.5 mt-0">Package Color</h3>
        <div className="flex items-center gap-[6px]">
          {packageColors.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedColor(c.id);
                setBgColor(c.color);
              }}
              className="w-[26px] h-[26px] rounded-full cursor-pointer transition-all duration-200 hover:scale-110 p-0"
              style={{
                background: c.color,
                border: selectedColor === c.id ? '2px solid #c0623a' : '2px solid transparent',
                outline: selectedColor === c.id ? '1px solid #c0623a' : 'none',
                outlineOffset: '1px',
              }}
            />
          ))}
          {/* Add color button */}
          <button
            onClick={() => customColorInputRef.current?.click()}
            className="w-[26px] h-[26px] rounded-full bg-transparent cursor-pointer flex items-center justify-center p-0 transition-all duration-200 hover:scale-110 relative"
            style={{ 
              border: selectedColor === 'custom' ? '2px solid #c0623a' : '1.5px solid #4a9e6e',
              outline: selectedColor === 'custom' ? '1px solid #c0623a' : 'none',
              outlineOffset: '1px',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill={selectedColor === 'custom' ? '#c0623a' : '#4a9e6e'} className="w-3 h-3">
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
            </svg>
            <input 
              type="color" 
              ref={customColorInputRef} 
              onChange={handleCustomColorChange}
              className="absolute opacity-0 w-0 h-0 pointer-events-none" 
            />
          </button>
        </div>
      </div>

      {/* Custom Material */}
      <div className="px-3 pb-3">
        <h3 className="text-[12px] font-semibold text-gray-800 mb-2 mt-0">Custom Material</h3>
        <div className="flex flex-col gap-[6px]">
          <MaterialItem icon="shadow" title="Shadow Effects" subtitle="Hide Shadow" />
          <MaterialItem icon="camera" title="Camera View" subtitle="Front Right" hasArrow />
          <MaterialItem icon="size" title="Custom Size" subtitle="12.4 × 7.5 × 3.4 in" />
        </div>
      </div>
    </aside>
  );
}

function AutoSizedModel({ modelUrl, textureCanvasRef, textureVersion, wireframe }) {
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => {
    if (!scene) return null;

    const clone = cloneSkeleton(scene);
    clone.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      obj.material = Array.isArray(obj.material)
        ? obj.material.map((mat) => mat?.clone())
        : obj.material.clone();
    });
    return clone;
  }, [scene]);
  const canvasTextureRef = useRef(null);
  const appliedTextureVersionRef = useRef(-1);
  const appliedWireframeRef = useRef(null);

  // Compute centering + scale from bounding box
  const [autoTransform, setAutoTransform] = useState({ scale: 1, offset: [0, 0, 0] });

  useEffect(() => {
    if (!clonedScene) return;
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Normalize so the largest dimension is 1.7 units
    const scale = 1.7 / maxDim;
    setAutoTransform({
      scale,
      offset: [
        -center.x * scale,
        -center.y * scale,
        -center.z * scale,
      ],
    });
  }, [clonedScene]);

  // Apply texture + wireframe
  useEffect(() => {
    if (
      textureVersion === appliedTextureVersionRef.current &&
      wireframe === appliedWireframeRef.current
    ) return;
    if (!clonedScene || !textureCanvasRef?.current) return;

    const textureCanvas = textureCanvasRef.current;
    if (!canvasTextureRef.current) {
      const tex = new THREE.CanvasTexture(textureCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.flipY = false;
      tex.needsUpdate = true;
      canvasTextureRef.current = tex;
    } else {
      canvasTextureRef.current.image = textureCanvas;
      canvasTextureRef.current.needsUpdate = true;
    }

    clonedScene.traverse((obj) => {
      if (!obj.isMesh) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (!mat) continue;
        if ('map' in mat) {
          mat.map = canvasTextureRef.current;
          mat.transparent = true;
          mat.needsUpdate = true;
        }
        if ('envMapIntensity' in mat) mat.envMapIntensity = 1.25;
        if ('roughness' in mat) mat.roughness = Math.max(0.18, mat.roughness * 0.82);
        if ('metalness' in mat) mat.metalness = Math.max(0.02, mat.metalness * 0.5);
        if (mat.side !== undefined) { mat.side = THREE.DoubleSide; }
        mat.wireframe = wireframe;
        mat.needsUpdate = true;
      }
    });

    appliedTextureVersionRef.current = textureVersion;
    appliedWireframeRef.current = wireframe;
  }, [clonedScene, textureCanvasRef, textureVersion, wireframe]);

  if (!clonedScene) return null;

  return (
    <group
      position={autoTransform.offset}
      scale={autoTransform.scale}
      rotation={[0, Math.PI / 6, 0]}
    >
      <primitive object={clonedScene} dispose={null} />
    </group>
  );
}

function MaterialItem({ icon, title, subtitle, hasArrow }) {
  const iconBg = { shadow: '#fef3c7', camera: '#fce7f3', size: '#e0e7ff' };
  const iconColor = { shadow: '#d97706', camera: '#db2777', size: '#6366f1' };
  const icons = {
    shadow: <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.75 9.25a.75.75 0 0 0 0 1.5h4.59l-2.1 1.95a.75.75 0 0 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 1 0-1.02 1.1l2.1 1.95H6.75Z" />,
    camera: <path d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    size: <path fillRule="evenodd" d="M1 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V6Zm4 1.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm2 3a4 4 0 0 0-3.665 2.395.75.75 0 0 0 .416 1A8.98 8.98 0 0 0 7 14.5a8.98 8.98 0 0 0 3.249-.605.75.75 0 0 0 .416-1A4 4 0 0 0 7 10.5Z" clipRule="evenodd" />,
  };

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg[icon] }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill={iconColor[icon]} className="w-[16px] h-[16px]">
          {icons[icon]}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-gray-800 m-0 leading-tight">{title}</p>
        <p className="text-[10px] text-gray-400 m-0 leading-tight mt-[2px]">{subtitle}</p>
      </div>
      {hasArrow && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0">
          <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
}

// Lives inside R3FCanvas — uses useThree to access the live renderer, scene, camera
const ScreenshotHelper = forwardRef((_, ref) => {
  const { gl, scene, camera } = useThree();

  useImperativeHandle(ref, () => ({
    capture: () => {
      // Force a fresh render with the current state
      gl.render(scene, camera);
      // Read the framebuffer (preserveDrawingBuffer must be true)
      const url = gl.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model-render.png';
      a.click();
    },
  }));

  return null;
});
