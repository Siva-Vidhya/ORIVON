import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Chrome, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface SignInProps {
  onSignIn: (email: string) => void;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      onSignIn(email);
    }, 1500);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'google_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        setError('Popup blocked. Please allow popups for this site.');
        setIsLoading(false);
        return;
      }

      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          setIsLoading(false);
          onSignIn(event.data.email);
        }
      };

      window.addEventListener('message', messageListener);
    } catch (err) {
      console.error(err);
      setError('Failed to initiate Google Sign-In');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#0F172A] p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-brand)]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#1E293B] rounded-[32px] shadow-2xl shadow-brand/5 overflow-hidden border border-white/20 dark:border-white/5 relative z-10"
      >
        {/* Left Side: Illustration/Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--color-brand-light)] dark:bg-[#7FA4E8]/5 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="w-12 h-12 bg-[var(--color-brand)] rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand/20">
              O
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
                Elevate your <br />
                <span className="text-[var(--color-brand)] dark:text-[#7FA4E8]">Productivity</span>
              </h1>
              <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1] leading-relaxed max-w-xs">
                The AI-powered OS designed for students, researchers, and early professionals.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">
              <ShieldCheck className="w-5 h-5 text-[var(--color-brand)] dark:text-[#7FA4E8]" />
              Private & Secure by default
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1E293B] bg-neutral-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="User" referrerPolicy="no-referrer" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1E293B] bg-[var(--color-brand)] flex items-center justify-center text-[10px] font-bold text-white">
                +2k
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-500">
              Joined by researchers worldwide
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-brand/20 blur-3xl rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] dark:text-[#E2E8F0]">
                {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
              </h2>
              <p className="text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">
                {mode === 'signin' ? 'Enter your details to access your workspace.' : 
                 mode === 'signup' ? 'Join Orivon and start your journey.' : 
                 'Enter your email to receive a reset link.'}
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl font-bold text-sm text-[var(--color-text-primary)] dark:text-[#E2E8F0] hover:bg-neutral-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <Chrome className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-white/10"></div>
                </div>
                <span className="relative px-4 bg-white dark:bg-[#1E293B] text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                  Or continue with email
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-[var(--color-brand)] transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-section)] dark:bg-white/5 border border-transparent focus:border-[var(--color-brand)] dark:focus:border-[#7FA4E8] rounded-2xl focus:outline-none transition-all text-[var(--color-text-primary)] dark:text-[#E2E8F0] placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Password</label>
                      {mode === 'signin' && (
                        <button 
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[10px] font-bold text-[var(--color-brand)] dark:text-[#7FA4E8] hover:underline uppercase tracking-widest"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-[var(--color-brand)] transition-colors" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-[var(--color-bg-section)] dark:bg-white/5 border border-transparent focus:border-[var(--color-brand)] dark:focus:border-[#7FA4E8] rounded-2xl focus:outline-none transition-all text-[var(--color-text-primary)] dark:text-[#E2E8F0] placeholder:text-neutral-400"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-bold text-red-500 ml-1"
                  >
                    {error}
                  </motion.p>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[var(--color-brand)] dark:bg-[#7FA4E8] text-white dark:text-[#0F172A] rounded-2xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-brand/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            </div>

            <div className="text-center">
              <p className="text-sm text-[var(--color-text-secondary)] dark:text-[#CBD5E1]">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="font-bold text-[var(--color-brand)] dark:text-[#7FA4E8] hover:underline"
                >
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
        <a href="#" className="hover:text-[var(--color-brand)] transition-colors">Privacy Policy</a>
        <span className="w-1 h-1 bg-neutral-200 dark:bg-white/10 rounded-full" />
        <a href="#" className="hover:text-[var(--color-brand)] transition-colors">Terms of Service</a>
        <span className="w-1 h-1 bg-neutral-200 dark:bg-white/10 rounded-full" />
        <a href="#" className="hover:text-[var(--color-brand)] transition-colors">Contact Support</a>
      </div>
    </div>
  );
}
