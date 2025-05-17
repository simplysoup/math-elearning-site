import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"; // Adjust the import path as needed

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth(); // Get auth state from context
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!isProfileMenuOpen);
  };

  // Function to get initials from user's name or email
  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.username) {
      const names = user.username.split(' ');
      return names.map(name => name[0]).join('').toUpperCase();
    }
    
    return user.email[0].toUpperCase();
  };

  return (
    <header className="bg-white text-black sticky top-0 shadow-x3 z-50">
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
          <div className="hidden sm:flex items-center space-x-6">
            <Link to="/" className="hover:text-yellow-500">
              Home
            </Link>
            <Link to="/editor" className="hover:text-yellow-500">
              Editor
            </Link>
            <Link to="/about" className="hover:text-yellow-500">
              About
            </Link>
            
            {/* Conditional render based on auth state */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"
                  aria-label="User profile"
                >
                  {getUserInitials()}
                </button>
                
                {/* Profile dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        {user?.username || user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hover:text-yellow-500 px-3 py-1 border border-yellow-500 rounded hover:bg-yellow-50 transition-colors"
              >
                Login
              </Link>
            )}
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
            
            {/* Conditional mobile login/profile */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-xl text-center py-2 hover:text-yellow-500"
                >
                  My Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-xl text-center py-2 hover:text-yellow-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-xl text-center py-2 hover:text-yellow-500"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      {/* Click outside to close profile menu */}
      {isProfileMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setProfileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Navbar;