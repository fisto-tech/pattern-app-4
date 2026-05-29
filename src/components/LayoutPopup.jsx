import boxPreview from '../assets/images/box-preview.png';

const layoutItems = Array.from({ length: 16 }, (_, index) => ({
  id: `layout-${index + 1}`,
  image: boxPreview,
}));

export default function LayoutPopup() {
  return (
    <div className="w-[350px] h-fit shrink-0 bg-white rounded-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden flex flex-col">
      <div className="p-5 pb-3">
        <h2 className="text-xl font-bold text-gray-900 m-0">Layout</h2>
      </div>

      <div className="px-5 pb-5 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 gap-3">
          {layoutItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`relative aspect-[1.58] overflow-hidden rounded-lg border-2 bg-gray-50 p-0 cursor-pointer transition-all hover:border-[#fb6c11] hover:shadow-sm ${
                index === 8 ? 'border-[#7c5cff] shadow-[0_0_0_2px_rgba(124,92,255,0.18)]' : 'border-transparent'
              }`}
            >
              <img
                src={item.image}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
