
"use client";

import { useState, type FC, type ChangeEvent, useRef } from 'react';
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
import { User as UserIcon, UploadCloud, Briefcase, Star, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const ProfileSetupModal: FC<ProfileSetupModalProps> = ({ isOpen, onClose, user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    profileImage: user?.photoURL || '',
    industry: '',
    age: '',
    dailyGoal: '2',
  });
  const [imagePreview, setImagePreview] = useState(user?.photoURL || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = 4;

  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

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
  
  const SubscriptionCard: FC<{title: string, price: string, features: string[], popular?: boolean}> = ({title, price, features, popular}) => (
    <div className={cn("border rounded-lg p-6 flex flex-col", popular && "border-primary border-2 relative")}>
        {popular && <div className="absolute top-0 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">Most Popular</div>}
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-3xl font-bold my-4">{price}<span className="text-base font-normal text-muted-foreground">/month</span></p>
        <ul className="space-y-3 text-muted-foreground flex-grow">
            {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <Button className="w-full mt-6" variant={popular ? "default" : "outline"}>Choose Plan</Button>
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
              <DialogTitle className="text-center text-2xl">Your Goals</DialogTitle>
              <DialogDescription className="text-center">How active will you be?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="dailyGoal">How many cover letters do you hope to generate a day?</Label>
                <Input id="dailyGoal" name="dailyGoal" type="number" value={formData.dailyGoal} onChange={handleChange} placeholder="e.g., 5" />
              </div>
               <p className="text-sm text-muted-foreground text-center pt-4">This helps us recommend the best plan for you.</p>
            </div>
          </>
        );
       case 4:
         return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Choose Your Plan</DialogTitle>
                    <DialogDescription className="text-center">You get 2 free generations a day. Upgrade for more.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                   <SubscriptionCard 
                     title="Job Seeker"
                     price="$5.99"
                     features={["10 Generations per day", "Standard tone options", "Email support"]}
                     popular
                   />
                    <SubscriptionCard 
                     title="Career Pro"
                     price="$9.99"
                     features={["30 Generations per day", "All tone options", "CV Analysis", "Priority support"]}
                   />
                </div>
            </>
         )
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl bg-white text-black p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                 {renderStep()}
            </div>
            <div className="mt-auto">
                <StepIndicator current={step} total={totalSteps} />
                <DialogFooter className="mt-6">
                    {step > 1 && (
                    <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                        <ArrowLeft />
                        Back
                    </Button>
                    )}
                    {step < totalSteps ? (
                    <Button onClick={handleNext} className="flex items-center gap-2">
                        Next
                        <ArrowRight />
                    </Button>
                    ) : (
                    <Button onClick={onClose}>Finish Setup</Button>
                    )}
                </DialogFooter>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupModal;
