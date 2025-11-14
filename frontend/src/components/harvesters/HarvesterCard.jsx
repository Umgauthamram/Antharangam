import React from 'react';
import { Power, PowerOff, Zap, AlertTriangle, Database } from 'lucide-react'; // Import a default icon
import { toast } from 'react-hot-toast';

// We provide a default icon (Database) in case the 'icon' prop is not passed.
export default function HarvesterCard({ icon: Icon = Database, name, description, status, collected, onToggle }) {
  const isRunning = status === 'Active';
  const isWarning = status === 'Setup Required';

  const getStatusIndicator = () => {
    if (isWarning) {
      return (
        <span className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-yellow-200 text-yellow-900">
          <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500" />
          {status}
        </span>
      );
    }
    return (
      <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
        isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        <Zap className={`w-3 h-3 mr-1 ${isRunning ? 'text-green-500' : 'text-gray-500'}`} />
        {isRunning ? 'Active' : 'Stopped'}
      </span>
    );
  };

  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden flex flex-col justify-between border border-primary">
    
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="w-8 h-8 text-peacock-500" />
            <h4 className="text-lg font-semibold text-primary ml-3">{name}</h4>
          </div>
          {getStatusIndicator()}
        </div>
        <p className="text-sm text-secondary mt-3">
          {description}
        </p>
      </div>

      {/* Card Footer */}
      <div className="bg-primary px-6 py-4 flex justify-between items-center">
        <span className="text-sm text-secondary italic">
          {collected} posts this week
        </span>
        {!isWarning && (
          <button
            onClick={onToggle}
            className={`flex items-center px-3 py-1 text-sm font-medium rounded-md ${
              isRunning 
                ? 'text-white bg-red-600 hover:bg-red-700' 
                : 'text-white bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? <PowerOff className="w-4 h-4 mr-1" /> : <Power className="w-4 h-4 mr-1" />}
            {isRunning ? 'Stop' : 'Start'}
          </button>
        )}
        {isWarning && (
           <button 
             onClick={() => toast.error('This harvester requires manual backend setup.')}
             className="flex items-center px-3 py-1 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
           >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Configure
          </button>
        )}
      </div>
    </div>
  );
}