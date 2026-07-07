import { type Variants } from 'framer-motion';

export const easeOut = [0.25, 0.4, 0.25, 1] as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: easeOut } },
};

export const fadeUp = (delay: number = 0): Variants => ({
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.4, ease: easeOut } },
});

export const fadeDown = (delay: number = 0): Variants => ({
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.35, ease: easeOut } },
});

export const fadeLeft = (delay: number = 0): Variants => ({
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { delay, duration: 0.4, ease: easeOut } },
});

export const fadeRight = (delay: number = 0): Variants => ({
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { delay, duration: 0.4, ease: easeOut } },
});

export const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: easeOut } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
};
