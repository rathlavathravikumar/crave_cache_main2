import React, { useMemo, useRef, useState } from 'react';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  UserCheck,
  Store,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Bike,
  BarChart3,
  Check,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { loginUser, registerUser, clearAuthError } from '../store/slices/authSlice';
import { showToast } from '../utils/toast';
import { SocialSignIn } from '../auth/SocialSignIn';
import { Button, InputField, cn } from '../components/ui';
import { Role } from '../types';

interface AuthPageProps {
  defaultRole?: Role;
  defaultMode?: 'login' | 'register';
  onBack: () => void;
}

type Mode = 'login' | 'register';

/* ------------------------------------------------------------------ *
 * Role definitions — single source for the picker, replacing the two
 * redundant button rows (quick-demo + role tabs) the modal had.
 * ------------------------------------------------------------------ */

const ROLES: Array<{
  value: Role;
  label: string;
  blurb: string;
  icon: typeof UserCheck;
  demoEmail: string;
  demoName: string;
  /** Admin accounts are provisioned, never self-registered. */
  canRegister: boolean;
}> = [
  {
    value: 'customer',
    label: 'Customer',
    blurb: 'Order & track food',
    icon: UserCheck,
    demoEmail: 'alex@example.com',
    demoName: 'Alex Johnson',
    canRegister: true,
  },
  {
    value: 'owner',
    label: 'Restaurant',
    blurb: 'Manage your menu',
    icon: Store,
    demoEmail: 'owner@pizzamaestro.com',
    demoName: 'Restaurant Owner',
    canRegister: true,
  },
  {
    value: 'admin',
    label: 'Admin',
    blurb: 'Platform control',
    icon: ShieldCheck,
    demoEmail: 'admin@cravecache.com',
    demoName: 'Root Admin',
    canRegister: false,
  },
];

const HIGHLIGHTS = [
  { icon: Sparkles, title: 'AI meal curation', copy: 'Describe a craving and get a matched order.' },
  { icon: Bike, title: 'Live order tracking', copy: 'Follow every stage from kitchen to doorstep.' },
  { icon: BarChart3, title: 'Role-aware portals', copy: 'Separate views for diners, kitchens and admins.' },
];

/* ------------------------------ validation ------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const validate = (
  mode: Mode,
  values: { name: string; email: string; phone: string; password: string }
): FormErrors => {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Enter a valid email address, e.g. name@example.com.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (mode === 'register' && values.password.length < 6) {
    errors.password = 'Use at least 6 characters.';
  }

  if (mode === 'register') {
    if (!values.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (values.name.trim().length < 2) {
      errors.name = 'That name looks too short.';
    }

    if (values.phone.trim() && values.phone.replace(/\D/g, '').length < 7) {
      errors.phone = 'Enter a valid phone number, or leave it blank.';
    }
  }

  return errors;
};

/* -------------------------------- page --------------------------------- */

