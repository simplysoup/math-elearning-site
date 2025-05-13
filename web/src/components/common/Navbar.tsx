import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white text-black sticky top-0 shadow-x3">
      <nav className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-semibold">
            Math Learning Site
          </Link>

          {/* Hamburger Icon */}
          <button
            className="sm:hidden flex flex-col items-center justify-between w-6 h-6 space-y-1"
            onClick={toggleMenu}
          >
            <span className="block w-full h-1 bg-black"></span>
            <span className="block w-full h-1 bg-black"></span>
            <span className="block w-full h-1 bg-black"></span>
          </button>

          {/* Navbar Links for larger screens */}
          <div className="hidden sm:flex space-x-6">
            <Link to="/" className="hover:text-yellow-500">
              Home
            </Link>
            <Link to="/courses" className="hover:text-yellow-500">
              Courses
            </Link>
            <Link to="/about" className="hover:text-yellow-500">
              About
            </Link>
            {/* Login Link */}
            <Link to="/login" className="hover:text-yellow-500">
              Login
            </Link>
          </div>
        </div>

        {/* Mobile Menu (Hamburger Dropdown) */}
        <div
          className={`sm:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
          onClick={toggleMenu}
        >
          <div className="flex flex-col space-y-4 py-4">
            <Link
              to="/"
              className="text-xl text-center py-2 hover:text-yellow-500"
            >
              Home
            </Link>
            <Link
              to="/courses"
              className="text-xl text-center py-2 hover:text-yellow-500"
            >
              Courses
            </Link>
            <Link
              to="/forums"
              className="text-xl text-center py-2 hover:text-yellow-500"
            >
              Forums
            </Link>
            <Link
              to="/about"
              className="text-xl text-center py-2 hover:text-yellow-500"
            >
              About
            </Link>
            {/* Login Link */}
            <Link
              to="/login"
              className="text-xl text-center py-2 hover:text-yellow-500"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
