import { z } from 'zod';
import { Type } from '@google/genai';

export const AnalyzeBody = z.object({
  description: z.string().min(10),
});

export const ChatBody = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string().min(1),
    }),
  ),
});

export const SubmitBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().min(1),
  collegeName: z.string().min(1),
  address: z.string().min(1),
  projectTitle: z.string().min(1),
  projectDescription: z.string().min(10),
  projectType: z.enum(['web', 'mobile', 'design', 'other', 'hardware']),
  budget: z.string().min(1),
  aiAnalysis: z
    .object({
      summary: z.string(),
      category: z.string(),
      estimatedComplexity: z.enum(['Low', 'Medium', 'High']),
    })
    .nullable()
    .optional(),
});

export const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    category: { type: Type.STRING },
    estimatedComplexity: {
      type: Type.STRING,
      enum: ['Low', 'Medium', 'High'],
    },
  },
  required: ['summary', 'category', 'estimatedComplexity'],
};
