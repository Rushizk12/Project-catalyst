
import React from 'react';

interface HeroProps {
  onGetStartedClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStartedClick }) => {
  return (
    <section className="text-center py-20 sm:py-28">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
        Turn Your Vision into Reality...
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-text-secondary">
         Have a project idea? I build high-quality, modern web and mobile applications tailored to your needs. Let's build something amazing together.
      </p>
      <div className="mt-8 flex justify-center">
        <button
          onClick={onGetStartedClick}
          className="bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-primary-hover transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg shadow-primary/30"
        >
          Submit Your Project
        </button>
      </div>
    </section>
  );
};

export default Hero;
