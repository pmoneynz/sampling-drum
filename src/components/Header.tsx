import React from 'react';
import { View } from '../App';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const views: { key: View; label: string }[] = [
    { key: 'pads', label: 'PADS' },
    { key: 'sequencer', label: 'SEQUENCER' },
    { key: 'waveform', label: 'WAVEFORM' },
    { key: 'mixer', label: 'MIXER' }
  ];

  return (
    <header className="bg-mpc-gray border-b border-mpc-light p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-mpc-accent">SAMPLING DRUM</h1>
          <div className="text-sm text-gray-400">v1.0</div>
        </div>
        
        <nav className="flex space-x-1">
          {views.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                currentView === key
                  ? 'bg-mpc-accent text-white'
                  : 'text-gray-300 hover:text-white hover:bg-mpc-light'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
} 