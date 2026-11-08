import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { ImagePlus, QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/misc';
import PageHeader from '@/components/common/PageHeader';
import FileDropzone from '@/components/common/FileDropzone';
import { FadeIn } from '@/components/common/motion';
import { cn, formatTime, getCategoryStyle } from '@/lib/utils';

/* ---------- local presentational helpers ---------- */

/** One block of the printed form: heading + note on the left, fields on the right. */
const FormSection = ({ number, title, note, children }) => (
  <section className="grid gap-5 border-t py-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
    <div>
      <p className="meta mb-1 tabular">{number}</p>
      <h2 className="text-xl leading-tight">{title}</h2>
      {note && <p className="text-muted-foreground mt-1.5 text-sm">{note}</p>}
    </div>
    <div className="min-w-0 space-y-5">{children}</div>
  </section>
);

const Field = ({ id, label, required, hint, counter, children, className }) => (
  <div className={cn('space-y-2', className)}>
    <div className="flex items-baseline justify-between gap-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-primary">*</span>}
      </Label>
      {counter}
    </div>
    {children}
    {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
  </div>
);

const CharCount = ({ value, max }) => (
  <span className="meta tabular">
    {(value || '').length}/{max}
  </span>
);

/** Static preview in the same ticket-stub style as EventCard (not a link, so it never leaves the form). */
const EventPreview = ({ title, description, category, location, eventDate, eventTime, fees, maxParticipants, image }) => {
  const cat = getCategoryStyle(category);
  const date = eventDate ? new Date(eventDate) : null;
  const hasDate = date && !isNaN(date);
  const feeValue = Number(fees) || 0;

  return (
    <article className="bg-card flex flex-col rounded-lg border">
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        {image ? (
          <img src={image} alt="Event cover preview" className="h-full w-full object-cover" />
        ) : (
          <div className={cn('flex h-full w-full items-end p-4 text-white', cat.poster)}>
            <span className="font-serif text-[2.4rem] leading-none font-medium italic opacity-90">{cat.label}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 p-4">
        <div className="flex w-11 shrink-0 flex-col items-center border-r pr-4 text-center">
          {hasDate ? (
            <>
              <span className="meta uppercase">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
              <span className="font-serif text-[1.7rem] leading-none font-medium tabular">{date.getDate()}</span>
              <span className="meta mt-0.5">{date.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
            </>
          ) : (
            <span className="font-serif text-[1.7rem] leading-none text-muted-foreground">?</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className={cn('mb-1 inline-flex items-center gap-1.5 text-xs font-medium', cat.text)}>
            <span className={cn('size-1.5 rounded-full', cat.dot)} />
            {cat.label}
          </span>
          <h3 className={cn('line-clamp-2 text-[1.15rem] leading-snug', !title && 'text-muted-foreground italic')}>
            {title || 'Your event title'}
          </h3>
          <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
            {description || 'The first couple of lines of your description go here.'}
          </p>
          <p className="meta mt-2.5 truncate">
            {eventTime ? formatTime(eventTime) : 'Time'} · {location || 'Venue'}
          </p>
        </div>
      </div>

      <div className="relative">
        <span className="bg-background absolute top-1/2 -left-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
        <span className="bg-background absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 rounded-full border" />
        <div className="perforated mx-3" />
      </div>

      <div className="flex min-h-12 items-center px-4 py-2.5 text-sm">
        {feeValue > 0 ? (
          <span className="font-medium tabular">₹{feeValue % 1 === 0 ? feeValue : feeValue.toFixed(2)}</span>
        ) : (
          <span className="text-success font-medium">Free</span>
        )}
        <span className="meta ml-2">{maxParticipants ? `${maxParticipants} seats` : 'No seat limit'}</span>
      </div>
    </article>
  );
};

const FormSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-3 border-b pb-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    ))}
  </div>
);

/* ---------- page ---------- */

const EventForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical',
    location: '',
    eventDate: '',
    eventTime: '',
    organizedBy: '',
    organizerDepartment: 'CSE',
    rulesEligibility: '',
    maxParticipants: '',
    registrationFees: '0',
    images: []
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [paymentQr, setPaymentQr] = useState(null);
  const [paymentQrPreview, setPaymentQrPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`https://college-event-aggregator-i3la.onrender.com/api/events/${id}`);
      const event = response.data;
      setFormData({
        title: event.title,
        description: event.description,
        category: event.category,
        location: event.location,
        eventDate: event.event_date.split('T')[0],
        eventTime: event.event_time,
        organizedBy: event.organized_by,
        organizerDepartment: event.organizer_department || 'CSE',
        rulesEligibility: event.rules_eligibility,
        maxParticipants: event.max_participants,
        registrationFees: event.registration_fees
      });
      setUploadedImages(event.images || []);
      // Show existing payment QR if present
      if (event.payment_qr_url) {
        setPaymentQrPreview(`https://college-event-aggregator-i3la.onrender.com${event.payment_qr_url}`);
      }
    } catch {
      toast.error('Failed to fetch event');
      navigate('/events');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Used by the custom category chips / department select (same state update as handleChange)
  const setField = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageUpload = (files) => {
    setUploadedImages([...uploadedImages, ...files]);
  };

  const removeImage = (index) => {
    const imageToRemove = uploadedImages[index];
    // If this is an existing image from the database (has an id), track its id for removal
    if (imageToRemove && !(imageToRemove instanceof File) && imageToRemove.id) {
      setRemovedImageIds(prev => [...prev, imageToRemove.id]);
    }
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleQrUpload = (files) => {
    const file = files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('QR code image must be less than 5MB');
        return;
      }
      setPaymentQr(file);
      setPaymentQrPreview(URL.createObjectURL(file));
    }
  };

  const removeQr = () => {
    setPaymentQr(null);
    setPaymentQrPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'images') {
        formDataToSend.append(key, formData[key]);
      }
    });
    formDataToSend.append('createdBy', user.id);

    // Append only new File objects as images
    uploadedImages.forEach(image => {
      if (image instanceof File) {
        formDataToSend.append('images', image);
      }
    });

    if (paymentQr) {
      formDataToSend.append('paymentQr', paymentQr);
    }

    // For edit mode, also send the list of removed image IDs
    if (isEdit && removedImageIds.length > 0) {
      formDataToSend.append('removedImageIds', JSON.stringify(removedImageIds));
    }

    try {
      if (isEdit) {
        await axios.put(`https://college-event-aggregator-i3la.onrender.com/api/events/${id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Event updated successfully');
      } else {
        await axios.post('https://college-event-aggregator-i3la.onrender.com/api/events', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Event created successfully');
      }
      navigate(user.role === 'admin' ? '/admin' : '/faculty');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'technical', 'cultural', 'sports',
    'workshop', 'seminar', 'competition', 'conference'
  ];

  const departments = [
    'CSE', 'IT', 'AI', 'EE', 'MECH', 'CIVIL', 'ENTC', 'Chemical', 'Robotics'
  ];

  // Preview URLs for the thumbnail grid (new files → object URL, existing → backend URL)
  const imagePreviews = useMemo(
    () =>
      uploadedImages.map(image =>
        image instanceof File ? URL.createObjectURL(image) : `https://college-event-aggregator-i3la.onrender.com${image.image_url}`
      ),
    [uploadedImages]
  );

  const showQr = parseFloat(formData.registrationFees) > 0;

  if (fetching) return <FormSkeleton />;

  return (
    <div>
      <PageHeader
        eyebrow={isEdit ? 'Editing' : 'New event'}
        title={isEdit ? 'Edit event' : <>Put up a <em>new</em> event</>}
        description={
          isEdit
            ? 'Change whatever needs changing. Students see the updated details as soon as you save.'
            : 'Fill this in once and the event goes up on the board for every student to see.'
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
          <fieldset disabled={loading} className="min-w-0 border-b">
            {/* ---------- Basics ---------- */}
            <FormSection number="1" title="The basics" note="What it's called and what students can expect.">
              <Field id="title" label="Title" required counter={<CharCount value={formData.title} max={200} />}>
                <Input
                  id="title"
                  type="text"
                  name="title"
                  required
                  minLength="5"
                  maxLength="200"
                  value={formData.title ?? ''}
                  onChange={handleChange}
                  placeholder="e.g. Intro to Git, hands-on"
                  className="h-11"
                />
              </Field>

              <Field
                id="description"
                label="Description"
                required
                hint="At least 20 characters."
                counter={<CharCount value={formData.description} max={5000} />}
              >
                <Textarea
                  id="description"
                  name="description"
                  required
                  minLength="20"
                  maxLength="5000"
                  rows={6}
                  value={formData.description ?? ''}
                  onChange={handleChange}
                  placeholder="What happens, who it's for, what to bring…"
                />
              </Field>

              <div className="space-y-2.5">
                <Label id="category-label">
                  Category<span className="text-primary">*</span>
                </Label>
                <div role="radiogroup" aria-labelledby="category-label" className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const style = getCategoryStyle(cat);
                    const selected = formData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setField('category', cat)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors outline-none',
                          'focus-visible:ring-ring/50 focus-visible:ring-2',
                          selected
                            ? 'border-foreground bg-foreground text-background'
                            : 'hover:border-foreground/40 bg-card'
                        )}
                      >
                        <span className={cn('size-2 rounded-full', style.dot)} />
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </FormSection>

            {/* ---------- Schedule & Venue ---------- */}
            <FormSection number="2" title="When and where" note="Pick the start time; the venue should be easy to find.">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="eventDate" label="Date" required>
                  <Input
                    id="eventDate"
                    type="date"
                    name="eventDate"
                    required
                    value={formData.eventDate ?? ''}
                    onChange={handleChange}
                    className="h-11"
                  />
                </Field>
                <Field id="eventTime" label="Start time" required>
                  <Input
                    id="eventTime"
                    type="time"
                    name="eventTime"
                    required
                    value={formData.eventTime ?? ''}
                    onChange={handleChange}
                    className="h-11"
                  />
                </Field>
              </div>
              <Field id="location" label="Venue" required>
                <Input
                  id="location"
                  type="text"
                  name="location"
                  required
                  value={formData.location ?? ''}
                  onChange={handleChange}
                  placeholder="e.g. Seminar Hall 2, Main Building"
                  className="h-11"
                />
              </Field>
            </FormSection>

            {/* ---------- Organizer ---------- */}
            <FormSection number="3" title="Hosted by" note="The department running the event.">
              <Field id="organizerDepartment" label="Department" required className="sm:max-w-xs">
                <Select
                  name="organizerDepartment"
                  required
                  value={formData.organizerDepartment}
                  onValueChange={(value) => setField('organizerDepartment', value)}
                >
                  <SelectTrigger id="organizerDepartment" className="h-11">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormSection>

            {/* ---------- Registration & Fees ---------- */}
            <FormSection
              number="4"
              title="Registration"
              note="How many can join, whether there's a fee, and any rules."
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="maxParticipants" label="Seats" hint="Leave empty for unlimited">
                  <Input
                    id="maxParticipants"
                    type="number"
                    name="maxParticipants"
                    min="1"
                    value={formData.maxParticipants ?? ''}
                    onChange={handleChange}
                    placeholder="Unlimited"
                    className="h-11"
                  />
                </Field>
                <Field id="registrationFees" label="Fee (₹)" hint="Set 0 for a free event">
                  <Input
                    id="registrationFees"
                    type="number"
                    name="registrationFees"
                    min="0"
                    step="0.01"
                    value={formData.registrationFees ?? ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="h-11"
                  />
                </Field>
              </div>

              {/* Payment QR Code Section - Only show if fees > 0 */}
              {showQr && (
                <div className="space-y-3 border-l-2 border-primary/60 pl-4">
                  <div>
                    <p className="text-sm font-medium">
                      Payment QR code <span className="text-primary">*</span>
                    </p>
                    <p className="text-muted-foreground text-xs">Upload a QR code for students to make payments</p>
                  </div>

                  {!paymentQrPreview ? (
                    <FileDropzone
                      accept="image/jpeg,image/jpg,image/png"
                      onFiles={handleQrUpload}
                      icon={QrCode}
                      hint="PNG, JPG up to 5MB"
                      className="py-7"
                      disabled={loading}
                    />
                  ) : (
                    <div className="flex flex-wrap items-start gap-4">
                      <img
                        src={paymentQrPreview}
                        alt="Payment QR"
                        className="size-36 rounded-md border bg-white object-contain p-2"
                      />
                      <div className="max-w-xs space-y-3">
                        <p className="text-muted-foreground text-xs">
                          Students will see this QR code when registering. Remove it to upload a different one.
                        </p>
                        <Button type="button" size="sm" variant="outline" onClick={removeQr} aria-label="Remove payment QR code">
                          <X strokeWidth={1.75} /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Field id="rulesEligibility" label="Rules and eligibility">
                <Textarea
                  id="rulesEligibility"
                  name="rulesEligibility"
                  rows={4}
                  value={formData.rulesEligibility ?? ''}
                  onChange={handleChange}
                  placeholder="Who can take part, team size, what's not allowed…"
                />
              </Field>
            </FormSection>

            {/* ---------- Media ---------- */}
            <FormSection
              number="5"
              title="Photos"
              note="The first one becomes the cover on the event card."
            >
              <FileDropzone
                accept="image/*"
                multiple
                onFiles={handleImageUpload}
                icon={ImagePlus}
                hint="Up to 10 images, 5MB each"
                disabled={loading}
              />

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div>
                  <p className="meta mb-3">
                    {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {uploadedImages.map((image, index) => (
                      <figure
                        key={image instanceof File ? `new-${image.name}-${image.lastModified}-${index}` : `existing-${image.id ?? index}`}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-md border">
                          <img
                            src={imagePreviews[index]}
                            alt={`Preview ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            aria-label={`Remove image ${index + 1}`}
                            className="bg-background/95 text-foreground hover:text-destructive absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-sm border transition-colors"
                          >
                            <X className="size-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                        <figcaption className="meta mt-1.5">
                          {index === 0 ? 'Cover' : `No. ${index + 1}`}
                          {!(image instanceof File) && ' · saved'}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </FormSection>
          </fieldset>

          {/* ---------- Live preview (xl) ---------- */}
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <FadeIn delay={0.1}>
                <p className="meta mb-3">How it'll look on the board</p>
                <EventPreview
                  title={formData.title}
                  description={formData.description}
                  category={formData.category}
                  location={formData.location}
                  eventDate={formData.eventDate}
                  eventTime={formData.eventTime}
                  fees={formData.registrationFees}
                  maxParticipants={formData.maxParticipants}
                  image={imagePreviews[0]}
                />
              </FadeIn>
            </div>
          </aside>
        </div>

        {/* ---------- Sticky action bar ---------- */}
        <div className="bg-background sticky bottom-0 z-20 mt-8 border-t py-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="meta hidden sm:block">Fields marked * are required.</p>
            <div className="flex gap-2 sm:justify-end">
              <Button type="button" variant="ghost" className="flex-1 sm:flex-none" onClick={() => navigate(-1)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" loading={loading} className="flex-1 sm:flex-none">
                {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Post event'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
