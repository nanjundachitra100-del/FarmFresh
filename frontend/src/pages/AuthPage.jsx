import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AuthPage.css';

export const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const reset = () => {
    setError('');
    setInfo('');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    reset();

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!supabase) {
      setError('Authentication service is unavailable. Check your configuration.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), role }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setInfo('Account created! Check your email to confirm, then sign in.');
      setMode('signin');
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    reset();

    if (!supabase) {
      setError('Authentication service is unavailable. Check your configuration.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Sprout size={32} className="auth-logo-icon" />
          <span className="auth-logo-text">Farm<span>Fresh</span></span>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); reset(); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); reset(); }}
          >
            Create Account
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="auth-field">
              <label htmlFor="signin-email">Email</label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="signin-password">Password</label>
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-role">I am a</label>
              <select
                id="signup-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Customer</option>
                <option value="farmer">Farmer</option>
              </select>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
