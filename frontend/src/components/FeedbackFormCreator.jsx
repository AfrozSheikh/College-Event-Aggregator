import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/misc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FeedbackFormCreator = ({ eventId, onSaveComplete }) => {
  const [formTitle, setFormTitle] = useState('Event Feedback Form');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      questionText: '',
      questionType: 'text',
      options: [],
      isRequired: true,
      orderIndex: 0
    }
  ]);
  const [loading, setLoading] = useState(false);

  const questionTypes = [
    { value: 'text', label: 'Short answer' },
    { value: 'textarea', label: 'Paragraph' },
    { value: 'rating', label: 'Rating (1–5)' },
    { value: 'multiple_choice', label: 'Multiple choice' }
  ];

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        questionText: '',
        questionType: 'text',
        options: [],
        isRequired: true,
        orderIndex: questions.length
      }
    ]);
  };

  const removeQuestion = (id) => {
    if (questions.length === 1) {
      toast.error('At least one question is required');
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const moveQuestion = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    // Update order index
    newQuestions.forEach((q, i) => {
      q.orderIndex = i;
    });

    setQuestions(newQuestions);
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: [...(q.options || []), ''] }
        : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.map((opt, i) => i === optionIndex ? value : opt)
          }
        : q
    ));
  };

  const removeOption = (questionId, optionIndex) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.filter((_, i) => i !== optionIndex)
          }
        : q
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (questions.some(q => !q.questionText.trim())) {
      toast.error('All questions must have text');
      return;
    }

    const multipleChoiceQuestions = questions.filter(q => q.questionType === 'multiple_choice');
    if (multipleChoiceQuestions.some(q => !q.options || q.options.length < 2)) {
      toast.error('Multiple choice questions must have at least 2 options');
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));

      await axios.post('https://college-event-aggregator-i3la.onrender.com/api/feedback-forms', {
        eventId,
        title: formTitle,
        description: formDescription,
        questions: questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === 'multiple_choice' ? q.options : null,
          isRequired: q.isRequired,
          orderIndex: q.orderIndex
        })),
        createdBy: user.id
      });

      toast.success('Feedback form created successfully!');
      if (onSaveComplete) onSaveComplete();
    } catch (error) {
      console.error('Error creating feedback form:', error);
      toast.error(error.response?.data?.error || 'Failed to create feedback form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-card rounded-lg border">
      <header className="border-b px-5 py-4 sm:px-6">
        <h3 className="text-xl">New feedback form</h3>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Write the questions students will answer about this event. Keep it short – four or five is plenty.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 p-5 sm:p-6">
        {/* Form meta */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-form-title">Form title</Label>
            <Input
              id="feedback-form-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Event Feedback Form"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-form-description">
              Note to students <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="feedback-form-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
              className="min-h-16"
              placeholder="e.g. Tell us what worked and what we should change next time."
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between border-b pb-2">
            <h4 className="font-serif text-lg">Questions</h4>
            <span className="meta">
              {questions.length} {questions.length === 1 ? 'question' : 'questions'}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="bg-background space-y-4 rounded-md border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="meta">Q{index + 1}</span>
                    <div className="flex items-center">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        aria-label="Move question up"
                        className="text-muted-foreground"
                      >
                        <ArrowUp strokeWidth={1.75} />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === questions.length - 1}
                        aria-label="Move question down"
                        className="text-muted-foreground"
                      >
                        <ArrowDown strokeWidth={1.75} />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => removeQuestion(question.id)}
                        aria-label="Remove question"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 strokeWidth={1.75} />
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <Input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                    placeholder="e.g. How useful was the session?"
                    aria-label={`Question ${index + 1} text`}
                    required
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Select
                      value={question.questionType}
                      onValueChange={(value) => updateQuestion(question.id, 'questionType', value)}
                    >
                      <SelectTrigger className="sm:w-52" aria-label="Question type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2.5 sm:ml-auto">
                      <Switch
                        id={`required-${question.id}`}
                        checked={question.isRequired}
                        onCheckedChange={(checked) => updateQuestion(question.id, 'isRequired', checked)}
                      />
                      <Label htmlFor={`required-${question.id}`} className="cursor-pointer font-normal">
                        Required
                      </Label>
                    </div>
                  </div>

                  {/* Multiple Choice Options */}
                  {question.questionType === 'multiple_choice' && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="meta">Options</p>
                      <AnimatePresence initial={false}>
                        {(question.options || []).map((option, optIndex) => (
                          <motion.div
                            key={optIndex}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <span className="border-muted-foreground/50 size-3.5 shrink-0 rounded-full border" aria-hidden="true" />
                            <Input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                              className="h-9"
                              placeholder={`Option ${optIndex + 1}`}
                              aria-label={`Option ${optIndex + 1}`}
                            />
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => removeOption(question.id, optIndex)}
                              aria-label={`Remove option ${optIndex + 1}`}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <X strokeWidth={1.75} />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <Button
                        type="button"
                        size="sm"
                        variant="link"
                        onClick={() => addOption(question.id)}
                        className="h-auto px-0"
                      >
                        + Add option
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            type="button"
            variant="outline"
            onClick={addQuestion}
            className="text-muted-foreground hover:text-foreground w-full border-dashed"
          >
            <Plus strokeWidth={1.75} /> Add question
          </Button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end border-t pt-5">
          <Button type="submit" variant="accent" loading={loading}>
            {loading ? 'Saving…' : 'Save feedback form'}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default FeedbackFormCreator;
