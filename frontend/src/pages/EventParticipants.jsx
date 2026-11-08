import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/misc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StatCard, { StatRow } from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { PageSkeleton } from '@/components/common/Loaders';
import { FadeIn } from '@/components/common/motion';
import { API_URL, cn, formatDate, formatTime, getCategoryStyle, getInitials } from '@/lib/utils';

const EventParticipants = () => {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null); // participant whose payment proof is being previewed

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, participantsRes] = await Promise.all([
        axios.get(`https://college-event-aggregator-i3la.onrender.com/api/events/${eventId}`),
        axios.get(`https://college-event-aggregator-i3la.onrender.com/api/participations/event/${eventId}`)
      ]);

      setEvent(eventRes.data);
      setParticipants(participantsRes.data);
    } catch {
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'College', 'Course/Year', 'Team Members', 'Registered Date', 'Payment Screenshot'],
      ...participants.map(p => [
        p.name,
        p.email,
        p.phone || 'N/A',
        p.college,
        p.course_year,
        p.team_members || 'N/A',
        new Date(p.registered_at).toLocaleDateString(),
        p.payment_screenshot_url ? 'Uploaded' : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants-event-${eventId}.csv`;
    a.click();
  };

  if (loading) return <PageSkeleton stats={3} cards={0} />;
  if (!event) {
    return (
      <EmptyState
        title="Event not found"
        description="It may have been removed. Head back to the dashboard to pick another one."
        action={<Button asChild variant="outline"><Link to="/admin"><ArrowLeft /> Back to dashboard</Link></Button>}
      />
    );
  }

  const hasFees = event.registration_fees > 0;
  const cat = getCategoryStyle(event.category);
  const individualCount = participants.filter(p => !p.team_members || p.team_members.trim() === '').length;
  const teamCount = participants.filter(p => p.team_members && p.team_members.trim() !== '').length;

  const query = search.trim().toLowerCase();
  const visibleParticipants = query
    ? participants.filter(p =>
        [p.name, p.email, p.phone, p.college, p.course_year, p.team_members]
          .some(v => v && String(v).toLowerCase().includes(query))
      )
    : participants;

  const screenshotUrl = (p) => `${API_URL}${p.payment_screenshot_url}`;

  const metaLine = [
    formatDate(event.event_date),
    event.event_time && formatTime(event.event_time),
    event.location,
    hasFees ? `₹${event.registration_fees}` : 'Free',
  ].filter(Boolean);

  const renderPaymentProof = (participant) =>
    participant.payment_screenshot_url ? (
      <button
        type="button"
        onClick={() => setPreview(participant)}
        className="hover:text-primary text-sm underline underline-offset-4"
      >
        View
      </button>
    ) : (
      <Badge variant="warning">Not uploaded</Badge>
    );

  return (
    <div className="space-y-8">
      {/* Event header */}
      <FadeIn className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-sm">
            <span className={cn('size-2 rounded-full', cat.dot)} />
            <span className={cat.text}>{cat.label}</span>
            <span className="text-muted-foreground">· Registrations</span>
          </p>
          <h1 className="text-[2rem] leading-[1.1] sm:text-[2.4rem]">{event.title}</h1>
          <p className="meta mt-3">{metaLine.join(' · ')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link to={`/events/${event.id ?? eventId}`}>View event</Link>
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={participants.length === 0}>
            Export CSV
          </Button>
        </div>
      </FadeIn>

      {/* Figures */}
      <FadeIn delay={0.05}>
        <StatRow>
          <StatCard label="Registrations" value={participants.length} />
          <StatCard label="Individual" value={individualCount} />
          <StatCard label="Teams" value={teamCount} />
        </StatRow>
      </FadeIn>

      {/* Participant list */}
      <FadeIn delay={0.1}>
        <div className="mb-1 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl">Who's coming</h2>
            {query && (
              <span className="meta">{visibleParticipants.length} of {participants.length}</span>
            )}
          </div>
          {participants.length > 0 && (
            <div className="relative sm:w-72">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" strokeWidth={1.75} />
              <Input
                aria-label="Search participants"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email or college"
                className="pl-9"
              />
            </div>
          )}
        </div>

        {participants.length === 0 ? (
          <p className="text-muted-foreground py-8 text-sm">
            No one has registered yet. Names will show up here as people sign up.
          </p>
        ) : visibleParticipants.length === 0 ? (
          <p className="text-muted-foreground py-8 text-sm">
            Nobody matches "{search}". Try a name, email or college.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-0">Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Registered</TableHead>
                    {hasFees && <TableHead className="pr-0">Payment proof</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="pl-0 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{participant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{participant.email}</div>
                        <div className="meta">{participant.phone || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div>{participant.college}</div>
                        <div className="text-muted-foreground text-sm">{participant.course_year}</div>
                      </TableCell>
                      <TableCell>
                        {participant.team_members ? (
                          <div className="max-w-xs truncate" title={participant.team_members}>{participant.team_members}</div>
                        ) : (
                          <span className="text-muted-foreground">Individual</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="meta">{new Date(participant.registered_at).toLocaleDateString()}</span>
                      </TableCell>
                      {hasFees && (
                        <TableCell className="pr-0 whitespace-nowrap">
                          {renderPaymentProof(participant)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y md:hidden">
              {visibleParticipants.map((participant) => (
                <li key={participant.id} className="py-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{participant.name}</span>
                        <span className="meta shrink-0">{new Date(participant.registered_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5 space-y-0.5 text-sm">
                        <p className="truncate">{participant.email}</p>
                        <p>{participant.phone || 'N/A'}</p>
                        <p>{participant.college} · {participant.course_year}</p>
                        <p>{participant.team_members ? `Team: ${participant.team_members}` : 'Individual'}</p>
                      </div>
                      {hasFees && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="meta">Payment proof</span>
                          {renderPaymentProof(participant)}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </FadeIn>

      {/* Payment screenshot preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment screenshot</DialogTitle>
            <DialogDescription>{preview?.name} · {preview?.email}</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="bg-muted/40 flex max-h-[65vh] items-center justify-center overflow-auto rounded-md border p-2">
              <img
                src={screenshotUrl(preview)}
                alt={`Payment screenshot uploaded by ${preview.name}`}
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>
          )}
          <DialogFooter>
            {preview && (
              <Button asChild variant="outline">
                <a href={screenshotUrl(preview)} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventParticipants;
