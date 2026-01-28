import { useState } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function LogoUploader() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/upload-logo`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, url: data.url });
        console.log('✅ Logo uploaded:', data.url);
        console.log('📝 Update the email template in /supabase/functions/server/index.tsx with this URL:');
        console.log(data.url);
      } else {
        setResult({ success: false, error: data.error || 'Upload failed' });
      }
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-2">Upload Logo for Email Template</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload the WellNest logo to Supabase Storage for use in email templates.
      </p>

      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-green-50 file:text-green-700
          hover:file:bg-green-100
          disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {uploading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <div>
              <p className="text-sm font-semibold text-green-800 mb-2">✅ Logo uploaded successfully!</p>
              <p className="text-xs text-green-700 mb-2">Public URL:</p>
              <code className="block p-2 bg-white rounded text-xs break-all border border-green-200">
                {result.url}
              </code>
              <p className="text-xs text-green-700 mt-3">
                📝 <strong>Next step:</strong> Update the email template in<br />
                <code className="bg-white px-1 py-0.5 rounded">/supabase/functions/server/index.tsx</code><br />
                Replace the placeholder logo URL with the URL above.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-red-800">❌ Upload failed</p>
              <p className="text-xs text-red-700 mt-1">{result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> The logo should be a PNG file with transparent background for best results in emails.
        </p>
      </div>
    </div>
  );
}
