
'use server';

/**
 * @fileOverview A flow for validating discount codes using the Firebase Admin SDK.
 *
 * - validateDiscountCode - Checks if a discount code is valid.
 * - ValidateDiscountCodeInput - The input type for the validateDiscountCode function.
 * - ValidateDiscountCodeOutput - The return type for the validateDiscountCode function.
 */

import { ai } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase-admin'; // Use the Admin SDK
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
    try {
      // Use the Admin SDK to access Firestore. This bypasses client-side security rules.
      const codeRef = adminDb.collection('discountCodes').doc(code);
      const codeSnap = await codeRef.get();

      if (codeSnap.exists) {
        const codeData = codeSnap.data();
        return {
          isValid: true,
          planName: codeData?.planName || 'Special', // Access planName from data()
        };
      }

      return {
        isValid: false,
      };
    } catch (error) {
        console.error("Error validating discount code:", error);
        // This will now only catch actual server errors, not permissions issues.
        throw new Error("Could not verify the code due to a server error.");
    }
  }
);
