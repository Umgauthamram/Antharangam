import React from 'react';
import { toast } from 'react-hot-toast';
import { Search, SlidersHorizontal, FileText, User, Link2 } from 'lucide-react';

const MOCK_RESULTS = [
  { id: 1, type: "post", title: "Selling illegal items...", content: "Selling illegal items, DM me. #buy #sell", platform: "X", timestamp: "2 days ago" },
  { id: 2, type: "entity", title: "98XXXXXX10", content: "Phone number found in 3 posts and 1 case.", platform: "N/A", timestamp: "N/A" },
  { id: 3, type: "case", title: "CASE-001: Illegal Arms Sale (X)", content: "Case open, assigned to Investigator A.", platform: "N/A", timestamp: "1 day ago" },
  { id: 4, type: "post", title: "Contact 98XXXXXX10 for details.", content: "Contact 98XXXXXX10 for details. Real deal.", platform: "X", timestamp: "3 days ago" },
  { id: 5, type: "entity", title: "example@upi", content: "UPI ID found in 5 posts and 2 cases.", platform: "N/A", timestamp: "N/A" },
];

export default function SearchPage() {
  const getResultIcon = (type) => {
    switch (type) {
      case 'post':
        return <FileText className="w-5 h-5 text-secondary" />;
      case 'entity':
        return <Link2 className="w-5 h-5 text-secondary" />;
      case 'case':
        return <User className="w-5 h-5 text-secondary" />;
      default:
        return <FileText className="w-5 h-5 text-secondary" />;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.elements.search.value;
    if (query) {
      toast.success(`Searching for: ${query}`);
    } else {
      toast.error("Please enter a search term.");
    }
  };

  const handleFilters = () => {
    toast('Opening advanced filters... (not implemented)');
  };

  return (
    <div>
      <h3 className="text-3xl font-medium text-primary">Global Search</h3>
      
      <form className="flex mt-8" onSubmit={handleSearch}>
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            id="search"
            placeholder="Search all evidence: posts, entities, cases, users..."
            className="w-full py-3 pl-10 pr-4 text-primary bg-subtle border border-primary rounded-lg focus:outline-none focus:bg-primary focus:border-peacock-500"
          />
        </div>
        <button
          type="button"
          onClick={handleFilters}
          className="flex items-center ml-3 px-4 py-2 text-sm font-medium text-primary bg-subtle border border-primary rounded-lg hover:bg-primary focus:outline-none"
        >
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Filters
        </button>
        <button
          type="submit"
          className="flex items-center ml-3 px-4 py-2 text-sm font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none"
        >
          <Search className="w-5 h-5 mr-2" />
          Search
        </button>
      </form>

      <div className="mt-8">
        <div className="bg-subtle rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-primary">
            <h4 className="text-lg font-semibold text-primary">Search Results ({MOCK_RESULTS.length})</h4>
          </div>
          <ul className="divide-y divide-primary">
            {MOCK_RESULTS.map((result) => (
              <li key={result.id} className="p-6 hover:bg-primary">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-peacock-500 truncate">
                      {result.title}
                    </p>
                    <p className="mt-1 text-sm text-primary truncate">
                      {result.content}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-secondary">
                      <span className="uppercase font-medium">{result.type}</span>
                      {result.platform !== 'N/A' && <span>{result.platform}</span>}
                      {result.timestamp !== 'N/A' && <span>{result.timestamp}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => toast(`Viewing ${result.type}: ${result.title}`)}
                    className="text-sm text-peacock-500 hover:text-peacock-700"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}