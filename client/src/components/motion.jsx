import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } } };

// Children that are <Card> animate in one after another.
export const Stagger = ({ className, children }) => (
  <motion.div className={className} variants={list} initial="hidden" animate="show">{children}</motion.div>
);

export const Card = ({ className = '', children, ...props }) => (
  <motion.div variants={item} whileHover={{ y: -3 }} className={`card ${className}`} {...props}>{children}</motion.div>
);

// Number that counts up/down to its value.
export function CountUp({ value, format }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);
  useEffect(() => { const c = animate(mv, value, { duration: 0.9, ease: 'easeOut' }); return () => c.stop(); }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}
