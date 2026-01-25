import { X, Loader } from 'lucide-react';
import { useState } from 'react';
import { Language, translations } from '../translations';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import logo from 'figma:asset/d3b087d995c1120c4f6f827938a39596d087b710.png';

type LoginRegisterModalProps = {
  onClose: () => void;
  onLoginSuccess: (user: any, needsActivation: boolean) => void;
  language: Language;
};

export function LoginRegisterModal({ onClose, onLoginSuccess, language }: LoginRegisterModalProps) {
  const t = translations[language];
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !activationCode.trim()) {
      setError(t.memberActivation?.error || 'Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email: email.trim(), password: activationCode }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Login error:', data);
        setError(data.error || 'Invalid email or password');
        setIsSubmitting(false);
        return;
      }

      console.log('Login successful:', data);
      
      // Pass the full user data to parent
      onLoginSuccess(data.user, false);
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !activationCode.trim() || !confirmPasswordValue.trim() || !name.trim() || !surname.trim() || !mobile.trim()) {
      setError(t.memberActivation?.error || 'Please fill in all fields');
      return;
    }
    
    if (activationCode !== confirmPasswordValue) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            password: activationCode,
            name: name.trim(),
            surname: surname.trim(),
            mobile: mobile.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Register error:', data);
        setError(data.error || 'Registration failed');
        setIsSubmitting(false);
        return;
      }

      console.log('Registration successful:', data);
      
      // After successful registration, show login screen
      setMode('login');
      setActivationCode('');
      setConfirmPasswordValue('');
      setError('');
      setIsSubmitting(false);
      
      // You can show a success message here
      alert(t.registerSuccess || 'Registration successful! Please login.');
    } catch (error) {
      console.error('Register error:', error);
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'login') {
        handleLogin();
      } else {
        handleRegister();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f5f0ed] rounded-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e8dfd8] sticky top-0 bg-[#f5f0ed] z-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <h2 className="text-lg text-[#3d2f28]">{t.memberLogin}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#e8dfd8] rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-[#6b5949]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Login/Register Tabs */}
          <div className="flex gap-2 mb-4 border-b border-[#e8dfd8]">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 pb-2 text-sm transition-colors ${
                mode === 'login'
                  ? 'text-[#6b5949] border-b-2 border-[#6b5949] font-medium'
                  : 'text-[#8b7764]'
              }`}
              disabled={isSubmitting}
            >
              {t.loginTab}
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 pb-2 text-sm transition-colors ${
                mode === 'register'
                  ? 'text-[#6b5949] border-b-2 border-[#6b5949] font-medium'
                  : 'text-[#8b7764]'
              }`}
              disabled={isSubmitting}
            >
              {t.registerTab}
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <p className="text-sm text-[#6b5949] mb-4">
                {t.memberLoginDesc}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.activationCode}
                  </label>
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder={t.activationCodePlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949] font-mono"
                    disabled={isSubmitting}
                    maxLength={14}
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  className="w-full bg-[#9ca571] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#8a9463] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {t.submitting || 'Loading...'}
                    </>
                  ) : (
                    t.login
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-[#8b7764]">
                    {t.noAccount}{' '}
                    <button
                      onClick={() => setMode('register')}
                      className="text-[#6b5949] hover:underline font-medium"
                      disabled={isSubmitting}
                    >
                      {t.register}
                    </button>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[#6b5949] mb-4">
                {t.createAccount || 'Create your account'}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.name}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.namePlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.surname}
                  </label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.surnamePlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.mobile}
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.mobilePlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.emailPlaceholder}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.password}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#3d2f28] mb-1">
                    {t.confirmPassword}
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordValue}
                    onChange={(e) => setConfirmPasswordValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.confirmPassword}
                    className="w-full px-3 py-2 rounded-lg bg-white text-sm text-[#3d2f28] placeholder:text-[#8b7764] focus:outline-none focus:ring-2 focus:ring-[#6b5949]"
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  className="w-full bg-[#9ca571] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#8a9463] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {t.submitting || 'Loading...'}
                    </>
                  ) : (
                    t.register
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-[#8b7764]">
                    {t.alreadyHaveAccount}{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-[#6b5949] hover:underline font-medium"
                      disabled={isSubmitting}
                    >
                      {t.loginHere}
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="text-center pt-4 border-t border-[#e8dfd8] mt-4">
            <p className="text-xs text-[#8b7764] mb-1">
              {t.needHelp || 'Need help?'}
            </p>
            <p className="text-xs text-[#6b5949]">
              {t.contactUs} info@wellnestpilates.mk
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}