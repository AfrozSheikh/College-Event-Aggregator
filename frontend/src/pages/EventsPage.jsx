import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EventCard from '@/components/common/EventCard';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { FadeIn } from '@/components/common/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/misc';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getCategoryStyle } from '@/lib/utils';

const EventsPage = () => {
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const categories = [
    'all', 'technical', 'cultural', 'sports',
    'workshop', 'seminar', 'competition', 'conference'
  ];

  const departments = [
    'all', 'CSE', 'IT', 'AI', 'EE', 'MECH', 'CIVIL', 'ENTC', 'Chemical', 'Robotics'
  ];

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'past' || type === 'future') {
      setEventType(type);
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory, selectedDepartment, eventType]);

  useEffect(() => {
    if (user?.role === 'student') {
      checkRegistrationStatus();
    }
  }, [user, filteredEvents]);

  const checkRegistrationStatus = async () => {
    try {
      const statusMap = {};
      for (const event of filteredEvents) {
        const response = await axios.get(
          `https://college-event-aggregator-i3la.onrender.com/api/participations/check/${event.id}/${user.id}`
        );
        statusMap[event.id] = response.data.isRegistered;
      }
      setRegistrationStatus(statusMap);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get('https://college-event-aggregator-i3la.onrender.com/api/events');
      setEvents(response.data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by type (past/future)
    const today = new Date();
    if (eventType === 'past') {
      filtered = filtered.filter(event => new Date(event.event_date) < today);
    } else if (eventType === 'future') {
      filtered = filtered.filter(event => new Date(event.event_date) >= today);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(event => event.organizer_department === selectedDepartment);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`https://college-event-aggregator-i3la.onrender.com/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setEventType('all');
  };

  const canManageEvents = user?.role === 'admin' || user?.role === 'faculty';
  const hasActiveFilters =
    searchTerm !== '' || selectedCategory !== 'all' || selectedDepartment !== 'all' || eventType !== 'all';

  const header = (
    <PageHeader
      title="Events"
      description={
        loading
          ? 'Everything happening around campus, past and upcoming.'
          : `${events.length} ${events.length === 1 ? 'event' : 'events'} on the board, past and upcoming.`
      }
      actions={
        canManageEvents && (
          <Button asChild variant="accent">
            <Link to="/create-event">
              <Plus /> New event
            </Link>
          </Button>
        )
      }
    />
  );

  if (loading) {
    return (
      <div>
        {header}
        <Skeleton className="mb-8 h-10 w-full max-w-xl" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="h-44 rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}

      {/* Filters: one quiet row, then the category chips */}
      <FadeIn delay={0.05} className="mb-8 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 lg:max-w-sm">
            <Search
              strokeWidth={1.75}
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, description or venue"
              aria-label="Search events"
              className="pr-9 pl-9"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Tabs value={eventType} onValueChange={setEventType} className="lg:ml-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="future">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 lg:ml-auto">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Department">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept === 'all' ? 'All departments' : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {categories.map(cat => {
            const style = getCategoryStyle(cat);
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={active}
                className={cn(
                  'focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {cat === 'all' ? (
                  'Any category'
                ) : (
                  <>
                    <span className={cn('size-1.5 rounded-full', style.dot)} />
                    {style.label}
                  </>
                )}
              </button>
            );
          })}
        </div>

        <p className="meta">
          Showing {filteredEvents.length} of {events.length}
        </p>
      </FadeIn>

      {filteredEvents.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'Nothing matches those filters' : 'No events posted yet'}
          description={
            hasActiveFilters
              ? 'Try another category or department, or clear the filters to see everything.'
              : 'Check back soon – new events show up here as soon as they are posted.'
          }
          action={
            hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <FadeIn
          key={`${eventType}-${selectedCategory}-${selectedDepartment}`}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredEvents.map(event => {
            const isUpcoming = new Date(event.event_date) >= new Date();
            const isRegistered = registrationStatus[event.id];
            const guardRegistered = e => {
              if (registrationStatus[event.id]) {
                e.preventDefault();
                toast.error('You are already registered for this event');
              }
            };
            return (
              <EventCard
                key={event.id}
                event={event}
                badge={
                  user?.role === 'student' && isRegistered ? (
                    <Badge variant="success">
                      <Check /> Registered
                    </Badge>
                  ) : null
                }
                actions={
                  <>
                    {user?.role === 'student' && isUpcoming && (
                      isRegistered ? (
                        <Link
                          to={`/events/${event.id}/participate`}
                          onClick={guardRegistered}
                          className="text-success inline-flex cursor-not-allowed items-center gap-1 text-sm font-medium"
                        >
                          <Check className="size-4" /> You're in
                        </Link>
                      ) : (
                        <Button asChild size="sm" variant="accent">
                          <Link to={`/events/${event.id}/participate`} onClick={guardRegistered}>
                            Register
                          </Link>
                        </Button>
                      )
                    )}

                    {canManageEvents && (
                      <div className="flex gap-0.5">
                        <Button asChild size="icon-sm" variant="ghost" aria-label="Edit event">
                          <Link to={`/edit-event/${event.id}`}>
                            <Pencil strokeWidth={1.75} />
                          </Link>
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Delete event"
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(event)}
                        >
                          <Trash2 strokeWidth={1.75} />
                        </Button>
                      </div>
                    )}
                  </>
                }
              />
            );
          })}
        </FadeIn>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this event?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" and all its data will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete event"
        onConfirm={() => {
          handleDeleteEvent(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default EventsPage;
