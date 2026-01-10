import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ParticipationForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    courseYear: '',
    teamMembers: '',
    document: null
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        college: user.college_name || '',
        courseYear: `${user.course} - ${user.year}`,
      }));
    }
  }, [user]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}`);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
      navigate('/events');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      document: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('eventId', id);
    formDataToSend.append('studentId', user.id);
    Object.keys(formData).forEach(key => {
      if (key !== 'document') {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    if (formData.document) {
      formDataToSend.append('document', formData.document);
    }

    try {
      await axios.post('http://localhost:5000/api/participations/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Successfully registered for the event!');
      navigate(`/events/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Register for: {event.title}
            </h1>
            <p className="text-gray-600">
              Fill out the form below to register for this event
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Date: <span className="font-medium">{new Date(event.event_date).toLocaleDateString()}</span></p>
                  <p className="text-gray-600">Time: <span className="font-medium">{event.event_time}</span></p>
                </div>
                <div>
                  <p className="text-gray-600">Location: <span className="font-medium">{event.location}</span></p>
                  <p className="text-gray-600">Category: <span className="font-medium">{event.category}</span></p>
                </div>
              </div>
            </div>
            
            {/* Payment QR Code Section - Show if fees > 0 */}
            {event.registration_fees > 0 && event.payment_qr_code && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-yellow-800 mb-3">💳 Payment Required</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">Registration Fees:</span> ₹{event.registration_fees}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Please scan the QR code below to make the payment. After payment, proceed with registration.
                    </p>
                    <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                      ⚠️ Keep your payment screenshot/reference for verification
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <img
                      src={`http://localhost:5000/${event.payment_qr_code}`}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain border-2 border-yellow-300 rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => window.open(`http://localhost:5000/${event.payment_qr_code}`, '_blank')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Full Size
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    minLength="3"
                    maxLength="100"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Name *
                  </label>
                  <input
                    type="text"
                    name="college"
                    required
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course & Year *
                </label>
                <input
                  type="text"
                  name="courseYear"
                  required
                  value={formData.courseYear}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., B.Tech CSE - 3rd Year"
                />
              </div>
            </div>

            {/* Team Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Team Information (Optional)</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Members
                </label>
                <textarea
                  name="teamMembers"
                  rows={3}
                  value={formData.teamMembers}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter names of team members (comma-separated)..."
                />
                <p className="text-sm text-gray-500 mt-1">Leave empty if participating individually</p>
              </div>
            </div>

            {/* Document Upload */}
            {/* <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Documents (Optional)</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Required Documents
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    id="document-upload"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="document-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {formData.document ? formData.document.name : 'Click to upload document'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">PDF, DOC, or Images (max 10MB)</p>
                  </label>
                </div>
              </div>
            </div> */}

            {/* Terms & Submit */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-start mb-6">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 mr-3"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the event rules and eligibility criteria. I confirm that all information provided is accurate.
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Register Now'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParticipationForm;