import React from 'react';
import { motion, type Variants } from 'motion/react';

/**
 * Staggered reveal for card grids and lists.
 *
 * Exists as a primitive rather than inline motion props because the same
 * three-line variant block was otherwise going to be pasted into every grid on
 * every page. Wrap the grid in `<Stagger>` and each child in `<StaggerItem>`;
 * the grid keeps its own `className`, so layout is untouched.
 *
 * Motion honours `prefers-reduced-motion` via the `<MotionConfig
 * reducedMotion="user">` in App.tsx — no extra guard is needed here.
 */

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      // Small enough to read as one movement rather than items arriving
      // one-by-one, and capped so a 40-card grid doesn't take a full second.
      staggerChildren: 0.035,
      delayChildren: 0.02,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

export interface StaggerProps extends React.ComponentProps<typeof motion.div> {
  children: React.ReactNode;
}

export const Stagger: React.FC<StaggerProps> = ({ children, ...rest }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" {...rest}>
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<StaggerProps> = ({ children, ...rest }) => (
  <motion.div variants={itemVariants} {...rest}>
    {children}
  </motion.div>
);
