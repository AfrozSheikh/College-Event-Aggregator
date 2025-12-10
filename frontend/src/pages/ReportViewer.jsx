import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReportViewer = () => {
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEvents(response.data);
      // Load generated reports from local storage or API
      const savedReports = JSON.parse(localStorage.getItem('generatedReports') || '[]');
      setReports(savedReports);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (eventId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/event/${eventId}`);
      toast.success('Report generated successfully');
      
      // Save report info
      const newReport = {
        id: Date.now(),
        eventId,
        downloadUrl: response.data.downloadUrl,
        generatedAt: new Date().toISOString()
      };
      
      const updatedReports = [newReport, ...reports];
      setReports(updatedReports);
      localStorage.setItem('generatedReports', JSON.stringify(updatedReports));
      
      // Open report in new tab
      window.open(`http://localhost:5000${response.data.downloadUrl}`, '_blank');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Report Generator</h1>
        <p className="text-gray-600">Generate and download event reports</p>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Event to Generate Report</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{event.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{new Date(event.event_date).toLocaleDateString()}</div>
                    <div className="text-gray-500">{event.event_time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                      {event.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => generateReport(event.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Generate PDF Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Reports */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Generated Reports</h2>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No reports generated yet</p>
            <p className="text-gray-400 text-sm mt-2">Generate your first report using the table above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => {
              const event = events.find(e => e.id === report.eventId);
              return (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{event?.title || 'Event not found'}</h3>
                      <p className="text-sm text-gray-500">
                        Generated: {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={`http://localhost:5000${report.downloadUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Download
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportViewer;