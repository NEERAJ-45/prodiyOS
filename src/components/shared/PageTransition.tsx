'use client';

import { motion } from 'framer-motion';
import { fadeUp } from './motion-variants';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp(0)}
    >
      {children}
    </motion.div>
  );
}
