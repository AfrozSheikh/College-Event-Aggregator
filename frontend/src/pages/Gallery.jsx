import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Gallery = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events/type/past');
      setEvents(response.data);
      if (response.data.length > 0) {
        setSelectedEvent(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Gallery</h1>
        <p className="text-gray-600 mb-8">Browse photos from past events</p>

        {/* Event Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedEvent?.id === event.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {event.title}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Event Gallery */}
        {selectedEvent && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedEvent.title}</h2>
              <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>📅 {new Date(selectedEvent.event_date).toLocaleDateString()}</span>
                <span>🕒 {selectedEvent.event_time}</span>
                <span>📍 {selectedEvent.location}</span>
                <span>👤 Organized by: {selectedEvent.organized_by}</span>
              </div>
            </div>

            {/* Image Grid */}
            {selectedEvent.images && selectedEvent.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedEvent.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`http://localhost:5000/${image.image_path}`}
                      alt={`Event ${selectedEvent.title} - ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => window.open(`http://localhost:5000/${image.image_path}`, '_blank')}
                        className="px-4 py-2 bg-white text-gray-800 rounded-lg"
                      >
                        View Full
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No images available for this event</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;