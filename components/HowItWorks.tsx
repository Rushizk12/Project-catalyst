
import React from 'react';

const steps = [
  {
    number: '01',
    title: 'Submit Your Idea',
    description: 'Fill out the project form below with as much detail as possible. Use our AI analyzer for instant feedback!',
  },
  {
    number: '02',
    title: 'Receive a Quote',
    description: 'I will review your submission and get back to you within 48 hours with a detailed proposal and a project quote.',
  },
  {
    number: '03',
    title: 'Development Kick-off',
    description: 'Once the proposal is approved, we will kick off the project, with regular updates and milestone checks.',
  },
    {
    number: '04',
    title: 'Launch & Support',
    description: 'After final approval, your project goes live! I provide ongoing support to ensure everything runs smoothly.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-16 sm:py-20">
       <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">My Process</h2>
        <p className="mt-3 text-lg text-text-secondary">A clear and transparent process to bring your project to life.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step) => (
          <div key={step.number} className="relative p-8 bg-surface rounded-xl border border-border">
            <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 text-6xl font-black text-primary/30 z-0">
              {step.number}
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-text-primary mb-3">{step.title}</h3>
              <p className="text-text-secondary">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
