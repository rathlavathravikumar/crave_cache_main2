import React, { useEffect, useMemo, useState } from 'react';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { apiFetch } from '../utils/apiBase';

/**
 * Stripe card entry.
 *
 * Card number, expiry and CVC are rendered by Stripe inside an iframe, so they
 * never enter this app's state or reach our server — which is what keeps the
 * checkout out of PCI scope. Previously these were plain React inputs.
 */

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || '';

export const isStripeConfigured = Boolean(PUBLISHABLE_KEY);

// loadStripe must be called once, not per render.
let stripePromise: Promise<Stripe | null> | null = null;
const getStripePromise = () => {
  if (!stripePromise && PUBLISHABLE_KEY) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
};

const CARD_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#1F2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#E11D48', iconColor: '#E11D48' },
  },
};

export interface StripeCardFormProps {
  /** Amount in major units (rupees), for display and intent creation. */
  amount: number;
  orderRef?: string;
  submitLabel: string;
  disabled?: boolean;
  /** Called with the confirmed PaymentIntent id once Stripe reports success. */
  onPaid: (paymentIntentId: string) => void | Promise<void>;
  onError?: (message: string) => void;
}

const CardForm: React.FC<StripeCardFormProps> = ({
  amount,
  orderRef,
  submitLabel,
  disabled,
  onPaid,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [busy, setBusy] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const fail = (message: string) => {
    setCardError(message);
    onError?.(message);
  };

  const handlePay = async () => {
    if (!stripe || !elements || busy) return;

    // getElement is typed as a union of every element type and TS cannot narrow
    // it from the component reference, so go via unknown.
    const card = elements.getElement(CardElement) as unknown as StripeCardElement | null;
    if (!card) return;

    setBusy(true);
    setCardError(null);

    try {
      // 1. Ask our server for an intent. The secret key stays server-side.
      const intentRes = await apiFetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, orderRef }),
      });
      const intent = await intentRes.json();
      if (!intentRes.ok) throw new Error(intent.error || 'Could not start the payment.');

      // 2. Confirm with Stripe directly from the browser.
      const { error, paymentIntent } = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: { card },
      });

      if (error) throw new Error(error.message || 'Your card could not be charged.');
      if (paymentIntent?.status !== 'succeeded') {
        throw new Error(`Payment did not complete (status: ${paymentIntent?.status}).`);
      }

      // 3. Re-verify server-side before the order is created. A client claiming
      //    success is not proof of payment.
      const verifyRes = await apiFetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      const verify = await verifyRes.json();
      if (!verifyRes.ok || !verify.success) {
        throw new Error(verify.error || verify.message || 'Payment could not be verified.');
      }

      await onPaid(paymentIntent.id);
    } catch (err: any) {
      fail(err?.message || 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-control border bg-white px-3.5 py-3 transition-colors ${
          cardError ? 'border-danger-500' : 'border-surface-line focus-within:border-brand-500'
        }`}
      >
        <CardElement
          options={CARD_ELEMENT_STYLE}
          onChange={(e) => {
            setCardComplete(e.complete);
            setCardError(e.error ? e.error.message : null);
          }}
        />
      </div>

      {cardError && (
        <p role="alert" className="flex items-start gap-1 text-[11px] font-bold text-danger-600">
          <AlertCircle className="mt-px h-3 w-3 shrink-0" strokeWidth={2.5} />
          {cardError}
        </p>
      )}

      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-400">
        <Lock className="h-3 w-3" />
        Card details go directly to Stripe and never touch our servers.
      </p>

      <Button
        type="button"
        size="lg"
        fullWidth
        loading={busy}
        loadingText="Processing payment…"
        disabled={disabled || !cardComplete || !stripe}
        onClick={handlePay}
        icon={<ShieldCheck className="h-4 w-4" />}
      >
        {submitLabel}
      </Button>
    </div>
  );
};

/** Wraps the card form in Stripe's Elements provider. */
export const StripeCardForm: React.FC<StripeCardFormProps> = (props) => {
  const promise = useMemo(() => getStripePromise(), []);

  useEffect(() => {
    if (!isStripeConfigured && import.meta.env.DEV) {
      console.warn(
        '[CraveCache] VITE_STRIPE_PUBLISHABLE_KEY is not set — card payment falls back to simulation.'
      );
    }
  }, []);

  if (!promise) return null;

  return (
    <Elements stripe={promise}>
      <CardForm {...props} />
    </Elements>
  );
};
