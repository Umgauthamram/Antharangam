import React from 'react';
import { NavLink } from 'react-router-dom'; 
import {
  LayoutDashboard,  Search, DatabaseZap, Users,
  LogOut, Briefcase, SearchCheck
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Case', icon: Briefcase, path: '/Case' },
  { name: 'Settings', icon: Users, path: '/settings' },

];

export default function Sidebar({ isOpen, setIsOpen, onLogout }) {
  
  const baseClasses = "flex items-center w-full px-6 py-4 mt-2 text-secondary hover:bg-primary hover:text-primary transition-colors duration-200";
  const activeClasses = "bg-peacock-900 text-peacock-100 border-r-4 border-peacock-500";
  
  return (
    <nav
      className={`bg-subtle shadow-lg transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } flex-shrink-0 flex flex-col `}
    >
      <div className="flex items-center justify-center h-20 ">
       
        {isOpen && (
          <span className="ml-2 text-2xl font-bold text-primary">
            Antharangam
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => 
              `${baseClasses} ${!isOpen ? 'justify-center' : ''} ${isActive ? activeClasses : ''}`
            }
          >
            <item.icon className="w-6 h-6" />
            {isOpen && <span className="ml-4 font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </div>

      <div >
        <button onClick={onLogout} className={`${baseClasses} ${!isOpen ? 'justify-center' : ''}`}>
          <LogOut className="w-6 h-6" />
          {isOpen && <span className="ml-4 font-medium">Logout</span>}
        </button>
        
       
      </div>
    </nav>
  );
}
