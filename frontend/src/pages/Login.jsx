import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/misc';
import Brand from '@/components/common/Brand';
import { FadeIn } from '@/components/common/motion';
import ThemeToggle from '@/components/common/ThemeToggle';
import { IconInput, PasswordInput } from '@/components/FormHelpers';
import { cn, formatTime, getCategoryStyle } from '@/lib/utils';

const BOARD_LIMIT = 6;

/** Real upcoming events from the public endpoint, pinned like notices. Fails quietly. */
const UpcomingBoard = () => {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get('https://college-event-aggregator-i3la.onrender.com/api/events/type/future')
      .then((res) => {
        if (!cancelled) setEvents(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = events ? events.slice(0, BOARD_LIMIT) : [];
  const more = events ? events.length - shown.length : 0;

  return (
    <aside className="bg-card hidden border-l lg:flex lg:min-h-screen lg:flex-col">
      <div className="flex flex-1 flex-col px-10 py-12 xl:px-16">
        <div className="flex items-baseline justify-between border-b pb-4">
          <h2 className="text-2xl font-medium">
            On the board <em className="text-muted-foreground font-normal">right now</em>
          </h2>
          {events && events.length > 0 && (
            <span className="meta">
              {events.length} upcoming
            </span>
          )}
        </div>

        {events === null ? (
          <ul className="divide-y" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex gap-5 py-5">
                <Skeleton className="h-11 w-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <div className="py-10">
            <p className="font-serif text-xl italic">Nothing pinned yet.</p>
            <p className="text-muted-foreground mt-1 text-sm">New events show up here as soon as they're posted.</p>
          </div>
        ) : (
          <FadeIn as="ul" className="divide-y">
            {shown.map((event) => {
              const cat = getCategoryStyle(event.category);
              const date = new Date(event.event_date);
              return (
                <li key={event.id} className="flex gap-5 py-5">
                  <div className="w-10 shrink-0 text-center">
                    <span className="block font-serif text-[1.75rem] leading-none font-medium tabular">{date.getDate()}</span>
                    <span className="meta mt-1 block">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-[1.1rem] leading-snug">{event.title}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cat.text)}>
                        <span className={cn('size-1.5 rounded-full', cat.dot)} />
                        {cat.label}
                      </span>
                      <span className="meta truncate">
                        {[formatTime(event.event_time), event.location].filter(Boolean).join(' · ')}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </FadeIn>
        )}

        {more > 0 && <p className="meta border-t pt-4">and {more} more once you sign in.</p>}

        <p className="text-muted-foreground mt-auto max-w-sm pt-10 text-sm">
          Fests, seminars, workshops and matches from across the college, posted by the people running them.
        </p>
      </div>
    </aside>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    let result;
    try {
      result = await login(email, password);
    } finally {
      setSubmitting(false);
    }

    if (result.success) {
      switch (result.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'faculty':
          navigate('/faculty');
          break;
        case 'student':
          navigate('/student');
          break;
      }
    }
  };

  return (
    <div className="bg-background grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Brand />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center px-5 pb-16 sm:px-10">
          <FadeIn className="mx-auto w-full max-w-sm">
            <h1 className="text-[2.4rem] leading-[1.1] font-medium tracking-tight">
              Sign in to the <em className="text-primary">noticeboard</em>.
            </h1>
            <p className="text-muted-foreground mt-3">Use the email you registered with.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <IconInput
                  id="login-email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  required
                  minLength="5"
                  maxLength="100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <PasswordInput
                  id="login-password"
                  icon={Lock}
                  autoComplete="current-password"
                  required
                  minLength="8"
                  maxLength="50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>

              <Button type="submit" variant="accent" size="lg" className="w-full" loading={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="text-muted-foreground mt-6 text-sm">
              No account yet?{' '}
              <Link to="/signup" className="text-foreground font-medium underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                Make one
              </Link>
              .
            </p>

            <p className="meta mt-10 border-t border-dashed pt-4">
              Demo admin: <span className="text-foreground">admin@college.edu</span> / <span className="text-foreground">admin123</span>
            </p>
          </FadeIn>
        </div>
      </main>

      <UpcomingBoard />
    </div>
  );
};

export default Login;
