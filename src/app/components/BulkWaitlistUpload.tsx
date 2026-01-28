import { useState } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface WaitlistUser {
  email: string;
  name: string;
  surname: string;
  phone: string;
}

interface BulkWaitlistUploadProps {
  onUploadComplete?: () => void;
}

export function BulkWaitlistUpload({ onUploadComplete }: BulkWaitlistUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const predefinedUsers: WaitlistUser[] = [
    {
      email: 'asani.kastri@gmail.com',
      name: 'Besa',
      surname: 'Ibrahimi',
      phone: '7081072'
    },
    {
      email: 'kastri@mikgroup.ch',
      name: 'Xenia',
      surname: 'Ivanovic',
      phone: '21313112'
    },
    {
      email: 'kastri.asani@hurra.com',
      name: 'Anëtar',
      surname: 'I Ri',
      phone: '1231231'
    }
  ];

  // Delete old users with incorrect emails
  const oldEmails = [
    'asani.kastri@gmail.com',
    'kastri@mkgroup.ch',
    'kastri.asani@khurra.com'
  ];

  const handleDeleteOldUsers = async () => {
    setDeleting(true);
    setResults(null);

    let deletedCount = 0;
    const errors: string[] = [];

    for (const email of oldEmails) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/waitlist/${encodeURIComponent(email)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          deletedCount++;
          console.log(`🗑️ Deleted: ${email}`);
        } else {
          const errorData = await response.json();
          if (errorData.error !== 'User not found in waitlist') {
            errors.push(`${email}: ${errorData.error || 'Unknown error'}`);
            console.error(`❌ Failed to delete: ${email}`, errorData);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${email}: ${errorMsg}`);
        console.error(`❌ Error deleting ${email}:`, error);
      }
    }

    setDeleting(false);
    console.log(`✅ Deleted ${deletedCount} old users`);
    
    if (onUploadComplete) {
      setTimeout(() => onUploadComplete(), 500);
    }
  };

  const handleClearAndReupload = async () => {
    await handleDeleteOldUsers();
    await handleBulkUpload();
  };

  const handleBulkUpload = async () => {
    setUploading(true);
    setResults(null);

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const user of predefinedUsers) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/waitlist`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              name: user.name,
              surname: user.surname,
              email: user.email,
              mobile: user.phone,
            }),
          }
        );

        if (response.ok) {
          successCount++;
          console.log(`✅ Added: ${user.name} ${user.surname} (${user.email})`);
        } else {
          const errorData = await response.json();
          
          // Check if already exists
          if (errorData.error === 'Already in waitlist') {
            skippedCount++;
            errors.push(`${user.name} ${user.surname} (${user.email}): Already in waitlist`);
            console.log(`⏭️ Skipped (already exists): ${user.email}`);
          } else {
            failedCount++;
            errors.push(`${user.name} ${user.surname} (${user.email}): ${errorData.error || 'Unknown error'}`);
            console.error(`❌ Failed: ${user.email}`, errorData);
          }
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${user.name} ${user.surname} (${user.email}): ${errorMsg}`);
        console.error(`❌ Error adding ${user.email}:`, error);
      }
    }

    setResults({ success: successCount, failed: failedCount, errors });
    setUploading(false);
    
    // Trigger refresh if callback provided (even if some were skipped)
    if (onUploadComplete) {
      setTimeout(() => onUploadComplete(), 500); // Small delay to ensure backend is updated
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start gap-3 mb-4">
        <Upload className="w-5 h-5 text-[#9ca571] mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#3d2f28]">Bulk Add Waitlist Users</h3>
          <p className="text-sm text-[#8b7764] mt-1">
            Add predefined users to the waitlist
          </p>
        </div>
      </div>

      {/* Preview of users to be added */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-[#3d2f28] mb-2">Users to be added:</h4>
        <ul className="space-y-2">
          {predefinedUsers.map((user, index) => (
            <li key={index} className="text-sm text-[#6b5949] flex justify-between items-start">
              <div>
                <span className="font-medium">{user.name} {user.surname}</span>
                <span className="text-xs text-[#8b7764] ml-2">({user.email})</span>
              </div>
              <span className="text-xs text-[#8b7764]">{user.phone}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleClearAndReupload}
          disabled={uploading || deleting}
          className="w-full bg-[#d4524d] hover:bg-[#c24742] disabled:bg-gray-300 
                     text-white py-3 rounded-lg font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          {uploading || deleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {deleting ? 'Clearing old data...' : 'Adding users...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Clear Old & Upload Corrected Users
            </>
          )}
        </button>
        
        <button
          onClick={handleBulkUpload}
          disabled={uploading || deleting}
          className="w-full bg-[#9ca571] hover:bg-[#8a9463] disabled:bg-gray-300 
                     text-white py-3 rounded-lg font-medium transition-colors
                     flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding users...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Add {predefinedUsers.length} Users (Skip if exists)
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className={`mt-4 p-4 rounded-lg border ${
          results.failed === 0 
            ? 'bg-green-50 border-green-200' 
            : results.success === 0
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-2">
            {results.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {results.success > 0 && `✅ Successfully added: ${results.success}`}
                {results.failed > 0 && ` • ❌ Failed: ${results.failed}`}
              </p>
              
              {results.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Details:</p>
                  <ul className="space-y-1">
                    {results.errors.map((error, index) => {
                      const isAlreadyExists = error.includes('Already in waitlist');
                      return (
                        <li key={index} className={`text-xs ${isAlreadyExists ? 'text-blue-700' : 'text-red-700'}`}>
                          {isAlreadyExists ? '⏭️' : '•'} {error}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>ℹ️ Note:</strong> Users without names will be added as "Anëtar I Ri" (New Member in Albanian).
          Each user will receive a unique redemption code via email.
        </p>
      </div>
    </div>
  );
}
