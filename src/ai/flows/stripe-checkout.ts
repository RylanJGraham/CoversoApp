
'use server';

/**
 * @fileOverview A flow for creating a Stripe Checkout session.
 * 
 * - createCheckoutSessionFlow - Creates a Stripe Checkout session and returns the URL.
 * - verifyCheckoutSessionFlow - Verifies a Stripe Checkout session and returns subscription details.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createStripeCheckoutSession, getStripeCheckoutSession } from '@/services/stripe';
import Stripe from 'stripe';

const CreateCheckoutSessionInputSchema = z.object({
    priceId: z.string().describe('The ID of the Stripe Price object.'),
    userId: z.string().describe('The Firebase user ID.'),
    userEmail: z.string().email().describe("The user's email address."),
});
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;

const CreateCheckoutSessionOutputSchema = z.object({
    sessionId: z.string().describe('The ID of the created Stripe Checkout Session.'),
    checkoutUrl: z.string().url().describe('The URL to redirect the user to for checkout.'),
});
export type CreateCheckoutSessionOutput = z.infer<typeof CreateCheckoutSessionOutputSchema>;

const createCheckoutSession = ai.defineFlow(
  {
    name: 'createCheckoutSession',
    inputSchema: CreateCheckoutSessionInputSchema,
    outputSchema: CreateCheckoutSessionOutputSchema,
  },
  async (input) => {
    const { priceId, userId, userEmail } = input;
    
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

export async function createCheckoutSessionFlow(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    return createCheckoutSession(input);
}


const VerifyCheckoutSessionInputSchema = z.object({
  sessionId: z.string().describe('The ID of the Stripe Checkout Session to verify.'),
});
export type VerifyCheckoutSessionInput = z.infer<typeof VerifyCheckoutSessionInputSchema>;

const VerifyCheckoutSessionOutputSchema = z.object({
  paymentStatus: z.string().describe('The payment status of the session (e.g., "paid").'),
  subscriptionId: z.string().optional().describe('The ID of the created Stripe Subscription.'),
  customerId: z.string().optional().describe('The ID of the Stripe Customer.'),
  planId: z.string().optional().describe('The ID of the Stripe Price/Plan.'),
});
export type VerifyCheckoutSessionOutput = z.infer<typeof VerifyCheckoutSessionOutputSchema>;


const verifyCheckoutSession = ai.defineFlow(
    {
        name: 'verifyCheckoutSession',
        inputSchema: VerifyCheckoutSessionInputSchema,
        outputSchema: VerifyCheckoutSessionOutputSchema,
    },
    async ({ sessionId }) => {
        const session = await getStripeCheckoutSession(sessionId);

        if (!session) {
            throw new Error('Stripe session not found.');
        }
        
        let subscriptionId: string | undefined;
        let planId: string | undefined;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });


        if (session.subscription) {
           // For subscriptions, get details from the subscription object
           const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
           subscriptionId = subscription.id;
           planId = subscription.items.data[0]?.price.id;
        } else if (session.line_items?.data[0]?.price) {
           // For one-time payments
           planId = session.line_items.data[0].price.id;
        }

        return {
            paymentStatus: session.payment_status,
            subscriptionId: subscriptionId,
            customerId: typeof session.customer === 'string' ? session.customer : undefined,
            planId: planId,
        };
    }
);

export async function verifyCheckoutSessionFlow(input: VerifyCheckoutSessionInput): Promise<VerifyCheckoutSessionOutput> {
    return verifyCheckoutSession(input);
}
