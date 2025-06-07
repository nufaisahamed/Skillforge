import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ChevronDown, LogOut } from "lucide-react";

const Header = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (authLoading) {
    return (
      <header className="bg-neutral-900 text-white p-4 shadow-md flex items-center justify-center h-16">
        <p className="text-lg font-medium animate-pulse">
          Loading SkillForge...
        </p>
      </header>
    );
  }

  // Fallback avatar URL (can replace with your preferred image)
  const fallbackAvatar =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(user?.name || "User") +
    "&background=0D8ABC&color=fff&rounded=true";

  return (
    <header className="bg-neutral-950 text-white shadow-md z-50">
      <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="text-3xl sm:text-4xl font-bold tracking-tight text-cyan-400 hover:text-cyan-300 transition duration-200"
        >
          SkillForge
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 mt-4 sm:mt-0 relative">
          {user ? (
            <>
              <Link
                to="/my-courses"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition duration-200 text-sm font-semibold shadow-sm"
              >
                My Courses
              </Link>
              <Link
                to="/storybooks"
                className="text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                Storybooks
              </Link>
              <Link
                to="/jobs"
                className="hover:text-blue-200 transition-colors duration-300 text-lg font-medium"
              >
                Jobs
              </Link>

              {(user.role === "instructor" || user.role === "admin") && (
                <Link
                  to="/instructor/dashboard"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 transition duration-200 text-sm font-semibold shadow-sm"
                >
                  My Teaching
                </Link>
              )}
              {user &&
                (user.role === "instructor" || user.role === "admin") && ( // Condition for Instructor/Admin
                  <Link
                    to="/jobs/my"
                    className="hover:text-blue-200 transition-colors duration-300 text-lg font-medium"
                  >
                    My Posted Jobs
                  </Link>
                )}

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                  aria-expanded={showDropdown}
                  aria-controls="user-dropdown"
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <span>{user.name}</span>
                  <ChevronDown size={16} />
                </button>

                {showDropdown && (
                  <div
                    id="user-dropdown"
                    className="absolute right-0 mt-2 w-72 bg-white text-black rounded-lg shadow-xl z-10 p-4"
                    role="menu"
                    aria-label="User menu"
                  >
                    <div className="flex items-center space-x-4 mb-3">
                      <img
                        src={user.profileImage}
                        alt={`${user.name}'s profile`}
                        className="w-14 h-14 rounded-full object-cover border border-gray-300"
                      />
                      <div>
                        <p className="font-bold text-lg">{user.name}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-gray-700 mt-1">
                            📞{" "}
                            <a
                              href={`tel:${user.phone}`}
                              className="hover:underline"
                            >
                              {user.phone}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {user.bio && (
                      <p className="text-gray-700 text-sm mb-3 italic border-b pb-3">
                        {user.bio}
                      </p>
                    )}

                    <p className="text-sm text-gray-700 capitalize">
                      Role: {user.role}
                    </p>

                    <hr className="my-3" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 text-white bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-400"
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition duration-200 text-sm font-semibold shadow-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition duration-200 text-sm font-semibold shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
