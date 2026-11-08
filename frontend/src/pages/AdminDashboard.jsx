import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import StatCard, { StatRow } from '@/components/common/StatCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { FadeIn } from '@/components/common/motion';
import { cn, formatDate, formatLongDate, getCategoryStyle, timeOfDay } from '@/lib/utils';

const SHORTCUTS = [
  { to: '/events', label: 'All events', note: 'edit or remove' },
  { to: '/admin/users', label: 'People', note: 'students and faculty' },
  { to: '/gallery', label: 'Gallery', note: 'photos from past events' },
  { to: '/admin/reports', label: 'Reports', note: 'PDF summaries' },
];

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const DashboardSkeleton = () => (
  <div className="space-y-10">
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    <Skeleton className="h-24 w-full rounded-md" />
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Skeleton className="h-72 rounded-md" />
      <Skeleton className="h-72 rounded-md" />
    </div>
  </div>
);

const SectionTitle = ({ children, aside }) => (
  <div className="mb-1 flex items-baseline justify-between gap-4 border-b pb-2">
    <h2 className="text-xl">{children}</h2>
    {aside}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalParticipants: 0,
    pendingFaculty: 0,
    recentEvents: 0,
    upcomingEvents: 0,
    totalFeedback: 0,
    monthlyRegistrations: 0
  });
  const [loading, setLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [facultyRes, eventsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users/pending'),
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/stats/dashboard')
      ]);

      setPendingFaculty(facultyRes.data);
      setEvents(eventsRes.data.slice(0, 5));
      setAllEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveFaculty = async (facultyId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${facultyId}/approve`);
      toast.success('Faculty approved successfully');
      fetchDashboardData(); // Refresh data
    } catch {
      toast.error('Failed to approve faculty');
    }
  };

  const rejectFaculty = async (facultyId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${facultyId}`);
      toast.success('Faculty rejected');
      fetchDashboardData(); // Refresh data
    } catch {
      toast.error('Failed to reject faculty');
    }
  };

  // Called after the user confirms in the ConfirmDialog (replaces window.confirm)
  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch {
      toast.error('Failed to delete event');
    }
  };

  if (loading) return <DashboardSkeleton />;

  // Category breakdown computed from the already-fetched events list
  const categoryCounts = allEvents.reduce((acc, e) => {
    const key = e.category || 'other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const categoryRows = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryRows.length ? categoryRows[0][1] : 0;

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const pendingCount = stats.pendingFaculty || 0;
  const summary = [
    plural(stats.upcomingEvents || 0, 'upcoming event', 'upcoming events'),
    pendingCount === 0
      ? 'nobody waiting for approval'
      : `${plural(pendingCount, 'faculty member', 'faculty members')} waiting for approval`,
    `${plural(stats.monthlyRegistrations || 0, 'registration', 'registrations')} this month`,
  ].join(', ');

  return (
    <div className="space-y-10">
      {/* Header */}
      <FadeIn className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="meta mb-2">{formatLongDate()}</p>
          <h1 className="text-[2.2rem] leading-[1.1] sm:text-[2.8rem]">
            {timeOfDay()}, <em>{firstName}.</em>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl">{summary.charAt(0).toUpperCase() + summary.slice(1)}.</p>
        </div>
        <Button asChild variant="accent" className="self-start sm:self-auto">
          <Link to="/create-event">New event</Link>
        </Button>
      </FadeIn>

      {/* Figures */}
      <FadeIn delay={0.05}>
        <StatRow>
          <StatCard label="Events" value={stats.totalEvents} hint={`${stats.recentEvents} added in the last 7 days`} />
          <StatCard label="Upcoming" value={stats.upcomingEvents} />
          <StatCard label="Registrations" value={stats.totalParticipants} hint={`${stats.monthlyRegistrations} this month`} />
          <StatCard label="Students" value={stats.totalStudents} />
          <StatCard
            label="Faculty"
            value={stats.totalFaculty}
            hint={pendingCount > 0 ? `${pendingCount} waiting for approval` : 'none waiting'}
            tone={pendingCount > 0 ? 'accent' : undefined}
          />
        </StatRow>
      </FadeIn>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
        {/* Main column */}
        <div className="min-w-0 space-y-12">
          {/* Pending faculty approvals */}
          <FadeIn delay={0.1}>
            <section>
              <SectionTitle
                aside={
                  <Link to="/admin/users" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">
                    All people
                  </Link>
                }
              >
                Waiting for approval
              </SectionTitle>
              {pendingFaculty.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">
                  No faculty sign-ups to review. New ones will show up here.
                </p>
              ) : (
                <ul className="divide-y">
                  {pendingFaculty.map(faculty => (
                    <li key={faculty.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{faculty.name}</p>
                        <p className="text-muted-foreground truncate text-sm">
                          {faculty.department ? `${faculty.department} · ` : ''}{faculty.email}
                        </p>
                        <p className="meta mt-1">Applied {formatDate(faculty.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" onClick={() => approveFaculty(faculty.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => rejectFaculty(faculty.id)}>
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </FadeIn>

          {/* Recent events */}
          <FadeIn delay={0.15}>
            <section>
              <SectionTitle
                aside={
                  <Link to="/events" className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline">
                    See all
                  </Link>
                }
              >
                Recent events
              </SectionTitle>
              {events.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">
                  No events yet. <Link to="/create-event" className="text-foreground underline underline-offset-4">Post the first one</Link>.
                </p>
              ) : (
                <ul className="divide-y">
                  {events.map(event => {
                    const isPastEvent = new Date(event.event_date) < new Date();
                    const cat = getCategoryStyle(event.category);
                    const d = new Date(event.event_date);

                    return (
                      <li key={event.id} className="group flex items-center gap-4 py-3.5">
                        <Link to={`/events/${event.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="w-11 shrink-0 text-center leading-none">
                            <span className="font-serif text-[1.7rem] font-medium tabular">{d.getDate()}</span>
                            <span className="meta block">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="group-hover:text-primary truncate font-medium transition-colors">{event.title}</p>
                            <p className="text-muted-foreground flex items-center gap-2 truncate text-sm">
                              <span className={cn('size-2 shrink-0 rounded-full', cat.dot)} />
                              <span>{cat.label}</span>
                              {event.location && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="truncate">{event.location}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={cn('meta', !isPastEvent && 'text-success')}>
                            {isPastEvent ? 'Past' : 'Upcoming'}
                          </span>
                          {isPastEvent && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${event.title}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setEventToDelete({ id: event.id, title: event.title });
                              }}
                            >
                              <Trash2 strokeWidth={1.75} />
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </FadeIn>
        </div>

        {/* Side column */}
        <aside className="space-y-12">
          <FadeIn delay={0.2}>
            <section>
              <SectionTitle aside={<span className="meta">{plural(allEvents.length, 'event', 'events')}</span>}>
                By category
              </SectionTitle>
              {categoryRows.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">Nothing to count yet.</p>
              ) : (
                <ul className="mt-3 space-y-3.5">
                  {categoryRows.map(([category, count]) => {
                    const cat = getCategoryStyle(category);
                    return (
                      <li key={category}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span>{cat.label}</span>
                          <span className="meta tabular">{count}</span>
                        </div>
                        <div className="bg-border/70 mt-1.5 h-px">
                          <div
                            className={cn('h-[3px] -translate-y-px', cat.dot)}
                            style={{ width: `${maxCategory ? (count / maxCategory) * 100 : 0}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </FadeIn>

          <FadeIn delay={0.25}>
            <section>
              <SectionTitle>Shortcuts</SectionTitle>
              <ul className="divide-y">
                {SHORTCUTS.map(({ to, label, note }) => (
                  <li key={to}>
                    <Link to={to} className="group flex items-center justify-between gap-3 py-2.5">
                      <span>
                        <span className="group-hover:text-primary transition-colors">{label}</span>
                        <span className="text-muted-foreground text-sm"> — {note}</span>
                      </span>
                      <ArrowRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" strokeWidth={1.75} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </FadeIn>
        </aside>
      </div>

      <ConfirmDialog
        open={!!eventToDelete}
        onOpenChange={(o) => !o && setEventToDelete(null)}
        title="Delete event?"
        description={eventToDelete ? `Are you sure you want to delete "${eventToDelete.title}"? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        onConfirm={() => {
          const target = eventToDelete;
          setEventToDelete(null);
          if (target) handleDeleteEvent(target.id, target.title);
        }}
      />
    </div>
  );
};

export default AdminDashboard;
