'use server';

/**
 * @fileOverview CV tailoring AI agent.
 *
 * - tailorCvToPlatform - A function that tailors a CV to a specific platform.
 * - TailorCvToPlatformInput - The input type for the tailorCvToPlatform function.
 * - TailorCvToPlatformOutput - The return type for the tailorCvToPlatform function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TailorCvToPlatformInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      'The user uploaded CV as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
  platformUrl: z.string().describe('The URL of the job platform.'),
  supportingDocs: z.array(z.string()).optional().describe('List of data URIs for supporting documents.'),
});

export type TailorCvToPlatformInput = z.infer<typeof TailorCvToPlatformInputSchema>;

const TailorCvToPlatformOutputSchema = z.object({
  tailoredCv: z.string().describe('The tailored CV for the specified platform.'),
});

export type TailorCvToPlatformOutput = z.infer<typeof TailorCvToPlatformOutputSchema>;

export async function tailorCvToPlatform(input: TailorCvToPlatformInput): Promise<TailorCvToPlatformOutput> {
  return tailorCvToPlatformFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tailorCvToPlatformPrompt',
  input: {schema: TailorCvToPlatformInputSchema},
  output: {schema: TailorCvToPlatformOutputSchema},
  prompt: `You are an expert CV writer, specializing in tailoring CVs to various job platforms.

You will receive a CV and a link to a job platform. Analyze the platform's layout, style, and content.

Based on your analysis, rewrite the CV to be suitable for the platform. Prioritize keywords and skills that are relevant to roles listed on the platform.

CV: {{media url=cvDataUri}}

Platform URL: {{{platformUrl}}}

Supporting Documents: {{#each supportingDocs}}{{media url=this}}\n{{/each}}`,
});

const tailorCvToPlatformFlow = ai.defineFlow(
  {
    name: 'tailorCvToPlatformFlow',
    inputSchema: TailorCvToPlatformInputSchema,
    outputSchema: TailorCvToPlatformOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
