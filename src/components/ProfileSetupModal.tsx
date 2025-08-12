
"use client";

import * as React from 'react';
import { useState, type FC, type ChangeEvent, useRef } from 'react';
import Image from 'next/image';
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
import { User as UserIcon, UploadCloud, Briefcase, Star, CheckCircle, ArrowRight, ArrowLeft, Loader2, X, CreditCard, Ticket, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';
import { getClientFirestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createSubscriptionFlow } from '@/ai/flows/stripe-checkout';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Separator } from './ui/separator';
import { validateDiscountCode } from '@/ai/flows/validate-discount-code';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TiltedCard from './TiltedCard';
import './TiltedCard.css';


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

const industryOptions = [
  "Software Development",
  "Marketing",
  "Design",
  "Finance",
  "Healthcare",
  "Education",
  "Sales",
  "Engineering",
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
    industries: [] as string[],
    academicLevel: '',
    dailyGoal: '2',
    createdAt: new Date(),
    subscriptionPlan: 'Basic', // Default to basic
  });
  const [imagePreview, setImagePreview] = useState(user?.photoURL || '');
  const [industryInput, setIndustryInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [discountCode, setDiscountCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [appliedCodePlan, setAppliedCodePlan] = useState<string | null>(null);

  const totalSteps = 4;

  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => {
    if (prev === 4 && clientSecret) {
        setClientSecret(null); // Reset payment state if going back from payment screen
        setIsPreparingPayment(null);
    }
    return Math.max(prev - 1, 1)
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleIndustrySelect = (industry: string) => {
    if (formData.industries.length < 3 && !formData.industries.includes(industry)) {
      setFormData(prev => ({...prev, industries: [...prev.industries, industry]}));
    }
    setIndustryInput('');
  }

  const handleIndustryRemove = (industryToRemove: string) => {
    setFormData(prev => ({...prev, industries: prev.industries.filter(i => i !== industryToRemove)}));
  }


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
            fullName: formData.fullName,
            profileImage: formData.profileImage,
            industries: formData.industries,
            academicLevel: formData.academicLevel,
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

  const handleApplyDiscountCode = async () => {
    if (!discountCode) return;
    setIsVerifyingCode(true);
    try {
        const result = await validateDiscountCode({ code: discountCode });
        if (result.isValid && result.planName) {
            toast({ title: "Code Applied!", description: `You've been upgraded to the ${result.planName} plan.` });
            setAppliedCodePlan(result.planName);
        } else {
            toast({ title: "Invalid Code", description: "That discount code is not valid. Please try again.", variant: "destructive" });
            setAppliedCodePlan(null);
        }
    } catch (error) {
        toast({ title: "Error", description: "Could not verify the code. Please try again.", variant: "destructive" });
    } finally {
        setIsVerifyingCode(false);
    }
  };
  
  const handleCompleteWithCode = async () => {
    if (appliedCodePlan) {
        const { success } = await saveProfileData(true, appliedCodePlan);
        if (success) {
            onClose();
        }
    }
  };


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
            index + 1 === current ? 'bg-primary w-4' : 'bg-primary/30'
          )}
        />
      ))}
    </div>
  );
  
  const SubscriptionCard: FC<Tier & { onChoose: (tier: Tier) => void, isPreparing: boolean, isSelected: boolean, disabled: boolean }> = ({title, price, features, popular, priceId, onChoose, isPreparing, isSelected, disabled, ...tier}) => (
     <TiltedCard containerHeight="100%" scaleOnHover={1.05} rotateAmplitude={4}>
        <div className={cn("border-2 rounded-lg p-4 flex flex-col h-full", popular ? "border-primary" : "border-gray-300", disabled && "opacity-50 bg-gray-50")}>
            {popular && <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">Most Popular</div>}
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            <p className="text-2xl font-bold my-2 text-foreground">{price}<span className="text-sm font-normal text-muted-foreground">{price !== 'Free' ? '/month' : ''}</span></p>
            <ul className="space-y-2 text-muted-foreground text-sm flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <Button className="w-full mt-4" variant={popular ? "default" : "outline"} onClick={() => onChoose({title, price, features, popular, priceId, ...tier})} disabled={isPreparing || disabled}>
                {isSelected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                { isSelected ? 'Preparing...' : (priceId === null ? 'Choose Basic' : 'Choose Plan')}
            </Button>
        </div>
     </TiltedCard>
  )

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to Coverso!</DialogTitle>
              <DialogDescription>
                Let's set up your profile to get started. We'll use this information to pre-fill the contact details on your cover letters.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-start gap-4 py-4">
               <Label htmlFor="fullName">Full Name</Label>
               <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g., Jane Doe"/>
               <Label>Profile Picture (Optional)</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24 border-2">
                        <AvatarImage src={imagePreview} alt="Profile" />
                        <AvatarFallback>
                            <UserIcon className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                     <Button type="button" variant="outline" className="rounded-full h-12 w-12 p-0 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="h-6 w-6" />
                    </Button>
                </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Tell Us About You</DialogTitle>
              <DialogDescription>This helps us tailor your experience.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div>
                <Label htmlFor="industry">What industry are you in? (Select up to 3)</Label>
                <div className="flex items-center gap-2 mt-2">
                    <Input 
                        id="industry"
                        list="industry-options"
                        value={industryInput}
                        onChange={(e) => setIndustryInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && industryInput) {
                                e.preventDefault();
                                handleIndustrySelect(industryInput);
                            }
                        }}
                        placeholder="Type or select an industry"
                        disabled={formData.industries.length >= 3}
                    />
                    <datalist id="industry-options">
                        {industryOptions.map(opt => <option key={opt} value={opt} />)}
                    </datalist>
                    <Button type="button" onClick={() => handleIndustrySelect(industryInput)} disabled={!industryInput || formData.industries.length >= 3}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {formData.industries.map(industry => (
                        <div key={industry} className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm">
                            <span>{industry}</span>
                            <button type="button" onClick={() => handleIndustryRemove(industry)} className="rounded-full hover:bg-black/20">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
              </div>
              
               <div>
                  <Label htmlFor="academicLevel">What is your current academic/career level?</Label>
                   <Select name="academicLevel" onValueChange={(value) => setFormData(p => ({...p, academicLevel: value}))} value={formData.academicLevel}>
                        <SelectTrigger className="w-full mt-2" id="academicLevel">
                            <SelectValue placeholder="Select your level..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="student">Undergraduate Student</SelectItem>
                            <SelectItem value="entry-level">Entry-level / Graduate</SelectItem>
                            <SelectItem value="mid-level">Mid-level Professional</SelectItem>
                            <SelectItem value="senior-level">Senior-level / Executive</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate Student</SelectItem>
                        </SelectContent>
                    </Select>
               </div>
            </div>
          </>
        );
       case 3:
         const paidTiers = tiers.filter(t => t.priceId !== null);
         return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
                    <DialogDescription>Select a plan to complete your setup. You can change this at any time.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {paidTiers.map(tier => (
                        <SubscriptionCard 
                            key={tier.title}
                            {...tier}
                            onChoose={handleChoosePlan}
                            isPreparing={isPreparingPayment !== null}
                            isSelected={isPreparingPayment === tier.priceId}
                            disabled={!!appliedCodePlan || isPreparingPayment !== null}
                        />
                        ))}
                    </div>
                    <Separator/>
                    <div className="grid grid-cols-3 gap-8">
                        <div className="col-span-2">
                             <h4 className="font-semibold">Don't want to pay?</h4>
                              <p className="text-sm text-muted-foreground">
                                <button type="button" onClick={() => handleChoosePlan(tiers[0])} className="text-primary font-semibold hover:underline">
                                    Continue with Free
                                </button>
                                 &nbsp;to get started right away.
                              </p>
                              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  {tiers[0].features.map((feature, i) => (
                                    <p key={i} className="flex items-center gap-2">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        <span>{feature}</span>
                                    </p>
                                  ))}
                              </div>
                        </div>

                        <div className="col-span-1 border-l pl-8">
                             <div className="flex items-center gap-2 mb-2">
                                 <Ticket className="h-5 w-5 text-primary" />
                                 <h4 className="font-semibold">Have a code?</h4>
                             </div>
                            {appliedCodePlan ? (
                                <div className='flex flex-col items-start gap-4'>
                                    <p className='font-medium text-sm'>
                                        Success! You've unlocked the <span className='font-bold text-primary'>{appliedCodePlan}</span> plan.
                                    </p>
                                     <Button onClick={handleCompleteWithCode} disabled={isSaving} variant="default" size="sm">
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Complete Setup
                                    </Button>
                                </div>
                            ) : (
                                 <div className="flex flex-col items-start gap-2">
                                    <Input 
                                        placeholder="Enter discount code" 
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value)}
                                        disabled={isVerifyingCode}
                                        className="h-9"
                                    />
                                    <Button onClick={handleApplyDiscountCode} disabled={isVerifyingCode || !discountCode} variant="secondary" size="sm">
                                        {isVerifyingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Apply
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
         )
       case 4:
         if (clientSecret) {
            return (
                 <>
                <DialogHeader>
                    <DialogTitle className="text-2xl">Enter Payment Details</DialogTitle>
                    <DialogDescription>Securely complete your subscription for the {selectedTier?.title} plan.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 bg-white rounded-lg p-4">
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                        <CheckoutForm onSuccessfulPayment={handleSuccessfulPayment}/>
                    </Elements>
                 </div>
                 </>
            )
         }
         return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Don't close on overlay click */ }}>
      <DialogContent 
        className="sm:max-w-md md:max-w-lg lg:max-w-5xl p-0 rounded-xl grid grid-cols-1 md:grid-cols-3 border-2 border-primary shadow-lg shadow-primary/20" 
        hideCloseButton={true} 
         onEscapeKeyDown={(e) => e.preventDefault()}
         onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="hidden md:flex md:col-span-1 bg-primary text-primary-foreground p-8 flex-col justify-between items-start gap-6 rounded-l-xl">
            <Image src="/Logo2.png" alt="Coverso Logo" width={200} height={80} />
            <p className="text-left text-lg font-medium">Before the Job Hunt Begins, Let Us Get To Know You</p>
            <div />
        </div>
        <div className="col-span-1 md:col-span-2 p-8 flex flex-col h-full min-h-[500px]">
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
                    <Button variant="default" onClick={handleNext} className="flex items-center gap-2">
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
