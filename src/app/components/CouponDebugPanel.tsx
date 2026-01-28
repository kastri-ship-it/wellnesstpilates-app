import { useState } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function CouponDebugPanel() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/debug/coupons`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      const data = await response.json();
      setDebugData(data);
      console.log('🔍 Database Debug Data:', data);
    } catch (error) {
      console.error('Error:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-md border-2 border-red-500 z-50">
      <h3 className="font-bold text-red-600 mb-2">🔍 Coupon Debug Panel</h3>
      
      <button
        onClick={checkDatabase}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 w-full mb-3"
      >
        {loading ? 'Checking...' : 'Check Database'}
      </button>

      {debugData && (
        <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
          <div className="mb-2">
            <strong>Total Coupons:</strong> {debugData.count || 0}
          </div>
          
          {debugData.coupons && debugData.coupons.length > 0 ? (
            <div>
              <strong>Coupons Found:</strong>
              {debugData.coupons.map((coupon: any, index: number) => (
                <div key={index} className="mt-2 p-2 bg-white rounded border">
                  <div><strong>Code:</strong> {coupon.code}</div>
                  <div><strong>Status:</strong> {coupon.status}</div>
                  <div><strong>Used:</strong> {coupon.used ? 'Yes' : 'No'}</div>
                  <div><strong>ID:</strong> <code className="text-xs">{coupon.id}</code></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600 font-bold">
              ❌ NO COUPONS FOUND IN DATABASE!
              <div className="text-xs mt-2 text-gray-600">
                You need to create the coupon in Supabase with key:
                <code className="block bg-yellow-100 p-1 mt-1">
                  redemption_codes:WN-SEHKKY
                </code>
              </div>
            </div>
          )}

          {debugData.error && (
            <div className="text-red-600">
              <strong>Error:</strong> {debugData.error}
            </div>
          )}
          
          <details className="mt-3">
            <summary className="cursor-pointer font-bold">Raw JSON</summary>
            <pre className="mt-2 text-xs bg-black text-green-400 p-2 rounded overflow-auto">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-600 border-t pt-2">
        <strong>Expected Database Key Format:</strong>
        <code className="block bg-yellow-50 p-1 mt-1 text-xs">
          redemption_codes:WN-SEHKKY
        </code>
        <div className="mt-1 text-red-600">
          ⚠️ NOT just "WN-SEHKKY" - must include prefix!
        </div>
      </div>
    </div>
  );
}
