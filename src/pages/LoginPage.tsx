import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const { state, addToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      addToast('error', 'Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (error) {
      addToast('error', error.message);
      return;
    }

    addToast('success', 'Signed in successfully.');
    navigate('/dashboard', { replace: true });
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setIsGoogleSubmitting(false);

    if (error) {
      addToast('error', error.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-background flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10">
          <div className="flex items-center gap-0.5 mb-20">
            <span className="font-mono font-bold text-2xl text-primary">STORE</span>
            <span className="font-mono font-bold text-2xl text-foreground">SYNC</span>
          </div>
        </div>

        <div className="relative z-10">
          <blockquote className="font-mono text-2xl md:text-3xl text-foreground leading-relaxed mb-6">
            "Inventory clarity<br />at the speed<br />of retail."
          </blockquote>
          <div className="w-16 h-0.5 bg-primary mb-4" />
          <p className="text-muted-foreground text-sm">Built for operations teams that move fast.</p>
        </div>

        <div className="relative z-10 flex gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary/10 rounded-full"
              style={{ height: `${20 + Math.sin(i * 0.5) * 30}px` }}
            />
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-card flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-0.5 mb-10">
            <span className="font-mono font-bold text-2xl text-primary">STORE</span>
            <span className="font-mono font-bold text-2xl text-foreground">SYNC</span>
          </div>

          <h2 className="font-mono font-bold text-2xl text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your StoreSync workspace</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 bg-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm"
                placeholder="........"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity mt-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="relative py-1">
              <div className="h-px bg-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                OR
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full py-3 border border-border bg-elevated text-foreground font-semibold rounded-lg hover:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <GoogleLogo />
              {isGoogleSubmitting ? 'Redirecting...' : 'Continue with Google'}
            </button>
          </div>

          <p className="text-center text-muted-foreground text-xs mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-primary hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M9 3.48c1.69 0 2.84.73 3.49 1.34l2.54-2.48C13.46.89 11.4 0 9 0 5.48 0 2.44 2.02.96 4.96l2.95 2.29C4.62 5.09 6.62 3.48 9 3.48z"
      />
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.25h2.91c1.7-1.57 2.69-3.88 2.69-6.6z"
      />
      <path
        fill="#FBBC05"
        d="M3.91 10.74c-.18-.54-.29-1.11-.29-1.74s.1-1.2.29-1.74V5.01H.96A8.98 8.98 0 0 0 0 9c0 1.45.35 2.82.96 3.99l2.95-2.25z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.25c-.8.54-1.82.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.32A9 9 0 0 0 9 18z"
      />
    </svg>
  );
}
