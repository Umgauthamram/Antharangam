import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Search, Loader2, Eye, FileText, Bot, AlertTriangle, Plus, X, ArrowLeft, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDarkMode } from '../../hooks/useDarkMode';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { exportSummaryToPDF,  exportPostsToExcel } from '../../utils/exportUtils';


export default function StrikePage() {
  const [view, setView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isDarkMode] = useDarkMode();
  const [ranQuery, setRanQuery] = useState('');


  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      const formattedData = data.map(proj => ({
        ...proj,
        id: proj._id,
        status: proj.status || "Unknown",
        description: proj.description || "No description.",
        summary: proj.summary || null,
        keyword: proj.keyword || "N/A",
        startDate: proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'N/A',
        endDate: proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'N/A',
      }));
      setProjects(formattedData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Could not load past projects.");
    } finally {
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleScrape = async (formData) => {
    const { projectName, description, keyword, startDate, endDate } = formData;

    if (!keyword || !projectName) {
      toast.error('Project Name and Keyword are required.');
      return;
    }

    setIsLoading(true);
    setAnalysisResults(null);
    setRanQuery(keyword);
    setIsModalOpen(false);
    toast('Running live fetching This may take a moment.');

    try {
        const response = await fetch('http://localhost:5001/api/projects/strike/twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, limit: 100 }),
      });

      if (!response.ok) throw new Error('Backend server error');

      const results = await response.json();

      const formattedPosts = results.posts.map(post => ({
        ...post,
        timestamp: new Date(post.timestamp).toLocaleString(),
        id: post._id
      }));

      setAnalysisResults({ posts: formattedPosts, summary: results.summary });
      toast.success(`Strike complete! Found ${formattedPosts.length} posts.`);

      fetchProjects();
      setCurrentQuery(keyword);
      setView('analysis');

    } catch (error) {
      console.error("Error running strike:", error);
      toast.error('Failed to connect to backend.');
      setAnalysisResults({ posts: [], summary: "" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAnalysis = async (project) => {
    const queryKeyword = project.keyword;

    setCurrentQuery(queryKeyword);
    setView('loading'); 
    toast('Fetching past analysis');

    try {
      const response = await fetch(`http://localhost:5001/api/posts/by_keyword?keyword=${encodeURIComponent(queryKeyword)}`);
      if (!response.ok) throw new Error('Failed to fetch posts for this project');

      const results = await response.json();
      
      const formattedResults = results.map(post => ({
        ...post,
        timestamp: new Date(post.timestamp).toLocaleString(),
        id: post._id
      }));

      setAnalysisResults({
        posts: formattedResults,
        summary: project.summary || "No AI summary was saved for this project."
      });
      setView('analysis');
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error('Could not load analysis.');
      setView('list');
    }
  };

  const handleBackToList = () => {
    setAnalysisResults(null);
    setCurrentQuery('');
    setView('list');
  };

  const renderContent = () => {
    switch (view) {
      case 'loading':
        return (
          <div className="text-center p-12 bg-subtle rounded-lg">
            <Loader2 className="w-12 h-12 text-peacock-500 animate-spin inline-block" />
            <p className="text-lg text-secondary mt-4">Running live strike for "{currentQuery}"</p>
          </div>
        );
      case 'analysis':
        return (
          <AnalysisResults
            data={analysisResults}
            query={currentQuery}
            onBack={handleBackToList}
          />
        );
      case 'list':
      default:
        return (
          <ProjectList
            projects={projects}
            isLoading={isProjectsLoading}
            onViewAnalysis={handleViewAnalysis}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-primary">Strike Projects</h1>
          <p className="text-secondary">Manage on-demand scrape & analysis projects.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none focus:ring focus:ring-peacock-300 focus:ring-opacity-80"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Strike
        </button>
      </div>

      {isModalOpen && (
        <NewStrikeModal
          onClose={() => setIsModalOpen(false)}
          onScrape={handleScrape}

        />
      )}

      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
}


function NewStrikeModal({ onClose, onScrape, isDarkMode }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const handleSubmit = (e) => {
    e.preventDefault();
    onScrape({ projectName, description, keyword, startDate, endDate });
  };

  const inputClasses = `
    w-full p-3 rounded-md border-2 focus:outline-none transition-colors
    ${isDarkMode
      ? 'bg-gray-700 text-gray-100 placeholder-gray-400 border-gray-600 focus:border-peacock-400'
      : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-peacock-600'
    }
  `;

  const labelClasses = `block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg ${isDarkMode ? 'bg-black/80' : 'bg-gray-900/60'}`}>
    
      <div className={`
        rounded-lg shadow-2xl w-full max-w-lg border
        ${isDarkMode
          ? 'bg-gray-800 text-gray-100 border-gray-700'
          : 'bg-white text-gray-900 border-gray-300'
        }
      `}>
        <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Create New Strike Project
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 dark:hover:text-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label htmlFor="projectName" className={labelClasses}>
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}

              className={inputClasses}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className={labelClasses}>Description</label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}

              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className={labelClasses}>Start Date</label>
              <div className="relative">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  dateFormat="dd-MM-yyyy"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  className={`${inputClasses} pr-10`}
                  wrapperClassName="w-full"
                />
                <Calendar className="w-5 h-5 text-gray-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className={labelClasses}>End Date</label>
              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  maxDate={new Date()}
                  dateFormat="dd-MM-yyyy"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  className={`${inputClasses} pr-10`}
                  wrapperClassName="w-full"
                />
                <Calendar className="w-5 h-5 text-gray-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Keyword */}
          <div>
            <label htmlFor="keyword" className={labelClasses}>
              Keyword(s) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}

              className={inputClasses}
              required
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Use standard X search operators (OR, -, #, @, etc.)
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center px-6 py-3 font-medium text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors"
            >
              <Search className="w-5 h-5 mr-2" />
              Start Scraping
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnalysisResults({ data, query, onBack }) {
  const { posts, summary } = data;

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-subtle  rounded-lg">
        <button
          onClick={onBack}
          className="flex items-center p-4 text-sm font-medium text-peacock-500 hover:text-peacock-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project List
        </button>
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-primary">No Results Found</h3>
          <p className="mt-1 text-secondary">The strike for "{query}" returned 0 posts. This may be a good sign.</p>
        </div>
      </div>
    );
  }

  const aiSummary = summary || `The keyword "${query}" generated ${posts.length} immediate hits, primarily on X. No AI summary was generated.`;

  const formattedSummary = aiSummary
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');

  const platformData = [{ name: 'X', value: posts.length }];
  const PLATFORM_COLORS = { 'X': '#0b0b0bff' };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-primary">Analysis for: "{query}"</h3>
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 text-sm font-medium text-primary bg-green-300 hover:scale-104 rounded-lg hover:bg-green-400 focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project List
        </button>
      </div>

      <div className="bg-subtle rounded-lg shadow-lg p-6">
        <h4 className="flex items-center text-lg font-semibold text-primary mb-3">
          <Bot className="w-5 h-5 mr-2 text-peacock-500" />
          Threat Intelligence Summary
        </h4>
        <p
          className="text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedSummary }}
        />
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => exportSummaryToPDF(aiSummary, query)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Download Summary (PDF)
          </button>
        </div>
      </div>

      <div className="bg-subtle rounded-lg shadow-lg p-6  ">
        <h4 className="text-lg font-semibold text-primary mb-4">Source Distribution</h4>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#8884d8">
                {platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        className="p-3 rounded-lg shadow-lg bg-white text-black dark:bg-gray-900 dark:text-white dark:border-gray-700">
                        <p className="text-sm font-medium">
                          {`${payload[0].name} : ${payload[0].value}`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-subtle rounded-lg overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h4 className="text-lg font-semibold text-primary">
            Source Data ({posts.length} Posts)
          </h4>
          <div className="flex gap-2">
            {/* <button
              onClick={() => exportPostsToPDF(posts, query)}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-peacock-600 rounded hover:bg-peacock-500"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> PDF
            </button> */}
            <button
              onClick={() => exportPostsToExcel(posts, query)}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full  ">
            <thead className="bg-primary  border-b-4">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Content</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Source Link</th>
              </tr>
            </thead>
            <tbody className="bg-subtle divide-y divide-primary">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-primary">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{post.platform}</td>
                  <td className="px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis truncate whitespace-nowrap text-sm text-primary font-medium">@{post.username}</td>
                  <td className="px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis">
                    <div className="text-sm  text-primary truncate max-w-lg">{post.content}</div>
                  </td>
                  <td className="px-6 py-4  whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-peacock-500  hover:text-peacock-700"
                      onClick={() => window.open(post.url, '_blank')}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProjectList({ projects, isLoading, onViewAnalysis }) {
  const getStatusClass = (status) => {
    if (status === 'Running') return 'text-blue-500';
    if (status === 'Completed') return 'text-green-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-subtle rounded-lg shadow-lg overflow-hidden ">
      <div className="p-4 ">
        <h4 className="text-lg font-semibold text-primary">Past Strike Projects</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-primary">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Keyword(s)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Time Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-subtle divide-y divide-primary">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center p-8">
                  <Loader2 className="w-8 h-8 text-peacock-500 animate-spin inline-block" />
                  <p className="text-secondary mt-2">Loading projects...</p>
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-8">
                  <p className="text-secondary">No projects found. Create your first "New Strike".</p>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-primary">
                  <td className="px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis">
                    <div className="text-sm font-semibold text-primary truncate">{project.name}</div>
                    <div className="text-xs text-secondary">{project.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary truncate">{project.keyword}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {project.startDate} - {project.endDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold truncate">
                    <span className={getStatusClass(project.status)}>{project.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewAnalysis(project)}
                      className="text-peacock-500 hover:text-peacock-700"
                    >
                      <FileText className="w-5 h-5 inline-block mr-1" /> View Analysis
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