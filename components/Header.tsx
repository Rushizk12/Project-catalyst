
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-border">
          <div className="flex items-center space-x-2">
             <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V4m0 16v-2M8 12a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
            <span className="text-2xl font-bold text-text-primary">Project Catalyst</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
