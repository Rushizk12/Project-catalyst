
import React, { useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import ProjectForm from './components/ProjectForm';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-background text-text-primary font-sans metallic-gradient">
      <div className="pointer-events-none absolute inset-0 grid-overlay"></div>
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Hero onGetStartedClick={scrollToForm} />
        <Services />
        <HowItWorks />
        <div ref={formRef}>
          <ProjectForm />
        </div>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default App;
