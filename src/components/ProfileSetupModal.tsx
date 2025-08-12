
"use client";

import * as React from 'react';
import { useState, type FC, type ChangeEvent, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, UploadCloud, Briefcase, Star, CheckCircle, ArrowRight, ArrowLeft, Loader2, X, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';
import { getClientFirestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createSubscriptionFlow } from '@/ai/flows/stripe-checkout';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';


interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface Tier {
    title: string;
    price: string;
    features: string[];
    priceId: string | null;
    popular?: boolean;
}

const tiers: Tier[] = [
    {
        title: "Basic",
        price: "Free",
        features: ["2 Generations per day", "Standard tone options", "Community support"],
        priceId: null,
    },
    {
        title: "Job Seeker",
        price: "$5.99",
        features: ["10 Generations per day", "Standard tone options", "Email support"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_JOB_SEEKER_PRICE_ID || 'price_1RvJpbRkulDjgBEWEyl0pYdE',
        popular: true,
    },
    {
        title: "Career Pro",
        price: "$9.99",
        features: ["30 Generations per day", "All tone options", "CV Analysis", "Priority support"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_CAREER_PRO_PRICE_ID || 'price_1RvJqDRkulDjgBEWioi7QL9P',
    },
    {
        title: "Executive",
        price: "$19.99",
        features: ["Unlimited Generations", "Premium tone options", "CV Analysis & Enhancement", "Priority support"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_EXECUTIVE_PRICE_ID || 'price_1RvJqaRkulDjgBEWsVeQW4qi',
    },
];

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');


const CheckoutForm: FC<{ onSuccessfulPayment: () => void }> = ({ onSuccessfulPayment }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) {
            return;
        }
        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // No return_url needed for this flow
            },
            redirect: 'if_required',
        });

        if (error) {
            toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            toast({ title: "Payment Successful!", description: "Your subscription is active." });
            onSuccessfulPayment();
        } else {
             toast({ title: "Payment Incomplete", description: "Your payment requires further action.", variant: "destructive" });
        }
        
        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            <Button disabled={isProcessing || !stripe || !elements} className="w-full mt-6">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : `Pay and Subscribe`}
            </Button>
        </form>
    );
}


