"use client";
import { Button } from "./ui/button";
import { Moon, Sun, Link, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={` z-50 transition-all duration-300 ${
        isScrolled ? "bg-opacity-90 backdrop-blur-md" : "bg-opacity-100"
      }`}
    >
      <div
        className={`flex flex-col transition-all duration-300 ${
          isMenuOpen ? "h-screen" : "h-auto"
        }`}
      >
        {/* Main Header */}
        <div
          className={`
          relative
          flex flex-col md:flex-row 
          justify-between items-center 
          p-4 md:p-6
          bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
          ${isScrolled ? "shadow-lg" : ""}
        `}
        >
          {/* Mobile Menu Button */}
          <button
            className="absolute left-4 top-4 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>

          {/* Logo/Title Section */}
          <div className="w-full md:w-auto flex flex-col md:flex-row items-center justify-center md:justify-start">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center md:text-left mt-8 md:mt-0">
              <span className="block md:inline bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400">
                Complete YouTube Watchtime
              </span>
            </h1>
          </div>

          {/* Actions Section */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a
              href="https://www.tiktok.com/@programmer.sohail"
              className="group flex items-center space-x-2 bg-white/10 rounded-full py-2 px-4 hover:bg-white/20 transition duration-300"
            >
              <span className="text-white font-medium">Programmer Sohail</span>
              <Link className="h-4 w-4 text-yellow-300 group-hover:text-yellow-400 transition-transform group-hover:rotate-12" />
            </a>
            <Button
              onClick={() => setIsDarkMode(!isDarkMode)}
              variant="outline"
              size="icon"
              className={`
                relative overflow-hidden
                bg-white/10 border-white/20
                hover:bg-white/20 hover:border-white/30
                transition-all duration-300
                w-10 h-10 rounded-full
                ${isDarkMode ? "rotate-0" : "rotate-180"}
              `}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-300 animate-spin-slow" />
              ) : (
                <Moon className="h-5 w-5 text-blue-200 animate-pulse" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden flex flex-col items-center p-6 space-y-4 bg-gradient-to-b from-purple-600 to-blue-600 animate-fadeIn">
            <a
              href="#features"
              className="text-white text-lg hover:text-yellow-300 transition"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-white text-lg hover:text-yellow-300 transition"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-white text-lg hover:text-yellow-300 transition"
            >
              Contact
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
