import React from 'react';
import { cn } from './cn';
import type { OrderStatus } from '../../types';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-600 ring-surface-line',
  brand: 'bg-brand-50 text-brand-600 ring-brand-200',
  success: 'bg-success-50 text-success-600 ring-success-500/20',
  warning: 'bg-warning-50 text-warning-500 ring-warning-500/20',
  danger: 'bg-danger-50 text-danger-600 ring-danger-500/20',
  info: 'bg-info-50 text-info-500 ring-info-500/20',
};

export const Badge: React.FC<{
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'neutral', icon, children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider ring-1 ring-inset',
      TONES[tone],
      className
    )}
  >
    {icon}
    {children}
  </span>
);

/** Order status → tone, so every status chip in the app matches. */
const STATUS_TONE: Record<OrderStatus, Tone> = {
  Placed: 'info',
  Confirmed: 'info',
  Preparing: 'warning',
  'Out for Delivery': 'brand',
  Delivered: 'success',
  Cancelled: 'danger',
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({
  status,
  className,
}) => (
  <Badge tone={STATUS_TONE[status] || 'neutral'} className={className}>
    {status}
  </Badge>
);
