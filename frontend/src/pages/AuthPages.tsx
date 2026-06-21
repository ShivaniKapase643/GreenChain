import React, { useState } from 'react';
import { navigate } from '../router';
import { Card, Icon } from '../components/UI';
import { PageHero } from '../components/Shell';
import { theme } from '../theme';

const AuthLayout: React.FC<React.PropsWithChildren<{ title: string; subtitle: string; icon: string }>> = ({ title, subtitle, icon, children }) => (
  <div className="gc-auth-page">
    <PageHero title={title} subtitle={subtitle} icon={icon} />
    <Card className="gc-auth-card">
      <div className="gc-auth-card__brand">
        <div className="gc-brand__mark">G</div>
        <div>
          <strong>GreenChain</strong>
          <span>Operational sustainability dashboard</span>
        </div>
      </div>
      {children}
    </Card>
  </div>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
}> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label className="gc-form-field">
    <span>{label}</span>
    <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
  </label>
);

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      window.alert('Please enter both email and password.');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 900);
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account" icon="login">
      <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="Enter your email" />
      <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="Enter your password" />
      <button className="gc-button gc-button--primary gc-auth-submit" onClick={handleLogin} disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
      <div className="gc-auth-switch">
        <span>Don't have an account?</span>
        <button className="gc-link-button" onClick={() => navigate('/auth/register')}>Sign Up</button>
      </div>
    </AuthLayout>
  );
};

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!name || !email || !password || !confirmPassword) {
      window.alert('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      window.alert('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      window.alert('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      window.alert('Account created successfully!');
      navigate('/auth/login');
    }, 900);
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join GreenChain today" icon="person_add">
      <Input label="Full Name" value={name} onChange={setName} placeholder="Enter your full name" />
      <Input label="Email" value={email} onChange={setEmail} type="email" placeholder="Enter your email" />
      <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="Create a password" />
      <Input label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm your password" />
      <button className="gc-button gc-button--primary gc-auth-submit" onClick={handleRegister} disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
      <div className="gc-auth-switch">
        <span>Already have an account?</span>
        <button className="gc-link-button" onClick={() => navigate('/auth/login')}>Sign In</button>
      </div>
    </AuthLayout>
  );
};
