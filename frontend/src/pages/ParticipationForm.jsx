import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox, Skeleton } from '@/components/ui/misc';
import PageHeader from '@/components/common/PageHeader';
import FileDropzone from '@/components/common/FileDropzone';
import { FadeIn } from '@/components/common/motion';
import { cn, fileUrl, formatTime, getCategoryStyle } from '@/lib/utils';

/* ---------- local helpers ---------- */

const formatSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

// Registrations are only for this institute, so the college name is fixed
const INSTITUTE_NAME = 'Institute of Engineering and Management';

const Field = ({ id, label, hint, className, ...inputProps }) => (
  <div className={cn('space-y-1.5', className)}>
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} {...inputProps} />
    {hint && <p className="meta">{hint}</p>}
  </div>
);

/* One part of the slip: heading + one-line note on the left (wide screens), fields on the right */
const FormSection = ({ number, title, note, children }) => (
  <section className="grid gap-x-10 gap-y-5 border-t py-8 md:grid-cols-[12rem_1fr]">
    <div>
      <p className="meta mb-1">{number}</p>
      <h2 className="text-xl leading-snug">{title}</h2>
      {note && <p className="text-muted-foreground mt-1.5 text-sm">{note}</p>}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

/* Quiet progress line: "1 Details — 2 Payment — 3 Confirm" */
const StepLine = ({ steps }) => (
  <ol className="meta flex flex-wrap items-center gap-x-2 gap-y-1">
    {steps.map((step, i) => (
      <li key={step.label} className="flex items-center gap-2">
        <span className={cn('inline-flex items-center gap-1', step.done && 'text-foreground')}>
          {step.done ? <Check className="size-3.5" strokeWidth={2} /> : <span>{i + 1}</span>}
          {step.label}
        </span>
        {i < steps.length - 1 && <span aria-hidden="true">—</span>}
      </li>
    ))}
  </ol>
);

const FormSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-3 border-b pb-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-96 max-w-full" />
    </div>
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-64 rounded-md" />
        <Skeleton className="h-32 rounded-md" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  </div>
);

/* ---------- page ---------- */

const ParticipationForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: INSTITUTE_NAME,
    courseYear: '',
    teamMembers: '',
    document: null
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isPaidEvent = event && Number(event.registration_fees) > 0;

  useEffect(() => {
    fetchEvent();
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        college: INSTITUTE_NAME,
        courseYear: `${user.course} - ${user.year}`,
      }));
    }
  }, [user]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/events/${id}`);
      setEvent(response.data);
    } catch {
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

  // Kept for the (currently disabled) optional document upload section
  // eslint-disable-next-line no-unused-vars
  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      document: e.target.files[0]
    });
  };

  // FileDropzone hands us an array of File objects (it resets its own input)
  const handlePaymentScreenshotChange = (files) => {
    const file = files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG or WEBP image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Screenshot must be smaller than 10MB');
      return;
    }

    if (paymentScreenshotPreview) URL.revokeObjectURL(paymentScreenshotPreview);
    setPaymentScreenshot(file);
    setPaymentScreenshotPreview(URL.createObjectURL(file));
  };

  const removePaymentScreenshot = () => {
    if (paymentScreenshotPreview) URL.revokeObjectURL(paymentScreenshotPreview);
    setPaymentScreenshot(null);
    setPaymentScreenshotPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) {
      toast.error('Please accept the event rules and eligibility criteria');
      return;
    }

    if (isPaidEvent && !paymentScreenshot) {
      toast.error('Please upload your payment screenshot');
      return;
    }

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

    if (paymentScreenshot) {
      formDataToSend.append('paymentScreenshot', paymentScreenshot);
    }

    try {
      await axios.post('https://college-event-aggregator-i3la.onrender.com/api/participations/register', formDataToSend, {
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

  if (!event) return <FormSkeleton />;

  const category = getCategoryStyle(event.category);
  const coverUrl = fileUrl(event.images?.[0]?.image_url);
  const qrUrl = fileUrl(event.payment_qr_url);
  const eventDate = new Date(event.event_date);
  const detailsDone = ['name', 'email', 'phone', 'college', 'courseYear'].every((k) => String(formData[k] || '').trim());
  const steps = [
    { label: 'Details', done: detailsDone },
    ...(isPaidEvent ? [{ label: 'Payment', done: !!paymentScreenshot }] : []),
    { label: 'Confirm', done: agreed },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" strokeWidth={1.75} /> Back
      </button>

      <PageHeader
        eyebrow="Registration"
        title={
          <>
            Register for <em>{event.title}</em>
          </>
        }
        description="Check your details, add a teammate or two if you have them, and send it in."
      />

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_20rem]">
        {/* Ticket stub summary – first on mobile, sticky on the right on desktop */}
        <aside className="lg:sticky lg:top-24 lg:order-last">
          <FadeIn delay={0.05}>
            <div className="bg-card rounded-lg border">
              <div className="h-36 overflow-hidden rounded-t-lg">
                {coverUrl ? (
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className={cn('flex h-full w-full items-end p-4 text-white', category.poster)}>
                    <span className="font-serif text-4xl leading-none italic opacity-90">{category.label}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 p-4">
                <div className="flex w-11 shrink-0 flex-col items-center border-r pr-4 text-center">
                  <span className="meta uppercase">{eventDate.toLocaleDateString('en-IN', { month: 'short' })}</span>
                  <span className="tabular font-serif text-[1.7rem] leading-none font-medium">{eventDate.getDate()}</span>
                  <span className="meta mt-0.5">{eventDate.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', category.text)}>
                    <span className={cn('size-1.5 rounded-full', category.dot)} />
                    {category.label}
                  </span>
                  <h3 className="mt-0.5 line-clamp-2 text-lg leading-snug">{event.title}</h3>
                  <p className="meta mt-2">{formatTime(event.event_time) || event.event_time}</p>
                  <p className="meta">{event.location}</p>
                </div>
              </div>

              <div className="relative">
                <span className="bg-background absolute top-1/2 -left-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
                <span className="bg-background absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
                <div className="perforated mx-3" />
              </div>

              <div className="flex items-baseline justify-between px-4 py-3.5">
                <span className="meta">Registration fee</span>
                {isPaidEvent ? (
                  <span className="tabular font-serif text-2xl">₹{event.registration_fees}</span>
                ) : (
                  <span className="text-success font-serif text-2xl italic">Free</span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mt-3 hidden px-1 text-xs lg:block">
              Your details go only to the people organising this event.
            </p>
          </FadeIn>
        </aside>

        <form onSubmit={handleSubmit}>
          <FadeIn>
            <div className="pb-6">
              <StepLine steps={steps} />
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <FormSection
              number="01"
              title="Your details"
              note="Filled in from your profile. Change anything that's out of date."
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  id="name"
                  label="Full name *"
                  type="text"
                  name="name"
                  required
                  minLength="3"
                  maxLength="100"
                  value={formData.name}
                  onChange={handleChange}
                />
                <Field
                  id="email"
                  label="Email *"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
                <Field
                  id="phone"
                  label="Phone *"
                  type="tel"
                  name="phone"
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  hint="10 digits, no country code"
                />
                <Field
                  id="college"
                  label="College *"
                  type="text"
                  name="college"
                  required
                  readOnly
                  value={INSTITUTE_NAME}
                  className="[&_input]:bg-muted [&_input]:text-muted-foreground [&_input]:cursor-not-allowed"
                  hint="Set for all registrations"
                />
                <Field
                  id="courseYear"
                  label="Course and year *"
                  type="text"
                  name="courseYear"
                  required
                  value={formData.courseYear}
                  onChange={handleChange}
                  placeholder="B.Tech CSE - 3rd Year"
                  className="md:col-span-2"
                />
              </div>
            </FormSection>

            <FormSection
              number="02"
              title="Team"
              note="Optional. Leave it empty if you're taking part on your own."
            >
              <div className="space-y-1.5">
                <Label htmlFor="teamMembers">Team members</Label>
                <Textarea
                  id="teamMembers"
                  name="teamMembers"
                  rows={3}
                  value={formData.teamMembers}
                  onChange={handleChange}
                  placeholder="Riya Sharma, Kabir Mehta"
                />
                <p className="meta">Separate names with commas</p>
              </div>
            </FormSection>

            {/* Payment – only for events with a fee */}
            {isPaidEvent && (
              <FormSection
                number="03"
                title="Payment"
                note={
                  event.payment_qr_url
                    ? 'Scan the QR code to pay, then upload a screenshot of the successful payment.'
                    : 'Pay as instructed by the organiser, then upload a screenshot of the successful payment.'
                }
              >
                <div className="space-y-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="meta">Amount to pay</p>
                        <p className="tabular font-serif text-5xl leading-tight">₹{event.registration_fees}</p>
                      </div>
                      <p className="border-l-2 border-foreground/30 pl-3 text-sm">
                        Make sure the transaction ID, amount and date are clearly visible in your screenshot.
                      </p>
                    </div>

                    {qrUrl && (
                      <figure className="bg-card w-fit shrink-0 rounded-md border p-3">
                        <img src={qrUrl} alt="Payment QR code" className="size-44 bg-white object-contain p-1" />
                        <figcaption className="mt-2 flex items-center justify-between gap-3">
                          <span className="meta">Scan to pay</span>
                          <a
                            href={qrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline underline-offset-4 hover:text-primary"
                          >
                            Open full size
                          </a>
                        </figcaption>
                      </figure>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Payment screenshot *</Label>
                    {!paymentScreenshotPreview ? (
                      <FileDropzone
                        accept="image/jpeg,image/png,image/webp"
                        onFiles={handlePaymentScreenshotChange}
                        hint="JPG, PNG or WEBP, up to 10MB"
                      />
                    ) : (
                      <div className="bg-card flex items-start gap-4 rounded-md border p-3">
                        <img
                          src={paymentScreenshotPreview}
                          alt="Payment screenshot preview"
                          className="bg-muted size-24 shrink-0 rounded-sm border object-contain"
                        />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-success inline-flex items-center gap-1 text-sm font-medium">
                            <Check className="size-4" strokeWidth={2} /> Attached
                          </p>
                          <p className="mt-1 truncate text-sm">{paymentScreenshot.name}</p>
                          <p className="meta">{formatSize(paymentScreenshot.size)}</p>
                          <button
                            type="button"
                            onClick={removePaymentScreenshot}
                            className="text-destructive mt-2 text-xs underline underline-offset-4"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </FormSection>
            )}

            {/* Confirm & submit */}
            <FormSection number={isPaidEvent ? '04' : '03'} title="Confirm" note="One last tick and you're done.">
              <label htmlFor="terms" className="flex cursor-pointer items-start gap-3">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <span className="text-sm">
                  I agree to the event rules and eligibility criteria, and the information above is accurate.
                </span>
              </label>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button type="submit" variant="accent" size="lg" loading={loading}>
                  {loading ? 'Submitting…' : 'Register'}
                </Button>
                <Button type="button" variant="ghost" size="lg" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </FormSection>
          </FadeIn>
        </form>
      </div>
    </div>
  );
};

export default ParticipationForm;
