import fistoLogo from '../assets/images/fisto-logo.png';

const navLinks = ['Home', 'Features', 'Mockups', 'Pricing', 'Contact'];

export default function Navbar({ onTogglePanel }) {
  return (
    <nav className="flex items-center justify-between px-7 py-3.5 bg-white border-b border-gray-100 z-50 shrink-0"
         style={{ minHeight: '52px' }}>
      {/* Logo */}
      <div className="flex items-center">
        <img src={fistoLogo} alt="Fisto Logo" className="h-12 w-auto object-contain" />
      </div>

      {/* Nav Links — hidden on small screens */}
      <ul className="hidden md:flex items-center gap-7 list-none m-0 p-0">
        {navLinks.map((link) => (
          <li key={link}>
            <a
              href={`#${link.toLowerCase()}`}
              className="text-[13px] font-medium text-gray-900 hover:black transition-colors duration-200 no-underline"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle for right panel */}
        <button
          onClick={onTogglePanel}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-800 border-none bg-transparent cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Sign In Button */}
        <button
          className="px-5 py-2 text-[13px] font-semibold text-white rounded-full transition-all duration-200 cursor-pointer border-none hover:shadow-lg hover:brightness-110"
          style={{ background: '#c0623a' }}
        >
          Sign In
        </button>
      </div>
    </nav>
  );
}
