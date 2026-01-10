import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

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
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'rating', label: 'Rating (1-5)' },
    { value: 'multiple_choice', label: 'Multiple Choice' }
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
      
      await axios.post('http://localhost:5000/api/feedback-forms', {
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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Create Feedback Form</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Form Title
          </label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Event Feedback Form"
          />
        </div>

        {/* Form Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Tell students what this feedback is for..."
          />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Questions</h4>
          
          {questions.map((question, index) => (
            <div key={question.id} className="border border-gray-300 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ArrowUpIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 'down')}
                    disabled={index === questions.length - 1}
                    className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ArrowDownIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <input
                type="text"
                value={question.questionText}
                onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your question..."
                required
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Question Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Question Type
                  </label>
                  <select
                    value={question.questionType}
                    onChange={(e) => updateQuestion(question.id, 'questionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {questionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Required Toggle */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={question.isRequired}
                      onChange={(e) => updateQuestion(question.id, 'isRequired', e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>
              </div>

              {/* Multiple Choice Options */}
              {question.questionType === 'multiple_choice' && (
                <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                  <label className="block text-xs font-medium text-gray-600">Options</label>
                  {(question.options || []).map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${optIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Option
                  </button>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Question
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Feedback Form'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackFormCreator;
