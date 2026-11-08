import { motion } from 'motion/react';

/*
 * Small, quick entrance animations. Use sparingly – page sections, not every element.
 *   <FadeIn delay={0.05}>...</FadeIn>
 *   <Stagger className="grid ..."><StaggerItem>…</StaggerItem></Stagger>
 */
export function FadeIn({ children, delay = 0, y = 6, className, as = 'div', ...props }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function Stagger({ children, className, stagger = 0.03, delay = 0, ...props }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