export const AuthPage: React.FC<AuthPageProps> = ({
  defaultRole = 'customer',
  defaultMode = 'login',
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const serverError = useAppSelector((state) => state.auth.error);

  const initialRole = ROLES.find((r) => r.value === defaultRole) || ROLES[0];

  const [role, setRole] = useState<Role>(initialRole.value);
  const [mode, setMode] = useState<Mode>(
    defaultMode === 'register' && !initialRole.canRegister ? 'login' : defaultMode
  );

  const [name, setName] = useState(initialRole.demoName);
  const [email, setEmail] = useState(initialRole.demoEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Guards a second submit slipping through before state has settled.
  const inFlight = useRef(false);
  // Once the user edits identity fields themselves, switching role must not
  // overwrite what they typed.
  const emailDirty = useRef(false);
  const nameDirty = useRef(false);

  const activeRole = useMemo(
    () => ROLES.find((r) => r.value === role) || ROLES[0],
    [role]
  );

  const handleRoleChange = (next: (typeof ROLES)[number]) => {
    setRole(next.value);
    setErrors({});
    dispatch(clearAuthError());

    if (!next.canRegister && mode === 'register') setMode('login');
    if (!emailDirty.current) setEmail(next.demoEmail);
    if (!nameDirty.current) setName(next.demoName);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    dispatch(clearAuthError());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;

    const values = { name, email, phone, password };
    const found = validate(mode, values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      showToast.error('Please fix the highlighted fields.');
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    dispatch(clearAuthError());

    try {
      if (mode === 'login') {
        const res = await dispatch(loginUser({ email: email.trim(), password, role }));
        if (loginUser.fulfilled.match(res)) {
          showToast.success(`Welcome back, ${res.payload.user.name}.`);
        } else {
          showToast.error(String(res.payload || 'Could not sign you in.'));
        }
      } else {
        const res = await dispatch(
          registerUser({ name: name.trim(), email: email.trim(), phone, password, role })
        );
        if (registerUser.fulfilled.match(res)) {
          showToast.success('Account created. Welcome to CraveCache.');
        } else {
          showToast.error(String(res.payload || 'Could not create your account.'));
        }
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ================= Brand panel ================= */}
      <aside className="relative hidden overflow-hidden bg-ink-900 px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-14">
        {/* Depth without imagery: soft brand glows on a dark field. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-brand-700/25 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-brand-500 text-white shadow-brand">
              <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Crave<span className="text-brand-500">Cache</span>
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
            Food ordering, with an AI that actually knows the menu.
          </h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-white/60">
            One platform, three purpose-built portals — for the people ordering, the kitchens
            cooking, and the team running it all.
          </p>

          <ul className="mt-9 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, copy }) => (
              <li key={title} className="flex gap-3.5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-white/10 text-brand-300 ring-1 ring-inset ring-white/10">
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-[13px] font-medium leading-relaxed text-white/50">{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-6 border-t border-white/10 pt-6">
          {[
            { value: '6', label: 'Restaurants' },
            { value: '15', label: 'Dishes' },
            { value: '3', label: 'Portals' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold tracking-tight text-white">{stat.value}</p>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= Form panel ================= */}
      <main className="flex flex-col justify-center bg-surface-page px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile brand lockup — the aside is hidden at this width. */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-control bg-brand-500 text-white shadow-brand">
              <UtensilsCrossed className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-ink-900">
              Crave<span className="text-brand-500">Cache</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            Back to home
          </button>

          <header>
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">
              {isRegister ? 'Create your account' : 'Sign in to CraveCache'}
            </h2>
            <p className="mt-1.5 text-sm font-medium text-ink-500">
              {isRegister
                ? 'Set up an account to start ordering in minutes.'
                : 'Choose your portal and continue where you left off.'}
            </p>
          </header>

          {/* ---------------- Role picker ---------------- */}
          <fieldset className="mt-7">
            <legend className="mb-2 text-[13px] font-bold text-ink-800">
              I&rsquo;m signing in as
            </legend>
            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Account type">
              {ROLES.map((option) => {
                const Icon = option.icon;
                const selected = role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleRoleChange(option)}
                    className={cn(
                      'group relative flex flex-col items-start gap-2 rounded-card border p-3 text-left transition-all',
                      selected
                        ? 'border-brand-500 bg-brand-50 shadow-card ring-1 ring-brand-500'
                        : 'border-surface-line bg-white hover:border-ink-400/50 hover:bg-surface-sunken/60'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-control transition-colors',
                        selected ? 'bg-brand-500 text-white' : 'bg-surface-sunken text-ink-500'
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block text-[13px] font-bold tracking-tight',
                          selected ? 'text-brand-700' : 'text-ink-900'
                        )}
                      >
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-semibold leading-tight text-ink-500">
                        {option.blurb}
                      </span>
                    </span>

                    {selected && (
                      <span
                        aria-hidden="true"
                        className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white"
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={4} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* ---------------- Social sign-in ---------------- */}
          <div className="mt-6">
            <SocialSignIn onStart={() => dispatch(clearAuthError())} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-surface-line" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">
              or continue with email
            </span>
            <span className="h-px flex-1 bg-surface-line" />
          </div>

          {/* ---------------- Credentials form ---------------- */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isRegister && (
              <InputField
                label="Full name"
                required
                value={name}
                error={errors.name}
                icon={<UserIcon className="h-4 w-4" />}
                placeholder="Jordan Rivera"
                autoComplete="name"
                onChange={(e) => {
                  nameDirty.current = true;
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
              />
            )}

            <InputField
              label="Email address"
              type="email"
              required
              value={email}
              error={errors.email}
              icon={<Mail className="h-4 w-4" />}
              placeholder="name@example.com"
              autoComplete="email"
              onChange={(e) => {
                emailDirty.current = true;
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />

            {isRegister && (
              <InputField
                label="Phone number"
                value={phone}
                error={errors.phone}
                hint="Optional — used for delivery updates."
                icon={<Phone className="h-4 w-4" />}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
              />
            )}

            <div className="relative">
              <InputField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                error={errors.password}
                icon={<Lock className="h-4 w-4" />}
                placeholder="••••••••"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-7 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface-sunken hover:text-ink-800"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Server-side failures, distinct from per-field validation. */}
            {serverError && (
              <p
                role="alert"
                className="rounded-control border border-danger-500/25 bg-danger-50 px-3 py-2.5 text-[13px] font-bold text-danger-600"
              >
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={submitting}
              loadingText={isRegister ? 'Creating account…' : 'Signing in…'}
              className="mt-1"
            >
              {isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {/* ---------------- Mode switch ---------------- */}
          <p className="mt-6 text-center text-[13px] font-semibold text-ink-500">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : activeRole.canRegister ? (
              <>
                New to CraveCache?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <span className="text-ink-400">
                Admin accounts are provisioned by the platform team.
              </span>
            )}
          </p>

          <p className="mt-8 text-center text-[13px] font-medium leading-relaxed text-ink-400">
            Demo credentials are pre-filled for the selected portal. Roles for social sign-in are
            assigned server-side from your email address.
          </p>
        </div>
      </main>
    </div>
  );
};
