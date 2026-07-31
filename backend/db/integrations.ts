/**
 * Third-party integrations: Stripe payments and Cloudinary image storage.
 *
 * Both are lazily constructed and both degrade gracefully. With no keys set the
 * app keeps working — payments fall back to the previous simulation and uploads
 * fall back to returning the inline data URI — so a fresh clone still runs.
 * `GET /api/health` reports which mode is live.
 */
import Stripe from 'stripe';
import { v2 as cloudinary } from 'cloudinary';

/* ------------------------------------------------------------------ Stripe */

let _stripe: Stripe | null = null;

/**
 * How payments behave:
 *
 *   auto      (default) real Stripe if STRIPE_SECRET_KEY is set, else simulated
 *   simulate            always simulated, even when keys are present — lets the
 *                       app take orders with no Stripe account at all
 *   stripe              require real Stripe; fail loudly rather than simulate
 */
export type PaymentMode = 'auto' | 'simulate' | 'stripe';

export const getPaymentMode = (): PaymentMode => {
  const raw = (process.env.PAYMENT_MODE || 'auto').toLowerCase();
  return raw === 'simulate' || raw === 'stripe' ? raw : 'auto';
};

/** True when real Stripe calls will be made. */
export const isStripeLive = () =>
  getPaymentMode() !== 'simulate' && Boolean(process.env.STRIPE_SECRET_KEY);

export const getStripe = (): Stripe | null => {
  if (getPaymentMode() === 'simulate') return null;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, {
      // Pinning avoids behaviour changing under us on a Stripe API upgrade.
      apiVersion: '2025-01-27.acacia' as any,
      appInfo: { name: 'CraveCache' },
    });
  }
  return _stripe;
};

/** Currency for new PaymentIntents. Must be supported by your Stripe account. */
export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'inr').toLowerCase();

/**
 * Stripe works in the currency's smallest unit — paise for INR, cents for USD.
 * Order totals in this app are whole rupees, so they are scaled here. Getting
 * this wrong is the classic Stripe bug: a ₹500 order charged as ₹5.
 */
const ZERO_DECIMAL = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);

export const toMinorUnits = (amount: number): number =>
  ZERO_DECIMAL.has(STRIPE_CURRENCY) ? Math.round(amount) : Math.round(amount * 100);

export const fromMinorUnits = (minor: number): number =>
  ZERO_DECIMAL.has(STRIPE_CURRENCY) ? minor : minor / 100;

/* -------------------------------------------------------------- Cloudinary */

let cloudinaryReady = false;

export const isCloudinaryLive = (): boolean => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
};

const configureCloudinary = () => {
  if (cloudinaryReady) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  cloudinaryReady = true;
};

export interface UploadResult {
  url: string;
  publicId: string | null;
  /** false when Cloudinary is not configured and the data URI was passed back. */
  stored: boolean;
  width?: number;
  height?: number;
  bytes?: number;
}

/**
 * Uploads a data URI or remote URL to Cloudinary.
 *
 * The client sends a data URI (it already produces one for avatar previews), so
 * no multipart parser is needed. Uploads are transformed server-side to cap
 * dimensions and normalise format.
 */
export async function uploadImage(
  source: string,
  options: { folder?: string; publicId?: string; maxDimension?: number } = {}
): Promise<UploadResult> {
  if (!isCloudinaryLive()) {
    // Unconfigured: hand the image straight back so the UI still works.
    return { url: source, publicId: null, stored: false };
  }

  configureCloudinary();

  const result = await cloudinary.uploader.upload(source, {
    folder: options.folder || 'cravecache',
    public_id: options.publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      {
        width: options.maxDimension || 1200,
        height: options.maxDimension || 1200,
        crop: 'limit',
      },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    stored: true,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  if (!isCloudinaryLive()) return false;
  configureCloudinary();
  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === 'ok';
}
