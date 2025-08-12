
"use client";

import { motion } from 'framer-motion';

interface UsageIndicatorProps {
  current: number;
  max: number;
  planName: string;
}

const UsageIndicator = ({ current, max, planName }: UsageIndicatorProps) => {
  const isUnlimited = max === Infinity;
  const percentage = isUnlimited ? 100 : Math.min((current / max) * 100, 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-2xl p-4 w-[200px] h-[150px] shadow-lg">
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="8"
            className="text-primary-foreground/20"
            fill="transparent"
            stroke="currentColor"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            strokeWidth="8"
            className="text-white"
            fill="transparent"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="z-10 text-center">
            {isUnlimited ? (
                <span className="text-2xl font-bold">∞</span>
            ) : (
                <>
                    <span className="text-xl font-bold">{current}</span>
                    <span className="text-lg">/{max}</span>
                </>
            )}
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold tracking-wide">{planName} Plan</p>
    </div>
  );
};

export default UsageIndicator;
