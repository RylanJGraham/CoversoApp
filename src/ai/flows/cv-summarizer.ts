'use server';

/**
 * @fileOverview A flow for summarizing a CV.
 *
 * - summarizeCvFlow - A function that takes a CV and returns a summary.
 * - CvSummarizerInput - The input type for the summarizeCvFlow function.
 * - CvSummarizerOutput - The return type for the summarizeCvFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CvSummarizerInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      'The user uploaded CV, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type CvSummarizerInput = z.infer<typeof CvSummarizerInputSchema>;


const CvSummarizerOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key information from the CV, including skills, work experience, and education.'),
});
export type CvSummarizerOutput = z.infer<typeof CvSummarizerOutputSchema>;


const prompt = ai.definePrompt({
  name: 'summarizeCvPrompt',
  input: {schema: CvSummarizerInputSchema},
  output: {schema: CvSummarizerOutputSchema},
  prompt: `You are an expert CV analyst. Your task is to extract the most important information from a CV and provide a concise summary.

Focus on the following key areas:
- Core skills and technical abilities
- A brief overview of work experience, including job titles and key responsibilities
- Education and qualifications

The summary should be brief and contain only the most relevant information for a job application.

CV to summarize:
{{media url=cvDataUri}}
`,
});

export const summarizeCvFlow: (input: CvSummarizerInput) => Promise<CvSummarizerOutput> = ai.defineFlow(
  {
    name: 'summarizeCvFlow',
    inputSchema: CvSummarizerInputSchema,
    outputSchema: CvSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
