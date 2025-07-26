'use server';

/**
 * @fileOverview Cover Letter Generation AI agent.
 *
 * - generateCoverLetter - A function that generates a cover letter.
 * - GenerateCoverLetterInput - The input type for the generateCoverLetter function.
 * - GenerateCoverLetterOutput - The return type for the generateCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCoverLetterInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      'The user uploaded CV as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  jobPostingUrl: z.string().describe('The URL of the job posting.'),
  supportingDocs: z.array(z.string()).optional().describe('List of data URIs for supporting documents.'),
});

export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The generated cover letter for the specified job posting.'),
});

export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: {schema: GenerateCoverLetterInputSchema},
  output: {schema: GenerateCoverLetterOutputSchema},
  prompt: `You are an expert career assistant. Your task is to write a compelling cover letter for a job application.

You will be provided with the applicant's CV, a link to the job posting, and optional supporting documents.

Analyze the job description from the provided URL to understand the requirements, company culture, and key responsibilities.
Use the CV and supporting documents to highlight the applicant's most relevant skills and experiences.

The cover letter should be professional, concise, and tailored specifically to the job posting.

CV: {{media url=cvDataUri}}
Job Posting URL: {{{jobPostingUrl}}}
Supporting Documents: {{#each supportingDocs}}{{media url=this}}\n{{/each}}`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
