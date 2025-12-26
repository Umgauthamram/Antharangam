import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    Search, Loader2, FileText, Bot, AlertTriangle, Plus, X, ArrowLeft, Download, FileSpreadsheet,
    Calendar, Zap, Settings, Inbox, Wind, Send, Facebook, Instagram, ShieldAlert, Power
} from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import DatePicker from 'react-datepicker';
import "../../components/ui/datepicker.css";
import { useLocation } from 'react-router-dom';
import { generateCaseReport } from '../../utils/reportGenerator';


const ALL_POSSIBLE_SOURCES = [
    { id: 'x', name: 'X (Twitter)', icon: X, enabled: true },
    { id: 'telegram', name: 'Telegram', icon: Send, enabled: false },
    { id: 'facebook', name: 'Facebook', icon: Facebook, enabled: false },
    { id: 'instagram', name: 'Instagram', icon: Instagram, enabled: false },
];

function OCRViewer({ text }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-2 w-full max-w-[200px]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded border transition-all duration-200 
                    ${isOpen
                        ? 'bg-gray-100 text-gray-700 border-gray-300'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:scale-105'
                    }`}
            >
                <div className="flex items-center">
                    <span className="mr-2">OCR Text</span>
                </div>

                {isOpen ? (
                    <X className="w-3 h-3 text-gray-500" />
                ) : (
                    <span className="text-[10px] uppercase tracking-wider font-bold">View</span>
                )}
            </button>
            {isOpen && (
                <div className="mt-1 p-2 bg-white rounded text-[10px] text-gray-600 border border-gray-200 font-mono break-all max-h-32 overflow-y-auto shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
                    {text}
                </div>
            )}
        </div>
    );
}

function getSourceIcon(sourceId) {
    const source = ALL_POSSIBLE_SOURCES.find(s => s.id === sourceId);
    return source ? source.icon : FileText;
}

function TabButton({ title, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 text-sm font-medium transition-colors ${active
                ? 'border-b-4 rounded border-peacock-500 text-peacock-500'
                : 'text-secondary hover:text-primary'
                }`}
        >
            {title}
        </button>
    );
}

