
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createSubscriptionFlow } from '@/ai/flows/stripe-checkout';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Tier {
    title: string;
    price: string;
    priceId: string | null;
    generations: string;
    features: string[];
    isMostPopular?: boolean;
}

const tiers: Tier[] = [
    {
        title: "Basic",
        price: "Free",
        priceId: null,
        generations: "2 Generations",
        features: ["Standard tone options", "Community support"],
    },
    {
        title: "Job Seeker",
        price: "$5.99",
        priceId: process.env.NEXT_PUBLIC_STRIPE_JOB_SEEKER_PRICE_ID || 'price_1RvJpbRkulDjgBEWEyl0pYdE',
        generations: "10 Generations / day",
        features: ["Standard tone options", "Email support", "Save documents"],
        isMostPopular: true,
    },
    {
        title: "Career Pro",
        price: "$9.99",
        priceId: process.env.NEXT_PUBLIC_STRIPE_CAREER_PRO_PRICE_ID || 'price_1RvJqDRkulDjgBEWioi7QL9P',
        generations: "30 Generations / day",
        features: ["All tone options", "CV Analysis", "Priority support"],
    },
    {
        title: "Executive",
        price: "$19.99",
        priceId: process.env.NEXT_PUBLIC_STRIPE_EXECUTIVE_PRICE_ID || 'price_1RvJqaRkulDjgBEWsVeQW4qi',
        generations: "Unlimited Generations",
        features: ["Premium tone options", "CV Analysis & Enhancement", "Dedicated support"],
    },
];

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm = ({ onSuccessfulPayment }: { onSuccessfulPayment: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/dashboard` },
            redirect: 'if_required',
        });

        if (error) {
            toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            toast({ title: "Payment Successful!", description: "Your subscription is active." });
            onSuccessfulPayment();
        } else {
             toast({ title: "Payment Incomplete", description: "Your payment requires further action." });
        }
        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <Button disabled={isProcessing || !stripe || !elements} className="w-full mt-6">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Pay and Subscribe'}
            </Button>
        </form>
    );
};


export default function PricingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleChoosePlan = async (tier: Tier) => {
        const auth = getClientAuth();
        const user = auth.currentUser;

        if (!user) {
            router.push('/login');
            return;
        }

        if (tier.priceId === null) {
            // Handle free plan selection if needed
            toast({ title: "You are on the Basic plan."});
            return;
        }

        setIsLoading(tier.priceId);

        try {
            const { clientSecret: newClientSecret } = await createSubscriptionFlow({
                priceId: tier.priceId,
                userId: user.uid,
                userEmail: user.email || '',
            });

            if (newClientSecret) {
                setClientSecret(newClientSecret);
                setSelectedTier(tier);
                setShowPaymentModal(true);
            } else {
                throw new Error("Could not create a subscription session.");
            }
        } catch (error) {
            console.error("Stripe Subscription Error:", error);
            toast({ title: "Error", description: "Could not prepare the payment form. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(null);
        }
    };

    const handleSuccessfulPayment = async () => {
         const auth = getClientAuth();
         const user = auth.currentUser;

        if (user && selectedTier) {
            const db = getClientFirestore();
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { subscriptionPlan: selectedTier.title }, { merge: true });
        }
        setShowPaymentModal(false);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Find the perfect plan
                    </h1>
                    <p className="mt-4 text-xl text-gray-600">
                        Start for free, then upgrade to a plan that fits your job search intensity.
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 items-end">
                    {tiers.map((tier) => (
                        <Card key={tier.title} className={cn(
                            "flex flex-col",
                            tier.isMostPopular ? "border-primary border-2 shadow-lg" : ""
                        )}>
                            {tier.isMostPopular && (
                                <div className="bg-primary text-primary-foreground text-center py-1.5 text-sm font-semibold rounded-t-lg">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader className="flex-grow">
                                <CardTitle className="text-2xl">{tier.title}</CardTitle>
                                <CardDescription className="text-lg font-bold">{tier.price}<span className="text-sm font-normal text-muted-foreground">{tier.price !== 'Free' ? '/month' : ''}</span></CardDescription>
                                <p className="text-primary font-semibold">{tier.generations}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-muted-foreground">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    onClick={() => handleChoosePlan(tier)}
                                    disabled={isLoading !== null}
                                    variant={tier.isMostPopular ? 'default' : 'outline'}
                                >
                                    {isLoading === tier.priceId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose Plan'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>

            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Your Subscription</DialogTitle>
                        <DialogDescription>
                            You're subscribing to the {selectedTier?.title} plan. Please enter your payment details below.
                        </DialogDescription>
                    </DialogHeader>
                    {clientSecret && (
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                            <CheckoutForm onSuccessfulPayment={handleSuccessfulPayment} />
                        </Elements>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
