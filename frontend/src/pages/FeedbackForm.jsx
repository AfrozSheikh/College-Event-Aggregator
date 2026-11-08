import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Star } from 'lucide-react';
import { FadeIn } from '@/components/common/motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress, Skeleton } from '@/components/ui/misc';
import { cn, formatDate, getCategoryStyle } from '@/lib/utils';

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

/** Plain, clickable 1–5 star picker. */
const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center" role="radiogroup" aria-label="Overall rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            className="focus-visible:ring-ring/60 cursor-pointer rounded-sm p-1 outline-none focus-visible:ring-2"
          >
            <Star
              strokeWidth={1.5}
              className={cn(
                'size-7 transition-colors duration-100',
                star <= shown ? 'fill-warning text-warning-foreground/60' : 'text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-muted-foreground text-sm">
        <span className="text-foreground font-serif text-lg tabular">{shown}</span> of 5 · {RATING_LABELS[shown]}
      </span>
    </div>
  );
};

const FeedbackForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/events/${id}`);
      setEvent(response.data);

      // Check if event is past
      const eventDate = new Date(response.data.event_date);
      const today = new Date();
      if (eventDate > today) {
        toast.error('Feedback can only be submitted for past events');
        navigate(`/events/${id}`);
      }
    } catch {
      toast.error('Failed to load event');
      navigate('/events');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('https://college-event-aggregator-i3la.onrender.com/api/feedback', {
        eventId: id,
        studentId: user.id,
        rating,
        comment,
        suggestions
      });

      toast.success('Thank you for your feedback!');
      navigate(`/events/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const cat = getCategoryStyle(event.category);
  const completed = (rating ? 1 : 0) + (comment.trim() ? 1 : 0);
  const progress = (completed / 2) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground -ml-3 mb-6">
        <ArrowLeft strokeWidth={1.75} /> Back
      </Button>

      {/* Header */}
      <FadeIn as="header" className="border-b pb-6">
        <p className="meta">Feedback</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] sm:text-[2.4rem]">{event.title}</h1>
        <p className="text-muted-foreground mt-3">
          How did it go? The organisers read every response when planning the next one.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', cat.text)}>
            <span className={cn('size-1.5 rounded-full', cat.dot)} />
            {cat.label}
          </span>
          {event.event_date && <span className="meta">{formatDate(event.event_date)}</span>}
          {event.location && <span className="meta">{event.location}</span>}
        </p>
      </FadeIn>

      {/* Progress */}
      <div className="mt-6 space-y-2">
        <Progress value={progress} className="h-0.5" />
        <p className="meta">{completed} of 2 answered · suggestions are optional</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <ol className="divide-y border-b">
          {/* Rating */}
          <li className="flex gap-4 py-7">
            <span className="text-muted-foreground w-6 shrink-0 font-serif text-xl tabular">1</span>
            <div className="min-w-0 flex-1 space-y-4">
              <h2 className="font-sans text-base font-medium">Overall, how was the event?</h2>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </li>

          {/* Comment */}
          <li className="flex gap-4 py-7">
            <span className="text-muted-foreground w-6 shrink-0 font-serif text-xl tabular">2</span>
            <div className="min-w-0 flex-1 space-y-3">
              <label htmlFor="feedback-comment" className="block font-medium">
                Your comments <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="feedback-comment"
                required
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What worked, what didn't, what you'll remember…"
              />
            </div>
          </li>

          {/* Suggestions */}
          <li className="flex gap-4 py-7">
            <span className="text-muted-foreground w-6 shrink-0 font-serif text-xl tabular">3</span>
            <div className="min-w-0 flex-1 space-y-3">
              <label htmlFor="feedback-suggestions" className="block font-medium">
                Suggestions for next time <span className="text-muted-foreground text-sm font-normal">(optional)</span>
              </label>
              <Textarea
                id="feedback-suggestions"
                rows={4}
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Anything that would make the next one better"
              />
            </div>
          </li>
        </ol>

        {/* Submit */}
        <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="lg" loading={loading}>
            {loading ? 'Sending…' : 'Send feedback'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