function SourceControlModal({ project, onClose, onUpdate }) {
    const projectSourcesData = ALL_POSSIBLE_SOURCES.map(staticSource => {
        const projectSource = (project.sources || []).find(ps => ps.id === staticSource.id);
        return {
            ...staticSource,
            status: projectSource ? projectSource.status : 'Stopped',
            isProjectSource: projectSource ? true : false
        };
    }).filter(s => s.isProjectSource);

    const initialStatusMap = new Map(
        projectSourcesData.map(s => [s.id, s.status])
    );

    const [sourceStatus, setSourceStatus] = useState(initialStatusMap);

    const toggleSource = (sourceId) => {
        setSourceStatus(prevStatus => {
            const current = prevStatus.get(sourceId);
            const newStatus = current === 'Active' ? 'Stopped' : 'Active';
            const newMap = new Map(prevStatus);
            newMap.set(sourceId, newStatus);
            return newMap;
        });
    };

    const handleSave = async () => {
        const updatedSources = projectSourcesData.map(s => ({
            id: s.id,
            name: s.name,
            status: sourceStatus.get(s.id) || 'Stopped'
        }));

        try {
            const response = await fetch(`http://localhost:5001/api/projects/${project._id}/sources`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sources: updatedSources })
            });

            if (!response.ok) throw new Error("Failed to update sources");

            toast.success("Sources updated & synced!");
            onUpdate(updatedSources);
            onClose();
        } catch (error) {
            console.error("Source update failed:", error);
            toast.error("Update failed. Check connection.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-subtle rounded-lg shadow-2xl w-full max-w-md border border-primary mx-4 p-6">
                <h3 className="text-xl font-semibold text-primary mb-4">Manage Sources: {project.name}</h3>
                <div className="space-y-3 mb-6">
                    {projectSourcesData.map(source => {
                        const status = sourceStatus.get(source.id);
                        const Icon = getSourceIcon(source.id);

                        return (
                            <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg bg-primary">
                                <div className="flex items-center">
                                    <Icon className="w-5 h-5 mr-2 text-peacock-500" />
                                    <span className="font-medium">{source.name}</span>
                                </div>
                                <button
                                    onClick={() => toggleSource(source.id)}
                                    className={`px-3 py-1 rounded text-sm font-medium flex items-center ${status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}
                                >
                                    <Power className="w-4 h-4 mr-1" />
                                    {status === 'Active' ? 'Running' : 'Stopped'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-secondary hover:text-primary rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-peacock-600 text-white rounded hover:bg-peacock-500">Save Changes</button>
                </div>
            </div>
        </div>
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

    const location = useLocation();

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

        if (location.state) {
            const { view, currentProject, analysisData } = location.state;

            if (view === 'analysis' && currentProject && analysisData) {
                setCurrentProject(currentProject);
                setAnalysisResults(analysisData);
                setView('analysis');
            }
        }
    }, [location.state]);

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

    // Add these inside Workbench component
    const handleStartHarvester = async (projectId, name, keywords) => {
        try {
            const res = await fetch('http://localhost:5001/api/harvesters/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId, name, keywords: keywords.split(' OR ') })
            });
            if (res.ok) {
                toast.success('Harvester started');
                fetchProjects(); // ← REFRESH LIST
            } else {
                toast.error('Failed to start');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleStopHarvester = async (projectId) => {
        try {
            const res = await fetch('http://localhost:5001/api/harvesters/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: projectId })
            });
            if (res.ok) {
                toast.success('Harvester stopped');
                fetchProjects();
            } else {
                toast.error('Failed to stop');
            }
        } catch (err) {
            toast.error('Network error');
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
                        <p className="text-lg text-secondary mt-4">Loading Data</p>
                    </div>
                );
            case 'analysis':
                return (
                    <AnalysisResults
                        project={currentProject}
                        initialData={analysisResults}
                        onBack={handleBackToList}
                        onRefreshData={() => handleViewAnalysis(currentProject)}
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
            {isStrikeModalOpen && (<NewStrikeModal onClose={() => setIsStrikeModalOpen(false)} onScrape={handleRunStrike} isDarkMode={isDarkMode} />)}
            {isHarvesterModalOpen && (<NewHarvesterModal onClose={() => setIsHarvesterModalOpen(false)} onCreate={handleRunHarvester} isDarkMode={isDarkMode} />)}

            {view === 'list' && (
                <>
                    <div className="flex items-center justify-between">
                        <div><h1 className="text-3xl font-bold mb-1 text-primary">Case Details</h1></div>
                        <div className="flex gap-4">
                            {activeTab === 'manual' && (<button onClick={() => setIsStrikeModalOpen(true)} className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none">New Manual Search</button>)}
                            {activeTab === 'automated' && (<button onClick={() => setIsHarvesterModalOpen(true)} className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none">New Automated Project</button>)}
                        </div>
                    </div>
                    <div className="flex border-primary">
                        <TabButton title="Manual Search" active={activeTab === 'manual'} onClick={() => selectTab('manual')} />
                        <TabButton title="Automated Projects" active={activeTab === 'automated'} onClick={() => selectTab('automated')} />
                    </div>
                    <div className="mt-8">{renderContent()}</div>
                </>
            )}
            {(view === 'analysis' || view === 'loading') && renderContent()}
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

    const bgModal = isDarkMode ? 'bg-black' : 'bg-white';

    const textPrimary = isDarkMode ? 'text-white' : 'text-black';
    const textLabel = isDarkMode ? 'text-white' : 'text-black';
    const textHelper = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const borderDefault = isDarkMode ? 'border-white' : 'border-black';
    const borderDivider = isDarkMode ? 'border-white/20' : 'border-black/20';
    const bgInput = isDarkMode ? 'bg-black' : 'bg-white';
    const focusAccent = 'focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500';
    const inputClasses = `w-full p-3 rounded-lg border transition-all duration-200 
                          ${bgInput} ${textPrimary} ${borderDefault} 
                          placeholder-opacity-50 ${focusAccent}`;
    const closeButtonClasses = isDarkMode
        ? 'text-white hover:bg-white hover:text-black'
        : 'text-black hover:bg-black hover:text-white';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity backdrop-blur-sm ${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}>

            <div className={`rounded-xl shadow-2xl w-full max-w-lg ${isDarkMode ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>

                <div className={`flex justify-between items-center p-6 border-b ${borderDivider}`}>
                    <h3 className="text-xl font-bold">
                        New Manual Search (Strike)
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-full ${closeButtonClasses} transition-colors`}
                        aria-label="Close"
                    >

                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div>
                        <label htmlFor="projectName" className={`block text-sm font-medium mb-2 ${textLabel}`}>Project Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="projectName"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className={inputClasses}
                            required
                            placeholder=""
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className={`block text-sm font-medium mb-2 ${textLabel}`}>Description</label>
                        <textarea
                            id="description"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${inputClasses} resize-none`}
                            placeholder="Briefly describe the objective of this search."
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${textLabel}`}>
                            Date
                        </label>
                        <div className="relative">
                            <DatePicker
                                selected={startDate}
                                onChange={(dates) => {
                                    const [start, end] = dates;
                                    setStartDate(start);
                                    setEndDate(end);
                                }}
                                startDate={startDate}
                                endDate={endDate}
                                selectsRange
                                monthsShown={1}
                                maxDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"

                                dateFormat="dd MMM yyyy"
                                placeholderText="Select start and end date"

                                className={`${inputClasses} w-full pl-10 cursor-pointer`}
                                wrapperClassName="w-full"
                                popperPlacement="bottom-start"
                                isClearable={true}
                            />
                            <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <p className={`text-xs mt-1 ${textHelper}`}>
                            Select the start date, then click the end date.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="keyword" className={`block text-sm font-medium mb-2 ${textLabel}`}>Keyword(s) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className={inputClasses}
                            required
                            placeholder="e.g., #Misinformation OR 'fake news'"
                        />

                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={!projectName || !keyword}
                            className="flex w-full items-center justify-center px-6 py-3 font-semibold text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

const AVAILABLE_SOURCES = [
    { id: 'x', name: 'X (Twitter)', icon: X, enabled: true },
    { id: 'telegram', name: 'Telegram', icon: Send, enabled: false },
    { id: 'facebook', name: 'Facebook', icon: Facebook, enabled: false },
];

function NewHarvesterModal({ onClose, onCreate, isDarkMode }) {
    const [projectName, setProjectName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [selectedSources, setSelectedSources] = useState(new Set());

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

        if (!projectName || !keywords || selectedSources.size === 0) return;

        const sources = AVAILABLE_SOURCES
            .filter(s => selectedSources.has(s.id))
            .map(s => ({ 
                id: s.id, 
                name: s.name, 
                status: 'Active',
                // Map 'x' -> 'twitter', others remain same
                platformKey: s.id === 'x' ? 'twitter' : s.id 
            }));

        onCreate({ projectName, keywords, sources });
    };

    const borderDefault = isDarkMode ? 'border-white' : 'border-white';
    const borderDivider = isDarkMode ? 'border-white/30' : 'border-black/30';
    const textPrimary = isDarkMode ? 'text-white' : 'text-black';
    const textLabel = isDarkMode ? 'text-white' : 'text-black';
    const textHelper = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    const bgInput = isDarkMode ? 'bg-black' : 'bg-white';
    const focusAccent = 'focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500';
    const inputClasses = `w-full p-3 rounded-lg border transition-all duration-200 ${bgInput} ${textPrimary} ${borderDefault} placeholder-opacity-50 ${focusAccent}`;
    const closeButtonClasses = isDarkMode ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity backdrop-blur-sm ${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}>
            <div className={`rounded-xl shadow-2xl w-full max-w-lg ${isDarkMode ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
                <div className={`flex justify-between items-center p-6 border-b ${borderDivider}`}>
                    <h3 className={`text-xl font-bold ${textPrimary}`}>New Project</h3>
                    <button onClick={onClose} className={`p-1 rounded-full ${closeButtonClasses} transition-colors`} aria-label="Close">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label htmlFor="projectName" className={`block text-sm font-medium mb-2 ${textLabel} `}>Project Name <span className="text-red-500">*</span></label>
                        <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className={inputClasses} required placeholder="e.g., New Target Analysis" />
                    </div>
                    <div>
                        <label htmlFor="keywords" className={`block text-sm font-medium mb-2 ${textLabel}`}>Keywords <span className="text-red-500">*</span></label>
                        <input type="text" id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClasses} required placeholder="e.g: protest OR rally" />
                        <p className={`text-xs mt-1 ${textHelper}`}>Use (OR) to separate</p>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-3 ${textLabel}`}>Select Sources <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-4">
                            {AVAILABLE_SOURCES.map(source => {
                                const isSelected = selectedSources.has(source.id);
                                const isDisabled = !source.enabled;
                                const baseClasses = 'p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200';
                                let stateClasses = '';
                                if (isDisabled) {
                                    stateClasses = `${isDarkMode ? 'bg-black border-white/30 opacity-40' : 'bg-white border-black/30 opacity-40'} cursor-not-allowed ${textPrimary}`;
                                } else if (isSelected) {
                                    stateClasses = `border-peacock-500 ${isDarkMode ? 'bg-peacock-900 text-peacock-200' : 'bg-peacock-50 text-peacock-800'} font-bold`;
                                } else {
                                    stateClasses = `${bgInput} ${borderDefault} hover:border-peacock-500 ${textPrimary} cursor-pointer`;
                                }
                                return (
                                    <button type="button" key={source.id} onClick={() => handleSourceToggle(source.id)} disabled={isDisabled} className={`${baseClasses} ${stateClasses}`}>
                                        <source.icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-peacock-400' : textPrimary}`} />
                                        <span className="text-sm font-semibold">{source.name}</span>
                                        {isDisabled && <span className="text-xs text-red-500 mt-1 font-medium">(Soon)</span>}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedSources.size === 0 && (<p className="text-sm text-red-500 mt-2 font-medium">Please select at least one source.</p>)}
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={!projectName || !keywords || selectedSources.size === 0} className="flex w-full items-center justify-center px-6 py-3 font-semibold text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Plus className="w-5 h-5 mr-2" /> Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// function NewHarvesterModal({ onClose, onCreate, isDarkMode }) {
//     const [projectName, setProjectName] = useState('');
//     const [keywords, setKeywords] = useState('');
//     const [selectedSources, setSelectedSources] = useState(new Set());

//     const handleSourceToggle = (sourceId) => {
//         const newSelection = new Set(selectedSources);

//         if (newSelection.has(sourceId)) {
//             newSelection.delete(sourceId);
//         } else {
//             newSelection.add(sourceId);
//         }
//         setSelectedSources(newSelection);
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();

//         if (!projectName || !keywords || selectedSources.size === 0) return;

//         const sources = AVAILABLE_SOURCES
//             .filter(s => selectedSources.has(s.id))
//             .map(s => ({ id: s.id, name: s.name, status: 'Active' }));

//         onCreate({ projectName, keywords, sources });
//     };

//     const borderDefault = isDarkMode ? 'border-white' : 'border-white';
//     const borderDivider = isDarkMode ? 'border-white/30' : 'border-black/30';

//     const textPrimary = isDarkMode ? 'text-white' : 'text-black';
//     const textLabel = isDarkMode ? 'text-white' : 'text-black';
//     const textHelper = isDarkMode ? 'text-gray-400' : 'text-gray-600';
    
//     const bgInput = isDarkMode ? 'bg-black' : 'bg-white';
//     const focusAccent = 'focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500';
//     const inputClasses = `w-full p-3 rounded-lg border transition-all duration-200 
//                           ${bgInput} ${textPrimary} ${borderDefault} 
//                           placeholder-opacity-50 ${focusAccent}`;

//     const closeButtonClasses = isDarkMode
//         ? 'text-white hover:bg-white hover:text-black'
//         : 'text-black hover:bg-black hover:text-white';


//     return (
//         <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity backdrop-blur-sm ${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}>

//             <div className={`rounded-xl shadow-2xl w-full max-w-lg ${isDarkMode ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>

//                 <div className={`flex justify-between items-center p-6 border-b ${borderDivider}`}>
//                     <h3 className={`text-xl font-bold ${textPrimary}`}>
//                         Open New Case
//                     </h3>
//                     <button
//                         onClick={onClose}
//                         className={`p-1 rounded-full ${closeButtonClasses} transition-colors`}
//                         aria-label="Close"
//                     >
//                         <X className="w-6 h-6" />
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-6 space-y-6">

//                     <div>
//                         <label htmlFor="projectName" className={`block text-sm font-medium mb-2 ${textLabel} `}>Project Name <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             id="projectName"
//                             value={projectName}
//                             onChange={(e) => setProjectName(e.target.value)}
//                             className={inputClasses}
//                             required
//                             placeholder="e.g., New Target Analysis"
//                         />
//                     </div>

//                     <div>
//                         <label htmlFor="keywords" className={`block text-sm font-medium mb-2 ${textLabel}`}>Keywords <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             id="keywords"
//                             value={keywords}
//                             onChange={(e) => setKeywords(e.target.value)}
//                             className={inputClasses}
//                             required
//                             placeholder="e.g: protest OR rally"
//                         />
//                         <p className={`text-xs mt-1 ${textHelper}`}>Use (OR) to separate</p>
//                     </div>

//                     <div>
//                         <label className={`block text-sm font-medium mb-3 ${textLabel}`}>Select Sources <span className="text-red-500">*</span></label>
//                         <div className="grid grid-cols-3 gap-4">
//                             {AVAILABLE_SOURCES.map(source => {
//                                 const isSelected = selectedSources.has(source.id);
//                                 const isDisabled = !source.enabled;

//                                 const baseClasses = 'p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200';

//                                 let stateClasses = '';

//                                 if (isDisabled) {
//                                     stateClasses = `${isDarkMode ? 'bg-black border-white/30 opacity-40' : 'bg-white border-black/30 opacity-40'} cursor-not-allowed ${textPrimary}`;
//                                 } else if (isSelected) {
//                                     stateClasses = `border-peacock-500 ${isDarkMode ? 'bg-peacock-900 text-peacock-200' : 'bg-peacock-50 text-peacock-800'} font-bold`;
//                                 } else {
//                                     stateClasses = `${bgInput} ${borderDefault} hover:border-peacock-500 ${textPrimary} cursor-pointer`;
//                                 }

//                                 return (
//                                     <button
//                                         type="button"
//                                         key={source.id}
//                                         onClick={() => handleSourceToggle(source.id)}
//                                         disabled={isDisabled}
//                                         className={`${baseClasses} ${stateClasses}`}
//                                     >
//                                         <source.icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-peacock-400' : textPrimary}`} />
//                                         <span className="text-sm font-semibold">{source.name}</span>
//                                         {isDisabled && <span className="text-xs text-red-500 mt-1 font-medium">(Soon)</span>}
//                                     </button>
//                                 );
//                             })}
//                         </div>
//                         {selectedSources.size === 0 && (
//                             <p className="text-sm text-red-500 mt-2 font-medium">Please select at least one source.</p>
//                         )}
//                     </div>

//                     <div className="flex justify-end pt-2">
//                         <button
//                             type="submit"
//                             disabled={!projectName || !keywords || selectedSources.size === 0}
//                             className="flex w-full items-center justify-center px-6 py-3 font-semibold text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             <Plus className="w-5 h-5 mr-2" />
//                             Create Project
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }

function ProjectList({ projects, isLoading, onViewAnalysis, type }) {
    const [search, setSearch] = useState('');

    const getStatusClass = (status) => {
        if (status === 'Running') return 'text-blue-700 bg-blue-100 rounded-sm p-1';
        if (status === 'Completed') return 'text-green-700 bg-green-100 rounded-sm p-1';
        if (status === 'Stopped') return 'text-red-700 bg-red-100 rounded-sm p-1  ';
        return 'text-gray-500';
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
                            <tr><td colSpan="6" className="text-center p-8"><Loader2 className="w-8 h-8 text-peacock-500 animate-spin inline-block" /></td></tr>
                        ) : filteredProjects.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-8"><p className="text-secondary">No {type} projects found.</p></td></tr>
                        ) : (
                            filteredProjects.map((project) => (
                                <tr key={project._id} className="hover:bg-primary">
                                    <td className="px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis">
                                        <div className="text-sm font-semibold text-primary truncate">{project.name}</div>
                                        <div className="text-xs text-secondary">{project.description || 'No description'}</div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary truncate">{project.keyword}</td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold truncate">
                                        <span className={getStatusClass(project.status)}>{project.status}</span>
                                    </td>


                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-medium">
                                        {project.postCount !== undefined && project.postCount !== null
                                            ? project.postCount
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">

                                        <button
                                            onClick={() => onViewAnalysis(project)}
                                            className="text-peacock-500 hover:text-peacock-700 font-medium"
                                        >
                                            View Analysis
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

function AnalysisResults({ project, initialData, onBack, onRefreshData }) {
    const [posts, setPosts] = useState(initialData.posts);
    const [summary, setSummary] = useState(initialData.summary);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [postSearch, setPostSearch] = useState('');
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [localProject, setLocalProject] = useState(project);

    useEffect(() => { setPosts(initialData.posts); }, [initialData]);

    const handleGenerateSummaryAndRisk = async () => {
        if (summary && !window.confirm("Re-run AI analysis? This consumes tokens.")) return;
        setIsSummarizing(true);
        toast('Running full AI Summary and Risk Triage');
        try {
            const response = await fetch(`http://localhost:5001/api/projects/${project._id}/summarize`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed');
            const { summary: newSummary } = await response.json();
            setSummary(newSummary);
            toast.success('Summary generated!');
            onRefreshData();
        } catch (error) {
            console.error("AI Error:", error);
            toast.error('AI pipeline failed.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.content?.toLowerCase().includes(postSearch.toLowerCase()) ||
        post.username?.toLowerCase().includes(postSearch.toLowerCase())
    );

    const getRiskColor = (risk) => {
        if (risk === 'High') return 'bg-red-100 text-red-800 border-red-200';
        if (risk === 'Medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    // const formattedSummary = (summary || "No summary yet.").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

    const isHtml = summary && summary.trim().startsWith("<");
    const formattedSummary = isHtml
        ? summary
        : (summary || "No summary yet.").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

    return (
        <div className="space-y-6">
            {isSourceModalOpen && (
                <SourceControlModal
                    project={localProject}
                    onClose={() => setIsSourceModalOpen(false)}
                    onUpdate={(updatedSources) => {
                        setLocalProject({ ...localProject, sources: updatedSources });
                        if (onRefreshData) onRefreshData();
                    }}
                />
            )}

            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button
                        onClick={onBack}
                        className="flex items-center px-4 py-2 text-sm font-medium hover:scale-105 rounded-lg transition-transform whitespace-nowrap"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </button>

                    <h3 className="text-2xl font-semibold text-primary truncate">
                        Analysis: "{localProject.name}"
                    </h3>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => generateCaseReport(localProject, posts, summary)}
                        className="px-5 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 hover:scale-105 transition-all"
                    >
                        Export Report
                    </button>

                    {localProject.type === 'Automated' && (
                        <button
                            onClick={() => setIsSourceModalOpen(true)}
                            className="px-5 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 hover:scale-105 transition-all"
                        >
                            Manage Sources
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-subtle rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="flex items-center text-lg font-semibold text-primary">
                        <Bot className="w-5 h-5 mr-2 text-peacock-500" /> Intelligence Summary
                    </h4>
                    <button onClick={handleGenerateSummaryAndRisk} disabled={isSummarizing} className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-peacock-600 rounded hover:bg-peacock-500 disabled:bg-gray-400">
                        {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />} Generate Analysis
                    </button>
                </div>
                <p className="text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedSummary }} />
            </div>

            <div className="bg-subtle rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 flex justify-between items-center border-b border-primary">
                    <h4 className="text-lg font-semibold text-primary">Live Feed ({filteredPosts.length} Posts)</h4>
                    <div className="relative w-64">
                        <input type="text" placeholder="Search content..." onChange={(e) => setPostSearch(e.target.value)} className="w-full p-2 pl-8 rounded border bg-primary focus:outline-none" />
                        <Search className="w-4 h-4 text-secondary absolute left-2 top-3" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-primary border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Risk</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider w-1/3">Content</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Forensic Intel</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-subtle divide-y divide-primary">
                            {filteredPosts.map((post) => {
                                const intel = post.enrichmentData || {};
                                const phones = intel.extracted_phones || [];
                                const upis = intel.extracted_upis || [];
                                const entities = intel.ner_entities || [];
                                const flags = intel.risk_flags || [];

                                const ocrText = intel.ocr_text;

                                const hasIntel = phones.length > 0 || upis.length > 0 || entities.length > 0 || flags.length > 0 || ocrText;

                                return (
                                    <tr key={post.id} className="hover:bg-primary transition-colors">
                                        <td className="px-6 py-4 align-top">
                                            {post.risk ? (
                                                <span className={`px-2 py-1 text-xs font-bold rounded border ${getRiskColor(post.risk)}`}>
                                                    {post.risk.toUpperCase()}
                                                </span>
                                            ) : <span className="text-xs text-gray-400">Processing...</span>}

                                            {post.sentiment && (
                                                <div className="mt-2 text-xs  bg-white p-1 w-18 rounded-sm text-secondary">
                                                    <span className='text-black font-semibold '>SENTIMENT</span> <span className={`font-medium  ${post.sentiment === 'Negative' ? 'text-red-500' : 'text-green-600'}`}>{post.sentiment}</span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <div className="text-sm font-bold text-primary">@{post.username}</div>
                                            <div className="text-xs text-gray-500">{post.timestamp}</div>
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <p className="text-sm text-primary mb-2 line-clamp-3">{post.content}</p>
                                            {post.screenshotPath && (
                                                <div className="space-y-1">
                                                    <a href={`http://localhost:5001${post.screenshotPath}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:underline">
                                                        <FileText className="w-3 h-3 mr-1" /> Evidence Snapshot
                                                    </a>

                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            {hasIntel ? (
                                                <div className="space-y-1">
                                                    {phones.map((p, i) => (
                                                        <div key={`p-${i}`} className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                                            <span className="mr-1"></span> {p}
                                                        </div>
                                                    ))}
                                                    {upis.map((u, i) => (
                                                        <div key={`u-${i}`} className="flex items-center text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                                            <span className="mr-1"></span> {u}
                                                        </div>
                                                    ))}
                                                    {flags.slice(0, 2).map((f, i) => (
                                                        <div key={`f-${i}`} className="flex items-center text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
                                                            <span className="mr-1"></span> {f.replace('Keyword: ', '')}
                                                        </div>
                                                    ))}


                                                    {ocrText && <OCRViewer text={ocrText} />}

                                                    {entities.slice(0, 2).map((e, i) => (
                                                        <div key={`e-${i}`} className="flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                                                            <span className="mr-1">👤</span> {e}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No specific entities found</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 align-top">
                                            <button onClick={() => window.open(post.url, '_blank')} className="text-blue-600 hover:scale-105 text-xs font-semibold px-3 py-1 rounded bg-blue-50 transition">
                                                View Post
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
