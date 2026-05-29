import sacuePocketModel from '../assets/models/sacue-pocket.glb';
import cardBoxModel from '../assets/models/card-box.glb';
import roundContainerModel from '../assets/models/round-container.glb';
import tShirtBlackModel from '../assets/models/t-shirt-black.glb';

const MODELS = [
  { id: 'sacue-pocket', name: 'Sacue', modelUrl: sacuePocketModel, active: true },
  { id: 'card-box', name: 'Card Box', modelUrl: cardBoxModel, active: false },
  { id: 'round-container', name: 'Round', modelUrl: roundContainerModel, active: false },
  { id: 't-shirt', name: 'T-Shirt', modelUrl: tShirtBlackModel, active: false },
];

export default function ModelsPopup({ onSelectModel, currentModelUrl }) {
  return (
    <div className="w-[350px] h-full shrink-0 bg-white rounded-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Model</h2>
        
        <div className="relative mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search models..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#fb6c11]"
          />
        </div>
      </div>

      <div className="p-5 overflow-y-auto flex-1">
        <h3 className="font-semibold text-gray-900 mb-3">Mockups</h3>
        <div className="grid grid-cols-3 gap-3">
          {MODELS.map((model) => {
            const isActive = currentModelUrl === model.modelUrl;
            return (
              <button 
                key={model.id}
                onClick={() => onSelectModel(model.modelUrl)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden transition-all cursor-pointer border-2 ${
                  isActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c0623a" className="w-8 h-8 opacity-80">
                  <path d="M12 21.5L2.5 16V8L12 2.5L21.5 8V16L12 21.5ZM12 4.7L4.5 9.1V14.9L12 19.3L19.5 14.9V9.1L12 4.7Z" />
                </svg>
                <span className="text-[9px] font-medium text-gray-600 mt-1">{model.name}</span>
                {isActive && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#fb6c11] rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
          {/* Empty placeholders to fill grid */}
          {Array.from({ length: Math.max(0, 6 - MODELS.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl opacity-40" />
          ))}
        </div>
      </div>
    </div>
  );
}
