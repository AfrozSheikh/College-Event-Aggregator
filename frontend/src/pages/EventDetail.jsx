import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Check, FileText, Pencil, Star, Trash2, Users } from 'lucide-react';
import FeedbackFormCreator from '../components/FeedbackFormCreator';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ImageLightbox from '@/components/common/ImageLightbox';
import StatCard, { StatRow } from '@/components/common/StatCard';
import { FadeIn } from '@/components/common/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/misc';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn, fileUrl, formatTime, getCategoryStyle } from '@/lib/utils';

/* Small local helpers */
const SectionTitle = ({ children, aside }) => (
  <div className="mb-4 flex items-baseline justify-between gap-3">
    <h2 className="text-xl">{children}</h2>
    {aside}
  </div>
);

const RatingStars = ({ value }) => {
  const n = parseInt(value) || 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            strokeWidth={1.5}
            className={cn('size-3.5', i < n ? 'fill-foreground text-foreground' : 'text-muted-foreground/40')}
          />
        ))}
      </span>
      <span className="meta">{value}/5</span>
    </span>
  );
};

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isRegistered, setIsRegistered] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [showFeedbackCreator, setShowFeedbackCreator] = useState(false);
  const [hasGivenFeedback, setHasGivenFeedback] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const checkRegistrationStatus = async () => {
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/participations/check/${id}/${user.id}`);
      setIsRegistered(response.data.isRegistered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const checkFeedbackStatus = async () => {
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/check/${id}/${user.id}`);
      setHasGivenFeedback(response.data.hasSubmitted);
    } catch (error) {
      console.error('Error checking feedback status:', error);
    }
  };

  useEffect(() => {
    fetchEventData();

    if (user?.role === 'student') {
      checkRegistrationStatus();
      checkFeedbackStatus();
    }
  }, [id, user]);

  const fetchEventData = async () => {
    try {
      const [eventRes, participationsRes, feedbackRes] = await Promise.all([
        axios.get(`https://college-event-aggregator-i3la.onrender.com/api/events/${id}`),
        user?.role === 'admin' ? axios.get(`https://college-event-aggregator-i3la.onrender.com/api/participations/event/${id}`) : Promise.resolve({ data: [] }),
        axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback/event/${id}`)
      ]);

      setEvent(eventRes.data);
      setParticipations(participationsRes.data);
      setFeedback(feedbackRes.data.feedback || []);

      // Check if feedback form exists and fetch dynamic responses
      try {
        const formRes = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/event/${id}`);
        const form = formRes.data;
        setFeedbackForm(form);

        // Fetch dynamic feedback responses for everyone (to display in feedback tab)
        const responsesRes = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/${form.id}/responses`);
        // Store dynamic responses in event state
        setEvent(prev => ({ ...prev, dynamicFeedbackResponses: responsesRes.data }));
      } catch {
        // No feedback form exists yet
        setFeedbackForm(null);
      }
    } catch {
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`https://college-event-aggregator-i3la.onrender.com/api/events/${id}`);
      toast.success('Event deleted successfully');
      navigate(user?.role === 'admin' ? '/admin' : '/faculty');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/reports/event/${id}`);
      toast.success('Report generated successfully');
      // Open report in new tab
      window.open(`https://college-event-aggregator-i3la.onrender.com${response.data.downloadUrl}`, '_blank');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <Skeleton className="h-4 w-24" />
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="aspect-[4/3] rounded-md lg:col-span-2" />
        </div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-64 rounded-md" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        title="Event not found"
        description="It may have been taken down. Have a look at the other events instead."
        action={
          <Button asChild variant="outline">
            <Link to="/events"><ArrowLeft /> Back to events</Link>
          </Button>
        }
      />
    );
  }

  const isPastEvent = new Date(event.event_date) < new Date();
  const canRegister = user?.role === 'student' && !isPastEvent;
  const canGiveFeedback = user?.role === 'student' && isPastEvent;
  const canManage = user?.role === 'admin' || (user?.role === 'faculty' && user.id === event.created_by);
  const canCreateFeedbackForm = user?.role === 'admin' || user?.role === 'faculty'; // All faculty can create feedback forms

  const cat = getCategoryStyle(event.category);
  const images = event.images || [];
  const imageUrls = images.map(img => fileUrl(img.image_url));
  const coverImage = imageUrls[0];
  const fees = Number(event.registration_fees) || 0;
  const responses = event.dynamicFeedbackResponses || [];

  const facts = [
    { label: 'Date', value: format(new Date(event.event_date), 'EEEE, d MMMM yyyy') },
    { label: 'Time', value: formatTime(event.event_time) || event.event_time },
    { label: 'Venue', value: event.location },
    { label: 'Organizer', value: event.organized_by || event.organizer_name },
    { label: 'Department', value: event.organizer_department },
    { label: 'Seats', value: event.max_participants || 'Unlimited' },
  ].filter(f => f.value);

  const guardRegistered = e => {
    if (isRegistered) {
      e.preventDefault();
      toast.error('You are already registered for this event');
    }
  };

  const guardFeedback = e => {
    if (hasGivenFeedback) {
      e.preventDefault();
      toast.error('You have already submitted feedback for this event');
    }
  };

  return (
    <div>
      <Link
        to="/events"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} /> All events
      </Link>

      {/* Poster-style header */}
      <FadeIn as="header" className="grid gap-8 border-b pb-10 lg:grid-cols-5 lg:items-end lg:gap-12">
        <div className="lg:col-span-3">
          <p className={cn('mb-4 inline-flex items-center gap-2 text-sm font-medium', cat.text)}>
            <span className={cn('size-2 rounded-full', cat.dot)} />
            {cat.label}
            <span className="meta ml-1">{isPastEvent ? '· already happened' : '· upcoming'}</span>
          </p>
          <h1 className="text-[2.5rem] leading-[1.05] text-balance sm:text-5xl lg:text-[3.4rem]">{event.title}</h1>

          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {facts.map(({ label, value }) => (
              <div key={label} className="flex items-baseline gap-3 border-t pt-2.5">
                <dt className="meta w-20 shrink-0">{label}</dt>
                <dd className="min-w-0 text-[0.95rem]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-2">
          {coverImage ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="focus-visible:ring-ring/50 block w-full overflow-hidden rounded-md border outline-none focus-visible:ring-2"
              aria-label="View cover image"
            >
              <img src={coverImage} alt={event.title} className="aspect-[4/3] w-full object-cover" />
            </button>
          ) : (
            <div className={cn('flex aspect-[4/3] w-full items-end rounded-md p-6 text-white', cat.poster)}>
              <span className="font-serif text-6xl leading-none font-medium italic opacity-90">{cat.label}</span>
            </div>
          )}
        </div>
      </FadeIn>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-14">
        {/* Main column */}
        <FadeIn delay={0.08} className="min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-8">
            <div className="scrollbar-none -mx-1 overflow-x-auto px-1">
              <TabsList>
                <TabsTrigger value="details">About</TabsTrigger>
                <TabsTrigger value="gallery">
                  Gallery <span className="meta">{event.images?.length || 0}</span>
                </TabsTrigger>
                {user?.role === 'admin' && (
                  <TabsTrigger value="participants">
                    Participants <span className="meta">{participations.length}</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                {canCreateFeedbackForm && (
                  <TabsTrigger value="create-feedback">
                    {feedbackForm ? 'Feedback form' : 'Create feedback form'}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* About */}
            <TabsContent value="details" className="space-y-10">
              <p className="max-w-prose text-[1.05rem] leading-relaxed whitespace-pre-line">{event.description}</p>

              {event.rules_eligibility && (
                <section className="border-l-primary max-w-prose rounded-r-md border border-l-2 px-5 py-4">
                  <h2 className="mb-2 text-lg">Rules & eligibility</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.rules_eligibility}</p>
                </section>
              )}

              <section className="max-w-prose">
                <SectionTitle>The details</SectionTitle>
                <dl className="divide-y border-y text-sm">
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">Maximum participants</dt>
                    <dd className="tabular">{event.max_participants || 'Unlimited'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">Registration fee</dt>
                    <dd className="tabular">₹{event.registration_fees || 0}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted-foreground">Posted by</dt>
                    <dd>{event.organizer_name || 'N/A'}</dd>
                  </div>
                </dl>
              </section>

              {user?.role === 'admin' && (
                <section>
                  <SectionTitle>So far</SectionTitle>
                  <StatRow className="md:max-w-md">
                    <StatCard label="Registrations" value={participations.length} />
                    <StatCard label="Feedback received" value={feedback.length} />
                  </StatRow>
                </section>
              )}
            </TabsContent>

            {/* Gallery */}
            <TabsContent value="gallery">
              {images.length > 0 ? (
                <section>
                  <SectionTitle aside={<span className="meta">{images.length} {images.length === 1 ? 'photo' : 'photos'}</span>}>
                    Photos
                  </SectionTitle>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="focus-visible:ring-ring/50 block aspect-[4/3] w-full overflow-hidden rounded-md border outline-none transition-opacity hover:opacity-85 focus-visible:ring-2"
                        aria-label={`View image ${index + 1}`}
                      >
                        <img
                          src={fileUrl(image.image_url)}
                          alt={`${event.title} - Image ${index + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <EmptyState title="No photos yet" description="Photos from the event will be added here once they are uploaded." />
              )}
            </TabsContent>

            {/* Participants (admin) */}
            {user?.role === 'admin' && (
              <TabsContent value="participants">
                <SectionTitle aside={<span className="meta">{participations.length} registered</span>}>
                  Who's coming
                </SectionTitle>
                {participations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Course / year</TableHead>
                        <TableHead>Registered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participations.map((participation) => (
                        <TableRow key={participation.id}>
                          <TableCell>
                            <div className="font-medium">{participation.name}</div>
                            <div className="meta">{participation.phone}</div>
                          </TableCell>
                          <TableCell>{participation.email}</TableCell>
                          <TableCell>{participation.college}</TableCell>
                          <TableCell>{participation.course_year}</TableCell>
                          <TableCell className="meta">{new Date(participation.registered_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState title="No one has registered yet" description="Registrations will be listed here as they come in." className="py-10" />
                )}
              </TabsContent>
            )}

            {/* Feedback */}
            <TabsContent value="feedback">
              {responses.length === 0 ? (
                <EmptyState
                  title="No feedback yet"
                  description="Responses show up here once students fill in the feedback form."
                  action={
                    isPastEvent && user?.role === 'student' && (
                      <Button asChild variant="accent">
                        <Link to={`/events/${id}/feedback-form`}>Give feedback</Link>
                      </Button>
                    )
                  }
                />
              ) : (
                <section>
                  <SectionTitle aside={<span className="meta">{responses.length} {responses.length === 1 ? 'response' : 'responses'}</span>}>
                    What people said
                  </SectionTitle>
                  <div className="divide-y border-y">
                    {responses.map((response) => (
                      <article key={response.id} className="py-6">
                        <div className="mb-4 flex items-baseline justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{response.student_name}</p>
                            <p className="meta truncate">{response.student_email}</p>
                          </div>
                          <span className="meta shrink-0">{new Date(response.submitted_at).toLocaleDateString()}</span>
                        </div>

                        <dl className="space-y-3">
                          {response.answers && response.answers.map((answer) => (
                            <div key={answer.id}>
                              <dt className="text-muted-foreground text-sm">{answer.question_text}</dt>
                              <dd className="mt-0.5">
                                {answer.question_type === 'rating' && <RatingStars value={answer.answer_text} />}
                                {answer.question_type !== 'rating' && (
                                  answer.answer_text || <span className="text-muted-foreground italic">No answer</span>
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </TabsContent>

            {/* Create / view feedback form */}
            {canCreateFeedbackForm && (
              <TabsContent value="create-feedback" className="space-y-8">
                {feedbackForm ? (
                  <section>
                    <p className="text-success mb-4 inline-flex items-center gap-1.5 text-sm font-medium">
                      <Check className="size-4" /> The feedback form for this event is live
                      <span className="meta ml-1">· {feedbackForm.questions?.length || 0} questions</span>
                    </p>
                    <h2 className="text-2xl">{feedbackForm.title}</h2>
                    {feedbackForm.description && (
                      <p className="text-muted-foreground mt-1 max-w-prose">{feedbackForm.description}</p>
                    )}
                    <ol className="mt-6 divide-y border-y">
                      {feedbackForm.questions?.map((q, index) => (
                        <li key={q.id} className="flex gap-4 py-3.5">
                          <span className="meta w-6 shrink-0 pt-0.5">Q{index + 1}</span>
                          <div className="min-w-0">
                            <p>
                              {q.question_text}
                              {q.is_required && <span className="text-primary ml-1" aria-label="required">*</span>}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="meta mr-1">{q.question_type?.replace('_', ' ')}</span>
                              {q.options && q.options.map((opt, i) => (
                                <Badge key={i} variant="outline" className="font-normal">{opt}</Badge>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : (
                  <div className="max-w-prose">
                    <h2 className="text-xl">No feedback form yet</h2>
                    <p className="text-muted-foreground mt-1">
                      Put together a few questions below. Students will be able to submit feedback immediately after registering.
                    </p>
                  </div>
                )}

                {(!feedbackForm || showFeedbackCreator) && (
                  <FeedbackFormCreator
                    eventId={id}
                    onSaveComplete={() => {
                      setShowFeedbackCreator(false);
                      fetchEventData(); // Refresh to show the new form
                    }}
                  />
                )}
              </TabsContent>
            )}
          </Tabs>
        </FadeIn>

        {/* Side column: ticket stub */}
        <FadeIn delay={0.14} as="aside" className="space-y-6 lg:sticky lg:top-20">
          <div className="bg-card rounded-lg border">
            <div className="flex items-end justify-between gap-3 p-5">
              <div>
                <p className="meta mb-1">Entry</p>
                {fees > 0 ? (
                  <p className="font-serif text-4xl leading-none font-medium tabular">₹{fees}</p>
                ) : (
                  <p className="text-success font-serif text-4xl leading-none font-medium italic">Free</p>
                )}
              </div>
              <Badge variant={isPastEvent ? 'secondary' : 'success'}>
                {isPastEvent ? 'Finished' : 'Open'}
              </Badge>
            </div>

            <div className="relative">
              <span className="bg-background absolute top-1/2 -left-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
              <span className="bg-background absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
              <div className="perforated mx-3" />
            </div>

            <div className="space-y-3 p-5">
              <p className="meta">
                {format(new Date(event.event_date), 'EEE d MMM yyyy')}
                {event.event_time ? ` · ${formatTime(event.event_time)}` : ''}
              </p>

              {/* Student actions */}
              {canRegister && (
                isRegistered ? (
                  <Link
                    to={`/events/${id}/participate`}
                    onClick={guardRegistered}
                    className="text-success flex cursor-not-allowed items-center gap-1.5 py-1 text-sm font-medium"
                  >
                    <Check className="size-4" /> You're registered for this one
                  </Link>
                ) : (
                  <Button asChild variant="accent" size="lg" className="w-full">
                    <Link to={`/events/${id}/participate`} onClick={guardRegistered}>
                      Register
                    </Link>
                  </Button>
                )
              )}

              {canGiveFeedback && (
                hasGivenFeedback ? (
                  <Link
                    to={`/events/${id}/feedback-form`}
                    onClick={guardFeedback}
                    className="text-success flex cursor-not-allowed items-center gap-1.5 py-1 text-sm font-medium"
                  >
                    <Check className="size-4" /> Thanks, your feedback is in
                  </Link>
                ) : (
                  <Button asChild variant="accent" size="lg" className="w-full">
                    <Link to={`/events/${id}/feedback-form`} onClick={guardFeedback}>
                      Give feedback
                    </Link>
                  </Button>
                )
              )}


              {/* Admin / faculty actions */}
              {(user?.role === 'admin' || user?.role === 'faculty') && (
                <div className="space-y-2 pt-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={generateReport}
                    loading={reportLoading}
                  >
                    {!reportLoading && <FileText strokeWidth={1.75} />}
                    {reportLoading ? 'Generating…' : 'Generate report'}
                  </Button>
                  {user?.role === 'admin' && (
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to={`/admin/participants/${id}`}>
                        <Users strokeWidth={1.75} /> Manage participants
                      </Link>
                    </Button>
                  )}
                  {canManage && (
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="sm" className="flex-1">
                        <Link to={`/edit-event/${id}`}>
                          <Pencil strokeWidth={1.75} /> Edit
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-1"
                        onClick={() => setConfirmDeleteOpen(true)}
                      >
                        <Trash2 strokeWidth={1.75} /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment QR */}
          {event.payment_qr_url && fees > 0 && (
            <figure className="rounded-lg border p-4">
              <a
                href={fileUrl(event.payment_qr_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md bg-white p-3"
              >
                <img
                  src={fileUrl(event.payment_qr_url)}
                  alt="Payment QR code"
                  className="mx-auto aspect-square w-full max-w-52 object-contain"
                />
              </a>
              <figcaption className="text-muted-foreground mt-3 text-sm">
                Scan to pay the ₹{fees} registration fee. <span className="meta">Tap to open full size.</span>
              </figcaption>
            </figure>
          )}
        </FadeIn>
      </div>

      <ImageLightbox
        images={imageUrls}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete this event?"
        description="Are you sure you want to delete this event? This cannot be undone."
        confirmLabel="Delete event"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default EventDetail;
