import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Building2, IdCard, Lock, Mail, Phone, School, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Brand from '@/components/common/Brand';
import { FadeIn } from '@/components/common/motion';
import ThemeToggle from '@/components/common/ThemeToggle';
import { ErrorMessage, IconInput, PasswordInput, PasswordStrength } from '@/components/FormHelpers';
import { cn } from '@/lib/utils';

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    description: 'Find events and register for them.',
  },
  {
    value: 'faculty',
    label: 'Faculty',
    description: 'Post and run events for your department.',
  },
];

const STUDENT_POINTS = [
  ['Register for events', 'Sign up for anything on the board: fests, workshops, seminars, matches.'],
  ['Upload payment proof', 'For paid events, attach your payment screenshot so the organiser can confirm your seat.'],
  ['Leave feedback', 'After an event, tell the organisers what worked and what didn’t.'],
];

const PointNumber = ({ n }) => (
  <span className="text-muted-foreground w-5 shrink-0 font-serif text-lg leading-6 italic tabular">{n}.</span>
);

/** Plain explanation of what an account is for. No numbers, no quotes. */
const AboutAccounts = () => (
  <aside className="bg-card hidden border-l lg:block">
    <div className="sticky top-0 flex min-h-screen flex-col px-10 py-12 xl:px-14">
      <h2 className="border-b pb-4 text-2xl font-medium">
        What an account <em className="text-muted-foreground font-normal">is for</em>
      </h2>

      <section className="mt-8">
        <p className="meta">If you’re a student</p>
        <ol className="mt-3 space-y-4">
          {STUDENT_POINTS.map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <PointNumber n={i + 1} />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 border-t pt-8">
        <p className="meta">If you’re faculty</p>
        <ol className="mt-3 space-y-4" start={4}>
          <li className="flex gap-4">
            <PointNumber n={4} />
            <div>
              <p className="font-medium">Post events</p>
              <p className="text-muted-foreground mt-0.5 text-sm">
                An admin checks faculty accounts first. Once <span className="marker text-foreground">you’re approved</span>, you
                can put events on the board and see who has registered.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </aside>
);

const Signup = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Student specific
    collegeName: '',
    course: '',
    year: '',
    // Faculty specific
    facultyId: '',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters, spaces, dots, hyphens, and apostrophes';
    }

    // Email validation — only @gmail.com allowed
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.email.trim())) {
      newErrors.email = 'Only Gmail addresses are allowed (e.g. example@gmail.com)';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/[\s\-+]/g, '');
      if (!/^(\+?91)?[6-9]\d{9}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid 10-digit Indian phone number';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else {
      const passwordErrors = [];
      if (!/[A-Z]/.test(formData.password)) passwordErrors.push('one uppercase letter');
      if (!/[a-z]/.test(formData.password)) passwordErrors.push('one lowercase letter');
      if (!/[0-9]/.test(formData.password)) passwordErrors.push('one digit');
      // eslint-disable-next-line no-useless-escape
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) passwordErrors.push('one special character');
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain at least ${passwordErrors.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validations
    if (role === 'student') {
      if (!formData.collegeName.trim()) {
        newErrors.collegeName = 'College name is required';
      } else if (formData.collegeName.trim().length < 3) {
        newErrors.collegeName = 'College name must be at least 3 characters';
      }

      if (!formData.course.trim()) {
        newErrors.course = 'Course is required';
      } else if (formData.course.trim().length < 2) {
        newErrors.course = 'Course must be at least 2 characters';
      }

      if (!formData.year) {
        newErrors.year = 'Please select your year';
      }
    } else if (role === 'faculty') {
      if (!formData.facultyId.trim()) {
        newErrors.facultyId = 'Faculty ID is required';
      } else if (formData.facultyId.trim().length < 3) {
        newErrors.facultyId = 'Faculty ID must be at least 3 characters';
      }

      if (!formData.department.trim()) {
        newErrors.department = 'Department is required';
      } else if (formData.department.trim().length < 2) {
        newErrors.department = 'Department must be at least 2 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the highlighted errors before submitting');
      // Scroll to top so user can see the error summary
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      role: role
    };

    if (role === 'student') {
      userData.collegeName = formData.collegeName.trim();
      userData.course = formData.course.trim();
      userData.year = formData.year;
    } else if (role === 'faculty') {
      userData.facultyId = formData.facultyId.trim();
      userData.department = formData.department.trim();
    }

    setSubmitting(true);
    let result;
    try {
      result = await signup(userData);
    } finally {
      setSubmitting(false);
    }
    if (result.success) {
      navigate('/login');
    }
  };

  const selectRole = (value) => {
    setRole(value);
    setErrors({});
  };

  // Inline error message for a field
  const renderError = (field) => (
    <ErrorMessage id={`${field}-error`} error={errors[field]} touched />
  );

  // Error summary box that shows all errors at the top of the form
  const errorEntries = Object.values(errors).filter(Boolean);
  const renderErrorSummary = () => (
    <AnimatePresence initial={false}>
      {errorEntries.length > 0 && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="border-destructive bg-destructive/5 border-l-2 py-3 pr-4 pl-4">
            <h3 className="text-destructive font-sans text-sm font-semibold">
              Please fix the following {errorEntries.length} error{errorEntries.length > 1 ? 's' : ''}:
            </h3>
            <ul className="text-destructive/90 mt-1.5 list-inside list-disc space-y-0.5 text-sm">
              {errorEntries.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Text-like field with label, leading icon and inline error
  const renderField = ({ name, label, icon, type = 'text', placeholder, autoComplete, className }) => (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={`signup-${name}`}>{label}</Label>
      <IconInput
        id={`signup-${name}`}
        name={name}
        type={type}
        icon={icon}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {renderError(name)}
    </div>
  );

  const sectionTitle = 'border-b pb-2 text-lg font-medium';
  const passwordsMatch = formData.password === formData.confirmPassword;

  return (
    <div className="bg-background grid min-h-screen lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Brand />
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground mr-1 hidden text-sm sm:inline">Have an account?</span>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 justify-center px-5 pt-6 pb-16 sm:px-10">
          <FadeIn className="w-full max-w-xl">
            <h1 className="text-[2.4rem] leading-[1.1] font-medium tracking-tight">
              Make yourself an <em className="text-primary">account</em>.
            </h1>
            <p className="text-muted-foreground mt-3">Takes a couple of minutes. Every field below is needed.</p>

            {/* Role selection */}
            <div className="mt-8">
              <p className="mb-2.5 text-sm font-medium" id="role-label">I’m signing up as</p>
              <div role="radiogroup" aria-labelledby="role-label" className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => selectRole(r.value)}
                      className={cn(
                        'bg-card flex cursor-pointer items-start gap-3 rounded-md border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:p-4',
                        active ? 'border-foreground' : 'hover:border-foreground/30'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                          active ? 'border-foreground' : 'border-foreground/30'
                        )}
                      >
                        {active && <span className="bg-foreground size-2 rounded-full" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{r.label}</span>
                        <span className="text-muted-foreground mt-0.5 block text-xs">{r.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-9" noValidate>
              {renderErrorSummary()}

              {/* Personal details */}
              <section className="space-y-4">
                <h3 className={sectionTitle}>About you</h3>
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  {renderField({ name: 'name', label: 'Full name', icon: User, placeholder: 'John Doe', autoComplete: 'name', className: 'sm:col-span-2' })}
                  {renderField({ name: 'email', label: 'Email (Gmail only)', icon: Mail, type: 'email', placeholder: 'john@gmail.com', autoComplete: 'email' })}
                  {renderField({ name: 'phone', label: 'Phone number', icon: Phone, type: 'tel', placeholder: '+91 9876543210', autoComplete: 'tel' })}
                </div>
              </section>

              {/* Role-specific details */}
              <section className="space-y-4">
                <h3 className={sectionTitle}>{role === 'student' ? 'Where you study' : 'Where you teach'}</h3>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    {/* p-px keeps input focus rings from being clipped by overflow-hidden */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 p-px sm:grid-cols-2">
                      {role === 'student' ? (
                        <>
                          {renderField({ name: 'collegeName', label: 'College name', icon: School, placeholder: 'Enter college name', autoComplete: 'organization', className: 'sm:col-span-2' })}
                          {renderField({ name: 'course', label: 'Course', icon: BookOpen, placeholder: 'B.Tech CSE' })}
                          <div className="space-y-2">
                            <Label htmlFor="signup-year">Year</Label>
                            <Select
                              name="year"
                              value={formData.year}
                              onValueChange={(value) => handleChange({ target: { name: 'year', value } })}
                            >
                              <SelectTrigger
                                id="signup-year"
                                aria-invalid={!!errors.year || undefined}
                                aria-describedby={errors.year ? 'year-error' : undefined}
                                className="h-10 w-full"
                              >
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1st Year">1st Year</SelectItem>
                                <SelectItem value="2nd Year">2nd Year</SelectItem>
                                <SelectItem value="3rd Year">3rd Year</SelectItem>
                                <SelectItem value="4th Year">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                            {renderError('year')}
                          </div>
                        </>
                      ) : (
                        <>
                          {renderField({ name: 'facultyId', label: 'Faculty ID', icon: IdCard, placeholder: 'FAC12345' })}
                          {renderField({ name: 'department', label: 'Department', icon: Building2, placeholder: 'Computer Science' })}
                        </>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </section>

              {/* Security */}
              <section className="space-y-4">
                <h3 className={sectionTitle}>A password</h3>
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <PasswordInput
                      id="signup-password"
                      name="password"
                      icon={Lock}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                    />
                    {renderError('password')}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirmPassword">Confirm password</Label>
                    <PasswordInput
                      id="signup-confirmPassword"
                      name="confirmPassword"
                      icon={Lock}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    />
                    <AnimatePresence initial={false}>
                      {formData.confirmPassword && !errors.confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn('overflow-hidden text-xs', passwordsMatch ? 'text-success' : 'text-muted-foreground')}
                        >
                          {passwordsMatch ? 'Passwords match.' : 'Passwords don’t match yet.'}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {renderError('confirmPassword')}
                  </div>

                  <div className="sm:col-span-2">
                    {!formData.password && (
                      <p id="password-hint" className="text-muted-foreground text-xs">
                        At least 8 characters, with an uppercase letter, a lowercase letter, a digit and a special character.
                      </p>
                    )}
                    <AnimatePresence initial={false}>
                      {formData.password && <PasswordStrength password={formData.password} />}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              <div className="border-t pt-6">
                <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto sm:px-8" loading={submitting}>
                  {submitting ? 'Creating account…' : 'Create account'}
                </Button>
                <p className="text-muted-foreground mt-4 text-sm">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-foreground decoration-foreground/30 hover:decoration-foreground font-medium underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                  .
                </p>
              </div>
            </form>
          </FadeIn>
        </div>
      </main>

      <AboutAccounts />
    </div>
  );
};

export default Signup;
