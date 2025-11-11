
import React from 'react';
import { toast } from 'react-hot-toast';
import { Eye, Edit, Trash2 } from 'lucide-react';

export default function CaseTable({ cases }) {
  const getPriorityClass = (priority) => {
    switch (priority) {
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

  const getStatusClass = (status) => {
    switch (status) {
      case 'Open':
        return 'text-green-500';
      case 'In Review':
        return 'text-yellow-500';
      case 'Closed':
        return 'text-gray-500';
      default:
        return 'text-primary';
    }
  };

  const handleView = (id) => toast(`Viewing case ${id}`);
  const handleEdit = (id) => toast.error(`Editing case ${id} (not implemented)`);
  const handleDelete = (id) => toast.error(`Deleting case ${id} (not implemented)`);

  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-primary">
        <h4 className="text-lg font-semibold text-primary">All Cases</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Case ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Last Update</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-subtle divide-y divide-primary">
            {cases.map((caseItem) => (
              <tr key={caseItem.id} className="hover:bg-primary">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{caseItem.id}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-primary truncate max-w-xs">{caseItem.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                  <span className={getStatusClass(caseItem.status)}>{caseItem.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(caseItem.priority)}`}>
                    {caseItem.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{caseItem.assignee}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{caseItem.lastUpdate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleView(caseItem.id)} className="text-peacock-500 hover:text-peacock-700 p-1">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleEdit(caseItem.id)} className="text-blue-500 hover:text-blue-700 p-1 ml-2">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(caseItem.id)} className="text-red-500 hover:text-red-700 p-1 ml-2">
                    <Trash2 className="w-5 h-5" />
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
