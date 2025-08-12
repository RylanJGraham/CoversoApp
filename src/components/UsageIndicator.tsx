
"use client";

import { useRouter } from 'next/navigation';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

interface UsageIndicatorProps {
  current: number;
  max: number;
  planName: string;
}

const UsageIndicator = ({ current, max, planName }: UsageIndicatorProps) => {
  const router = useRouter();
  const isUnlimited = max === Infinity;
  const percentage = isUnlimited ? 100 : Math.min((current / max) * 100, 100);

  const data = [{ name: 'usage', value: percentage }];
  
  const getColor = (percent: number) => {
    if (isUnlimited) return 'hsl(var(--primary))';
    if (percent >= 90) return 'hsl(var(--destructive))';
    if (percent >= 60) return 'hsl(var(--accent))';
    return 'hsl(var(--primary))';
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center justify-between bg-white border-2 border-primary/10 rounded-2xl p-4 w-full h-full max-w-[300px] max-h-[250px] shadow-lg">
      <div className="relative w-full h-full flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="85%"
            data={data}
            startAngle={180}
            endAngle={0}
            barSize={20}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
              style={{ fill: color }}
            />
             <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-3xl font-bold"
             >
                {isUnlimited ? '∞' : `${current}/${max}`}
            </text>
             <text
                x="50%"
                y="80%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-lg font-semibold"
             >
                Generations
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-auto">
        <p className="text-xl font-bold tracking-wide text-black">{planName} Plan</p>
         <Button variant="link" className="text-primary text-base" onClick={() => router.push('/pricing')}>
            Upgrade Plan
            <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default UsageIndicator;
