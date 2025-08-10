
"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
  to: number;
  from?: number;
}

export default function AnimatedCounter({ to, from = 0 }: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, to, {
      duration: 2,
      delay: 0.5,
      ease: "easeOut",
    });
    return controls.stop;
  }, [to, from, count]);

  return <motion.span>{rounded}</motion.span>;
}
