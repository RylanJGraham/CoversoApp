
'use server';

/**
 * @fileOverview A flow for creating a Stripe Checkout session.
 * 
 * - createSubscriptionFlow - Creates a Stripe Subscription and returns a client secret for payment.
 * - verifyCheckoutSessionFlow - Verifies a Stripe Checkout session and returns subscription details.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createStripeCheckoutSession, getStripeCheckoutSession, createStripeSubscription } from '@/services/stripe';
import Stripe from 'stripe';

const CreateSubscriptionInputSchema = z.object({
    priceId: z.string().describe('The ID of the Stripe Price object.'),
    userId: z.string().describe('The Firebase user ID.'),
    userEmail: z.string().email().describe("The user's email address."),
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionInputSchema>;

const CreateSubscriptionOutputSchema = z.object({
    subscriptionId: z.string().describe('The ID of the created Stripe Subscription.'),
    clientSecret: z.string().describe('The client secret for the subscription\'s latest invoice payment intent.'),
});
export type CreateSubscriptionOutput = z.infer<typeof CreateSubscriptionOutputSchema>;

const createSubscription = ai.defineFlow(
  {
    name: 'createSubscription',
    inputSchema: CreateSubscriptionInputSchema,
    outputSchema: CreateSubscriptionOutputSchema,
  },
  async (input) => {
    const { priceId, userId, userEmail } = input;
    
    const { subscription, clientSecret } = await createStripeSubscription(priceId, userId, userEmail);

    if (!subscription.id || !clientSecret) {
        throw new Error("Stripe subscription or client secret not found.");
    }

    return {
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
    };
  }
);

export async function createSubscriptionFlow(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    return createSubscription(input);
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
