import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/misc';
import PageHeader from '@/components/common/PageHeader';
import { FadeIn } from '@/components/common/motion';
import { cn, formatDate, formatTime, getCategoryStyle } from '@/lib/utils';

const ReportViewer = () => {
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generatingId, setGeneratingId] = useState(null);

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
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (eventId) => {
    setGeneratingId(eventId);
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
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingId(null);
    }
  };

  const query = search.trim().toLowerCase();
  const visibleEvents = query
    ? events.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.category?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      )
    : events;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Pick an event and we'll put together a PDF with its details and registrations. It opens in a new tab when it's ready."
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        {/* Event list */}
        <FadeIn delay={0.05} className="min-w-0">
          <div className="mb-1 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl">Events</h2>
            <div className="relative sm:w-64">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" strokeWidth={1.75} />
              <Input
                aria-label="Search events"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title or category"
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleEvents.length === 0 ? (
            <p className="text-muted-foreground py-8 text-sm">
              {events.length === 0
                ? 'No events yet. Reports become available once an event has been posted.'
                : `Nothing matches "${search}". Try another word.`}
            </p>
          ) : (
            <ul className="divide-y">
              {visibleEvents.map(event => {
                const cat = getCategoryStyle(event.category);
                const isGenerating = generatingId === event.id;
                const d = new Date(event.event_date);
                return (
                  <li key={event.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="w-11 shrink-0 text-center leading-none">
                        <span className="font-serif text-[1.7rem] font-medium tabular">{d.getDate()}</span>
                        <span className="meta block">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
                          <span className="flex items-center gap-1.5">
                            <span className={cn('size-2 shrink-0 rounded-full', cat.dot)} />
                            {cat.label}
                          </span>
                          <span aria-hidden>·</span>
                          <span className="meta">
                            {formatDate(event.event_date)}
                            {event.event_time && `, ${formatTime(event.event_time)}`}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-start sm:self-auto"
                      loading={isGenerating}
                      disabled={generatingId !== null && !isGenerating}
                      onClick={() => generateReport(event.id)}
                    >
                      {isGenerating ? 'Generating…' : 'Generate PDF'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </FadeIn>

        {/* Generated reports */}
        <FadeIn delay={0.1}>
          <aside className="lg:sticky lg:top-24">
            <div className="mb-1 flex items-baseline justify-between border-b pb-3">
              <h2 className="text-xl">Generated</h2>
              {reports.length > 0 && <span className="meta">{reports.length}</span>}
            </div>
            <p className="meta mt-2">Kept on this device only.</p>
            {reports.length === 0 ? (
              <p className="text-muted-foreground py-6 text-sm">
                Nothing generated yet. Your PDFs will be listed here.
              </p>
            ) : (
              <ul className="mt-2 max-h-[640px] divide-y overflow-y-auto">
                {reports.map(report => {
                  const event = events.find(e => e.id === report.eventId);
                  const href = `http://localhost:5000${report.downloadUrl}`;
                  const fileName = report.downloadUrl?.split('/').pop();
                  return (
                    <li key={report.id} className="py-3">
                      <p className="truncate text-sm font-medium">{event?.title || 'Event not found'}</p>
                      {fileName && <p className="meta truncate" title={fileName}>{fileName}</p>}
                      <p className="meta">{new Date(report.generatedAt).toLocaleString()}</p>
                      <div className="mt-1.5 flex gap-4 text-sm">
                        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline underline-offset-4">
                          Open
                        </a>
                        <a href={href} target="_blank" rel="noopener noreferrer" download className="text-muted-foreground hover:text-primary underline underline-offset-4">
                          Download
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </FadeIn>
      </div>
    </div>
  );
};

export default ReportViewer;
