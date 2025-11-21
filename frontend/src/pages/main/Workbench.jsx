import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    Search, Loader2, FileText, Bot, AlertTriangle, Plus, X, ArrowLeft, Download, FileSpreadsheet,
    Calendar, Zap, Settings, Inbox, Wind, Send, Facebook, Instagram
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDarkMode } from '../../hooks/useDarkMode';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { exportSummaryToPDF, exportPostsToExcel } from '../../utils/exportUtils';

function TabButton({ title, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium transition-colors ${
        active
          ? 'border-b-4 rounded border-peacock-500 text-peacock-500'
          : 'text-secondary hover:text-primary'
      }`}
    >
      {title}
    </button>
  );
}

export default function Workbench() {
    const [view, setView] = useState('list'); 
    const [activeTab, setActiveTab] = useState('manual');
    const [isStrikeModalOpen, setIsStrikeModalOpen] = useState(false);
    const [isHarvesterModalOpen, setIsHarvesterModalOpen] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [currentProject, setCurrentProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);
    const [isDarkMode] = useDarkMode();

    const fetchProjects = async () => {
        setIsProjectsLoading(true);
        try {
            const response = await fetch('http://localhost:5001/api/projects');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            setProjects(data);
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

    const handleRunStrike = async (formData) => {
        const { projectName, description, keyword, startDate, endDate } = formData;
        if (!keyword || !projectName) {
            toast.error('Project Name and Keyword are required.');
            return;
        }
        setIsStrikeModalOpen(false);
        setView('loading');
        toast('Running live strike... This may take a moment.');
        try {
            const response = await fetch('http://localhost:5001/api/projects/strike/twitter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, limit: 100 }),
            });
            if (!response.ok) throw new Error('Backend server error');
            const newProject = await response.json();
            await handleViewAnalysis(newProject);
            fetchProjects();
        } catch (error) {
            console.error("Error running strike:", error);
            toast.error('Failed to connect to backend.');
            setView('list');
        }
    };

    const handleRunHarvester = async (formData) => {
        const { projectName, keywords, sources } = formData;
        if (!projectName || !keywords || sources.length === 0) {
            toast.error("Project Name, Keywords, and at least one Source are required.");
            return;
        }
        setIsHarvesterModalOpen(false);
        toast('Creating automated project...');
        try {
            const response = await fetch('http://localhost:5001/api/projects/automated', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Backend failed to create project');
            toast.success('Automated project created!');
            fetchProjects();
        } catch (error) {
            console.error("Error creating harvester:", error);
            toast.error('Failed to create project.');
        }
    };

    const handleViewAnalysis = async (project) => {
        setCurrentProject(project);
        setView('loading');
        // toast('Fetching past analysis...');
        try {
            const sourceIdentifier = project.type === 'Automated' ? project.projectId : project.sourceTag;
            const response = await fetch(`http://localhost:5001/api/posts/by_source?source=${encodeURIComponent(sourceIdentifier)}`);
            if (!response.ok) throw new Error('Failed to fetch posts');
            const posts = await response.json();
            const formattedResults = posts.map(post => ({
                ...post,
                timestamp: new Date(post.timestamp).toLocaleString(),
                id: post._id
            }));
            setAnalysisResults({
                posts: formattedResults,
                summary: project.summary || null
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
        setCurrentProject(null);
        fetchProjects();
        setView('list');
    };
    
    const selectTab = (tab) => {
        setView('list'); 
        setActiveTab(tab);
    }

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return (
                    <div className="text-center p-12 bg-subtle rounded-lg">
                        <Loader2 className="w-12 h-12 text-peacock-500 animate-spin inline-block" />
                        <p className="text-lg text-secondary mt-4">Loading Data...</p>
                    </div>
                );
            case 'analysis':
                return (
                    <AnalysisResults
                        project={currentProject}
                        initialData={analysisResults}
                        onBack={handleBackToList}
                    />
                );
            case 'list':
            default:
              
                const projectsToShow = projects.filter(p =>
                    (activeTab === 'manual' && p.type === 'Manual') ||
                    (activeTab === 'automated' && p.type === 'Automated')
                );

                return (
                    <ProjectList
                        projects={projectsToShow}
                        isLoading={isProjectsLoading}
                        onViewAnalysis={handleViewAnalysis}
                        type={activeTab === 'manual' ? 'Manual' : 'Automated'}
                    />
                );
        }
    };

    return (
        <div className="space-y-6">
            {isStrikeModalOpen && (
                <NewStrikeModal
                    onClose={() => setIsStrikeModalOpen(false)}
                    onScrape={handleRunStrike}
                    isDarkMode={isDarkMode}
                />
            )}
            {isHarvesterModalOpen && (
                <NewHarvesterModal
                    onClose={() => setIsHarvesterModalOpen(false)}
                    onCreate={handleRunHarvester}
                    isDarkMode={isDarkMode}
                />
            )}
           {view === 'list' && (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-1 text-primary">Case Details</h1>
                           
                        </div>
                        <div className="flex gap-4">
                            {activeTab === 'manual' && (
                                <button
                                    onClick={() => setIsStrikeModalOpen(true)}
                                    className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none"
                                >
                                   
                                    New Manual Search
                                </button>
                            )}
                            {activeTab === 'automated' && (
                                <button
                                    onClick={() => setIsHarvesterModalOpen(true)}
                                    className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none"
                                >
                                    New Automated Project
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex border-primary">
                        <TabButton
                            title="Manual Search"
                            active={activeTab === 'manual'}
                            onClick={() => selectTab('manual')}
                        />
                        <TabButton
                            title="Automated Projects"
                            active={activeTab === 'automated'}
                            onClick={() => selectTab('automated')}
                        />
                    </div>

                    <div className="mt-8">
                        {renderContent()}
                    </div>
                </>
            )}

            {(view === 'analysis' || view === 'loading') && (
                renderContent()
            )}
        </div>
    );
}

function NewStrikeModal({ onClose, onScrape, isDarkMode }) {
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [keyword, setKeyword] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const handleSubmit = (e) => { e.preventDefault(); onScrape({ projectName, description, keyword, startDate, endDate });};

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg ${isDarkMode ? 'bg-black/80' : 'bg-gray-900/60'}`}>
            <div className={`rounded-lg shadow-2xl w-full max-w-lg border ${isDarkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        Create New Manual Search
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 dark:hover:text-gray-100">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium mb-1 text-gray-700">Project Name <span className="text-red-500">*</span></label>
                        <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-peacock-600" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                        <textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-peacock-600 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium mb-1 text-gray-700">Start Date</label>
                            <DatePicker selected={startDate} onChange={setStartDate} maxDate={new Date()} dateFormat="dd-MM-yyyy" className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 border-gray-300 focus:border-peacock-600" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-gray-700">End Date</label>
                            <DatePicker selected={endDate} onChange={setEndDate} minDate={startDate} maxDate={new Date()} dateFormat="dd-MM-yyyy" className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 border-gray-300 focus:border-peacock-600" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="keyword" className="block text-sm font-medium mb-1 text-gray-700">Keyword(s) <span className="text-red-500">*</span></label>
                        <input type="text" id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-peacock-600" required />
                        <p className="text-xs mt-1 text-gray-600">Use standard X search operators (OR, -, #, @, etc.)</p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="flex w-full items-center justify-center px-6 py-3 font-medium text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors">
                            <Search className="w-5 h-5 mr-2" />
                            Start Scraping
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const AVAILABLE_SOURCES = [
    { id: 'x', name: 'X (Twitter)', icon: X, enabled: true },
    { id: 'telegram', name: 'Telegram', icon: Send, enabled: false },
    { id: 'facebook', name: 'Facebook', icon: Facebook, enabled: false },
];

function NewHarvesterModal({ onClose, onCreate, isDarkMode }) {
    const [projectName, setProjectName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [selectedSources, setSelectedSources] = useState(new Set(['x']));

    const handleSourceToggle = (sourceId) => {
        const newSelection = new Set(selectedSources);
        if (newSelection.has(sourceId)) {
            newSelection.delete(sourceId);
        } else {
            newSelection.add(sourceId);
        }
        setSelectedSources(newSelection);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const sources = AVAILABLE_SOURCES
            .filter(s => selectedSources.has(s.id))
            .map(s => ({ id: s.id, name: s.name, status: 'Active' }));
        onCreate({ projectName, keywords, sources });
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg ${isDarkMode ? 'bg-black/80' : 'bg-gray-900/60'}`}>
            <div className={`rounded-lg shadow-2xl w-full max-w-lg border ${isDarkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}>
                <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        New Automated Project
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 dark:hover:text-gray-100">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="projectName" className="block text-sm font-medium mb-1 text-gray-700">Project Name <span className="text-red-500">*</span></label>
                        <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-peacock-600" required />
                    </div>
                    <div>
                        <label htmlFor="keywords" className="block text-sm font-medium mb-1 text-gray-700">Keywords <span className="text-red-500">*</span></label>
                        <input type="text" id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full p-3 rounded-md border-2 bg-gray-50 text-gray-900 placeholder-gray-500 border-gray-300 focus:border-peacock-600" required />
                        <p className="text-xs mt-1 text-gray-600">Use (OR) to separate. e.g., protest OR rally OR gautham</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Select Sources <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-4">
                            {AVAILABLE_SOURCES.map(source => {
                                const isSelected = selectedSources.has(source.id);
                                return (
                                    <button
                                        type="button"
                                        key={source.id}
                                        onClick={() => source.enabled && handleSourceToggle(source.id)}
                                        disabled={!source.enabled}
                                        className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center transition-all ${isSelected ? 'border-peacock-500 bg-peacock-50' : 'border-gray-300 bg-white'
                                            } ${source.enabled ? 'cursor-pointer hover:border-peacock-400' : 'cursor-not-allowed bg-gray-100 opacity-50'}`}
                                    >
                                        <source.icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-peacock-600' : 'text-gray-500'}`} />
                                        <span className="text-sm font-medium">{source.name}</span>
                                        {!source.enabled && <span className="text-xs text-red-500 mt-1">(Soon)</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="flex w-full items-center justify-center px-6 py-3 font-medium text-white capitalize rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors">
                            <Plus className="w-5 h-5 mr-2" />
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function ProjectList({ projects, isLoading, onViewAnalysis, type }) {
    const [search, setSearch] = useState('');

    const getStatusClass = (status) => {
        if (status === 'Running') return 'text-green-500';
        if (status === 'Completed') return 'text-blue-500';
        if (status === 'Stopped') return 'text-gray-500';
        return 'text-gray-500';
    };

    const getTypeClass = (type) => {
        if (type === 'Manual') return 'bg-peacock-100 text-peacock-800';
        if (type === 'Automated') return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };
    
    const filteredProjects = projects.filter(p =>
        (p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.keyword?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="bg-subtle rounded-lg shadow-lg overflow-hidden ">
            <div className="p-4 border-b border-primary">
                <div className="relative w-full max-w-xs">
                    <input
                        type="text"
                        placeholder={`Search ${type} projects...`}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-2 pl-10 rounded-md border-2 bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary"
                    />
                    <Search className="w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary">
                    <thead className="bg-primary">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Project Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Keyword(s)</th>
                            {/* <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Type</th> */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Posts</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-subtle ">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="text-center p-8">
                                    <Loader2 className="w-8 h-8 text-peacock-500 animate-spin inline-block" />
                                </td>
                            </tr>
                        ) : filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center p-8">
                                    <p className="text-secondary">No {type} projects found.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredProjects.map((project) => (
                                <tr key={project._id} className="hover:bg-primary">
                                    <td className="px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis">
                                        <div className="text-sm font-semibold text-primary truncate">{project.name}</div>
                                        <div className="text-xs text-secondary">{project.description || 'No description'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary truncate">{project.keyword}</td>
                                    {/* <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeClass(project.type)}`}>
                                            {project.type}
                                        </span>
                                    </td> */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold truncate">
                                        <span className={getStatusClass(project.status)}>{project.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary  ">{project.postCount || 0}</td>
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

function AnalysisResults({ project, initialData, onBack }) {
    const [posts, setPosts] = useState(initialData.posts);
    const [summary, setSummary] = useState(initialData.summary);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [postSearch, setPostSearch] = useState('');

    const handleGenerateSummary = async () => {
        if (!project) return;
        setIsSummarizing(true);
        toast('Sending posts to AI for analysis...');
        try {
            const response = await fetch(`http://localhost:5001/api/projects/${project._id}/summarize`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to generate summary');
            const { summary: newSummary } = await response.json();
            setSummary(newSummary);
            toast.success('Summary generated!');
        } catch (error) {
            console.error("Error generating summary:", error);
            toast.error('Failed to generate summary.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.content?.toLowerCase().includes(postSearch.toLowerCase()) ||
        post.username?.toLowerCase().includes(postSearch.toLowerCase())
    );

    const aiSummary = summary || "No summary has been generated for this project yet.";
    const formattedSummary = aiSummary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');

    const platformData = [{ name: 'X', value: posts.length }];
    const PLATFORM_COLORS = { 'X': '#0b0b0bff' };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-primary">Analysis for: "{project.name}"</h3>
                <button
                    onClick={onBack}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-black hover:scale-104 rounded-lg hover:bg-peacock-600 focus:outline-none"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Project List
                </button>
            </div>
            <div className="bg-subtle rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="flex items-center text-lg font-semibold text-primary">
                        <Bot className="w-5 h-5 mr-2 text-peacock-500" />
                        Threat Intelligence Summary
                    </h4>
                    {!summary && (
                        <button
                            onClick={handleGenerateSummary}
                            disabled={isSummarizing}
                            className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-peacock-600 rounded hover:bg-peacock-500 disabled:bg-gray-400"
                        >
                            {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4 mr-1" />}
                            Generate Summary
                        </button>
                    )}
                </div>
                {isSummarizing && !summary && (
                    <p className="text-secondary italic">Generating summary... this can take a minute.</p>
                )}
                <p
                    className="text-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formattedSummary }}
                />
                {summary && (
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => exportSummaryToPDF(aiSummary, project.name)}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-peacock-600 rounded-lg hover:bg-peacock-500 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" /> Download Summary (PDF)
                        </button>
                    </div>
                )}
            </div>
            <div className="bg-subtle rounded-lg shadow-lg p-6">
                <h4 className="flex items-center text-lg font-semibold text-primary mb-3">
                    <Inbox className="w-5 h-5 mr-2 text-yellow-500" />
                    Post Triage
                </h4>
                <p className="text-secondary mb-4">Filter posts by their sentiment or risk level.</p>
                <div className="flex gap-4">
                    <button className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-500 disabled:bg-gray-400">
                        Run Risk Analysis (AI)
                    </button>
                    <p className="text-secondary italic">(Feature coming soon)</p>
                </div>
            </div>
            <div className="bg-subtle rounded-lg overflow-hidden">
                <div className="p-4 flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-primary">
                        Source Data ({filteredPosts.length} of {posts.length} Posts)
                    </h4>
                    <div className="flex gap-4">
                        <div className="relative w-full max-w-sm">
                            <input
                                type="text"
                                placeholder="Search posts..."
                                onChange={(e) => setPostSearch(e.target.value)}
                                className="w-full p-2 pl-10 rounded-md border-2 bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary"
                            />
                            <Search className="w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <button
                            onClick={() => exportPostsToExcel(filteredPosts, project.name)}
                            className="flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-primary border-b-4">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Source</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Content</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Source Link</th>
                            </tr>
                        </thead>
                        <tbody className="bg-subtle divide-y divide-primary">
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="hover:bg-primary">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{post.platform}</td>
                                    <td className="px-6 py-4 max-w-[200px] overflow-hidden text-ellipsis truncate whitespace-nowrap text-sm text-primary font-medium">@{post.username}</td>
                                    <td className="px-6 py-4 max-w-[400px] overflow-hidden text-ellipsis">
                                        <div className="text-sm text-primary truncate max-w-lg">{post.content}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            className="text-peacock-500 hover:text-peacock-700"
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