'use server';

/**
 * @fileOverview CV Enhancement AI agent.
 *
 * - suggestCvImprovements - A function that suggests improvements to a CV.
 * - SuggestCvImprovementsInput - The input type for the suggestCvImprovements function.
 * - SuggestCvImprovementsOutput - The return type for the suggestCvImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCvImprovementsInputSchema = z.object({
  cvDataUri: z
    .string()
    .describe(
      'The user uploaded CV, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  platformLink: z
    .string()
    .describe('The link to the job platform to tailor the CV for.'),
  supportingDocumentsDataUris: z
    .array(z.string())
    .describe(
      'An array of data URIs representing supporting documents, each as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    )
    .optional(),
});
export type SuggestCvImprovementsInput = z.infer<typeof SuggestCvImprovementsInputSchema>;

const SuggestCvImprovementsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested improvements for the CV.'),
});
export type SuggestCvImprovementsOutput = z.infer<typeof SuggestCvImprovementsOutputSchema>;

export async function suggestCvImprovements(
  input: SuggestCvImprovementsInput
): Promise<SuggestCvImprovementsOutput> {
  return suggestCvImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCvImprovementsPrompt',
  input: {schema: SuggestCvImprovementsInputSchema},
  output: {schema: SuggestCvImprovementsOutputSchema},
  prompt: `You are a professional CV writing assistant. You will take a CV, along with
supporting documents, and a link to a job platform, and suggest improvements to the CV
to tailor it to the job platform.

CV:
{{media url=cvDataUri}}

Supporting Documents:
{{#each supportingDocumentsDataUris}}
{{media url=this}}
{{/each}}

Job Platform Link: {{{platformLink}}}

Suggestions should be actionable and specific.

Here are suggestions for improvement:
`,
});

const suggestCvImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestCvImprovementsFlow',
    inputSchema: SuggestCvImprovementsInputSchema,
    outputSchema: SuggestCvImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
