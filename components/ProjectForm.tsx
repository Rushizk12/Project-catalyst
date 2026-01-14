
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { ProjectFormData, AIAnalysis } from '../types';
import { analyzeProjectDescription, submitProject } from '../services/geminiService';
import AiSparkleIcon from './icons/AiSparkleIcon';

const initialFormData: ProjectFormData = {
  name: '',
  email: '',
  phoneNumber: '',
  collegeName: '',
  address: '',
  projectTitle: '',
  projectDescription: '',
  projectType: 'web',
  budget: '5000',
};

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Define inner components inside the file but outside the main component
const FormInput: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}> = ({ id, label, type = 'text', value, onChange, placeholder, required = true }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
    <input
      type={type}
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-background border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition"
    />
  </div>
);

const FormTextarea: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}> = ({ id, label, value, onChange, placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
    <textarea
      id={id}
      name={id}
      rows={8}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="w-full bg-background border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition"
    />
  </div>
);

const ProjectForm: React.FC = () => {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyzeClick = async () => {
    if (!formData.projectDescription) {
      setAnalysisError("Please provide a project description to analyze.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeProjectDescription(formData.projectDescription);
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitProject({ ...formData, aiAnalysis: analysisResult });
      setIsSubmitting(false);
      setSubmitSuccess(true);
    } catch (error) {
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : 'Submission failed');
    }
  };
  
  if (submitSuccess) {
    return (
        <section className="py-16 sm:py-20 text-center">
            <div className="max-w-3xl mx-auto bg-surface border border-border rounded-xl p-8 md:p-12">
                <svg className="mx-auto h-16 w-16 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-6 text-3xl font-bold text-text-primary">Thank You!</h2>
                <p className="mt-4 text-lg text-text-secondary">
                    Your project has been submitted successfully. I'll review the details and get back to you at <span className="font-semibold text-primary">{formData.email}</span> within the next 48 hours.
                </p>
            </div>
        </section>
    );
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">Let's Get Started</h2>
        <p className="mt-3 text-lg text-text-secondary">Fill out the form below, and I'll get back to you with a quote.</p>
      </div>
      <div className="mt-12 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-8 rounded-xl border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput id="name" label="Your Name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
            <FormInput id="email" label="Your Email" type="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput id="phoneNumber" label="Phone Number" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+91 98765 43210" />
            <FormInput id="collegeName" label="College Name" value={formData.collegeName} onChange={handleInputChange} placeholder="e.g., IIT Delhi" />
          </div>
          <FormInput id="address" label="Address" value={formData.address} onChange={handleInputChange} placeholder="e.g., 123 Main Street, New Delhi" />
          <FormInput id="projectTitle" label="Project Title" value={formData.projectTitle} onChange={handleInputChange} placeholder="e.g., E-commerce Platform for Books" />
          
          <div>
            <FormTextarea id="projectDescription" label="Project Description" value={formData.projectDescription} onChange={handleInputChange} placeholder="Describe your project in detail. What are the key features? Who is the target audience?" />
            <div className="mt-2 text-right">
              <button type="button" onClick={handleAnalyzeClick} disabled={isAnalyzing} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-secondary disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AiSparkleIcon className="mr-2"/>
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
            {analysisError && <p className="mt-2 text-sm text-red-500">{analysisError}</p>}
            {analysisResult && (
              <div className="mt-4 p-4 bg-background border border-border rounded-lg">
                <h4 className="text-lg font-semibold text-text-primary flex items-center"><AiSparkleIcon className="text-secondary mr-2"/> AI Analysis</h4>
                <div className="mt-2 space-y-2 text-text-secondary">
                  <p><strong>Summary:</strong> {analysisResult.summary}</p>
                  <p><strong>Suggested Category:</strong> {analysisResult.category}</p>
                  <p><strong>Estimated Complexity:</strong> {analysisResult.estimatedComplexity}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-text-secondary mb-1">Project Type</label>
              <select id="projectType" name="projectType" value={formData.projectType} onChange={handleInputChange} required className="w-full bg-background border border-border rounded-lg p-3 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary transition">
                <option value="" disabled>Select a type</option>
                <option value="web">Web Development</option>
                <option value="mobile">Mobile App Development</option>
                <option value="design">UI/UX Design</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-text-secondary mb-1">Estimated Budget: {formatINR(Number(formData.budget))}</label>
              <input type="range" id="budget" name="budget" min="2000" max="15000" step="500" value={formData.budget} onChange={handleInputChange} className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
          </div>
          
          <div>
             <button type="submit" disabled={isSubmitting || isAnalyzing} className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-primary-hover transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg shadow-primary/30 disabled:bg-gray-600 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center">
              {isSubmitting ? (
                 <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
              ) : 'Submit Project'}
            </button>
            {submitError && <p className="mt-4 text-center text-sm text-red-500">{submitError}</p>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default ProjectForm;
