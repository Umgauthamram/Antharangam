
import React from 'react';
import { Eye, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AlertTable({ alerts, isLoading }) {
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-200 text-red-900';
      case 'High':
        return 'bg-yellow-200 text-yellow-900';
      case 'Medium':
        return 'bg-blue-200 text-blue-900';
      case 'New': 
        return 'bg-gray-200 text-gray-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const handleView = (alert) => {
    if (alert.url) {
      window.open(alert.url, '_blank');
    } else {
      toast.error('No URL available for this post.');
    }
  };

  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden ">
      <div className="p-4">
        <h4 className="text-lg font-semibold text-primary">Recent Alert Triage</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary">
            <tr>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-subtle">
          
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center p-8">
                  <Loader2 className="w-8 h-8 text-peacock-500 animate-spin inline-block" />
                  <p className="text-secondary mt-2">Connecting to backend</p>
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-8">
                  <p className="text-secondary">No data available</p>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-primary">
                 
                  <td className="px-6 py-4">
                    <div className="text-sm text-primary truncate max-w-xs">{alert.content}</div>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-center text-sm text-secondary">{alert.platform}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary font-medium">@{alert.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{alert.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-peacock-500 hover:text-peacock-700"
                      onClick={() => handleView(alert)}
                    >
                      <Eye className="w-5 h-5 inline-block mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}