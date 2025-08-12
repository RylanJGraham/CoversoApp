
'use server';

/**
 * @fileOverview A flow for creating a Stripe Checkout session.
 * 
 * - createCheckoutSession - Creates a Stripe Checkout session and returns the URL.
 * - CreateCheckoutSessionInput - The input type for the flow.
 * - CreateCheckoutSessionOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createStripeCheckoutSession } from '@/services/stripe';

export const CreateCheckoutSessionInputSchema = z.object({
    priceId: z.string().describe('The ID of the Stripe Price object.'),
    userId: z.string().describe('The Firebase user ID.'),
    userEmail: z.string().email().describe("The user's email address."),
});
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;

export const CreateCheckoutSessionOutputSchema = z.object({
    sessionId: z.string().describe('The ID of the created Stripe Checkout Session.'),
    checkoutUrl: z.string().url().describe('The URL to redirect the user to for checkout.'),
});
export type CreateCheckoutSessionOutput = z.infer<typeof CreateCheckoutSessionOutputSchema>;

export const createCheckoutSession = ai.defineFlow(
  {
    name: 'createCheckoutSession',
    inputSchema: CreateCheckoutSessionInputSchema,
    outputSchema: CreateCheckoutSessionOutputSchema,
  },
  async (input) => {
    const { priceId, userId, userEmail } = input;
    
    // This is where you would typically interact with your database
    // to find or create a Stripe Customer ID for the user.
    // For simplicity, we'll pass the Firebase UID and email to the service.

    const session = await createStripeCheckoutSession(priceId, userId, userEmail);

    if (!session.url) {
        throw new Error("Stripe session URL not found.");
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }
);
