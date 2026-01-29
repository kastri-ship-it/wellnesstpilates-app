import { useState, useEffect } from 'react';
import {
  UserPlus, Mail, Trash2, Send, RefreshCw, CheckCircle, Clock, Gift
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

type WaitlistUser = {
  id: string;
  name: string;
  surname: string;
  mobile: string;
  email: string;
  redemptionCode: string;
  status: 'pending' | 'invited' | 'redeemed';
  addedAt: string;
  invitedAt?: string;
  redeemedAt?: string;
  inviteEmailSent: boolean;
};

export function WaitlistView() {
  const [users, setUsers] = useState<WaitlistUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/waitlist`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvites = async (emails: string[]) => {
    try {
      setIsSending(true);
      setStatusMessage(null);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/waitlist/send-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ emails, bulk: emails.length > 1 }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const { summary } = data;
        if (summary.failed > 0) {
          setStatusMessage({
            type: 'error',
            text: `Sent ${summary.successful} invites, ${summary.failed} failed`,
          });
        } else {
          setStatusMessage({
            type: 'success',
            text: `Successfully sent ${summary.successful} invite${summary.successful > 1 ? 's' : ''}`,
          });
        }
        fetchWaitlist();
        setSelectedUsers([]);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to send invites' });
      }
    } catch (error) {
      console.error('Error sending invites:', error);
      setStatusMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSending(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Remove this user from the waitlist?`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/admin/waitlist/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        fetchWaitlist();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const toggleSelectAll = () => {
    const pendingEmails = users.filter((u) => u.status === 'pending').map((u) => u.email);
    if (selectedUsers.length === pendingEmails.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(pendingEmails);
    }
  };

  const toggleUser = (email: string) => {
    setSelectedUsers((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'invited':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'redeemed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'invited':
        return 'bg-blue-100 text-blue-700';
      case 'redeemed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const invitedCount = users.filter((u) => u.status === 'invited').length;
  const redeemedCount = users.filter((u) => u.status === 'redeemed').length;

  return (
    <div className="p-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e8dfd8]">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-[#8b7764]">Pending</span>
          </div>
          <p className="text-2xl font-bold text-[#3d2f28]">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e8dfd8]">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-[#8b7764]">Invited</span>
          </div>
          <p className="text-2xl font-bold text-[#3d2f28]">{invitedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#e8dfd8]">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-green-500" />
            <span className="text-xs text-[#8b7764]">Redeemed</span>
          </div>
          <p className="text-2xl font-bold text-[#3d2f28]">{redeemedCount}</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={fetchWaitlist}
              className="p-2 hover:bg-[#f5f0ed] rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-[#6b5949] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {pendingCount > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === pendingCount && pendingCount > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#e8dfd8] text-[#6b5949] focus:ring-[#6b5949]"
                />
                <span className="text-sm text-[#6b5949]">Select all pending</span>
              </label>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <button
              onClick={() => handleSendInvites(selectedUsers)}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 bg-[#6b5949] text-white rounded-lg text-sm font-medium hover:bg-[#5a4838] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Sending...' : `Send ${selectedUsers.length} Invite${selectedUsers.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-sm ${
            statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* User List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#6b5949] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-[#e8dfd8]">
          <UserPlus className="w-12 h-12 mx-auto mb-2 text-[#8b7764] opacity-30" />
          <p className="text-[#8b7764]">No users in waitlist</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl shadow-sm border border-[#e8dfd8] p-4"
            >
              <div className="flex items-start gap-3">
                {user.status === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.email)}
                    onChange={() => toggleUser(user.email)}
                    className="mt-1 w-4 h-4 rounded border-[#e8dfd8] text-[#6b5949] focus:ring-[#6b5949]"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#3d2f28]">
                      {user.name} {user.surname}
                    </p>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      {user.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#8b7764] truncate">{user.email}</p>
                  <p className="text-sm text-[#8b7764]">{user.mobile}</p>
                  {user.redemptionCode && (
                    <p className="text-xs text-[#6b5949] mt-1 font-mono">
                      Code: {user.redemptionCode}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {user.status === 'pending' && (
                    <button
                      onClick={() => handleSendInvites([user.email])}
                      disabled={isSending}
                      className="p-2 hover:bg-[#f5f0ed] rounded-lg text-[#6b5949]"
                      title="Send invite"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.email)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-[#f8f9f4] to-[#f5f0ed] rounded-xl p-4 border border-[#e8e6e3]">
        <h3 className="text-sm font-semibold text-[#3d2f28] mb-2">How Waitlist Works</h3>
        <ul className="space-y-1.5 text-xs text-[#6b5949]">
          <li className="flex items-start gap-2">
            <span className="text-[#9ca571] font-bold">1.</span>
            <span>Select pending users and send invites</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#9ca571] font-bold">2.</span>
            <span>Each user receives a unique redemption code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#9ca571] font-bold">3.</span>
            <span>Code gives +1 free session with 8+ class package</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#9ca571] font-bold">4.</span>
            <span>Code is valid for 50 days from invite date</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
