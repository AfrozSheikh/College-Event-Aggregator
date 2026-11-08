import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const API_URL = 'https://college-event-aggregator-i3la.onrender.com';

// Builds an absolute URL for files served by the backend (e.g. "/api/files/gallery/3")
export const fileUrl = (path) => (path ? `${API_URL}${path}` : null);

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export const formatDate = (date, options = {}) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options })
    : '';

export const formatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

/*
 * Category styling – muted, printed-poster colours.
 *   dot:    small solid swatch (`<span className={cn('size-2 rounded-full', cat.dot)} />`)
 *   text:   coloured label text
 *   badge:  quiet tinted badge
 *   poster: solid background used for image-less event covers (pair with text-white)
 * `emoji` and `gradient` are legacy fields – don't use them in new markup.
 */
export const CATEGORY_STYLES = {
  technical: { label: 'Technical', dot: 'bg-[#3c5a80]', text: 'text-[#3c5a80] dark:text-[#9db4d4]', badge: 'border-[#3c5a80]/25 bg-[#3c5a80]/8 text-[#3c5a80] dark:text-[#9db4d4]', poster: 'bg-[#2f4a6b]' },
  cultural: { label: 'Cultural', dot: 'bg-[#8a3b5c]', text: 'text-[#8a3b5c] dark:text-[#d79ab5]', badge: 'border-[#8a3b5c]/25 bg-[#8a3b5c]/8 text-[#8a3b5c] dark:text-[#d79ab5]', poster: 'bg-[#6e2f4a]' },
  sports: { label: 'Sports', dot: 'bg-[#3f6b46]', text: 'text-[#3f6b46] dark:text-[#9cc5a2]', badge: 'border-[#3f6b46]/25 bg-[#3f6b46]/8 text-[#3f6b46] dark:text-[#9cc5a2]', poster: 'bg-[#33573a]' },
  workshop: { label: 'Workshop', dot: 'bg-[#b07d1f]', text: 'text-[#8f6514] dark:text-[#e2bd72]', badge: 'border-[#b07d1f]/30 bg-[#b07d1f]/10 text-[#8f6514] dark:text-[#e2bd72]', poster: 'bg-[#8f6514]' },
  seminar: { label: 'Seminar', dot: 'bg-[#2f6e6a]', text: 'text-[#2f6e6a] dark:text-[#8fc9c4]', badge: 'border-[#2f6e6a]/25 bg-[#2f6e6a]/8 text-[#2f6e6a] dark:text-[#8fc9c4]', poster: 'bg-[#285c58]' },
  competition: { label: 'Competition', dot: 'bg-[#a3402a]', text: 'text-[#a3402a] dark:text-[#e59a86]', badge: 'border-[#a3402a]/25 bg-[#a3402a]/8 text-[#a3402a] dark:text-[#e59a86]', poster: 'bg-[#8a3522]' },
  conference: { label: 'Conference', dot: 'bg-[#4b4a7a]', text: 'text-[#4b4a7a] dark:text-[#afadd9]', badge: 'border-[#4b4a7a]/25 bg-[#4b4a7a]/8 text-[#4b4a7a] dark:text-[#afadd9]', poster: 'bg-[#3e3d66]' },
};

const FALLBACK_CATEGORY = { dot: 'bg-foreground/60', text: 'text-foreground', badge: 'border-border bg-muted text-foreground', poster: 'bg-[#3a3631]' };

export const getCategoryStyle = (category) => {
  const style = CATEGORY_STYLES[category] || {
    ...FALLBACK_CATEGORY,
    label: category ? category[0].toUpperCase() + category.slice(1) : 'Event',
  };
  // Legacy fields kept so older markup keeps rendering sensibly
  return { emoji: '', gradient: '', ...style };
};

// "Sat, 8 Nov" style date used in headers
export const formatLongDate = (date = new Date()) =>
  new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

export const timeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
};
