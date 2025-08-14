
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
  tone: z.string().optional().describe("The desired tone for the cover letter (e.g., 'Professional', 'Enthusiastic')."),
  mustHaveInfo: z.string().optional().describe("Specific information or points that must be included in the cover letter."),
  pageLength: z.number().optional().describe("The desired length of the cover letter in pages (e.g., 0.5 for half a page, 1 for a full page)."),
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
  prompt: `You are an expert career coach and professional writer. Your task is to write a highly compelling, persuasive, and professionally formatted cover letter that makes the applicant stand out. You will also provide a concise analysis of the job posting.

**Primary Goal:** Get the applicant an interview.

**Your Persona:** You are confident, strategic, and an expert in persuasive communication. You understand how to frame a candidate's experience to align perfectly with a job's requirements.

**Process:**

1.  **Job Description Deconstruction:**
    *   **It is critical that you ONLY use the provided job description text to extract information. Do NOT use any other sources or prior knowledge.**
    *   From the content in \`jobDescription\`, you MUST extract the official **Job Title** and the **Company Name**. Populate the \`jobTitle\` and \`companyName\` fields in the output.
    *   Identify the top 3-5 most critical skills, qualifications, or experiences the company is looking for. These are the "pain points" the company wants to solve. Populate the \`keyFocusPoints\` array in the output with these points.

2.  **Cover Letter Structure & Content:**
    *   **Header:** Start with the applicant's contact information, cleanly formatted. Below that, add the date, then the Hiring Manager's title (if not available, use "Hiring Manager"), the extracted Company Name, and the company location (from the job description if available).

    *   **Opening (The Hook):** Start with a strong, engaging opening. Do not use a generic "I am writing to apply..." line. Instead, lead with a powerful statement that immediately connects the applicant's key strength to the company's primary need. For example: "As a data analyst with a proven record of increasing marketing ROI by over 30%, I was immediately drawn to the [Job Title] role and its focus on data-driven growth at [Company Name]."

    *   **Body (The Narrative):** This is the core of the letter.
        *   Do not just list skills. Weave a narrative. For each of the \`keyFocusPoints\` you identified, provide a concrete example or a brief story from the applicant's CV summary or supporting documents that demonstrates their expertise in that area. Use the STAR method (Situation, Task, Action, Result) implicitly.
        *   Directly connect the applicant's experience to the company's goals or projects mentioned in the job description. Show, don't just tell.
        {{#if mustHaveInfo}}
        *   **Crucially, you MUST seamlessly integrate the following key points into the narrative:** {{{mustHaveInfo}}}
        {{/if}}

    *   **Closing (The Call to Action):** End with a confident and proactive closing. Reiterate enthusiasm for the role and the company. Instead of a passive "I look forward to hearing from you," try something more assertive like, "I am eager to discuss how my expertise in [Key Skill] can help your team achieve [Company Goal]."

    *   **Salutation:** Close with "Sincerely," followed by the applicant's full name.

3.  **Tone & Style:**
    {{#if tone}}
    *   Adopt a **{{{tone}}}** tone. This should influence your word choice and sentence structure. For example, a "Confident" tone uses strong action verbs, while a "Personable" tone might be slightly more conversational.
    {{else}}
    *   Default to a **Professional and Confident** tone.
    {{/if}}
    *   Use dynamic, powerful language. Avoid jargon and clichés. Keep sentences clear and concise.

4.  **Formatting & Length:**
    {{#if pageLength}}
    *   Adjust the length and level of detail to fit the desired page length of **{{{pageLength}}}** pages. A shorter letter should be more concise and impactful, while a longer one can include more detailed examples.
    {{else}}
    *   The letter should be approximately one page long.
    {{/if}}


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
