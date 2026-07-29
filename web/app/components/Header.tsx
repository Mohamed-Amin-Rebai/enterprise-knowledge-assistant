"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { Home , Brain, BrainCircuit, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const goToApp = () => router.push("/app");
  const goToSignin = () => router.push("/sign-in");
  const goToSignup = () => router.push("/sign-up");
  const goToHome = () => router.push("/");

  const isActive = (route: string) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  };

  // Show loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <header className="sticky top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 bg-white/90 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <BrainCircuit className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Enterprise Knowledge Assistant
            </span>
          </div>
          <div className="w-24 h-9 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header
      className={`
        sticky top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 
        backdrop-blur-xl transition-all duration-300
        ${isScrolled 
          ? "bg-white/95 shadow-lg border-b border-gray-200/50" 
          : "bg-white/90 border-b border-gray-200/30"
        }
      `}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">

        {/* LOGO */}
        <div 
          onClick={goToHome}
          className="flex items-center gap-2.5 cursor-pointer group flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30 group-hover:shadow-violet-500/40 group-hover:scale-105 transition-all duration-300">
            <BrainCircuit className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-300 hidden sm:block">
            Enterprise Knowledge Assistant
          </span>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-300 sm:hidden">
            EKA
          </span>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {!isSignedIn ? (
            <>
              <button
                onClick={goToSignin}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 transition-all duration-200"
              >
                Login
              </button>
              <button
                onClick={goToSignup}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 transition-all duration-300"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {/* HOME */}
              <button
                onClick={goToHome}
                className={`
                  group flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200
                  ${isActive("/")
                    ? "bg-indigo-50/80 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-200/50"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  }
                `}
              >
                <Home size={16} className={`
                  ${isActive("/") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}
                  transition-colors duration-200
                `} />
                <span>Home</span>
              </button>

              {/* Knowledge Base */}
              <button
                onClick={goToApp}
                className={`
                  group flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-200
                  ${isActive("/app")
                    ? "bg-indigo-50/80 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-200/50"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                  }
                `}
              >
                <Brain size={16} className={`
                  ${isActive("/app") ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}
                  transition-colors duration-200
                `} />
                <span>Knowledge Base</span>
                {isActive("/app") && (
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full ml-0.5 animate-pulse" />
                )}
              </button>

              {/* DIVIDER */}
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

              {/* USER */}
              <div className="flex items-center p-1 rounded-lg hover:bg-gray-100/80 transition-colors duration-200">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100/80 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg py-4 px-4">
          <div className="flex flex-col gap-2">
            {!isSignedIn ? (
              <>
                <button
                  onClick={goToSignin}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 transition-all duration-200 text-left"
                >
                  Login
                </button>
                <button
                  onClick={goToSignup}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goToHome}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive("/")
                      ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                    }
                  `}
                >
                  <Brain size={18} />
                  <span>Home</span>
                </button>
                <button
                  onClick={goToApp}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive("/app")
                      ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                    }
                  `}
                >
                  <Brain size={18} />
                  <span>Knowledge Base</span>
                  {isActive("/app") && (
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full ml-auto" />
                  )}
                </button>
                <div className="border-t border-gray-200/50 my-2" />
                <div className="flex items-center gap-3 px-4 py-2">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                  />
                  <span className="text-sm text-gray-600">Profile</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}