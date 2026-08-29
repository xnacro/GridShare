import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FaIcon from '../icons/FaIcon';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function LoginModal({ isOpen, onClose }) {
  const { user, profile, household, signIn, signUp, signInWithGoogle, signInAsDemo, signOut } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

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
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in failed.');
    }
  };

  const handleDemoSignIn = async (role) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInAsDemo(role);
      onClose();
    } catch (err) {
      setErrorMessage('Failed to load demo profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#15211B]/50 p-4 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md rounded-3xl border border-[#DCE4DE] bg-white p-6 sm:p-7 shadow-modal animate-in zoom-in-95 duration-150 space-y-5">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#DCE4DE]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#12392B] text-[#41C98A] flex items-center justify-center text-lg flex-shrink-0">
              <FaIcon name="user" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#15211B]">
                {user ? 'Account & Household Profile' : isSignUp ? 'Create GridShare Account' : 'Sign In to GridShare'}
              </h3>
              <p className="text-xs text-[#5E6A63]">
                {user ? 'Manage active session and multi-tenant binding' : 'Multi-tenant prosumer and consumer identity'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
          >
            <FaIcon name="close" />
          </button>
        </div>

        {/* If Already Logged In: Show Account & Household Info + Demo Switcher */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#F5F7F3] border border-[#DCE4DE] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#15211B]">{profile?.display_name || 'GridShare Member'}</span>
                <Badge variant="surplus" size="xs">AUTHENTICATED</Badge>
              </div>
              <div className="text-xs text-[#5E6A63] font-mono">{user.email}</div>
              <div className="pt-2 border-t border-[#DCE4DE] flex items-center justify-between text-xs">
                <span className="text-[#87918B]">Bound Household:</span>
                <strong className="text-[#12392B]">{household?.name || 'House A'}</strong>
              </div>
            </div>

            {/* Quick Multi-Tenant Switcher */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#87918B]">
                <span className="uppercase tracking-wider">Switch Perspective / Demo User</span>
                <Badge variant="ai" size="xs">1-Click Test</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('house_a')}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    household?.id === 'house_a'
                      ? 'bg-[#E7F6EE] border-[#209B67] text-[#12392B] font-bold'
                      : 'bg-[#F5F7F3] border-[#DCE4DE] text-[#5E6A63] hover:text-[#15211B]'
                  }`}
                >
                  <div className="text-xs flex items-center gap-1">
                    <FaIcon name="solar" className="text-[#209B67]" />
                    House A
                  </div>
                  <div className="text-[10px] font-mono text-[#209B67] mt-0.5">+4.7 kW Surplus</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('house_b')}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    household?.id === 'house_b'
                      ? 'bg-[#FDF2F2] border-[#D85D5D] text-[#15211B] font-bold'
                      : 'bg-[#F5F7F3] border-[#DCE4DE] text-[#5E6A63] hover:text-[#15211B]'
                  }`}
                >
                  <div className="text-xs flex items-center gap-1">
                    <FaIcon name="home" className="text-[#397BD2]" />
                    House B
                  </div>
                  <div className="text-[10px] font-mono text-[#D85D5D] mt-0.5">-2.8 kW Deficit</div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE4DE] flex items-center justify-between">
              <Button variant="danger" size="sm" onClick={handleSignOut} isLoading={loading}>
                Sign Out
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* If Not Logged In: Show Sign In / Sign Up Form */
          <div className="space-y-4">
            
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F5F7F3] border border-[#DCE4DE]">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMessage(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition duration-150 ${
                  !isSignUp ? 'bg-white text-[#15211B] shadow-xs' : 'text-[#5E6A63] hover:text-[#15211B]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMessage(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition duration-150 ${
                  isSignUp ? 'bg-white text-[#15211B] shadow-xs' : 'text-[#5E6A63] hover:text-[#15211B]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="rounded-2xl border border-[#F8D2D2] bg-[#FDF2F2] p-3 text-xs font-semibold text-[#D85D5D] flex items-center gap-2">
                <FaIcon name="warning" className="text-sm flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#15211B]">Full Name / Household</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House A Resident"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-[#DCE4DE] bg-[#F5F7F3]/40 px-3 py-2 text-xs text-[#15211B] placeholder-[#87918B] focus:border-[#209B67] focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#15211B]">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="prosumer@gridshare.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE4DE] bg-[#F5F7F3]/40 px-3 py-2 text-xs text-[#15211B] placeholder-[#87918B] focus:border-[#209B67] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#15211B]">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#DCE4DE] bg-[#F5F7F3]/40 px-3 py-2 text-xs text-[#15211B] placeholder-[#87918B] focus:border-[#209B67] focus:bg-white focus:outline-none"
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

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-[#DCE4DE] bg-white px-4 py-2 text-xs font-bold text-[#15211B] hover:bg-[#F5F7F3] shadow-subtle transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Instant Demo Switcher */}
            <div className="pt-2 border-t border-[#DCE4DE] space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] font-bold text-[#87918B]">
                <span className="uppercase tracking-wider">Instant Evaluator Demo Access</span>
                <Badge variant="ai" size="xs">1-Click</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('house_a')}
                  className="p-2 rounded-xl border border-[#DCE4DE] bg-[#F5F7F3] hover:bg-[#E7F6EE] hover:border-[#209B67] text-left transition"
                >
                  <div className="text-[11px] font-bold text-[#15211B]">House A (Prosumer)</div>
                  <div className="text-[9px] font-mono text-[#209B67]">+4.7 kW</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('house_b')}
                  className="p-2 rounded-xl border border-[#DCE4DE] bg-[#F5F7F3] hover:bg-[#FDF2F2] hover:border-[#D85D5D] text-left transition"
                >
                  <div className="text-[11px] font-bold text-[#15211B]">House B (Consumer)</div>
                  <div className="text-[9px] font-mono text-[#D85D5D]">-2.8 kW</div>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
