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
import { summarizeCvFlow, type CvSummarizerInput, type CvSummarizerOutput } from './cv-summarizer';

const GenerateCoverLetterInputSchema = z.object({
  fullName: z.string().describe("The user's full name."),
  userLocation: z.string().describe("The user's location (e.g., city, country)."),
  phone: z.string().optional().describe("The user's phone number."),
  email: z.string().optional().describe("The user's email address."),
  linkedinUrl: z.string().optional().describe("A URL to the user's LinkedIn profile."),
  cvDataUri: z
    .string()
    .describe(
      "The user uploaded CV as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescription: z.string().describe('The full text of the job description.'),
  supportingDocs: z.array(z.string()).optional().describe('List of data URIs for supporting documents.'),
  portfolioUrls: z.array(z.string()).optional().describe('List of URLs to online portfolios or documents.'),
});

export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

const GenerateCoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The generated cover letter for the specified job posting.'),
  jobTitle: z.string().describe('The job title extracted from the job posting.'),
  companyName: z.string().describe('The company name extracted from the job posting.'),
  keyFocusPoints: z.array(z.string()).describe('A list of key skills and qualifications the AI focused on from the job description.'),
});

export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoverLetterPrompt',
  input: {schema: z.object({
    ...GenerateCoverLetterInputSchema.shape,
    cvSummary: z.string().describe("A concise summary of the applicant's CV."),
  })},
  output: {schema: GenerateCoverLetterOutputSchema},
  prompt: `You are an expert career assistant. Your task is to write a compelling and professionally formatted cover letter for a job application. You will also provide analysis of the job posting.

You will be provided with the applicant's personal information, a summary of their CV, the job description text, and optional supporting documents and portfolio URLs.

1.  **Analyze the Job Description:** **It is critical that you ONLY use the provided job description text to extract information. Do NOT use any other sources or prior knowledge.**
    - From the content in \`jobDescription\`, you MUST extract the Job Title and the Company Name.
    - Populate the \`jobTitle\` and \`companyName\` fields in the output with your findings from the text.
    - From the job description text, identify the top 3-5 most important skills or qualifications. Populate the \`keyFocusPoints\` array in the output with these points.

2.  **Format the Header:** Start the cover letter with the applicant's contact information, formatted as follows:
    - Full Name
    - Location
    - Phone Number (if provided)
    - Email Address (if provided)
    - LinkedIn URL (if provided, display as "LinkedIn")
    
    Below the applicant's details, add the Hiring Manager's title (if not available, use "Hiring Manager"), the Company Name you extracted from the job description, and the company location (also from the job description if available).

3.  **Salutation:** Address the letter to the "Hiring Manager".

4.  **Write the Body:**
    - Use the applicant's CV summary, supporting documents, and portfolio URLs to highlight the most relevant skills and experiences that match the \`keyFocusPoints\` you identified from the job description.
    - The cover letter body should be professional, concise, and tailored specifically to the job description provided.

**Applicant Information:**
- Full Name: {{{fullName}}}
- Location: {{{userLocation}}}
{{#if phone}}- Phone: {{{phone}}}{{/if}}
{{#if email}}- Email: {{{email}}}{{/if}}
{{#if linkedinUrl}}- LinkedIn: {{{linkedinUrl}}}{{/if}}

**Applicant's Materials:**
- CV Summary: {{{cvSummary}}}
- Job Description (Use this as the ONLY source for job details): {{{jobDescription}}}
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
    // First, summarize the CV to reduce token count
    const cvSummary = await summarizeCvFlow({ cvDataUri: input.cvDataUri });

    // Then, generate the cover letter using the summary
    const {output} = await prompt({
      ...input,
      cvSummary: cvSummary.summary,
    });
    return output!;
  }
);
