import React from 'react';
import { Search, Moon, Sun, ChevronsRight } from 'lucide-react';

export default function Header({ toggleDarkMode, isDarkMode, isSidebarOpen, setIsSidebarOpen }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-subtle border-b border-primary shadow-md h-20">
      <div className="flex items-center">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-secondary hover:text-primary focus:outline-none"
          >
            <ChevronsRight />
          </button>
        )}
        
        <div className="relative ml-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search cases, users, entities..."
            className="w-full py-2 pl-10 pr-4 text-primary bg-primary border border-primary rounded-lg focus:outline-none focus:bg-primary focus:border-peacock-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-secondary rounded-full hover:bg-primary focus:outline-none"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
        
        <div className="relative">
          <img
            className="w-10 h-10 rounded-full object-cover"
            src="https://placehold.co/100x100/0d9488/white?text=ID"
            alt="Investigator Avatar"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
      </div>
    </header>
  );
}