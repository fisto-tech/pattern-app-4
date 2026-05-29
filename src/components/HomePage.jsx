import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import sacuePocketModel from '../assets/models/sacue-pocket.glb';
import cardBoxModel from '../assets/models/card-box.glb';
import roundContainerModel from '../assets/models/round-container.glb';
import tShirtBlackModel from '../assets/models/t-shirt-black.glb';

const MODEL_ICONS = {
  box: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c0623a" className="w-12 h-12 opacity-80">
      <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z" />
      <path d="M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z" />
      <path d="M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
    </svg>
  ),
  bottle: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c0623a" className="w-12 h-12 opacity-80">
      <path fillRule="evenodd" d="M10.5 3.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.75h.75a.75.75 0 0 1 .625.334l2.25 3.5A.75.75 0 0 1 17 9H7a.75.75 0 0 1-.625-1.166l2.25-3.5A.75.75 0 0 1 9.25 4.5H10.5v-.75ZM7.5 10.5a.75.75 0 0 0-.75.75v8.25a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5v-8.25a.75.75 0 0 0-.75-.75h-9Z" clipRule="evenodd" />
    </svg>
  ),
  shirt: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c0623a" className="w-12 h-12 opacity-80">
      <path d="M16.5 6.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18 8.25a6 6 0 1 0-12 0v2.625a.75.75 0 0 0 .75.75h10.5a.75.75 0 0 0 .75-.75V8.25Z" />
      <path fillRule="evenodd" d="M1.5 8.25a.75.75 0 0 1 .75-.75h3.75v2.625A2.25 2.25 0 0 1 3.75 12.375H2.25a.75.75 0 0 1-.75-.75V8.25ZM22.5 8.25a.75.75 0 0 0-.75-.75h-3.75v2.625a2.25 2.25 0 0 0 2.25 2.25h1.5a.75.75 0 0 0 .75-.75V8.25ZM6 13.5v7.5h12v-7.5H6Z" clipRule="evenodd" />
    </svg>
  ),
  generic: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c0623a" className="w-12 h-12 opacity-80">
      <path d="M12 21.5L2.5 16V8L12 2.5L21.5 8V16L12 21.5ZM12 4.7L4.5 9.1V14.9L12 19.3L19.5 14.9V9.1L12 4.7Z" />
    </svg>
  ),
};

const PRESET_PRODUCTS = [
  {
    id: 'sacue-pocket',
    name: 'Sacue Pocket',
    modelUrl: sacuePocketModel,
    description: 'Compact pocket mockup',
    bgColor: '#fff8f5',
    icon: 'generic',
  },
  {
    id: 'card-box',
    name: 'Card Box',
    modelUrl: cardBoxModel,
    description: 'Rigid card-style box',
    bgColor: '#f5f8ff',
    icon: 'box',
  },
  {
    id: 'round-container',
    name: 'Round Container',
    modelUrl: roundContainerModel,
    description: 'Cylindrical round container',
    bgColor: '#f5fff8',
    icon: 'bottle',
  },
  {
    id: 't-shirt-black',
    name: 'T-Shirt (Black)',
    modelUrl: tShirtBlackModel,
    description: 'Classic black tee mockup',
    bgColor: '#fafafa',
    icon: 'shirt',
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
    setCustomProducts(prev => [{ id: url, name, modelUrl: url, description: 'Custom uploaded model', bgColor: '#fff5fa', icon: 'generic' }, ...prev]);
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
                {MODEL_ICONS[product.icon] || MODEL_ICONS.generic}
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
