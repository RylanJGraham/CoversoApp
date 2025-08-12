
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    typescript: true,
});

/**
 * Creates a Stripe Checkout session for a subscription.
 * @param priceId - The ID of the Stripe Price object.
 * @param userId - The Firebase user ID to associate with the Stripe customer.
 * @param userEmail - The user's email.
 * @returns The Stripe Checkout Session object.
 */
export async function createStripeCheckoutSession(priceId: string, userId: string, userEmail: string): Promise<Stripe.Checkout.Session> {
    
    let customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer: Stripe.Customer;

    if (customers.data.length > 0) {
        customer = customers.data[0];
    } else {
        customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
                firebaseUID: userId,
            },
        });
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer: customer.id,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        allow_promotion_codes: true,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, 
    });

    return session;
}

/**
 * Retrieves a Stripe Checkout session.
 * @param sessionId - The ID of the Stripe Checkout Session.
 * @returns The Stripe Checkout Session object.
 */
export async function getStripeCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'line_items.data.price.product']
    });
    return session;
}

    