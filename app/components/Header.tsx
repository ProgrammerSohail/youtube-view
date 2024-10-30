"use client";
import { Button } from "./ui/button";
import { Moon, Sun, Link } from "lucide-react";

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <div className="flex justify-between items-center mb-8 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
      <h1 className="text-3xl font-extrabold text-white flex items-center">
        Complete YouTube Watchtime by{" "}
        <a
          href="https://www.tiktok.com/@programmer.sohail?is_from_webapp=1&sender_device=pc"
          className="ml-2 flex items-center text-yellow-300 hover:text-yellow-400 transition duration-300"
        >
          Programmer Sohail <Link className="h-5 w-5 ml-1" />
        </a>
      </h1>
      <Button
        onClick={() => setIsDarkMode(!isDarkMode)}
        variant="outline"
        size="icon"
        className="transition-transform duration-300 transform hover:scale-110"
      >
        {isDarkMode ? (
          <Sun className="h-[1.5rem] w-[1.5rem] text-white" />
        ) : (
          <Moon className="h-[1.5rem] w-[1.5rem] text-black" />
        )}
      </Button>
    </div>
  );
};

export default Header; 