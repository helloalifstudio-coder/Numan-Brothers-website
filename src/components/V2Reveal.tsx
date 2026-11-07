import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export default function V2Reveal({
  children, className = '', delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduce ? false : { opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: reduce ? 0 : 0.65, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
  >{children}</motion.div>;
}
