
'use server';

import { adminDb } from '@/lib/firebase-admin';

interface ValidationResult {
  valid: boolean;
  planName?: string;
  error?: string;
}

export async function validateDiscountCode(code: string): Promise<ValidationResult> {
  try {
    if (!code) {
      return { valid: false, error: 'No code provided' };
    }

    const discountRef = adminDb.collection('discountCodes').doc(code);
    const doc = await discountRef.get();

    if (!doc.exists) {
      return { valid: false, error: 'Invalid discount code' };
    }
    
    const discountData = doc.data();

    // Here you could add more validation logic, e.g., expiry dates, use counts, etc.
    
    return { 
      valid: true, 
      planName: discountData?.planName || 'Special'
    };

  } catch (error) {
    console.error('Discount code validation error:', error);
    return { valid: false, error: 'Error validating discount code. Please try again.' };
  }
}
