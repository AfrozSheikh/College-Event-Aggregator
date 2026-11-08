import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import StatCard, { StatRow } from '@/components/common/StatCard';
import EventCard from '@/components/common/EventCard';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { PageSkeleton } from '@/components/common/Loaders';
import { FadeIn } from '@/components/common/motion';
import { formatDate, formatLongDate, timeOfDay } from '@/lib/utils';

const isUpcomingEvent = (event) => new Date(event.event_date) >= new Date();

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const FacultyDashboard = ({ view = 'dashboard' }) => {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0
  });
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes] = await Promise.all([
        axios.get('https://college-event-aggregator-i3la.onrender.com/api/events')
      ]);

      const allEventsData = eventsRes.data;
      setAllEvents(allEventsData);

      // Filter events created by this faculty
      const facultyEvents = allEventsData.filter(event => event.created_by === user?.id);
      setMyEvents(facultyEvents);

      // Calculate stats
      setStats({
        myEvents: facultyEvents.length,
        totalParticipants: 0, // Would need additional API
        upcomingEvents: facultyEvents.filter(e => new Date(e.event_date) >= new Date()).length
      });
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`https://college-event-aggregator-i3la.onrender.com/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const deleteDialog = (
    <ConfirmDialog
      open={!!eventToDelete}
      onOpenChange={(open) => !open && setEventToDelete(null)}
      title="Delete this event?"
      description={
        eventToDelete
          ? `"${eventToDelete.title}" and its registrations will be permanently removed. This cannot be undone.`
          : undefined
      }
      confirmLabel="Delete event"
      onConfirm={() => {
        const target = eventToDelete;
        setEventToDelete(null);
        if (target) handleDeleteEvent(target.id);
      }}
    />
  );

  const renderEventActions = (event) => (
    <>
      <Button asChild size="sm" variant="ghost" className="h-8 px-2.5">
        <Link to={`/events/${event.id}`} aria-label={`View ${event.title}`}>View</Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="h-8 px-2.5">
        <Link to={`/edit-event/${event.id}`} aria-label={`Edit ${event.title}`}>Edit</Link>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Delete ${event.title}`}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 px-2.5"
        onClick={() => setEventToDelete(event)}
      >
        Delete
      </Button>
    </>
  );

  const renderEventGrid = (events, emptyProps) =>
    events.length === 0 ? (
      <EmptyState {...emptyProps} />
    ) : (
      <FadeIn className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {events.map(event => (
          <EventCard key={event.id} event={event} actions={renderEventActions(event)} />
        ))}
      </FadeIn>
    );

  const createButton = (
    <Button asChild variant="accent">
      <Link to="/create-event">
        <Plus strokeWidth={1.75} /> New event
      </Link>
    </Button>
  );

  if (loading) return <PageSkeleton stats={view === 'events' ? 0 : 3} cards={view === 'events' ? 6 : 3} />;

  const upcomingList = myEvents.filter(isUpcomingEvent);
  const pastList = myEvents.filter(event => !isUpcomingEvent(event));

  if (view === 'events') {
    return (
      <div>
        <PageHeader
          eyebrow="Faculty"
          title="My events"
          description="Everything you've put up, in one place. Open one to see who's registered, or edit and remove it here."
          actions={createButton}
        />

        {myEvents.length === 0 ? (
          <EmptyState
            title="You haven't created any events yet"
            description="Once you post an event, it'll show up here for you to edit or remove."
            action={createButton}
          />
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="w-full sm:w-fit">
              <TabsTrigger value="all">
                All <span className="meta tabular">{myEvents.length}</span>
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming <span className="meta tabular">{upcomingList.length}</span>
              </TabsTrigger>
              <TabsTrigger value="past">
                Past <span className="meta tabular">{pastList.length}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {renderEventGrid(myEvents, { title: 'No events yet' })}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-4">
              {renderEventGrid(upcomingList, {
                title: 'Nothing coming up',
                description: 'All your events are in the past. Post a new one when you have something planned.',
                action: createButton,
              })}
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              {renderEventGrid(pastList, {
                title: 'No past events yet',
                description: 'Events move here once their date has gone by.',
              })}
            </TabsContent>
          </Tabs>
        )}

        {deleteDialog}
      </div>
    );
  }

  const firstName = (user?.name || '').trim().split(' ')[0];
  const completed = Math.max(stats.myEvents - stats.upcomingEvents, 0);
  const nextEvent = [...upcomingList].sort((a, b) => new Date(a.event_date) - new Date(b.event_date))[0];
  const recentEvents = myEvents.slice(0, 3);

  const summary =
    stats.myEvents === 0
      ? "You haven't put up any events yet. When you do, they'll be listed here."
      : `You've organised ${plural(stats.myEvents, 'event')} so far, and ${
          stats.upcomingEvents === 0 ? 'none are' : stats.upcomingEvents === 1 ? '1 is' : `${stats.upcomingEvents} are`
        } still coming up.`;

  const profileLine = [
    user?.department,
    user?.faculty_id && `ID ${user.faculty_id}`,
    user?.status,
  ].filter(Boolean);

  return (
    <div className="space-y-10">
      {/* Header */}
      <FadeIn className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="meta mb-3">{formatLongDate()}</p>
          <h1 className="text-[2.2rem] leading-[1.1] sm:text-[2.8rem]">
            {timeOfDay()}
            {firstName ? <>, <em>{firstName}</em>.</> : '.'}
          </h1>
          <p className="text-muted-foreground mt-3 text-[1.05rem]">
            {summary}
            {nextEvent && (
              <>
                {' '}Next up is{' '}
                <Link to={`/events/${nextEvent.id}`} className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                  {nextEvent.title}
                </Link>{' '}
                on {formatDate(nextEvent.event_date, { year: undefined })}.
              </>
            )}
          </p>
          {profileLine.length > 0 && (
            <p className="meta mt-4 capitalize">{profileLine.join(' · ')}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Link to="/faculty/my-events" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">
            My events
          </Link>
          {createButton}
        </div>
      </FadeIn>

      {/* Figures */}
      <FadeIn delay={0.05}>
        <StatRow>
          <StatCard label="Events you've organised" value={stats.myEvents} />
          <StatCard label="Coming up" value={stats.upcomingEvents} tone="accent" />
          <StatCard label="Already done" value={completed} />
        </StatRow>
      </FadeIn>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        {/* Recent events */}
        <FadeIn delay={0.1}>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 className="text-2xl">Your recent events</h2>
            {myEvents.length > 0 && (
              <Link
                to="/faculty/my-events"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
              >
                See all <ArrowRight className="size-3.5" strokeWidth={1.75} />
              </Link>
            )}
          </div>

          {recentEvents.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Post your first event and students will be able to find and register for it."
              action={createButton}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recentEvents.map(event => (
                <EventCard key={event.id} event={event} compact actions={renderEventActions(event)} />
              ))}
            </div>
          )}
        </FadeIn>

        {/* Elsewhere */}
        <FadeIn delay={0.15} className="lg:border-l lg:pl-8">
          <h2 className="mb-3 text-lg">Elsewhere</h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/events" className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">
                Browse every event on campus
              </Link>
            </li>
            <li>
              <Link to="/gallery" className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">
                Photos from past events
              </Link>
            </li>
          </ul>
        </FadeIn>
      </div>

      {deleteDialog}
    </div>
  );
};

export default FacultyDashboard;
