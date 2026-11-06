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
    <header className="bg-paper text-ink sticky top-0 z-50 border-b border-rule">
      <nav className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <span aria-hidden="true" className="inline-block h-3.5 w-3.5 bg-pencil" />
            Math Workbook
          </Link>

          {/* Hamburger Icon */}
          <button
            className="sm:hidden flex flex-col items-center justify-between w-6 h-6 space-y-1"
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span className="block w-full h-0.5 bg-ink"></span>
            <span className="block w-full h-0.5 bg-ink"></span>
            <span className="block w-full h-0.5 bg-ink"></span>
          </button>

          {/* Navbar Links for larger screens */}
          <div className="hidden sm:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="hover:text-pencil">
              Home
            </Link>
            <Link to="/editor" className="hover:text-pencil">
              Editor
            </Link>
            <Link to="/about" className="hover:text-pencil">
              About
            </Link>

            {/* Conditional render based on auth state */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={toggleProfileMenu}
                  className="w-9 h-9 rounded-sm bg-pencil text-white flex items-center justify-center font-mono text-sm hover:bg-pencil-dark transition-colors"
                  aria-label="User profile"
                >
                  {getUserInitials()}
                </button>

                {/* Profile dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-paper rounded-sm border border-rule py-1 z-50">
                    <div className="px-4 py-2 border-b border-rule">
                      <p className="text-sm font-medium text-ink">
                        {user?.username || user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-ink hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hover:text-pencil px-3 py-1.5 border border-ink rounded-sm hover:border-pencil transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu (Hamburger Dropdown) */}
        <div
          className={`sm:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}
          onClick={toggleMenu}
        >
          <div className="flex flex-col space-y-4 py-4 text-sm font-medium">
            <Link
              to="/"
              className="text-center py-2 hover:text-pencil"
            >
              Home
            </Link>
            <Link
              to="/editor"
              className="text-center py-2 hover:text-pencil"
            >
              Editor
            </Link>
            <Link
              to="/about"
              className="text-center py-2 hover:text-pencil"
            >
              About
            </Link>

            {/* Conditional mobile login/profile */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-center py-2 hover:text-pencil"
                >
                  My Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-center py-2 hover:text-pencil"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-center py-2 hover:text-pencil"
              >
                Log in
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
