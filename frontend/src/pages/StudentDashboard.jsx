import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard, { StatRow } from '@/components/common/StatCard';
import EventCard from '@/components/common/EventCard';
import EmptyState from '@/components/common/EmptyState';
import { PageSkeleton } from '@/components/common/Loaders';
import { FadeIn } from '@/components/common/motion';
import { cn, formatLongDate, getCategoryStyle, timeOfDay } from '@/lib/utils';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const StudentDashboard = () => {
  const { user, notifications } = useAuth();
  const [futureEvents, setFutureEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [feedbackStatus, setFeedbackStatus] = useState({});

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Calculate unread notifications
    if (notifications && Array.isArray(notifications)) {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  useEffect(() => {
    if (user && futureEvents.length > 0) {
      checkRegistrationStatus();
    }
  }, [user, futureEvents]);

  useEffect(() => {
    if (user && pastEvents.length > 0) {
      checkFeedbackStatus();
    }
  }, [user, pastEvents]);

  const checkRegistrationStatus = async () => {
    try {
      const statusMap = {};
      for (const event of futureEvents) {
        const response = await axios.get(
          `http://localhost:5000/api/participations/check/${event.id}/${user.id}`
        );
        statusMap[event.id] = response.data.isRegistered;
      }
      setRegistrationStatus(statusMap);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const checkFeedbackStatus = async () => {
    try {
      const statusMap = {};
      for (const event of pastEvents) {
        const response = await axios.get(
          `http://localhost:5000/api/feedback-forms/check/${event.id}/${user.id}`
        );
        statusMap[event.id] = response.data.hasSubmitted;
      }
      setFeedbackStatus(statusMap);
    } catch (error) {
      console.error('Error checking feedback status:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const [futureRes, pastRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events/type/future'),
        axios.get('http://localhost:5000/api/events/type/past')
      ]);

      setFutureEvents(futureRes.data.slice(0, 3));
      setPastEvents(pastRes.data.slice(0, 3));
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e, eventId) => {
    if (registrationStatus[eventId]) {
      e.preventDefault();
      toast.error('You are already registered for this event');
    }
  };

  const handleFeedbackClick = (e, eventId) => {
    if (feedbackStatus[eventId]) {
      e.preventDefault();
      toast.error('You have already submitted feedback for this event');
    }
  };

  if (loading) return <PageSkeleton stats={4} cards={3} />;

  const registeredCount = futureEvents.filter(event => registrationStatus[event.id]).length;
  const pendingFeedbackEvents = pastEvents.filter(event => feedbackStatus[event.id] === false);
  const firstName = user?.name?.split(' ')[0] || 'there';

  const registrationSentence =
    futureEvents.length === 0
      ? 'No upcoming events have been posted yet.'
      : `You're registered for ${registeredCount} of the ${futureEvents.length === 1 ? '1 upcoming event' : `next ${futureEvents.length} upcoming events`}.`;
  const feedbackSentence =
    pendingFeedbackEvents.length === 0
      ? 'Nothing waiting for feedback.'
      : `${plural(pendingFeedbackEvents.length, 'event')} waiting for your feedback.`;
  const courseLine = [user?.course, user?.year].filter(Boolean).join(', ');

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <FadeIn as="header" className="grid gap-8 pb-2 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="meta">{formatLongDate()}</p>
          <h1 className="mt-3 text-[2.4rem] leading-[1.05] sm:text-[3rem]">
            {timeOfDay()}, <em>{firstName}.</em>
          </h1>
          <p className="text-muted-foreground mt-3 text-[1.05rem]">
            {registrationSentence} {feedbackSentence}
          </p>
          {(user?.college_name || courseLine) && (
            <p className="meta mt-3">
              {[user?.college_name, courseLine].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild variant="accent">
              <Link to="/events">Browse events</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/student/my-registrations">My registrations</Link>
            </Button>
          </div>
        </div>

        {/* Notifications note */}
        {notifications && Array.isArray(notifications) && unreadCount > 0 && (
          <div className="bg-card flex items-center gap-3 rounded-md border px-4 py-3 text-sm lg:max-w-xs">
            <span className="bg-primary size-2 shrink-0 rounded-full" />
            <span>
              You have {plural(unreadCount, 'unread notification')}.
            </span>
          </div>
        )}
      </FadeIn>

      {/* Figures */}
      <StatRow>
        <StatCard label="Upcoming events" value={futureEvents.length} hint="Next few on the board" />
        <StatCard label="Registered" value={registeredCount} hint="Of those upcoming" tone="accent" />
        <StatCard label="Feedback to give" value={pendingFeedbackEvents.length} hint="From recent events" />
        <StatCard label="Unread notifications" value={unreadCount} />
      </StatRow>

      {/* Pending feedback reminder */}
      {pendingFeedbackEvents.length > 0 && (
        <FadeIn>
          <div className="bg-card rounded-md border border-l-4 border-l-warning px-5 py-4">
            <h2 className="text-xl">Your feedback is waiting</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tell the organisers how {pendingFeedbackEvents.length === 1 ? 'this event' : 'these events'} went. It takes a
              minute or two.
            </p>
            <ul className="mt-3 divide-y border-t">
              {pendingFeedbackEvents.map(event => (
                <li key={event.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0 truncate font-medium">{event.title}</span>
                  <Link
                    to={`/events/${event.id}/feedback-form`}
                    className="text-primary shrink-0 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Give feedback
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      )}

      {/* Upcoming Events */}
      <section>
        <div className="mb-5 flex items-baseline justify-between gap-4 border-b pb-3">
          <h2 className="text-2xl">Coming up</h2>
          <Link to="/events" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
            All events <ArrowRight className="size-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        {futureEvents.length === 0 ? (
          <EmptyState
            title="Nothing on the board yet"
            description="New events will show up here as soon as organisers publish them."
            action={
              <Button asChild variant="outline">
                <Link to="/events">Browse all events</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {futureEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                badge={
                  registrationStatus[event.id] ? (
                    <Badge variant="success">
                      <Check /> Registered
                    </Badge>
                  ) : null
                }
                actions={
                  <>
                    {registrationStatus[event.id] ? (
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground cursor-not-allowed"
                      >
                        <Link
                          to={`/events/${event.id}/participate`}
                          onClick={(e) => handleRegisterClick(e, event.id)}
                          aria-disabled="true"
                        >
                          Already registered
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="accent">
                        <Link
                          to={`/events/${event.id}/participate`}
                          onClick={(e) => handleRegisterClick(e, event.id)}
                        >
                          Register
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/events/${event.id}`}>Details</Link>
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Events for Feedback */}
      <section>
        <div className="mb-1 flex items-baseline justify-between gap-4 border-b pb-3">
          <h2 className="text-2xl">Recently finished</h2>
          <Link
            to="/events?type=past"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            Past events <ArrowRight className="size-3.5" strokeWidth={1.75} />
          </Link>
        </div>

        {pastEvents.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No finished events yet"
            description="Once events wrap up, they'll be listed here so you can leave feedback."
          />
        ) : (
          <ul className="divide-y border-b">
            {pastEvents.map(event => {
              const cat = getCategoryStyle(event.category);
              const submitted = feedbackStatus[event.id];
              const date = new Date(event.event_date);
              return (
                <li key={event.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex min-w-0 flex-1 items-center gap-5">
                    <div className="w-11 shrink-0 text-center">
                      <span className="meta block uppercase">
                        {date.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="font-serif text-[1.7rem] leading-none font-medium tabular">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <Link to={`/events/${event.id}`} className="hover:text-primary transition-colors">
                        <h3 className="truncate text-[1.1rem] leading-snug">{event.title}</h3>
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cat.text)}>
                          <span className={cn('size-1.5 rounded-full', cat.dot)} />
                          {cat.label}
                        </span>
                        <span className="meta truncate">{event.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pl-16 sm:pl-0">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/events/${event.id}`}>Details</Link>
                    </Button>
                    {submitted ? (
                      <Button asChild size="sm" variant="ghost" className="text-success cursor-not-allowed">
                        <Link
                          to={`/events/${event.id}/feedback-form`}
                          onClick={(e) => handleFeedbackClick(e, event.id)}
                          aria-disabled="true"
                        >
                          <Check /> Feedback sent
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to={`/events/${event.id}/feedback-form`}
                          onClick={(e) => handleFeedbackClick(e, event.id)}
                        >
                          Give feedback
                        </Link>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
