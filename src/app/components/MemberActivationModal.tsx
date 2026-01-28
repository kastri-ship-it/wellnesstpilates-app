import { useState } from 'react';
import { X, Mail, Check, Loader } from 'lucide-react';
import { Language, translations } from '../translations';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import logo from '../../assets/d3b087d995c1120c4f6f827938a39596d087b710.png';

type MemberActivationModalProps = {
  onClose: () => void;
  onSuccess: (email: string) => void;
  language: Language;
};

export function MemberActivationModal({ onClose, onSuccess, language }: MemberActivationModalProps) {
  const t = translations[language];
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !code.trim()) {
      setError(t.memberActivation?.error || 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/activate-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Activation error:', data);
        setError(data.error || 'Activation failed. Please check your code and try again.');
        setIsSubmitting(false);
        return;
      }

      console.log('Member activated successfully:', data);
      setSuccess(true);

      // Show success message for 2 seconds then call onSuccess
      setTimeout(() => {
        onSuccess(email.trim());
      }, 2000);
    } catch (error) {
      console.error('Error activating member:', error);
      setError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e8dfd8]">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <div>
              <h3 className="text-base text-[#3d2f28] font-medium">
                {t.memberActivation?.title || 'Activate Member Area'}
              </h3>
              <p className="text-xs text-[#8b7764]">
                {t.memberActivation?.subtitle || 'Enter your activation code'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f5f0ed] rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-[#6b5949]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg text-[#3d2f28] font-medium mb-2">
                {t.memberActivation?.successTitle || 'Activation Successful!'}
              </h4>
              <p className="text-sm text-[#6b5949]">
                {t.memberActivation?.successMessage || 'Your member area has been activated.'}
              </p>
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="bg-[#f5f0ed] rounded-lg p-4 mb-4 flex gap-3">
                <Mail className="w-5 h-5 text-[#9ca571] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[#3d2f28] mb-1 font-medium">
                    {t.memberActivation?.infoTitle || 'Check Your Email'}
                  </p>
                  <p className="text-xs text-[#6b5949] leading-relaxed">
                    {t.memberActivation?.infoMessage || 'After booking, the admin will send you an activation code via email. Enter it here to access your package.'}
                  </p>
                </div>
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm text-[#6b5949] mb-2">
                  {t.email || 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[#e8dfd8] rounded-lg text-[#3d2f28] focus:outline-none focus:border-[#9ca571] transition-colors"
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Activation Code Input */}
              <div className="mb-4">
                <label className="block text-sm text-[#6b5949] mb-2">
                  {t.memberActivation?.codeLabel || 'Activation Code'}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border-2 border-[#e8dfd8] rounded-lg text-[#3d2f28] font-mono text-lg tracking-wider focus:outline-none focus:border-[#9ca571] transition-colors"
                  placeholder="WN-XXXX-XXXX"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-[#8b7764] mt-2">
                  {t.memberActivation?.codeHint || 'Enter the activation code from your email'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-[#f5f0ed] text-[#6b5949] rounded-lg text-sm font-medium hover:bg-[#e8dfd8] transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#9ca571] text-white rounded-lg text-sm font-medium hover:bg-[#8a9461] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      {t.memberActivation?.activating || 'Activating...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t.memberActivation?.activate || 'Activate'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}