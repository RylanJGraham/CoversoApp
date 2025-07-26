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
  fullName: z.string().describe("The user's full name."),
  userLocation: z.string().describe("The user's location (e.g., city, country)."),
  phone: z.string().optional().describe("The user's phone number."),
  email: z.string().optional().describe("The user's email address."),
  linkedinUrl: z.string().optional().describe("A URL to the user's LinkedIn profile."),
  cvDataUri: z
    .string()
    .describe(
      'The user uploaded CV as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  jobPostingUrl: z.string().describe('The URL of the job posting.'),
  supportingDocs: z.array(z.string()).optional().describe('List of data URIs for supporting documents.'),
  portfolioUrls: z.array(z.string()).optional().describe('List of URLs to online portfolios or documents.'),
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
  prompt: `You are an expert career assistant. Your task is to write a compelling and professionally formatted cover letter for a job application.

You will be provided with the applicant's personal information, their CV, a link to the job posting, and optional supporting documents and portfolio URLs.

1.  **Format the Header:** Start the cover letter with the applicant's contact information, formatted as follows:
    - Full Name
    - Location
    - Phone Number (if provided)
    - Email Address (if provided)
    - LinkedIn URL (if provided, display as "LinkedIn")

2.  **Analyze the Job Posting:** Infer the Hiring Manager's title (if not available, use "Hiring Manager"), the Company Name, and the Company Location from the job posting URL. Format this information below the applicant's details.

3.  **Salutation:** Address the letter to the "Hiring Manager".

4.  **Write the Body:**
    - Analyze the job description from the provided URL to understand the requirements, company culture, and key responsibilities.
    - Use the applicant's CV, supporting documents, and portfolio URLs to highlight the most relevant skills and experiences. Scrape any provided portfolio URLs for additional context.
    - The cover letter body should be professional, concise, and tailored specifically to the job posting.

5.  **Closing:** End with a professional closing (e.g., "Sincerely,").

**Applicant Information:**
- Full Name: {{{fullName}}}
- Location: {{{userLocation}}}
{{#if phone}}- Phone: {{{phone}}}{{/if}}
{{#if email}}- Email: {{{email}}}{{/if}}
{{#if linkedinUrl}}- LinkedIn: {{{linkedinUrl}}}{{/if}}

**Applicant's Materials:**
- CV: {{media url=cvDataUri}}
- Job Posting URL: {{{jobPostingUrl}}}
{{#if supportingDocs}}
- Supporting Documents:
{{#each supportingDocs}}
  - {{media url=this}}
{{/each}}
{{/if}}
{{#if portfolioUrls}}
- Portfolio URLs:
{{#each portfolioUrls}}
  - {{{this}}}
{{/each}}
{{/if}}
`,
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
