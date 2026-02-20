import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const { state, addToast } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      addToast('error', 'All fields are required.');
      return;
    }

    if (password.length < 6) {
      addToast('error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      addToast('error', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
        },
      },
    });
    setIsSubmitting(false);

    if (error) {
      addToast('error', error.message);
      return;
    }

    const hasSession = Boolean(data.session);
    if (hasSession) {
      addToast('success', 'Account created. Welcome to StoreSync.');
      navigate('/dashboard', { replace: true });
      return;
    }

    addToast('info', 'Account created. Check your email to confirm, then sign in.');
    navigate(`/login?email=${encodeURIComponent(email.trim())}`, { replace: true });
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

          <h2 className="font-mono font-bold text-2xl text-foreground mb-2">Create account</h2>
          <p className="text-muted-foreground text-sm mb-8">Register your StoreSync workspace access</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-3 bg-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm"
                placeholder="Your name"
              />
            </div>
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
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors text-sm"
                placeholder="Re-enter password"
              />
            </div>
            <button
              onClick={handleRegister}
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity mt-2 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-muted-foreground text-xs mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
