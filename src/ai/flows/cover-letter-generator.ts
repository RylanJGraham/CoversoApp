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
      "The user uploaded CV as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobPostingUrl: z.string().describe('The URL of the job posting.'),
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
  input: {schema: GenerateCoverLetterInputSchema},
  output: {schema: GenerateCoverLetterOutputSchema},
  prompt: `You are an expert career assistant. Your task is to write a compelling and professionally formatted cover letter for a job application. You will also provide analysis of the job posting.

You will be provided with the applicant's personal information, their CV, a link to the job posting, and optional supporting documents and portfolio URLs.

1.  **Analyze the Job Posting:** **Strictly use the provided job posting URL** to extract the Job Title, Company Name, and Company Location. Do not use any other sources.
    - Populate the \`jobTitle\` and \`companyName\` fields in the output with your findings.
    - Identify the top 3-5 most important skills or qualifications from the job description. Populate the \`keyFocusPoints\` array in the output with these points.

2.  **Format the Header:** Start the cover letter with the applicant's contact information, formatted as follows:
    - Full Name
    - Location
    - Phone Number (if provided)
    - Email Address (if provided)
    - LinkedIn URL (if provided, display as "LinkedIn")
    
    Below the applicant's details, add the Hiring Manager's title (if not available, use "Hiring Manager"), the Company Name you extracted, and the Company Location.

3.  **Salutation:** Address the letter to the "Hiring Manager".

4.  **Write the Body:**
    - Use the applicant's CV, supporting documents, and portfolio URLs to highlight the most relevant skills and experiences that match the \`keyFocusPoints\` you identified.
    - The cover letter body should be professional, concise, and tailored specifically to the job posting found at the URL.

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

const normalizeLinkedInUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.endsWith('linkedin.com')) {
      // 1. Remove country-specific subdomains
      urlObj.hostname = 'www.linkedin.com';

      // 2. Find the job ID from the path
      const pathMatch = urlObj.pathname.match(/\/jobs\/view\/(\d+)/);
      if (pathMatch && pathMatch[1]) {
        const jobId = pathMatch[1];
        // 3. Construct canonical URL and remove query params/fragments
        return `https://www.linkedin.com/jobs/view/${jobId}/`;
      }
    }
  } catch (e) {
    // Not a valid URL, return original
    return url;
  }
  // Return original url if it's not a linkedin job url or something is wrong
  return url.split('?')[0].split('#')[0];
};


const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async input => {
    const normalizedUrl = normalizeLinkedInUrl(input.jobPostingUrl);
    const updatedInput = { ...input, jobPostingUrl: normalizedUrl };
    const {output} = await prompt(updatedInput);
    return output!;
  }
);
