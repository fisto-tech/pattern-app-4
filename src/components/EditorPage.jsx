import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import Canvas from './Canvas';
import RightPanel from './RightPanel';
import ModelsPopup from './ModelsPopup';
import UploadsPopup from './UploadsPopup';
import LayoutPopup from './LayoutPopup';

export default function EditorPage() {
  const location = useLocation();
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const textureCanvasRef = useRef(null);
  const [textureVersion, setTextureVersion] = useState(0);

  const [activeTab, setActiveTab] = useState('edit');
  const [uploadedImages, setUploadedImages] = useState([]);
  const canvasRef = useRef(null);

  const [modelUrl, setModelUrl] = useState(location.state?.initialModelUrl || null);
  const [wireframe, setWireframe] = useState(false);
  const [showUv, setShowUv] = useState(true);
  const [bgColor, setBgColor] = useState('#ffffff');

  useEffect(() => {
    if (location.state?.initialModelUrl) {
      setModelUrl(location.state.initialModelUrl);
    }
  }, [location.state]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* Top Navbar */}
      <Navbar onTogglePanel={() => setShowMobilePanel(!showMobilePanel)} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden bg-[#f5efe6]">
        
        {/* Sidebar Container */}
        <div className="flex z-20 h-full py-6 pl-6 pr-0 transition-all duration-300">
          <LeftSidebar active={activeTab} setActive={setActiveTab} />
          
          {/* Render Popups based on activeTab */}
          <div className={`transition-all duration-300 overflow-hidden shrink-0 ${activeTab !== 'edit' ? 'w-[350px] ml-4' : 'w-0 ml-0'}`}>
            {activeTab === 'models' && (
              <ModelsPopup 
                onSelectModel={(url) => { setModelUrl(url); setActiveTab('edit'); }} 
                currentModelUrl={modelUrl}
              />
            )}
            {activeTab === 'uploads' && (
              <UploadsPopup 
                onUpload={(file, url) => {
                  if (!uploadedImages.includes(url)) {
                    setUploadedImages(prev => [url, ...prev]);
                  }
                  canvasRef.current?.uploadImage(url);
                }} 
                uploadedImages={uploadedImages} 
              />
            )}
            {activeTab === 'layout' && (
              <LayoutPopup />
            )}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          <Canvas
            ref={canvasRef}
            textureCanvasRef={textureCanvasRef}
            onTextureUpdated={() => setTextureVersion((v) => v + 1)}
            modelUrl={modelUrl}
            setModelUrl={setModelUrl}
            showUv={showUv}
            bgColor={bgColor}
          />
        </div>

        {/* Right Panel — hidden on mobile, shown via toggle */}
        <div className={`
          shrink-0
          lg:relative lg:block
          ${showMobilePanel
            ? 'absolute inset-y-0 right-0 z-40 block'
            : 'hidden lg:block'
          }
        `}>
          <RightPanel
            canvasRef={canvasRef}
            textureCanvasRef={textureCanvasRef}
            textureVersion={textureVersion}
            modelUrl={modelUrl}
            wireframe={wireframe}
            setWireframe={setWireframe}
            showUv={showUv}
            setShowUv={setShowUv}
            bgColor={bgColor}
            setBgColor={setBgColor}
          />
        </div>

        {/* Mobile overlay backdrop */}
        {showMobilePanel && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setShowMobilePanel(false)}
          />
        )}
      </div>
    </div>
  );
}
