
export interface ProjectFormData {
  name: string;
  email: string;
  phoneNumber: string;
  collegeName: string;
  address: string;
  projectTitle: string;
  projectDescription: string;
  projectType: 'web' | 'mobile' | 'design' | 'other' | 'hardware';
  budget: string;
}

export interface AIAnalysis {
  summary: string;
  category: 'Web Development' | 'Mobile App Development' | 'UI/UX Design' | 'Other'|'Hardware';
  estimatedComplexity: 'Low' | 'Medium' | 'High';
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
