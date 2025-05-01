
import React from 'react';
import { CalendarClock } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  return (
    <header className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarClock className="h-8 w-8 text-seer-600" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">TimeSeer</h1>
            <p className="text-sm text-muted-foreground">Forecast Kit</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <ThemeToggle />
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-sm font-medium text-foreground hover:text-seer-600 transition-colors">Dashboard</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-seer-600 transition-colors">Documentation</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-seer-600 transition-colors">Settings</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
