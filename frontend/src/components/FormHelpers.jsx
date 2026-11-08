import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Error message component for form fields
export const ErrorMessage = ({ error, touched, id }) => (
  <AnimatePresence initial={false}>
    {error && touched && (
      <motion.p
        id={id}
        role="alert"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        className="text-destructive overflow-hidden pt-1 text-xs"
      >
        {error}
      </motion.p>
    )}
  </AnimatePresence>
);

// Helper function to get input class names based on error state
// eslint-disable-next-line react-refresh/only-export-components
export const getInputClassName = (baseClassName, error, touched) => {
  const errorClass =
    error && touched
      ? 'border-destructive focus-visible:ring-destructive/20'
      : 'border-input focus-visible:border-foreground/60 focus-visible:ring-ring/15';
  return cn(baseClassName, errorClass);
};

/**
 * Input with an optional small leading lucide icon and an optional trailing element.
 * All other props are forwarded to the shadcn <Input>.
 */
export const IconInput = ({ icon: Icon, trailing, className, invalid, ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon
        strokeWidth={1.75}
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2',
          invalid ? 'text-destructive/80' : 'text-muted-foreground/70'
        )}
      />
    )}
    <Input
      aria-invalid={invalid || undefined}
      className={cn('h-10', Icon && 'pl-9', trailing && 'pr-11', className)}
      {...props}
    />
    {trailing && <div className="absolute top-1/2 right-1 -translate-y-1/2">{trailing}</div>}
  </div>
);

/** Password input with an optional leading icon and a show/hide toggle. */
export const PasswordInput = ({ icon, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <IconInput
      icon={icon}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
        </button>
      }
      {...props}
    />
  );
};

// brick while weak, ink while getting there, green when every rule is met
const STRENGTH_LEVELS = [
  { label: 'Too weak', text: 'text-primary', bar: 'bg-primary' },
  { label: 'Weak', text: 'text-primary', bar: 'bg-primary' },
  { label: 'Weak', text: 'text-primary', bar: 'bg-primary' },
  { label: 'Fair', text: 'text-foreground', bar: 'bg-foreground/70' },
  { label: 'Nearly there', text: 'text-foreground', bar: 'bg-foreground' },
  { label: 'Strong', text: 'text-success', bar: 'bg-success' },
];

// Password strength indicator component
export const PasswordStrength = ({ password }) => {
  if (!password) return null;

  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'an uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'a lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'a number', ok: /[0-9]/.test(password) },
    // eslint-disable-next-line no-useless-escape
    { label: 'a special character', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const strength = checks.filter((c) => c.ok).length;
  const level = STRENGTH_LEVELS[strength];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden pt-1"
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {checks.map((_, i) => (
            <span
              key={i}
              className={cn('h-[3px] flex-1 transition-colors duration-200', i < strength ? level.bar : 'bg-border')}
            />
          ))}
        </div>
        <span className={cn('w-20 text-right font-mono text-[11.5px] tracking-tight', level.text)}>{level.label}</span>
      </div>
      <ul className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {checks.map((c) => (
          <li key={c.label} className={cn('transition-colors', c.ok && 'text-foreground line-through decoration-foreground/30')}>
            {c.label}
          </li>
        ))}
      </ul>
    </motion.div>
  );
};
