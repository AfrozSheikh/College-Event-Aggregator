import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { FocusCards } from '@/components/aceternity/focus-cards';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ImageLightbox from '@/components/common/ImageLightbox';
import { FadeIn } from '@/components/common/motion';
import { cn, fileUrl, formatDate, formatTime, getCategoryStyle } from '@/lib/utils';

const GallerySkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-3 border-b pb-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
      <div className="space-y-5">
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-md" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const photoCount = (n) => `${n} ${n === 1 ? 'photo' : 'photos'}`;

const Gallery = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const canManage = user?.role === 'admin' || user?.role === 'faculty';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('https://college-event-aggregator-i3la.onrender.com/api/events/type/past');
      setEvents(response.data);
      if (response.data.length > 0) {
        setSelectedEvent(response.data[0]);
      }
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Confirmation now happens in <ConfirmDialog> before this is called
  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`https://college-event-aggregator-i3la.onrender.com/api/events/${eventId}`);
      toast.success('Event deleted successfully');

      // Remove deleted event from list
      const updatedEvents = events.filter(e => e.id !== eventId);
      setEvents(updatedEvents);

      // If deleted event was selected, select the first available event
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(updatedEvents.length > 0 ? updatedEvents[0] : null);
      }
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const selectEvent = (event) => {
    setLightboxIndex(null);
    setSelectedEvent(event);
  };

  if (loading) return <GallerySkeleton />;

  const images = selectedEvent?.images || [];
  const imageUrls = images.map((image) => fileUrl(image.image_url));
  const category = selectedEvent ? getCategoryStyle(selectedEvent.category) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Gallery"
        title="Photos from past events"
        description="Pick an event to see what the day looked like."
      />

      {events.length === 0 ? (
        <EmptyState
          title="No past events yet"
          description="Once an event is over, its photos will show up here."
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
          {/* Event picker: a scrolling row of text chips on small screens, a ruled list on large ones */}
          <FadeIn delay={0.05} className="min-w-0 lg:sticky lg:top-24">
            <p className="meta mb-3 hidden lg:block">
              {events.length} past {events.length === 1 ? 'event' : 'events'}
            </p>
            <nav aria-label="Past events" className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-2 lg:w-full lg:flex-col lg:gap-0 lg:divide-y lg:border-y">
                {events.map(event => {
                  const active = selectedEvent?.id === event.id;
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => selectEvent(event)}
                        aria-pressed={active}
                        className={cn(
                          'focus-visible:ring-ring/40 flex max-w-60 flex-col rounded-md border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2',
                          'lg:w-full lg:max-w-none lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-2.5',
                          active
                            ? 'border-foreground bg-card lg:border-l-primary lg:bg-transparent'
                            : 'hover:bg-accent/50 lg:border-l-transparent'
                        )}
                      >
                        <span
                          className={cn(
                            'w-full truncate text-sm',
                            active ? 'text-foreground lg:text-primary font-medium' : 'text-foreground/80'
                          )}
                        >
                          {event.title}
                        </span>
                        <span className="meta">
                          {formatDate(event.event_date, { year: undefined })} · {photoCount(event.images?.length || 0)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </FadeIn>

          {/* Selected event */}
          {selectedEvent && (
            <FadeIn key={selectedEvent.id} delay={0.05} className="min-w-0">
              <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', category.text)}>
                    <span className={cn('size-1.5 rounded-full', category.dot)} />
                    {category.label}
                  </span>
                  <h2 className="mt-1 text-[1.75rem] leading-tight">{selectedEvent.title}</h2>
                  <p className="meta mt-2">
                    {formatDate(selectedEvent.event_date)}
                    {selectedEvent.event_time && ` · ${formatTime(selectedEvent.event_time)}`}
                    {selectedEvent.location && ` · ${selectedEvent.location}`}
                    {selectedEvent.organized_by && ` · organised by ${selectedEvent.organized_by}`}
                  </p>
                  {selectedEvent.description && (
                    <p className="text-muted-foreground mt-3 line-clamp-3 max-w-2xl text-sm">{selectedEvent.description}</p>
                  )}
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 self-start"
                    onClick={() => setConfirmDelete({ id: selectedEvent.id, title: selectedEvent.title })}
                  >
                    <Trash2 strokeWidth={1.75} /> Delete event
                  </Button>
                )}
              </header>

              {images.length > 0 ? (
                <>
                  <p className="meta mb-3">{photoCount(images.length)} · click one to see it larger</p>
                  <FocusCards
                    cards={images.map((image, index) => ({
                      key: index,
                      src: imageUrls[index],
                      title: `${selectedEvent.title} – ${index + 1}`,
                      onClick: () => setLightboxIndex(index),
                    }))}
                  />
                </>
              ) : (
                <EmptyState
                  title="No photos for this one yet"
                  description="When the organisers upload pictures from the day, they'll appear here."
                />
              )}
            </FadeIn>
          )}
        </div>
      )}

      <ImageLightbox
        images={imageUrls}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete event?"
        description={confirmDelete ? `Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={() => confirmDelete && handleDeleteEvent(confirmDelete.id)}
      />
    </div>
  );
};

export default Gallery;
