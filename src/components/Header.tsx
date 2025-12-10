import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>

          {/* Logo */}
          <Link to="/" className="font-bold text-lg text-white">
            Isaac Muaco Vlog
          </Link>

          {/* Spacer */}
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
};

export default Header;
