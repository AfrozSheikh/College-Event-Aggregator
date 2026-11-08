import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { FadeIn } from '@/components/common/motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress, Skeleton } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

/** Plain, clickable 1–5 star picker. */
const StarRating = ({ value, onChange, label }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
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

const DynamicFeedbackForm = () => {
  const { id: eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [feedbackForm, setFeedbackForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    fetchFeedbackForm();
    checkSubmissionStatus();
  }, [eventId, user]);

  const fetchFeedbackForm = async () => {
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/event/${eventId}`);
      setFeedbackForm(response.data);

      // Initialize answers object
      const initialAnswers = {};
      response.data.questions.forEach(q => {
        initialAnswers[q.id] = q.question_type === 'rating' ? 5 : '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No feedback form found for this event');
        navigate(`/events/${eventId}`);
      } else {
        toast.error('Failed to load feedback form');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSubmissionStatus = async () => {
    if (!user) return;

    try {
      const response = await axios.get(
        `https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/check/${eventId}/${user.id}`
      );
      setHasSubmitted(response.data.hasSubmitted);
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required questions
    const requiredQuestions = feedbackForm.questions.filter(q => q.is_required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id] || answers[q.id].toString().trim() === '');

    if (missingAnswers.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = feedbackForm.questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id]?.toString() || ''
      }));

      await axios.post('https://college-event-aggregator-i3la.onrender.com/api/feedback-forms/responses', {
        formId: feedbackForm.id,
        eventId,
        studentId: user.id,
        answers: formattedAnswers
      });

      toast.success('Thank you for your feedback!');
      navigate('/student');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    switch (question.question_type) {
      case 'text':
        return (
          <Input
            id={`question-${question.id}`}
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.is_required}
            placeholder="Your answer..."
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={`question-${question.id}`}
            rows={4}
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.is_required}
            placeholder="Your answer..."
          />
        );

      case 'rating':
        return (
          <StarRating
            label={question.question_text}
            value={answers[question.id] || 5}
            onChange={(star) => handleAnswerChange(question.id, star)}
          />
        );

      case 'multiple_choice':
        return (
          <div className="divide-y overflow-hidden rounded-md border" role="radiogroup">
            {question.options && question.options.map((option, index) => {
              const selected = answers[question.id] === option;
              return (
                <label
                  key={index}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 px-3.5 py-3 text-sm transition-colors',
                    'has-[:focus-visible]:bg-accent',
                    selected ? 'bg-accent text-foreground' : 'hover:bg-accent/60'
                  )}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={selected}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="sr-only"
                    required={question.is_required}
                  />
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      selected ? 'border-foreground' : 'border-muted-foreground/50'
                    )}
                  >
                    {selected && <span className="bg-foreground size-2 rounded-full" />}
                  </span>
                  <span className={cn(selected ? 'font-medium' : 'text-muted-foreground')}>{option}</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-1.5 w-full" />
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <FadeIn className="mx-auto max-w-2xl py-12 text-center">
        <Check className="text-success mx-auto size-7" strokeWidth={1.75} />
        <h1 className="mt-4 text-[2rem] leading-tight">You've already sent feedback for this one.</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md">
          Thanks for taking the time. Each form can only be filled in once, so there's nothing more to do here.
        </p>
        <Button variant="outline" className="mt-7" onClick={() => navigate('/student')}>
          <ArrowLeft strokeWidth={1.75} /> Back to dashboard
        </Button>
      </FadeIn>
    );
  }

  if (!feedbackForm) {
    return null;
  }

  const requiredQuestions = feedbackForm.questions.filter(q => q.is_required);
  const answeredRequired = requiredQuestions.filter(
    q => answers[q.id] && answers[q.id].toString().trim() !== ''
  ).length;
  const progress = requiredQuestions.length ? (answeredRequired / requiredQuestions.length) * 100 : 100;
  const questionCount = feedbackForm.questions.length;

  return (
    <div className="mx-auto max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground -ml-3 mb-6">
        <ArrowLeft strokeWidth={1.75} /> Back
      </Button>

      {/* Form header */}
      <FadeIn as="header" className="border-b pb-6">
        <p className="meta">Feedback</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] sm:text-[2.4rem]">{feedbackForm.title}</h1>
        {feedbackForm.description && (
          <p className="text-muted-foreground mt-3 whitespace-pre-line">{feedbackForm.description}</p>
        )}
        <p className="meta mt-3">
          {questionCount} question{questionCount === 1 ? '' : 's'}
          {requiredQuestions.length > 0 && ` · ${requiredQuestions.length} required`}
        </p>
        {feedbackForm.is_mandatory && (
          <p className="border-l-warning mt-4 border-l-4 py-0.5 pl-3 text-sm">
            This feedback form is mandatory.
          </p>
        )}
      </FadeIn>

      {/* Progress */}
      <div className="bg-background sticky top-16 z-20 space-y-2 py-4">
        <Progress value={progress} className="h-0.5" />
        <p className="meta">
          {requiredQuestions.length
            ? `${answeredRequired} of ${requiredQuestions.length} required answered`
            : 'No questions are required'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <ol className="divide-y border-b">
          {feedbackForm.questions.map((question, index) => {
            const answered = answers[question.id] && answers[question.id].toString().trim() !== '';
            return (
              <li key={question.id} className="flex gap-4 py-7">
                <span
                  className={cn(
                    'w-6 shrink-0 font-serif text-xl tabular transition-colors',
                    answered ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-4">
                  <label htmlFor={`question-${question.id}`} className="block leading-snug font-medium">
                    {question.question_text}
                    {question.is_required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {renderQuestion(question)}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="lg" loading={submitting}>
            {submitting ? 'Sending…' : 'Send feedback'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DynamicFeedbackForm;
