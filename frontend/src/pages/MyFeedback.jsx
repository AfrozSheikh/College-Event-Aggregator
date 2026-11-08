import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import StatCard, { StatRow } from '@/components/common/StatCard';
import { ListSkeleton } from '@/components/common/Loaders';
import { FadeIn } from '@/components/common/motion';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

const StarRow = ({ rating, className }) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        strokeWidth={1.5}
        className={cn('size-4', i <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/35')}
      />
    ))}
  </span>
);

const isRatingAnswer = (value) => /^[1-5]$/.test(String(value ?? '').trim());

const EntryFooter = ({ feedback }) => (
  <div className="mt-4 flex items-center justify-between gap-3">
    <span className="meta">Sent {formatDate(feedback.submitted_at)}</span>
    {feedback.event_id && (
      <Link
        to={`/events/${feedback.event_id}`}
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
      >
        View event
      </Link>
    )}
  </div>
);

const DynamicFeedbackCard = ({ feedback }) => {
  const [open, setOpen] = useState(false);
  const answerCount = feedback.answers?.length || 0;

  return (
    <article className="py-6">
      <h3 className="text-[1.3rem] leading-snug">{feedback.event_title || 'Event'}</h3>
      <p className="meta mt-1">
        {feedback.event_date ? formatDate(feedback.event_date) : 'Date not available'}
        {feedback.form_title ? ` · ${feedback.form_title}` : ''}
      </p>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="text-foreground focus-visible:ring-ring/50 mt-3 cursor-pointer rounded-sm text-sm font-medium underline decoration-border underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2"
      >
        {open ? 'Hide your answers' : `Show your ${answerCount} ${answerCount === 1 ? 'answer' : 'answers'}`}
      </button>

      {open && (
        <dl className="mt-4 space-y-4 border-l pl-4">
          {feedback.answers?.map((answer) => (
            <div key={answer.id}>
              <dt className="text-muted-foreground text-sm">{answer.question_text}</dt>
              <dd className="mt-1">
                {isRatingAnswer(answer.answer_text) ? (
                  <span className="flex items-center gap-2">
                    <StarRow rating={Number(answer.answer_text)} />
                    <span className="meta">{answer.answer_text} of 5</span>
                  </span>
                ) : (
                  <span className={cn('whitespace-pre-line', !answer.answer_text && 'text-muted-foreground italic')}>
                    {answer.answer_text || 'No answer provided'}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <EntryFooter feedback={feedback} />
    </article>
  );
};

const LegacyFeedbackCard = ({ feedback }) => (
  <article className="py-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h3 className="text-[1.3rem] leading-snug">{feedback.event_title || 'Event'}</h3>
        <p className="meta mt-1">
          {feedback.event_date ? formatDate(feedback.event_date) : 'Date not available'}
          {feedback.location ? ` · ${feedback.location}` : ''}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-2">
        <StarRow rating={feedback.rating} />
        <span className="meta">{feedback.rating} of 5</span>
      </span>
    </div>

    {(feedback.comment || feedback.suggestions) && (
      <dl className="mt-4 space-y-4 border-l pl-4">
        {feedback.comment && (
          <div>
            <dt className="text-muted-foreground text-sm">Your comment</dt>
            <dd className="mt-1 whitespace-pre-line">{feedback.comment}</dd>
          </div>
        )}
        {feedback.suggestions && (
          <div>
            <dt className="text-muted-foreground text-sm">Your suggestions</dt>
            <dd className="mt-1 whitespace-pre-line">{feedback.suggestions}</dd>
          </div>
        )}
      </dl>
    )}

    <EntryFooter feedback={feedback} />
  </article>
);

const MyFeedback = () => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [dynamicFeedbackList, setDynamicFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      console.log('Fetching feedback for user ID:', user.id);

      // Fetch legacy feedback
      const legacyResponse = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback/user/${user.id}`);
      console.log('Legacy feedback API response:', legacyResponse.data);
      setFeedbackList(legacyResponse.data);

      // Fetch dynamic feedback responses - we need to get user's registrations first
      try {
        const registrationsResponse = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/participations/student/${user.id}`);
        const registrations = registrationsResponse.data;

        // For each registration, check if there's a dynamic feedback response
        const dynamicResponses = [];
        for (const reg of registrations) {
          try {
            const formResponse = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/event/${reg.event_id}`);
            const form = formResponse.data;

            // Check if student submitted response
            const responsesResponse = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/${form.id}/responses`);
            const userResponse = responsesResponse.data.find(r => r.student_id === user.id);

            if (userResponse) {
              dynamicResponses.push({
                ...userResponse,
                event_title: reg.event_title,
                event_date: reg.event_date,
                event_id: reg.event_id,
                form_title: form.title
              });
            }
          } catch {
            // No dynamic feedback form for this event or not submitted
            continue;
          }
        }

        setDynamicFeedbackList(dynamicResponses);
      } catch (error) {
        console.error('Failed to load dynamic feedback:', error);
      }

    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <PageHeader
      eyebrow="Your activity"
      title="My feedback"
      description="What you've told organisers about the events you went to."
      actions={
        <Button asChild variant="outline">
          <Link to="/student/my-registrations">Feedback still to give</Link>
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

  const total = feedbackList.length + dynamicFeedbackList.length;
  const ratedItems = feedbackList.filter(f => Number(f.rating) > 0);
  const avgRating = ratedItems.length
    ? ratedItems.reduce((sum, f) => sum + Number(f.rating), 0) / ratedItems.length
    : 0;

  return (
    <div>
      {header}

      {total === 0 ? (
        <EmptyState
          title="No feedback sent yet"
          description="After an event you attended wraps up, you can leave feedback for it from your registrations."
          action={
            <Button asChild variant="accent">
              <Link to="/events?type=past">See past events</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <StatRow className="md:max-w-2xl">
            <StatCard label="Sent in total" value={total} />
            <StatCard label="Form responses" value={dynamicFeedbackList.length} />
            <StatCard
              label="Average rating"
              value={ratedItems.length ? avgRating.toFixed(1) : '–'}
              suffix={ratedItems.length ? ' / 5' : ''}
              hint={
                ratedItems.length
                  ? `From ${ratedItems.length} rated ${ratedItems.length === 1 ? 'event' : 'events'}`
                  : 'No star ratings yet'
              }
            />
          </StatRow>

          <FadeIn className="max-w-3xl">
            <div className="divide-y border-b">
              {/* Dynamic Feedback Responses */}
              {dynamicFeedbackList.map(feedback => (
                <DynamicFeedbackCard key={`dynamic-${feedback.id}`} feedback={feedback} />
              ))}

              {/* Legacy Feedback */}
              {feedbackList.map(feedback => (
                <LegacyFeedbackCard key={`legacy-${feedback.id}`} feedback={feedback} />
              ))}
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
};

export default MyFeedback;
