import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ModelThumbnail from './ModelThumbnail';
import sacuePocketModel from '../assets/models/sacue-pocket.glb';
import cardBoxModel from '../assets/models/card-box.glb';
import roundContainerModel from '../assets/models/round-container.glb';
import tShirtBlackModel from '../assets/models/t-shirt-black.glb';

const PRESET_PRODUCTS = [
  {
    id: 'sacue-pocket',
    name: 'Sacue Pocket',
    modelUrl: sacuePocketModel,
    description: 'Compact pocket mockup',
    bgColor: '#fff8f5',
  },
  {
    id: 'card-box',
    name: 'Card Box',
    modelUrl: cardBoxModel,
    description: 'Rigid card-style box',
    bgColor: '#f5f8ff',
  },
  {
    id: 'round-container',
    name: 'Round Container',
    modelUrl: roundContainerModel,
    description: 'Cylindrical round container',
    bgColor: '#f5fff8',
  },
  {
    id: 't-shirt-black',
    name: 'T-Shirt (Black)',
    modelUrl: tShirtBlackModel,
    description: 'Classic black tee mockup',
    bgColor: '#fafafa',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const glbInputRef = useRef(null);
  const [customProducts, setCustomProducts] = useState([]);

  const handleGlbUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.glb$/i, '').replace(/[-_]/g, ' ');
    setCustomProducts(prev => [{ id: url, name, modelUrl: url, description: 'Custom uploaded model', bgColor: '#fff5fa' }, ...prev]);
    e.target.value = '';
  };

  const allProducts = [...customProducts, ...PRESET_PRODUCTS];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'linear-gradient(135deg, #fdf6f0 0%, #f5efe6 100%)' }}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-14">
          <span className="inline-block mb-3 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase" style={{ background: '#feeadd', color: '#c05520' }}>
            3D Mockup Editor
          </span>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Pick a Model &amp; <span style={{ color: '#c0623a' }}>Customize It</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Select a preset 3D model or upload your own <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">.glb</code> file to open in the pattern editor.
          </p>

          {/* Upload GLB */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <input ref={glbInputRef} type="file" accept=".glb" className="hidden" onChange={handleGlbUpload} />
            <button
              onClick={() => glbInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all hover:brightness-110 active:scale-95 border-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #c0623a, #e87d4e)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload Custom .glb
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate('/editor', { state: { initialModelUrl: product.modelUrl } })}
              className="group rounded-2xl p-6 cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-white/60 flex flex-col items-center text-center"
              style={{ background: product.bgColor, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-gray-100 transition-transform duration-300 group-hover:scale-105">
                <ModelThumbnail modelUrl={product.modelUrl} className="h-full w-full" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">{product.name}</h2>
              <p className="text-sm text-gray-500 mb-5">{product.description}</p>

              <button
                className="mt-auto px-5 py-2 rounded-xl text-white text-sm font-semibold border-none cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{ background: '#c0623a' }}
              >
                Customize →
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