const ProfileSetupModal: FC<ProfileSetupModalProps> = ({ isOpen, onClose, user }) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    profileImage: user?.photoURL || '',
    industry: '',
    age: '',
    dailyGoal: '2',
    createdAt: new Date(),
    subscriptionPlan: 'Basic', // Default to basic
  });
  const [imagePreview, setImagePreview] = useState(user?.photoURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalSteps = 4;

  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => {
    if (prev === 4 && clientSecret) {
        setClientSecret(null); // Reset payment state if going back from payment screen
        setIsPreparingPayment(null);
    }
    return Math.max(prev - 1, 1)
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({...prev, profileImage: reader.result as string}))
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileData = async (onboardingStatus: boolean, plan: string) => {
     if (!user) {
        toast({ title: "Error", description: "You must be logged in to complete setup.", variant: "destructive" });
        return { success: false };
    }
    setIsSaving(true);
    try {
        const db = getClientFirestore();
        const userRef = doc(db, "users", user.uid);
        
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            ...formData,
            subscriptionPlan: plan,
            onboardingComplete: onboardingStatus,
        }, { merge: true });
        
        if(onboardingStatus){
            toast({ title: "Profile Saved!", description: "Welcome to Coverso!" });
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error saving user data: ", error);
        toast({ title: "Save Failed", description: "Could not save your profile. Please try again.", variant: "destructive" });
        return { success: false };
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleSuccessfulPayment = async () => {
    if (selectedTier) {
      const { success } = await saveProfileData(true, selectedTier.title);
      if (success) {
        onClose();
      }
    }
  }


  const handleChoosePlan = async (tier: Tier) => {
    if (!user) {
        toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
        return;
    }
    
    setSelectedTier(tier);
    
    // For free plan, save profile and close modal.
    if (tier.priceId === null) {
      const { success } = await saveProfileData(true, tier.title);
      if (success) {
        onClose();
      }
      return;
    }
    
    // First, save the user's current data but keep onboarding incomplete.
    const { success: profileSaved } = await saveProfileData(false, tier.title);
    if (!profileSaved) return;

    setIsPreparingPayment(tier.priceId);

    try {
      const { clientSecret: newClientSecret } = await createSubscriptionFlow({
          priceId: tier.priceId,
          userId: user.uid,
          userEmail: user.email || '',
      });

      if (newClientSecret) {
          setClientSecret(newClientSecret);
          handleNext(); // Move to payment step
      } else {
          throw new Error("Could not create a subscription session.");
      }

    } catch (error) {
      console.error("Stripe Subscription Error:", error);
      toast({ title: "Subscription Error", description: "Could not prepare the payment form. Please try again.", variant: "destructive" });
    } finally {
        setIsPreparingPayment(null);
    }
  };

  const StepIndicator: FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="flex justify-center space-x-2 my-4">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-2 w-2 rounded-full transition-all duration-300',
            index + 1 === current ? 'bg-primary w-4' : 'bg-gray-300'
          )}
        />
      ))}
    </div>
  );
  
  const SubscriptionCard: FC<Tier & { onChoose: (tier: Tier) => void, isPreparing: boolean, isSelected: boolean }> = ({title, price, features, popular, priceId, onChoose, isPreparing, isSelected, ...tier}) => (
    <div className={cn("border rounded-lg p-6 flex flex-col", popular && "border-primary border-2 relative")}>
        {popular && <div className="absolute top-0 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">Most Popular</div>}
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-3xl font-bold my-4">{price}<span className="text-base font-normal text-muted-foreground">{price !== 'Free' ? '/month' : ''}</span></p>
        <ul className="space-y-3 text-muted-foreground flex-grow">
            {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <Button className="w-full mt-6" variant={popular ? "default" : "outline"} onClick={() => onChoose({title, price, features, popular, priceId, ...tier})} disabled={isPreparing}>
            {isSelected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            { isSelected ? 'Preparing...' : (priceId === null ? 'Choose Basic' : 'Choose Plan')}
        </Button>
    </div>
  )

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">Welcome to Coverso!</DialogTitle>
              <DialogDescription className="text-center">Let's set up your profile to get started.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={imagePreview} alt="Profile" />
                <AvatarFallback>
                    <UploadCloud className="h-10 w-10 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
               <Label htmlFor="fullName">Full Name</Label>
               <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g., Jane Doe" className="text-center" />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">Tell Us About You</DialogTitle>
              <DialogDescription className="text-center">This helps us tailor your experience.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="industry">What industry are you in?</Label>
                <Input id="industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g., Software Development" />
              </div>
              <div>
                <Label htmlFor="age">What is your age?</Label>
                <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="e.g., 28" />
              </div>
            </div>
          </>
        );
       case 3:
         return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
                    <DialogDescription className="text-center">Select a plan to complete your setup. You can change this at any time.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
                   {tiers.map(tier => (
                       <SubscriptionCard 
                         key={tier.title}
                         {...tier}
                         onChoose={handleChoosePlan}
                         isPreparing={isPreparingPayment !== null}
                         isSelected={isPreparingPayment === tier.priceId}
                       />
                   ))}
                </div>
            </>
         )
       case 4:
         if (clientSecret) {
            return (
                 <>
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Enter Payment Details</DialogTitle>
                    <DialogDescription className="text-center">Securely complete your subscription for the {selectedTier?.title} plan.</DialogDescription>
                </DialogHeader>
                 <div className="py-4">
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm onSuccessfulPayment={handleSuccessfulPayment}/>
                    </Elements>
                 </div>
                 </>
            )
         }
         // Fallback if clientSecret isn't ready, though this shouldn't be seen.
         return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Don't close on overlay click */ }}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-5xl bg-white text-black p-8 rounded-xl shadow-2xl" hideCloseButton={true} 
         onEscapeKeyDown={(e) => e.preventDefault()}
         onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full min-h-[400px]">
            <div className="flex-grow">
                 {renderStep()}
            </div>
            <div className="mt-auto">
                <StepIndicator current={step} total={totalSteps} />
                 <DialogFooter className="mt-6">
                    {step > 1 && (
                    <Button variant="outline" onClick={handleBack} className="flex items-center gap-2" disabled={isSaving || !!isPreparingPayment}>
                        <ArrowLeft />
                        Back
                    </Button>
                    )}
                    {step < 3 && (
                    <Button onClick={handleNext} className="flex items-center gap-2">
                        Next
                        <ArrowRight />
                    </Button>
                    )}
                </DialogFooter>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupModal;

    