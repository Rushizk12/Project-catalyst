
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface mt-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 border-t border-border text-center text-text-secondary">
          <p>&copy; {currentYear} Project Catalyst </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
