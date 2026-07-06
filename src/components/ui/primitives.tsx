import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { DeviceStatus } from '@/types';
import { STATUS_META } from '@/lib/utils';

/** Oddiy konteyner karta. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

/** Status rangidagi kichik nuqta. */
export function StatusDot({ status, size = 10 }: { status: DeviceStatus; size?: number }) {
  return (
    <span
      className="status-dot"
      style={{ width: size, height: size, background: STATUS_META[status].color }}
    />
  );
}

/** Status yorlig'i (rangli badge). */
export function Badge({ status }: { status: DeviceStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="badge"
      style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}
    >
      <span className="badge-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

/** Topbar uslubidagi tugma. */
export function Button({
  active,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button className={`tb-btn ${active ? 'on' : ''} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
