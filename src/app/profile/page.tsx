
"use client";

import { useState, useEffect, FC } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, User as UserIcon, CreditCard, FileText, Shield } from 'lucide-react';
import { Footer } from '@/components/Footer';

interface UserProfile {
  fullName: string;
  email: string;
  userLocation?: string;
  phone?: string;
  linkedinUrl?: string;
}

const ProfilePage: FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const db = getClientFirestore();
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data() as UserProfile);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveChanges = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      const db = getClientFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, profile, { merge: true });
      toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error', description: 'Could not update your profile.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleManageSubscription = () => {
      // This would eventually link to the Stripe Customer Portal
      // For now, it links to the pricing page
      router.push('/pricing');
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex-grow">
        <div className="space-y-10">
          
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-primary" />
                <span>Edit Profile</span>
              </CardTitle>
              <CardDescription>Update your personal information here.</CardDescription>
            </CardHeader>
            <CardContent>
              {profile && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" value={profile.fullName} onChange={handleProfileChange} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" value={profile.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userLocation">Location</Label>
                      <Input id="userLocation" name="userLocation" value={profile.userLocation || ''} onChange={handleProfileChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} />
                    </div>
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                        <Input id="linkedinUrl" name="linkedinUrl" value={profile.linkedinUrl || ''} onChange={handleProfileChange} />
                    </div>
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />
          
          {/* Billing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary" />
                <span>Billing</span>
              </CardTitle>
              <CardDescription>Manage your subscription and payment details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Redirect to our payment provider to manage your plan.</p>
                     <Button variant="default" onClick={handleManageSubscription}>
                        Manage Subscription
                    </Button>
                </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Legal Section */}
           <div className="grid md:grid-cols-2 gap-8">
               <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-6 h-6 text-primary" />
                      <span>Terms of Service</span>
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground text-sm">
                       By using Coverso, you agree to our terms and conditions. Our service provides AI-generated content intended as a draft. It is your responsibility to review, edit, and verify the accuracy of all documents before submission. Coverso is not liable for any outcomes of your job applications.
                    </p>
                     <Button variant="link" className="px-0 mt-2">Read full terms</Button>
                 </CardContent>
               </Card>
                <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Shield className="w-6 h-6 text-primary" />
                      <span>Privacy Policy</span>
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground text-sm">
                      We value your privacy. Your personal information and uploaded documents are used solely to provide our service and are not shared with third parties. We use industry-standard security measures to protect your data. All payment information is handled securely by our payment processor, Stripe.
                    </p>
                    <Button variant="link" className="px-0 mt-2">Read full policy</Button>
                 </CardContent>
               </Card>
           </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
