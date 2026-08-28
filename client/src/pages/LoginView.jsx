import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FaIcon from '../components/icons/FaIcon';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, signInAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setErrorMessage('Please enter your full name or household title.');
          setLoading(false);
          return;
        }
        await signUp(displayName, email, password);
      } else {
        await signIn(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in failed.');
    }
  };

  const handleDemoSignIn = async (role) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInAsDemo(role);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage('Failed to load demo profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4 select-none">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#12392B] text-[#41C98A] shadow-md mb-2">
            <FaIcon name="network" className="text-xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#15211B] tracking-tight">
            {isSignUp ? 'Join GridShare Community' : 'Welcome back to GridShare'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6A63] font-medium">
            {isSignUp
              ? 'Create your prosumer identity to trade clean peer energy.'
              : 'Sign in to access your household cockpit and local microgrid.'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="rounded-3xl border border-[#DCE4DE] bg-white p-6 sm:p-8 shadow-card space-y-5">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F5F7F3] border border-[#DCE4DE]">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition duration-150 ${
                !isSignUp
                  ? 'bg-white text-[#15211B] shadow-xs'
                  : 'text-[#5E6A63] hover:text-[#15211B]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
              className={`py-2 rounded-xl text-xs font-bold transition duration-150 ${
                isSignUp
                  ? 'bg-white text-[#15211B] shadow-xs'
                  : 'text-[#5E6A63] hover:text-[#15211B]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-2xl border border-[#F8D2D2] bg-[#FDF2F2] p-3 text-xs font-semibold text-[#D85D5D] flex items-center gap-2 animate-in fade-in">
              <FaIcon name="warning" className="text-sm flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#15211B]">Full Name or Household</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House A Resident"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/40 px-3.5 py-2.5 text-xs text-[#15211B] placeholder-[#87918B] focus:border-[#209B67] focus:bg-white focus:outline-none transition"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#15211B]">Email Address</label>
              <input
                type="email"
                required
                placeholder="prosumer@gridshare.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/40 px-3.5 py-2.5 text-xs text-[#15211B] placeholder-[#87918B] focus:border-[#209B67] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#15211B]">Password</label>
                {!isSignUp && (
                  <span className="text-[11px] text-[#209B67] font-semibold cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#DCE4DE] bg-[#F5F7F3]/40 px-3.5 py-2.5 text-xs text-[#15211B] placeholder-[#87918B] focus:border-[#209B67] focus:bg-white focus:outline-none transition"
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              isLoading={loading}
              className="w-full justify-center py-2.5 text-xs font-bold shadow-sm mt-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#DCE4DE]" />
            <span className="bg-white px-3 text-[11px] font-bold text-[#87918B] uppercase tracking-wider">
              or
            </span>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-[#DCE4DE] bg-white px-4 py-2.5 text-xs font-bold text-[#15211B] hover:bg-[#F5F7F3] shadow-subtle transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Quick Demo Switcher Strip for Evaluators */}
          <div className="pt-3 border-t border-[#DCE4DE] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#87918B]">
              <span className="uppercase tracking-wider">Instant Evaluator Demo Login</span>
              <Badge variant="ai" size="xs">1-Click Test</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('house_a')}
                className="p-2.5 rounded-xl border border-[#DCE4DE] bg-[#F5F7F3] hover:bg-[#E7F6EE] hover:border-[#209B67] text-left transition"
              >
                <div className="text-[11px] font-bold text-[#15211B] flex items-center gap-1">
                  <FaIcon name="solar" className="text-[#209B67] text-xs" />
                  House A (Prosumer)
                </div>
                <div className="text-[10px] font-mono text-[#209B67] mt-0.5">+4.7 kW Surplus</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('house_b')}
                className="p-2.5 rounded-xl border border-[#DCE4DE] bg-[#F5F7F3] hover:bg-[#FDF2F2] hover:border-[#D85D5D] text-left transition"
              >
                <div className="text-[11px] font-bold text-[#15211B] flex items-center gap-1">
                  <FaIcon name="home" className="text-[#397BD2] text-xs" />
                  House B (Consumer)
                </div>
                <div className="text-[10px] font-mono text-[#D85D5D] mt-0.5">-2.8 kW Deficit</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
