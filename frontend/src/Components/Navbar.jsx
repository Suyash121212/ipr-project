import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Scale,
  Copyright,
  FileText,
  Palette,
  Gavel,
  FileCheck,
  User,
  LogOut,
} from "lucide-react";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/clerk-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const services = [
  { name: "Patents", href: "/patentservice", icon: FileText },
  { name: "Trademarks", href: "/trademarkservices", icon: Scale },
  { name: "Copyrights", href: "/copyrightservices", icon: Copyright },
  { name: "Industrial Design", href: "/industrialdesignservices", icon: Palette },
  { name: "IP Litigation", href: "/iplitigationpage", icon: Gavel },
  { name: "separator", href: "", icon: null },
  { name: "Patent Filing Process", href: "/patentGuide", icon: FileText },
  { name: "Copyright Filing Process", href: "/copyrightGuide", icon: Copyright },
  { name: "Filing Requirements", href: "/requirements", icon: FileCheck },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [isOpen, setIsOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);

  // BUG FIX 1: Lazy initializer prevents crashes if localStorage is unavailable
  // (e.g., SSR, private browsing restrictions, or browser extensions blocking it)
  const [theme] = useState(() => {
    try {
      return localStorage.getItem("theme") || "light";
    } catch {
      return "light";
    }
  });

  // Apply theme class on mount only (theme toggle removed — class still applied
  // so existing dark-mode Tailwind classes in the rest of the app keep working)
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);


  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".user-dropdown")) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Early return is AFTER all hooks — this was already correct in the original
  if (
    location.pathname === "/dashboard" ||
    location.pathname === "/admin-dashboard"
  )
    return null;


  const handleNavigation = (path) => {
    setIsOpen(false);
    setShowUserDropdown(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserDropdown(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.services-dropdown')) {
        setShowServicesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 bg-transparent"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link
            to="/"
            className="flex items-center space-x-2 group"
            onClick={() => {
              setIsOpen(false);
              setShowUserDropdown(false);
            }}
          >
            <div className="relative">
              {/* <Scale className="h-8 w-8 text-teal-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 ease-out" /> */}
              <img
                src="/weblogo.png"
                alt="Logo"
                className="h-28 w-28 mt-8 object-contain"
              />
              <div className="absolute inset-0 bg-teal-600/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 ease-out"></div>
            </div>
            {/* <span className="font-playfair text-xl font-bold bg-gradient-to-r from-gray-900 via-teal-700 to-gray-900 dark:from-white dark:via-teal-400 dark:to-white bg-clip-text text-transparent">
              IPSecure Legal
            </span> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="relative text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-all duration-300 group"
              onClick={() => {
                setIsOpen(false);
                setShowUserDropdown(false);
              }}
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* Services Dropdown — state-based so it doesn't flicker on un-hover */}
            <div className="relative services-dropdown">
              <button
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-all duration-300"
                onClick={() => setShowServicesDropdown(!showServicesDropdown)}
              >
                <span>Services</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showServicesDropdown ? "rotate-180" : ""}`} />
              </button>

              {showServicesDropdown && (
                <div className="absolute bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl rounded-xl mt-3 w-64 z-20 border border-gray-200/50 dark:border-gray-600/50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2">
                    {services.map((service) =>
                      service.name === "separator" ? (
                        <div key="separator" className="border-t border-gray-200 dark:border-gray-600 my-2" />
                      ) : (
                        <Link
                          key={service.name}
                          to={service.href}
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 transition-all duration-200 group/item transform hover:scale-[1.02]"
                          onClick={() => {
                            setIsOpen(false);
                            setShowServicesDropdown(false);
                            setShowUserDropdown(false);
                          }}
                        >
                          <service.icon className="h-4 w-4 text-teal-600 group-hover/item:scale-110 transition-transform duration-200" />
                          <span className="group-hover/item:text-teal-600 transition-colors duration-200">
                            {service.name}
                          </span>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {["About", "Insights", "Contact"].map((label) => (
              <Link
                key={label}
                to={`/${label.toLowerCase()}`}
                className="relative text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-all duration-300 group"
                onClick={() => {
                  setIsOpen(false);
                  setShowUserDropdown(false);
                }}
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}

            {/* Profile / Login */}
            <SignedOut>
              <Link
                to="/login"
                className="relative text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-all duration-300 group"
                onClick={() => setIsOpen(false)}
              >
                Login
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-teal-600 to-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-teal-600 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {isLoaded && user
                      ? user.firstName?.charAt(0) ||
                      user.emailAddresses[0]?.emailAddress?.charAt(0) ||
                      "U"
                      : "U"}
                  </div>
                  <span className="hidden lg:block">Profile</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180 duration-300" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-3 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-2">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {isLoaded && user ? user.firstName || "User" : "Loading..."}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {isLoaded && user?.emailAddresses[0]?.emailAddress}
                        </p>
                      </div>
                      <button
                        onClick={() => handleNavigation("/dashboard")}
                        className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 transition-all duration-200"
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </SignedIn>

            {/* Theme toggle removed */}

            <SignedOut>
              <Link
                to="/login"
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-teal-500/25 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu Button — theme toggle removed */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="h-10 w-10 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-300 flex items-center justify-center backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-4 duration-300 rounded-b-2xl mx-4 mb-4 shadow-xl">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link
                to="/"
                className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>

              <div className="px-4 py-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Services
                </span>
                <div className="ml-4 mt-2 space-y-1">
                  {services.map(
                    (service) =>
                      service.name !== "separator" && (
                        <Link
                          key={service.name}
                          to={service.href}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-all duration-200"
                          onClick={() => setIsOpen(false)}
                        >
                          <service.icon className="h-4 w-4" />
                          <span>{service.name}</span>
                        </Link>
                      )
                  )}
                </div>
              </div>

              {["About", "Insights", "Contact"].map((label) => (
                <Link
                  key={label}
                  to={`/${label.toLowerCase()}`}
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {label}
                </Link>
              ))}

              <SignedOut>
                <Link
                  to="/login"
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="block text-center bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-300 mt-4 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </SignedOut>

              <SignedIn>
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {isLoaded && user ? user.firstName || "User" : "Loading..."}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {isLoaded && user?.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNavigation("/dashboard")}
                    className="w-full text-left px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:text-teal-600 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}