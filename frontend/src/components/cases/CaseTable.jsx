import React from 'react';
import { toast } from 'react-hot-toast';
import { Eye, Edit, Trash2 } from 'lucide-react';

// --- NEW: Accepting 'onView' prop ---
export default function CaseTable({ cases, onView }) {

  const getPriorityClass = (type) => {
    // --- CHANGED: Using 'type' instead of 'priority' ---
    switch (type) {
      case 'Manual':
        return 'bg-blue-200 text-blue-900';
      case 'Automated':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-200 text-gray-900';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Running': // <-- Updated status
        return 'text-green-500';
      case 'Completed': // <-- Updated status
        return 'text-blue-500';
      case 'Stopped': // <-- Updated status
        return 'text-gray-500';
      default:
        return 'text-primary';
    }
  };

  // Keep these dummy functions for now
  const handleEdit = (id) => toast.error(`Editing case ${id} (not implemented)`);
  const handleDelete = (id) => toast.error(`Deleting case ${id} (not implemented)`);

  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-primary">
        <h4 className="text-lg font-semibold text-primary">All Projects</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary">
            <tr>
              {/* --- CHANGED: Column Headers --- */}
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Keywords</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Posts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-subtle divide-y divide-primary">
            {/* --- CHANGED: Using real data fields --- */}
            {cases.map((caseItem) => (
              <tr key={caseItem._id} className="hover:bg-primary">
                
                <td className="px-6 py-4">
                  <div className="text-sm text-primary font-semibold truncate max-w-xs">{caseItem.name}</div>
                  <div className="text-xs text-secondary truncate max-w-xs">{caseItem.description}</div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-secondary truncate max-w-xs">{caseItem.keyword}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                  <span className={getStatusClass(caseItem.status)}>{caseItem.status}</span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(caseItem.type)}`}>
                    {caseItem.type}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{caseItem.postCount || 0}</td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                  {new Date(caseItem.createdAt).toLocaleDateString()}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* --- CHANGED: 'onView' prop is now used --- */}
                  <button 
                    onClick={() => onView(caseItem)} 
                    className="text-peacock-500 hover:text-peacock-700 p-1"
                    title="View Analysis"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleEdit(caseItem._id)} className="text-blue-500 hover:text-blue-700 p-1 ml-2" title="Edit (Not Implemented)">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(caseItem._id)} className="text-red-500 hover:text-red-700 p-1 ml-2" title="Delete (Not Implemented)">
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