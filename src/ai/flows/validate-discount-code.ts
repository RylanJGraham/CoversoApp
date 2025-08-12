'use server';

/**
 * @fileOverview A flow for validating discount codes.
 *
 * - validateDiscountCode - Checks if a discount code is valid.
 * - ValidateDiscountCodeInput - The input type for the validateDiscountCode function.
 * - ValidateDiscountCodeOutput - The return type for the validateDiscountCode function.
 */

import { ai } from '@/ai/genkit';
import { getClientFirestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { z } from 'genkit';

const ValidateDiscountCodeInputSchema = z.object({
  code: z.string().describe('The discount code to validate.'),
});
export type ValidateDiscountCodeInput = z.infer<typeof ValidateDiscountCodeInputSchema>;

const ValidateDiscountCodeOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the code is valid or not.'),
  planName: z.string().optional().describe('The name of the plan granted by the code.'),
});
export type ValidateDiscountCodeOutput = z.infer<typeof ValidateDiscountCodeOutputSchema>;


export async function validateDiscountCode(input: ValidateDiscountCodeInput): Promise<ValidateDiscountCodeOutput> {
    return validateDiscountCodeFlow(input);
}

const validateDiscountCodeFlow = ai.defineFlow(
  {
    name: 'validateDiscountCodeFlow',
    inputSchema: ValidateDiscountCodeInputSchema,
    outputSchema: ValidateDiscountCodeOutputSchema,
  },
  async ({ code }) => {
    // Note: This uses the client SDK for simplicity in this environment.
    // In a production scenario with stricter rules, you'd use the Admin SDK.
    const db = getClientFirestore();
    const codeRef = doc(db, 'discountCodes', code);
    const codeSnap = await getDoc(codeRef);

    if (codeSnap.exists()) {
      const codeData = codeSnap.data();
      return {
        isValid: true,
        planName: codeData.planName || 'Special',
      };
    }

    return {
      isValid: false,
    };
  }
);
