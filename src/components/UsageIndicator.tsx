
"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface UsageIndicatorProps {
  current: number;
  max: number;
  planName: string;
}

const UsageIndicator = ({ current, max, planName }: UsageIndicatorProps) => {
  const isUnlimited = max === Infinity;
  const percentage = isUnlimited ? 100 : Math.min((current / max) * 100, 100);

  const data = [{ name: 'usage', value: percentage }];
  
  // Define color stops for the gauge
  const getColor = (percent: number) => {
    if (percent >= 90) return 'hsl(var(--destructive))'; // Red for high usage
    if (percent >= 60) return 'hsl(var(--accent))';   // Orange for medium usage
    return 'hsl(var(--primary))'; // Purple for low usage
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center justify-center bg-white border-2 border-primary/10 rounded-2xl p-4 w-[200px] h-[150px] shadow-lg">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
            barSize={12}
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
              className="fill-primary"
              style={{ fill: color }}
            />
             <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-xl font-bold"
             >
                {isUnlimited ? '∞' : `${current}/${max}`}
            </text>
             <text
                x="50%"
                y="80%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs font-semibold"
             >
                Generations
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
       <p className="mt-1 text-sm font-semibold tracking-wide text-black">{planName} Plan</p>
    </div>
  );
};

export default UsageIndicator;
