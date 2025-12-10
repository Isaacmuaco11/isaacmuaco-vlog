import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-foreground/5">
      <div className="px-5 md:px-20 py-5 md:py-6">
        <div className="flex items-center justify-center">
          {/* Logo */}
          <Link to="/" className="font-serif text-2xl md:text-3xl font-bold italic">
            Isaac Muaco Vlog
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
