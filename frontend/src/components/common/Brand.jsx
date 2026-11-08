import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// IEM · UEM college logo (trimmed copy of public/iem-uem.png)
const LOGO_SRC = '/iem-uem-logo.png';

/**
 * The college logo on a small white plate, so it reads the same in light and dark mode.
 * Height is set via className (e.g. "h-10"); width follows the logo's aspect ratio.
 */
export function CollegeLogo({ className }) {
  return (
    <span className={cn('inline-flex h-11 shrink-0 items-center rounded-md border bg-white px-1.5 py-1', className)}>
      <img src={LOGO_SRC} alt="IEM · UEM – Institute & University of Engineering and Management" className="h-full w-auto" />
    </span>
  );
}

/**
 * Brand block used in the sidebar, the auth pages and the 404 page.
 *   <Brand />          logo + institute name underneath
 *   <Brand compact />  logo only, smaller (mobile header)
 */
export default function Brand({ to = '/', className, subtitle = true, compact = false }) {
  if (compact) {
    return (
      <Link to={to} className={cn('flex items-center', className)} aria-label="Institute of Engineering and Management – home">
        <CollegeLogo className="h-9" />
      </Link>
    );
  }

  return (
    <Link to={to} className={cn('flex flex-col items-start gap-2.5', className)}>
      <CollegeLogo className="h-14" />
      <span className="leading-none">
        <span className="block max-w-[13rem] font-serif text-[1.05rem] leading-tight font-medium tracking-tight">
          Institute of Engineering and Management
        </span>
        {subtitle && <span className="meta mt-1.5 block">the campus noticeboard</span>}
      </span>
    </Link>
  );
}
