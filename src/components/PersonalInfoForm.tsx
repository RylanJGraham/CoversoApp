
"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfile {
  fullName: string;
  userLocation: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  [key: string]: any;
}

interface PersonalInfoFormProps {
  user: User | null;
  profile: UserProfile | null;
}

export interface PersonalInfoHandle {
  getValues: () => {
    fullName: string;
    userLocation: string;
    phone: string;
    email: string;
    linkedinUrl: string;
  };
}

export const PersonalInfoForm = forwardRef<PersonalInfoHandle, PersonalInfoFormProps>(({ profile, user }, ref) => {
  const [fullName, setFullName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setUserLocation(profile.userLocation || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || user?.email || '');
      setLinkedinUrl(profile.linkedinUrl || '');
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [user, profile]);

  useImperativeHandle(ref, () => ({
    getValues: () => ({
      fullName,
      userLocation,
      phone,
      email,
      linkedinUrl,
    }),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-gray-800">Full Name*</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location" className="text-gray-800">Location*</Label>
        <Input id="location" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} placeholder="City, Country" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-800">Phone Number</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+00 000000000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-800">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="linkedin" className="text-gray-800">LinkedIn Profile URL</Label>
        <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
      </div>
    </div>
  );
});

PersonalInfoForm.displayName = 'PersonalInfoForm';
