import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/common/Loaders';
import { FadeIn } from '@/components/common/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, fileUrl, getCategoryStyle } from '@/lib/utils';

const isUpcomingDate = (date) => new Date(date) >= new Date();

const textLink = 'text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline';

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      // Fetch student's participations
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/participations/student/${user.id}`);
      const regs = response.data;
      setRegistrations(regs);

      // Check feedback status for each registration
      const statusPromises = regs.map(async (reg) => {
        try {
          // Check if feedback form exists
          await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/event/${reg.event_id}`);

          // Check if student has submitted
          const statusResponse = await axios.get(
            `https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/check/${reg.event_id}/${user.id}`
          );

          return {
            eventId: reg.event_id,
            hasForm: true,
            hasSubmitted: statusResponse.data.hasSubmitted
          };
        } catch {
          // No feedback form exists for this event
          return {
            eventId: reg.event_id,
            hasForm: false,
            hasSubmitted: false
          };
        }
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.eventId] = status;
      });
      setFeedbackStatus(statusMap);

    } catch (error) {
      console.error('Failed to load registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Your activity"
      title="My registrations"
      description="Every event you've signed up for, with your payment and documents in one place."
      actions={
        <Button asChild variant="accent">
          <Link to="/events">Browse events</Link>
        </Button>
      }
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const upcomingCount = registrations.filter(reg => isUpcomingDate(reg.event_date)).length;
  const pastCount = registrations.length - upcomingCount;
  const filtered = registrations.filter(reg => {
    if (filter === 'upcoming') return isUpcomingDate(reg.event_date);
    if (filter === 'past') return !isUpcomingDate(reg.event_date);
    return true;
  });

  const count = (n) => <span className="meta tabular">{n}</span>;

  return (
    <div>
      {header}

      {registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="When you register for an event, it'll be listed here with your receipt and documents."
          action={
            <Button asChild variant="accent">
              <Link to="/events">Browse events</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="all">All {count(registrations.length)}</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming {count(upcomingCount)}</TabsTrigger>
              <TabsTrigger value="past">Past {count(pastCount)}</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length === 0 ? (
            <EmptyState
              title={filter === 'upcoming' ? 'No upcoming registrations' : 'No past registrations'}
              description={
                filter === 'upcoming'
                  ? "You haven't signed up for anything coming up. Have a look at what's on."
                  : 'Events you attended will show up here once they are over.'
              }
              action={
                <Button asChild variant="outline">
                  <Link to="/events">Browse events</Link>
                </Button>
              }
            />
          ) : (
            <FadeIn key={filter}>
              <ul className="divide-y border-y">
                {filtered.map(reg => {
                  const upcoming = isUpcomingDate(reg.event_date);
                  const cat = getCategoryStyle(reg.category);
                  const status = feedbackStatus[reg.event_id];
                  const eventDate = new Date(reg.event_date);

                  return (
                    <li key={reg.id} className="flex gap-5 py-6 sm:gap-7">
                      {/* Date stub */}
                      <div className="flex w-14 shrink-0 flex-col items-center border-r border-dashed pr-5 text-center sm:w-16 sm:pr-7">
                        <span className="meta uppercase">
                          {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                        <span className="font-serif text-[2.2rem] leading-none font-medium tabular">
                          {eventDate.getDate()}
                        </span>
                        <span className="meta mt-1">
                          {eventDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0">
                            <Link to={`/events/${reg.event_id}`} className="hover:text-primary transition-colors">
                              <h3 className="text-[1.3rem] leading-snug">{reg.event_title}</h3>
                            </Link>
                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                              <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cat.text)}>
                                <span className={cn('size-1.5 rounded-full', cat.dot)} />
                                {cat.label}
                              </span>
                              <span className="text-muted-foreground min-w-0 truncate">{reg.location}</span>
                            </p>
                          </div>
                          <Badge variant={upcoming ? 'success' : 'secondary'} className="shrink-0">
                            {upcoming ? 'Upcoming' : 'Completed'}
                          </Badge>
                        </div>

                        <p className="meta mt-3 break-words">
                          Registered{' '}
                          {new Date(reg.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {reg.team_members ? `Team: ${reg.team_members}` : 'Individual'}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/events/${reg.event_id}`}>View event</Link>
                          </Button>

                          {/* Dynamic Feedback Form Button */}
                          {status?.hasForm && !status?.hasSubmitted && (
                            <Button asChild size="sm" variant="accent">
                              <Link to={`/events/${reg.event_id}/feedback-form`}>Give feedback</Link>
                            </Button>
                          )}

                          {status?.hasForm && status?.hasSubmitted && (
                            <span className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
                              <Check className="size-4" strokeWidth={2} /> Feedback sent
                            </span>
                          )}

                          {/* Legacy Feedback (for events without dynamic form) */}
                          {!status?.hasForm && new Date(reg.event_date) < new Date() && (
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/events/${reg.event_id}/feedback`}>Give feedback</Link>
                            </Button>
                          )}

                          {reg.payment_screenshot_url && (
                            <a
                              href={fileUrl(reg.payment_screenshot_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={textLink}
                            >
                              Payment screenshot
                            </a>
                          )}

                          {reg.document_url && (
                            <a
                              href={fileUrl(reg.document_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={textLink}
                            >
                              Uploaded document
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </FadeIn>
          )}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
