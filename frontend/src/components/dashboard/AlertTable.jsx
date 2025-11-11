import React from 'react';
import { Eye } from 'lucide-react';

export default function AlertTable({ alerts }) {
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-200 text-red-900';
      case 'High':
        return 'bg-yellow-200 text-yellow-900';
      case 'Medium':
        return 'bg-blue-200 text-blue-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-primary">
        <h4 className="text-lg font-semibold text-primary">Recent Alert Triage</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-subtle divide-y divide-primary">
            {alerts.map((alert) => (
              <tr key={alert.id} className="hover:bg-primary">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClass(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-primary truncate max-w-xs">{alert.content}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{alert.platform}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{alert.timestamp}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    className="text-peacock-500 hover:text-peacock-700"
                    // We will add an onClick to open a modal later
                  >
                    <Eye className="w-5 h-5 inline-block mr-1" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}