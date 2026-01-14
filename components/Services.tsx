
import React from 'react';
import CodeIcon from './icons/CodeIcon';
import MobileIcon from './icons/MobileIcon';
import DesignIcon from './icons/DesignIcon';

const services = [
  {
    icon: <CodeIcon />,
    title: 'Web Development',
    description: 'Creating responsive, fast, and scalable websites and web applications using modern technologies like React, TypeScript, and Node.js.',
  },
  {
    icon: <MobileIcon />,
    title: 'Mobile App Development',
    description: 'Building cross-platform mobile apps for iOS and Android that offer a seamless user experience and robust performance.',
  },
  {
    icon: <DesignIcon />,
    title: 'UI/UX Design',
    description: 'Designing intuitive and beautiful user interfaces. I focus on user-centric design principles to create engaging digital products.',
  },
];

const Services: React.FC = () => {
  return (
    <section className="py-16 sm:py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">What I Do</h2>
        <p className="mt-3 text-lg text-text-secondary">From concept to deployment, I cover the entire development lifecycle.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className="bg-surface p-8 rounded-xl border border-border transform hover:-translate-y-2 transition-transform duration-300">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 text-primary mx-auto mb-6">
              {service.icon}
            </div>
            <h3 className="text-2xl font-semibold text-center text-text-primary mb-3">{service.title}</h3>
            <p className="text-center text-text-secondary">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
