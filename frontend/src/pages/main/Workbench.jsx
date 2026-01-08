import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    Calendar, Zap, Send, Facebook, Instagram, Power, Linkedin, MessageCircle, X, Search, Loader2, ArrowLeft,  Globe , Eye, Activity, Bot, FileText, Plus, ExternalLink
} from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import DatePicker from 'react-datepicker';
import "../../components/ui/datepicker.css";
import { useLocation } from 'react-router-dom';
import { generateCaseReport } from '../../utils/reportGenerator';


const ALL_POSSIBLE_SOURCES = [
    { id: 'x', name: 'X (Twitter)', icon: X, enabled: true },
    { id: 'reddit', name: 'Reddit', icon: MessageCircle, enabled: true },
    { id: 'facebook', name: 'Facebook', icon: Facebook, enabled: true },
    { id: 'instagram', name: 'Instagram', icon: Instagram, enabled: true },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, enabled: true },
    { id: 'telegram', name: 'Telegram', icon: Send, enabled: true },
];

// function OCRViewer({ text }) {
//     const [isOpen, setIsOpen] = useState(false);

//     return (
//         <div className="mt-2 w-full max-w-[200px]">
//             <button
//                 onClick={() => setIsOpen(!isOpen)}
//                 className={`flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded border transition-all duration-200 
//                     ${isOpen
//                         ? 'bg-gray-100 text-gray-700 border-gray-300'
//                         : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:scale-105'
//                     }`}
//             >
//                 <div className="flex items-center">
//                     <span className="mr-2">OCR Text</span>
//                 </div>

//                 {isOpen ? (
//                     <X className="w-3 h-3 text-gray-500" />
//                 ) : (
//                     <span className="text-[10px] uppercase tracking-wider font-bold">View</span>
//                 )}
//             </button>
//             {isOpen && (
//                 <div className="mt-1 p-2 bg-white rounded text-[10px] text-gray-600 border border-gray-200 font-mono break-all max-h-32 overflow-y-auto shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
//                     {text}
//                 </div>
//             )}
//         </div>
//     );
// }

function getSourceIcon(sourceId) {
    const source = ALL_POSSIBLE_SOURCES.find(s => s.id === sourceId);
    return source ? source.icon : FileText;
}

// function TabButton({ title, active, onClick }) {
//     return (
//         <button
//             onClick={onClick}
//             className={`px-6 py-3 text-sm font-medium transition-colors ${active
//                 ? 'border-b-4 rounded border-peacock-500 text-peacock-500'
//                 : 'text-secondary hover:text-primary'
//                 }`}
//         >
//             {title}
//         </button>
//     );
// }

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
            status: sourceStatus.get(s.id) || 'Stopped',
            platformKey: s.id === 'x' ? 'twitter' : s.id
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
    const [activeTab, setActiveTab] = useState('automated'); // Default to Automated
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
        // ... (Keep strictly for backward compatibility helper functions if needed, but UI entry is removed)
        const { projectName, description, keyword, startDate, endDate } = formData;
        // ...
        setIsStrikeModalOpen(false);
        // ... Logic remains in case we need to revive manual strikes later, but hidden from user now.
        // Actually, user asked to REMOVE it. So I will simply not render the modal trigger.
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

    const handleProjectRefresh = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/projects');
            if (!response.ok) throw new Error('Failed to fetch projects');
            const data = await response.json();
            setProjects(data);
            
            if (currentProject) {
                const updated = data.find(p => p.projectId === currentProject.projectId);
                if (updated) setCurrentProject(updated);
            }
        } catch (error) {
            console.error("Error refreshing projects:", error);
        }
    };

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
                        onProjectUpdate={handleProjectRefresh}
                    />
                );
            case 'list':
            default:

                const projectsToShow = projects.filter(p => p.type === 'Automated');

                return (
                    <ProjectList
                        projects={projectsToShow}
                        isLoading={isProjectsLoading}
                        onViewAnalysis={handleViewAnalysis}
                        type={'Automated'}
                    />
                );
        }
    };


    return (
        <div className="space-y-6">
            {/* Manual Strike Modal Removed */}
            {isHarvesterModalOpen && (<NewHarvesterModal onClose={() => setIsHarvesterModalOpen(false)} onCreate={handleRunHarvester} isDarkMode={isDarkMode} />)}

            {view === 'list' && (
                <>
                    <div className="flex items-center justify-between">
                        <div><h1 className="text-3xl font-bold mb-1 text-primary">Case Management</h1></div>
                        <div className="flex gap-4">
                             <button onClick={() => setIsHarvesterModalOpen(true)} className="flex items-center px-4 py-2 font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-peacock-600 rounded-lg hover:bg-peacock-500 focus:outline-none">
                                <Plus className="w-5 h-5 mr-1" /> New Case
                             </button>
                        </div>
                    </div>
                    {/* Tab Selection Removed - showing only Automated Projects */}
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
    const [platform, setPlatform] = useState('x');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const handleSubmit = (e) => {
        e.preventDefault();
        onScrape({ projectName, description, keyword, platform, startDate, endDate });
    };

    const bgModal = isDarkMode ? 'bg-black' : 'bg-white';
    const textPrimary = isDarkMode ? 'text-white' : 'text-black';
    const textLabel = isDarkMode ? 'text-white' : 'text-black';
    const textHelper = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const borderDefault = isDarkMode ? 'border-white' : 'border-black';
    const borderDivider = isDarkMode ? 'border-white/20' : 'border-black/20';
    const bgInput = isDarkMode ? 'bg-black' : 'bg-white';
    const focusAccent = 'focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500';
    const inputClasses = `w-full p-3 rounded-lg border transition-all duration-200 ${bgInput} ${textPrimary} ${borderDefault} placeholder-opacity-50 ${focusAccent}`;
    const closeButtonClasses = isDarkMode ? 'text-white hover:bg-white hover:text-black' : 'text-black hover:bg-black hover:text-white';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity backdrop-blur-sm ${isDarkMode ? 'bg-black/10' : 'bg-white/10'}`}>
            <div className={`rounded-xl shadow-2xl w-full max-w-lg ${isDarkMode ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
                <div className={`flex justify-between items-center p-6 border-b ${borderDivider}`}>
                    <h3 className="text-xl font-bold">New Manual Search (Strike)</h3>
                    <button onClick={onClose} className={`p-1 rounded-full ${closeButtonClasses} transition-colors`} aria-label="Close">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label htmlFor="projectName" className={`block text-sm font-medium mb-2 ${textLabel}`}>Project Name <span className="text-red-500">*</span></label>
                        <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className={inputClasses} required placeholder="" />
                    </div>
                    <div>
                        <label htmlFor="description" className={`block text-sm font-medium mb-2 ${textLabel}`}>Description</label>
                        <textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClasses} resize-none`} placeholder="Briefly describe the objective of this search." />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${textLabel}`}>Date</label>
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
                    </div>
                    <div>
                        <label htmlFor="keyword" className={`block text-sm font-medium mb-2 ${textLabel}`}>Keyword(s) <span className="text-red-500">*</span></label>
                        <input type="text" id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={inputClasses} required placeholder="e.g., #Misinformation OR 'fake news'" />
                    </div>
                    <div>
                        <label htmlFor="platform" className={`block text-sm font-medium mb-2 ${textLabel}`}>Platform <span className="text-red-500">*</span></label>
                        <select
                            id="platform"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className={inputClasses}
                        >
                            {ALL_POSSIBLE_SOURCES.filter(s => s.enabled).map(source => (
                                <option key={source.id} value={source.id}>{source.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={!projectName || !keyword} className="flex w-full items-center justify-center px-6 py-3 font-semibold text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Search className="w-5 h-5 mr-2" /> Start Scraping
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}





function NewHarvesterModal({ onClose, onCreate, isDarkMode }) {
    const [projectName, setProjectName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [investigator, setInvestigator] = useState('');
    const [legalAuth, setLegalAuth] = useState('OSINT');
    const [caseType, setCaseType] = useState('General Investigation');
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

        const sources = ALL_POSSIBLE_SOURCES
            .filter(s => selectedSources.has(s.id))
            .map(s => ({ 
                id: s.id, 
                name: s.name, 
                status: 'Active',
                platformKey: s.id === 'x' ? 'twitter' : s.id 
            }));

        onCreate({ projectName, keywords, sources, investigator, legalAuth, caseType });
    };

    // Cleaner dark/light mode styles without heavy borders
    const bgModal = isDarkMode ? 'bg-zinc-950' : 'bg-white';
    const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
    const textLabel = isDarkMode ? 'text-zinc-400' : 'text-zinc-500';
    const bgInput = isDarkMode ? 'bg-zinc-900/50' : 'bg-gray-50';
    const focusRing = 'focus:ring-2 focus:ring-peacock-500 focus:outline-none';
    const inputClasses = `w-full p-3 rounded-lg text-sm font-medium transition-all ${bgInput} ${textPrimary} ${focusRing} border-none`; 
    const closeButtonClasses = isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-black hover:bg-black/5';

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity backdrop-blur-md ${isDarkMode ? 'bg-black/60' : 'bg-gray-900/20'}`}>
            <div className={`rounded-2xl shadow-2xl w-full max-w-4xl ${bgModal} overflow-hidden flex flex-col max-h-[90vh]`}>
                
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6">
                    <div>
                        <h3 className={`text-2xl font-bold ${textPrimary} tracking-tight`}>New Forensic Case</h3>
                        <p className={`text-sm ${textLabel} mt-1`}>Configure target parameters and legal authorization.</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full ${closeButtonClasses} transition-colors`} aria-label="Close">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Grid */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-8">
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN: Case Details & Keywords (7 cols) */}
                        <div className="col-span-12 md:col-span-7 space-y-6">
                            
                            {/* Section: Case Meta */}
                            <div className="space-y-4">
                                <h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-peacock-400' : 'text-peacock-600'}`}>Case Metadata</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label htmlFor="projectName" className={`block text-xs font-semibold uppercase mb-2 ${textLabel}`}>Case Name / ID</label>
                                        <input type="text" id="projectName" autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} className={inputClasses} required placeholder="Operation Name or Case #" />
                                    </div>
                                    <div>
                                        <label htmlFor="investigator" className={`block text-xs font-semibold uppercase mb-2 ${textLabel}`}>Investigator</label>
                                        <input type="text" id="investigator" value={investigator} onChange={(e) => setInvestigator(e.target.value)} className={inputClasses} placeholder="Agent Name" />
                                    </div>
                                    <div>
                                        <label htmlFor="legalAuth" className={`block text-xs font-semibold uppercase mb-2 ${textLabel}`}>Authority</label>
                                        <select id="legalAuth" value={legalAuth} onChange={(e) => setLegalAuth(e.target.value)} className={`${inputClasses} appearance-none cursor-pointer`}>
                                            <option value="OSINT">OSINT (Public)</option>
                                            <option value="Internal">Internal Inquiry</option>
                                            <option value="Warrant">Judicial Warrant</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="caseType" className={`block text-xs font-semibold uppercase mb-2 ${textLabel}`}>Classification</label>
                                        <input type="text" id="caseType" value={caseType} onChange={(e) => setCaseType(e.target.value)} className={inputClasses} placeholder="e.g. Fraud, Harassment, Terror Funding" />
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-800 to-transparent my-6" />

                            {/* Section: Target Info */}
                            <div className="space-y-4">
                                <h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-peacock-400' : 'text-peacock-600'}`}>Target Definitions</h4>
                                <div>
                                    <label htmlFor="keywords" className={`block text-xs font-semibold uppercase mb-2 ${textLabel}`}>Keywords / Handles / Hashtags</label>
                                    <input type="text" id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClasses} required placeholder="@username OR #hashtag" />
                                    <p className="text-[10px] text-gray-500 mt-2 font-medium">✨ Supports boolean logic (AND, OR).</p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sources (5 cols) */}
                        <div className="col-span-12 md:col-span-5">
                            <div className={`h-full rounded-2xl p-6 ${isDarkMode ? 'bg-zinc-900/30' : 'bg-gray-50/80'}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-widest mb-6 ${isDarkMode ? 'text-peacock-400' : 'text-peacock-600'}`}>Intelligence Sources</h4>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    {ALL_POSSIBLE_SOURCES.map(source => {
                                        const isSelected = selectedSources.has(source.id);
                                        const isDisabled = !source.enabled;
                                        return (
                                            <button
                                                type="button"
                                                key={source.id}
                                                onClick={() => handleSourceToggle(source.id)}
                                                disabled={isDisabled}
                                                className={`
                                                    relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200
                                                    ${isDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-95'}
                                                    ${isSelected 
                                                        ? (isDarkMode ? 'bg-peacock-600 text-white shadow-lg shadow-peacock-900/50' : 'bg-white text-peacock-600 shadow-md ring-2 ring-peacock-500') 
                                                        : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-white text-gray-500 hover:bg-white shadow-sm hover:shadow-md')}
                                                `}
                                            >
                                                <source.icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-white' : ''}`} />
                                                <span className="text-xs font-bold">{source.name}</span>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                {selectedSources.size === 0 ? (
                                    <div className="mt-6 text-center">
                                        <p className="text-xs text-red-500 font-medium animate-pulse">Select at least one source</p>
                                    </div>
                                ) : (
                                    <div className="mt-8">
                                        <button type="submit" disabled={!projectName || !keywords} className="w-full py-4 text-sm font-bold text-white uppercase tracking-widest rounded-xl bg-peacock-600 hover:bg-peacock-500 hover:shadow-lg hover:shadow-peacock-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]">
                                            Initiate Case
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}

function ProjectList({ projects, isLoading, onViewAnalysis, type }) {
    const [search, setSearch] = useState('');

    const getStatusClass = (status) => {
        if (status === 'Running') return 'text-blue-700 bg-blue-50 border border-blue-200';
        if (status === 'Completed') return 'text-green-700 bg-green-50 border border-green-200';
        if (status === 'Stopped') return 'text-red-700 bg-red-50 border border-red-200';
        return 'text-gray-500 bg-gray-50 border border-gray-200';
    };

    const filteredProjects = projects.filter(p =>
        (p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.keyword?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="bg-subtle rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary bg-primary/30">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search cases by name, ID or keyword..."
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full p-2.5 pl-10 text-sm rounded-lg bg-gray-700 border-primary focus:border-peacock-500 focus:outline-none text-primary"
                    />
                    <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-primary">
                    <thead className="bg-primary/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Case Details</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Authority / Agent</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Evidence</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-subtle divide-y divide-primary">
                        {isLoading ? (
                            <tr><td colSpan="6" className="text-center p-12"><Loader2 className="w-8 h-8 text-peacock-500 animate-spin inline-block" /></td></tr>
                        ) : filteredProjects.length === 0 ? (
                            <tr><td colSpan="6" className="text-center p-12"><p className="text-secondary text-sm">No forensic cases found or active.</p></td></tr>
                        ) : (
                            filteredProjects.map((project) => (
                                <tr key={project._id} className="hover:bg-primary transition-colors group">
                                    <td className="px-6 py-4 max-w-[280px]">
                                        <div className="flex items-center">
                                            <div className="p-2 rounded-lg bg-peacock-50 dark:bg-peacock-900/20 text-peacock-600 mr-3">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-primary truncate">{project.name}</div>
                                                <div className="text-xs text-secondary mt-0.5 font-mono">{project.keyword}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs font-medium text-primary">{project.investigator || 'Unassigned'}</div>
                                        <div className="text-[10px] text-secondary uppercase tracking-wider mt-0.5">{project.legalAuth || 'OSINT'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${getStatusClass(project.status)}`}>
                                            {project.status?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-medium">
                                       <span className="font-mono">{project.postCount || 0}</span> items
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => onViewAnalysis(project)} className="flex items-center text-peacock-600 hover:text-peacock-700 transition-colors bg-peacock-100 hover:bg-peacock-200  px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide">
                                            <Eye className="w-3 h-3 mr-1.5" /> Inspect
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

function UserCircle({ className }) {
    // Placeholder icon component to fix ReferenceError if Users is not imported
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-9"/></svg>
}

function Briefcase({ className }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}



function ProfileDetailsModal({ profile, posts, onClose }) {
    // Filter posts for this specific user
    const userPosts = React.useMemo(() => {
        return posts.filter(p => (p.author === profile.name || p.username === profile.name));
    }, [posts, profile]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-subtle w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-start bg-white dark:bg-black rounded-t-2xl">
                    <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-full bg-peacock-100 dark:bg-peacock-900/30 flex items-center justify-center text-3xl font-bold text-peacock-600">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                {profile.name}
                                {profile.highRisk > 0 && (
                                    <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                        Critical Target
                                    </span>
                                )}
                            </h2>
                            <div className="flex gap-2 mt-2">
                                {Array.from(profile.platforms).map(p => (
                                    <span key={p} className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 uppercase font-bold">Total Intercepts</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userPosts.length}</p>
                        </div>
                        <div className="p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 uppercase font-bold">Risk Incidents</p>
                            <p className={`text-2xl font-bold mt-1 ${profile.highRisk > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {profile.highRisk}
                            </p>
                        </div>
                        <div className="p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 uppercase font-bold">First Seen</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-2 font-mono">
                                {profile.firstActive ? new Date(profile.firstActive).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div className="p-4 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 uppercase font-bold">Last Active</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-2 font-mono">
                                {profile.lastActive ? new Date(profile.lastActive).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Threat Intelligence / Summary */}
                    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-peacock-500" /> Activity Timeline
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {userPosts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((post, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-500">{new Date(post.timestamp).toLocaleString()}</span>
                                            <span className="text-[10px] uppercase font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600">
                                                {post.platform}
                                            </span>
                                        </div>
                                        {post.risk && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                post.risk === 'High' ? 'bg-red-100 text-red-700' : 
                                                post.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {post.risk}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medidum">
                                        {post.content}
                                    </p>
                                    {(post.url || post.sourceUrl) && (
                                        <div className="mt-2 text-right">
                                            <a href={post.url || post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-peacock-600 hover:text-peacock-700 hover:underline inline-flex items-center gap-1 bg-peacock-50 px-2 py-1 rounded">
                                                View Original Post <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileIntelligence({ posts }) {
    const [selectedProfile, setSelectedProfile] = useState(null);

    const profiles = React.useMemo(() => {
        const map = new Map();
        posts.forEach(p => {
            let user = p.author || p.username || 'Unknown';
            
            // Smart Extraction for Legacy Data
            if ((!user || user === 'Instagram User' || user === 'Unknown') && p.platform === 'instagram' && p.content) {
                const match = p.content.match(/Photo by ([^|]+)/);
                if (match && match[1]) user = match[1].trim();
            }

            if (!map.has(user)) {
                map.set(user, { 
                    name: user, 
                    platforms: new Set(), 
                    totalPosts: 0, 
                    highRisk: 0,
                    lastActive: null,
                    firstActive: null
                });
            }
            const profile = map.get(user);
            profile.totalPosts++;
            profile.platforms.add(p.platform || 'General');
            if (p.risk === 'High' || p.risk === 'Critical') profile.highRisk++;
            
            const time = new Date(p.timestamp);
            if (!profile.lastActive || time > new Date(profile.lastActive)) profile.lastActive = p.timestamp;
            if (!profile.firstActive || time < new Date(profile.firstActive)) profile.firstActive = p.timestamp;
        });
        return Array.from(map.values()).sort((a,b) => b.highRisk - a.highRisk || b.totalPosts - a.totalPosts);
    }, [posts]);

    return (
        <>
            {selectedProfile && (
                <ProfileDetailsModal 
                    profile={selectedProfile} 
                    posts={posts} 
                    onClose={() => setSelectedProfile(null)} 
                />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {profiles.map((p, i) => (
                    <div key={i} className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-500">
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[150px]" title={p.name}>{p.name}</h4>
                                    <div className="flex gap-1 mt-1">
                                        {Array.from(p.platforms).map(plat => (
                                            <span key={plat} className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                {plat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {p.highRisk > 0 && (
                                <div className="flex flex-col items-end">
                                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold ">
                                        {p.highRisk} THREATS
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 dark:border-gray-800 mb-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Activity</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{p.totalPosts} <span className="text-xs font-normal text-gray-400">posts</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Risk Score</p>
                                <p className={`text-xl font-bold ${p.highRisk > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {p.highRisk > 0 ? 'CRITICAL' : 'LOW'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <div className="flex justify-between text-xs">
                                <span className="text-gray-500">First Seen:</span>
                                <span className="text-gray-900 dark:text-gray-300 font-mono">{p.firstActive ? new Date(p.firstActive).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Last Active:</span>
                                <span className="text-gray-900 dark:text-gray-300 font-mono">{p.lastActive ? new Date(p.lastActive).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                        
                        <button onClick={() => setSelectedProfile(p)} className="w-full mt-4 py-2 text-sm font-medium text-peacock-600 bg-peacock-50 dark:bg-peacock-900/20 rounded-lg hover:bg-peacock-100 transition-colors">
                            View Detailed Profile
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}

function TimelineView({ posts }) {
    const sortedPosts = React.useMemo(() => {
        return [...posts].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [posts]);

    const [activeId, setActiveId] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                 entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.getAttribute('data-id'));
                    }
                });
            },
            { rootMargin: '-30% 0px -30% 0px', threshold: 0.5 } 
        );

        const elements = document.querySelectorAll('.timeline-item');
        elements.forEach((el) => observer.observe(el));

        return () => {
             elements.forEach((el) => observer.unobserve(el));
        };
    }, [sortedPosts]);
    
    // Find index of active item to style previous lines
    const activeIndex = React.useMemo(() => {
        if (!activeId) return -1;
        return sortedPosts.findIndex((_, idx) => `post-${idx}` === activeId);
    }, [activeId, sortedPosts]);

    const getEffectiveAuthor = (post) => {
        let author = post.username || post.author || post.owner || 'Unknown';
        if ((!author || author === 'Instagram User' || author === 'Unknown') && post.platform === 'instagram' && post.content) {
            const match = post.content.match(/Photo by ([^|]+)/);
            if (match && match[1]) return match[1].trim();
        }
        return author;
    };

    return (
        <div className="relative pl-8 space-y-8 animate-in fade-in duration-500 ml-4 py-4">
             {/* Note: Removed parent border-l-2 to implement per-item dynamic line */}
            {sortedPosts.map((post, idx) => {
                const isActive = activeId === `post-${idx}`;
                const isPast = activeIndex !== -1 && idx <= activeIndex;
                const authorName = getEffectiveAuthor(post);
                
                return (
                    <div key={idx} data-id={`post-${idx}`} className="timeline-item relative group transition-all duration-500">
                        
                         {/* Dynamic Connecting Line (Draws DOWN to next item) */}
                        {idx < sortedPosts.length - 1 && (
                            <div className={`absolute left-[-29px] top-8 bottom-[-40px] transition-all duration-1000 ease-in-out
                                ${isPast ? 'w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]' : 'w-0.5 bg-gray-800'}
                            `} style={{ zIndex: 0 }} />
                        )}

                        {/* Dot */}
                        <div className={`absolute -left-[35px] top-4 w-4 h-4 rounded-full border-2 transition-all duration-700 ease-out z-10
                             ${isPast || isActive ? 'bg-white border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : `bg-black border-gray-600 ${post.risk === 'High' ? 'border-red-500' : ''}`}
                        `} />
                        
                        <div className={`flex flex-col sm:flex-row gap-4 bg-white dark:bg-black p-4 rounded-xl border transition-all duration-500 ease-out ${isActive ? 'border-peacock-500 shadow-lg scale-[1.02]' : 'border-gray-800 shadow-sm opacity-80 hover:opacity-100'}`}>
                            <div className="sm:w-32 flex-shrink-0 text-right sm:text-left">
                                <span className="text-xs font-mono text-gray-500 block">{new Date(post.timestamp).toLocaleTimeString()}</span>
                                <div className="font-bold text-sm text-gray-900 dark:text-white">{new Date(post.timestamp).toLocaleDateString()}</div>
                            </div>
                            <div className="flex-1 border-l border-gray-100 dark:border-gray-800 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded tracking-wider">
                                        {post.platform}
                                    </span>
                                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">
                                        {authorName}
                                    </h5>
                                    {post.risk === 'High' && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded ml-auto">THREAT</span>}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{post.content}</p>
                                
                                {(post.url || post.sourceUrl) && (
                                    <div className="mt-3 flex justify-end">
                                        <a href={post.url || post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-peacock-600 hover:text-peacock-700 hover:underline flex items-center gap-1 bg-peacock-50 dark:bg-peacock-900/20 px-2 py-1 rounded transition-colors">
                                            View Original Post <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function AnalysisResults({ project, initialData, onBack, onRefreshData, onProjectUpdate }) {
    const [posts, setPosts] = useState(initialData.posts);
    const [summary, setSummary] = useState(initialData.summary);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [postSearch, setPostSearch] = useState('');
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [localProject, setLocalProject] = useState(project);
    const [activeTab, setActiveTab] = useState('feed');

    useEffect(() => { setPosts(initialData.posts); }, [initialData]);
    useEffect(() => { setLocalProject(project); }, [project]);

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
            if (onRefreshData) onRefreshData();
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
        if (risk === 'High') return 'bg-red-50 text-red-700 border-red-100';
        if (risk === 'Medium') return 'bg-yellow-50 text-yellow-700 border-yellow-100';
        return 'bg-green-50 text-green-700 border-green-100';
    };

    const getEffectiveAuthor = (post) => {
        let author = post.username || post.author || post.owner || 'Unknown';
        // Retroactive fix for Instagram "Photo by"
        if ((!author || author === 'Instagram User' || author === 'Unknown') && post.platform === 'instagram' && post.content) {
            const match = post.content.match(/Photo by ([^|]+)/);
            if (match && match[1]) return match[1].trim();
        }
        return author;
    };

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
                        if (onProjectUpdate) onProjectUpdate();
                    }}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 bg-subtle/95 backdrop-blur py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /> 
                    </button>
                    <div>
                        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                             {localProject.name} <span className="text-xs font-normal text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full" title='project ID'>{localProject.projectId?.substr(0,6)}</span>
                        </h3>
                        <div className="flex text-xs text-white mt-0.5 gap-3">
                            <span className="flex items-center"><UserCircle className="w-3 h-3 mr-1"/> {localProject.investigator || 'Unknown'}</span>
                            <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1"/> {localProject.legalAuth || 'OSINT'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white  p-1 rounded-lg">
                        <button onClick={() => setActiveTab('feed')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'feed' ? 'bg-white dark:bg-black shadow text-white' : 'text-black '}`}>Live Feed</button>
                        <button onClick={() => setActiveTab('profiles')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'profiles' ? 'bg-white dark:bg-black shadow text-white' : 'text-black '}`}>Target Profiles</button>
                        <button onClick={() => setActiveTab('timeline')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'timeline' ? 'bg-white dark:bg-black shadow text-white' : 'text-black '}`}>Timeline</button>
                    </div>

                    <button onClick={() => generateCaseReport(localProject, posts, summary)} className="p-2 flex items-center gap-2 font-semibold text-green-600 hover:bg-green-200 bg-green-100 rounded-lg transition-colors" title="Export PDF">
                        <Globe className="w-5 h-5" /> Export
                    </button>
                    {localProject.type === 'Automated' && (
                        <button onClick={() => setIsSourceModalOpen(true)} className="p-2 flex items-center gap-2 font-semibold text-blue-600 hover:bg-blue-200 bg-blue-100 rounded-lg transition-colors" title="Manage Sources">
                             <Activity className="w-5 h-5" /> Sources
                        </button>
                    )}
                </div>
            </div>

            {/* TABS CONTENT */}
            {activeTab === 'feed' && (
                <div className="space-y-6">
                    <div className="bg-subtle rounded-xl shadow-sm  p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="flex items-center text-lg font-bold text-primary">
                                <Bot className="w-5 h-5 mr-2 text-peacock-500" /> Intelligence Summary
                            </h4>
                            <button onClick={handleGenerateSummaryAndRisk} disabled={isSummarizing} className="text-xs font-bold text-peacock-600 bg-peacock-100 hover:bg-peacock-200 px-3 py-1.5 rounded-lg hover:underline disabled:opacity-50">
                                {isSummarizing ? 'Analyzing...' : 'Refresh AI Analysis'}
                            </button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-secondary bg-primary/30 p-4 rounded-lg ">
                            {isSummarizing ? (
                                <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Processing evidence...</div>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: formattedSummary }} />
                            )}
                        </div>
                    </div>

                     {/* Live Feed Table (Existing Code) */}
                    <div className="bg-subtle rounded-xl shadow-sm  overflow-hidden">
                         <div className="p-4  bg-primary/30 flex justify-between items-center">
                            <h4 className="font-bold text-primary flex items-center gap-2">
                                <Activity className="w-4 h-4 text-peacock-500" /> Evidence Feed
                                <span className="text-xs font-normal text-secondary bg-primary px-2 py-0.5 rounded-full">{filteredPosts.length} items</span>
                            </h4>
                            <input
                                type="text"
                                placeholder="Filter content..."
                                value={postSearch}
                                onChange={(e) => setPostSearch(e.target.value)}
                                className="text-sm p-2 w-64 rounded-lg bg-subtle"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-primary">
                                <thead className="bg-primary/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Content</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Risk</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Media</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-subtle divide-y divide-primary">
                                    {filteredPosts.map((post) => (
                                        <tr key={post.id} className="hover:bg-primary transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-secondary font-mono">{post.timestamp}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-primary">{getEffectiveAuthor(post)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-secondary line-clamp-2 max-w-md">{post.content}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {post.platform && <span className="text-[10px] uppercase font-bold text-peacock-600">{post.platform}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                                                {post.risk ? (
                                                     <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${getRiskColor(post.risk)}`}>
                                                        {post.risk}
                                                    </span>
                                                ) : <span className="text-gray-400 text-xs">-</span>}

                                                {(post.url || post.sourceUrl) && (
                                                     <a href={post.url || post.sourceUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Go to Source">
                                                        <ExternalLink className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                                                     </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {post.screenshotPath ? (
                                                    <a href={`http://localhost:5001${post.screenshotPath}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs flex items-center">
                                                        <ImageIcon className="w-3 h-3 mr-1" /> View
                                                    </a>
                                                ) : <span className="text-gray-300 text-xs">No media</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'profiles' && <ProfileIntelligence posts={posts} />}
            {activeTab === 'timeline' && <TimelineView posts={posts} />}
        </div>
    );
}

function ImageIcon({ className }) {
     return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
}




// function NewStrikeModal({ onClose, onScrape, isDarkMode }) {
//     const [projectName, setProjectName] = useState('');
//     const [description, setDescription] = useState('');
//     const [keyword, setKeyword] = useState('');
//     const [startDate, setStartDate] = useState(new Date());
//     const [endDate, setEndDate] = useState(new Date());

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         onScrape({ projectName, description, keyword, startDate, endDate });
//     };

//     const bgModal = isDarkMode ? 'bg-black' : 'bg-white';

//     const textPrimary = isDarkMode ? 'text-white' : 'text-black';
//     const textLabel = isDarkMode ? 'text-white' : 'text-black';
//     const textHelper = isDarkMode ? 'text-gray-300' : 'text-gray-600';
//     const borderDefault = isDarkMode ? 'border-white' : 'border-black';
//     const borderDivider = isDarkMode ? 'border-white/20' : 'border-black/20';
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
//                     <h3 className="text-xl font-bold">
//                         New Manual Search (Strike)
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
//                         <label htmlFor="projectName" className={`block text-sm font-medium mb-2 ${textLabel}`}>Project Name <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             id="projectName"
//                             value={projectName}
//                             onChange={(e) => setProjectName(e.target.value)}
//                             className={inputClasses}
//                             required
//                             placeholder=""
//                         />
//                     </div>

//                     <div>
//                         <label htmlFor="description" className={`block text-sm font-medium mb-2 ${textLabel}`}>Description</label>
//                         <textarea
//                             id="description"
//                             rows={2}
//                             value={description}
//                             onChange={(e) => setDescription(e.target.value)}
//                             className={`${inputClasses} resize-none`}
//                             placeholder="Briefly describe the objective of this search."
//                         />
//                     </div>

//                     <div>
//                         <label className={`block text-sm font-medium mb-2 ${textLabel}`}>
//                             Date
//                         </label>
//                         <div className="relative">
//                             <DatePicker
//                                 selected={startDate}
//                                 onChange={(dates) => {
//                                     const [start, end] = dates;
//                                     setStartDate(start);
//                                     setEndDate(end);
//                                 }}
//                                 startDate={startDate}
//                                 endDate={endDate}
//                                 selectsRange
//                                 monthsShown={1}
//                                 maxDate={new Date()}
//                                 showMonthDropdown
//                                 showYearDropdown
//                                 dropdownMode="select"

//                                 dateFormat="dd MMM yyyy"
//                                 placeholderText="Select start and end date"

//                                 className={`${inputClasses} w-full pl-10 cursor-pointer`}
//                                 wrapperClassName="w-full"
//                                 popperPlacement="bottom-start"
//                                 isClearable={true}
//                             />
//                             <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
//                         </div>
//                         <p className={`text-xs mt-1 ${textHelper}`}>
//                             Select the start date, then click the end date.
//                         </p>
//                     </div>

//                     <div>
//                         <label htmlFor="keyword" className={`block text-sm font-medium mb-2 ${textLabel}`}>Keyword(s) <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             id="keyword"
//                             value={keyword}
//                             onChange={(e) => setKeyword(e.target.value)}
//                             className={inputClasses}
//                             required
//                             placeholder="e.g., #Misinformation OR 'fake news'"
//                         />

//                     </div>

//                     <div className="flex justify-end pt-4">
//                         <button
//                             type="submit"
//                             disabled={!projectName || !keyword}
//                             className="flex w-full items-center justify-center px-6 py-3 font-semibold text-white capitalize rounded-lg bg-peacock-600 hover:bg-peacock-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             <Search className="w-5 h-5 mr-2" />
//                             Start Scraping
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


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

// function ProjectList({ projects, isLoading, onViewAnalysis, type }) {
//     const [search, setSearch] = useState('');

//     const getStatusClass = (status) => {
//         if (status === 'Running') return 'text-blue-700 bg-blue-100 rounded-sm p-1';
//         if (status === 'Completed') return 'text-green-700 bg-green-100 rounded-sm p-1';
//         if (status === 'Stopped') return 'text-red-700 bg-red-100 rounded-sm p-1  ';
//         return 'text-gray-500';
//     };


//     const filteredProjects = projects.filter(p =>
//     (p.name?.toLowerCase().includes(search.toLowerCase()) ||
//         p.keyword?.toLowerCase().includes(search.toLowerCase()))
//     );

//     return (
//         <div className="bg-subtle rounded-lg shadow-lg overflow-hidden ">
//             <div className="p-4 border-b border-primary">
//                 <div className="relative w-full max-w-xs">
//                     <input
//                         type="text"
//                         placeholder={`Search ${type} projects...`}
//                         onChange={(e) => setSearch(e.target.value)}
//                         className="w-full p-2 pl-10 rounded-md border-2 bg-primary border-primary focus:border-peacock-500 focus:outline-none text-primary"
//                     />
//                     <Search className="w-5 h-5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
//                 </div>
//             </div>

//             <div className="overflow-x-auto">
//                 <table className="min-w-full divide-y divide-primary">
//                     <thead className="bg-primary">
//                         <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Project Name</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Keyword(s)</th>
//                             {/* <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Type</th> */}
//                             <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Posts</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="bg-subtle ">
//                         {isLoading ? (
//                             <tr><td colSpan="6" className="text-center p-8"><Loader2 className="w-8 h-8 text-peacock-500 animate-spin inline-block" /></td></tr>
//                         ) : filteredProjects.length === 0 ? (
//                             <tr><td colSpan="6" className="text-center p-8"><p className="text-secondary">No {type} projects found.</p></td></tr>
//                         ) : (
//                             filteredProjects.map((project) => (
//                                 <tr key={project._id} className="hover:bg-primary">
//                                     <td className="px-6 py-4 max-w-[250px] overflow-hidden text-ellipsis">
//                                         <div className="text-sm font-semibold text-primary truncate">{project.name}</div>
//                                         <div className="text-xs text-secondary">{project.description || 'No description'}</div>
//                                     </td>

//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary truncate">{project.keyword}</td>

//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold truncate">
//                                         <span className={getStatusClass(project.status)}>{project.status}</span>
//                                     </td>


//                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-medium">
//                                         {project.postCount !== undefined && project.postCount !== null
//                                             ? project.postCount
//                                             : '-'}
//                                     </td>
//                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">

//                                         <button
//                                             onClick={() => onViewAnalysis(project)}
//                                             className="text-peacock-500 hover:text-peacock-700 font-medium"
//                                         >
//                                             View Analysis
//                                         </button>


//                                     </td>
//                                 </tr>
//                             ))
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }

// function AnalysisResults({ project, initialData, onBack, onRefreshData }) {
//     const [posts, setPosts] = useState(initialData.posts);
//     const [summary, setSummary] = useState(initialData.summary);
//     const [isSummarizing, setIsSummarizing] = useState(false);
//     const [postSearch, setPostSearch] = useState('');
//     const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
//     const [localProject, setLocalProject] = useState(project);

//     useEffect(() => { setPosts(initialData.posts); }, [initialData]);

//     const handleGenerateSummaryAndRisk = async () => {
//         if (summary && !window.confirm("Re-run AI analysis? This consumes tokens.")) return;
//         setIsSummarizing(true);
//         toast('Running full AI Summary and Risk Triage');
//         try {
//             const response = await fetch(`http://localhost:5001/api/projects/${project._id}/summarize`, { method: 'POST' });
//             if (!response.ok) throw new Error('Failed');
//             const { summary: newSummary } = await response.json();
//             setSummary(newSummary);
//             toast.success('Summary generated!');
//             onRefreshData();
//         } catch (error) {
//             console.error("AI Error:", error);
//             toast.error('AI pipeline failed.');
//         } finally {
//             setIsSummarizing(false);
//         }
//     };

//     const filteredPosts = posts.filter(post =>
//         post.content?.toLowerCase().includes(postSearch.toLowerCase()) ||
//         post.username?.toLowerCase().includes(postSearch.toLowerCase())
//     );

//     const getRiskColor = (risk) => {
//         if (risk === 'High') return 'bg-red-100 text-red-800 border-red-200';
//         if (risk === 'Medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//         return 'bg-green-100 text-green-800 border-green-200';
//     };

//     // const formattedSummary = (summary || "No summary yet.").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

//     const isHtml = summary && summary.trim().startsWith("<");
//     const formattedSummary = isHtml
//         ? summary
//         : (summary || "No summary yet.").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');

//     return (
//         <div className="space-y-6">
//             {isSourceModalOpen && (
//                 <SourceControlModal
//                     project={localProject}
//                     onClose={() => setIsSourceModalOpen(false)}
//                     onUpdate={(updatedSources) => {
//                         setLocalProject({ ...localProject, sources: updatedSources });
//                         if (onRefreshData) onRefreshData();
//                     }}
//                 />
//             )}

//             <div className="flex justify-between items-center gap-4">
//                 <div className="flex items-center gap-4 min-w-0 flex-1">
//                     <button
//                         onClick={onBack}
//                         className="flex items-center px-4 py-2 text-sm font-medium hover:scale-105 rounded-lg transition-transform whitespace-nowrap"
//                     >
//                         <ArrowLeft className="w-4 h-4 mr-2" /> Back
//                     </button>

//                     <h3 className="text-2xl font-semibold text-primary truncate">
//                         Analysis: "{localProject.name}"
//                     </h3>
//                 </div>

//                 <div className="flex items-center gap-3 flex-shrink-0">
//                     <button
//                         onClick={() => generateCaseReport(localProject, posts, summary)}
//                         className="px-5 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 hover:scale-105 transition-all"
//                     >
//                         Export Report
//                     </button>

//                     {localProject.type === 'Automated' && (
//                         <button
//                             onClick={() => setIsSourceModalOpen(true)}
//                             className="px-5 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 hover:scale-105 transition-all"
//                         >
//                             Manage Sources
//                         </button>
//                     )}
//                 </div>
//             </div>

//             <div className="bg-subtle rounded-lg shadow-lg p-6">
//                 <div className="flex justify-between items-center mb-3">
//                     <h4 className="flex items-center text-lg font-semibold text-primary">
//                         <Bot className="w-5 h-5 mr-2 text-peacock-500" /> Intelligence Summary
//                     </h4>
//                     <button onClick={handleGenerateSummaryAndRisk} disabled={isSummarizing} className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-peacock-600 rounded hover:bg-peacock-500 disabled:bg-gray-400">
//                         {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />} Generate Analysis
//                     </button>
//                 </div>
//                 <p className="text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedSummary }} />
//             </div>

//             <div className="bg-subtle rounded-lg overflow-hidden shadow-sm">
//                 <div className="p-4 flex justify-between items-center border-b border-primary">
//                     <h4 className="text-lg font-semibold text-primary">Live Feed ({filteredPosts.length} Posts)</h4>
//                     <div className="relative w-64">
//                         <input type="text" placeholder="Search content..." onChange={(e) => setPostSearch(e.target.value)} className="w-full p-2 pl-8 rounded border bg-primary focus:outline-none" />
//                         <Search className="w-4 h-4 text-secondary absolute left-2 top-3" />
//                     </div>
//                 </div>
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full">
//                         <thead className="bg-primary border-b-2 border-gray-200">
//                             <tr>
//                                 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Risk</th>
//                                 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">User</th>
//                                 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider w-1/3">Content</th>
//                                 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Forensic Intel</th>
//                                 <th className="px-6 py-3 text-left text-xs font-bold text-secondary uppercase tracking-wider">Action</th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-subtle divide-y divide-primary">
//                             {filteredPosts.map((post) => {
//                                 const intel = post.enrichmentData || {};
//                                 const phones = intel.extracted_phones || [];
//                                 const upis = intel.extracted_upis || [];
//                                 const entities = intel.ner_entities || [];
//                                 const flags = intel.risk_flags || [];

//                                 const ocrText = intel.ocr_text;

//                                 const hasIntel = phones.length > 0 || upis.length > 0 || entities.length > 0 || flags.length > 0 || ocrText;

//                                 return (
//                                     <tr key={post.id} className="hover:bg-primary transition-colors">
//                                         <td className="px-6 py-4 align-top">
//                                             {post.risk ? (
//                                                 <span className={`px-2 py-1 text-xs font-bold rounded border ${getRiskColor(post.risk)}`}>
//                                                     {post.risk.toUpperCase()}
//                                                 </span>
//                                             ) : <span className="text-xs text-gray-400">Processing...</span>}

//                                             {post.sentiment && (
//                                                 <div className="mt-2 text-xs  bg-white p-1 w-18 rounded-sm text-secondary">
//                                                     <span className='text-black font-semibold '>SENTIMENT</span> <span className={`font-medium  ${post.sentiment === 'Negative' ? 'text-red-500' : 'text-green-600'}`}>{post.sentiment}</span>
//                                                 </div>
//                                             )}
//                                         </td>

//                                         <td className="px-6 py-4 align-top">
//                                             <div className="text-sm font-bold text-primary">@{post.username}</div>
//                                             <div className="text-xs text-gray-500">{post.timestamp}</div>
//                                         </td>

//                                         <td className="px-6 py-4 align-top">
//                                             <p className="text-sm text-primary mb-2 line-clamp-3">{post.content}</p>
//                                             {post.screenshotPath && (
//                                                 <div className="space-y-1">
//                                                     <a href={`http://localhost:5001${post.screenshotPath}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:underline">
//                                                         <FileText className="w-3 h-3 mr-1" /> Evidence Snapshot
//                                                     </a>

//                                                 </div>
//                                             )}
//                                         </td>

//                                         <td className="px-6 py-4 align-top">
//                                             {hasIntel ? (
//                                                 <div className="space-y-1">
//                                                     {phones.map((p, i) => (
//                                                         <div key={`p-${i}`} className="flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
//                                                             <span className="mr-1"></span> {p}
//                                                         </div>
//                                                     ))}
//                                                     {upis.map((u, i) => (
//                                                         <div key={`u-${i}`} className="flex items-center text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
//                                                             <span className="mr-1"></span> {u}
//                                                         </div>
//                                                     ))}
//                                                     {flags.slice(0, 2).map((f, i) => (
//                                                         <div key={`f-${i}`} className="flex items-center text-xs bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
//                                                             <span className="mr-1"></span> {f.replace('Keyword: ', '')}
//                                                         </div>
//                                                     ))}


//                                                     {ocrText && <OCRViewer text={ocrText} />}

//                                                     {entities.slice(0, 2).map((e, i) => (
//                                                         <div key={`e-${i}`} className="flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
//                                                             <span className="mr-1">👤</span> {e}
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             ) : (
//                                                 <span className="text-xs text-gray-400 italic">No specific entities found</span>
//                                             )}
//                                         </td>

//                                         <td className="px-6 py-4 align-top">
//                                             <button onClick={() => window.open(post.url, '_blank')} className="text-blue-600 hover:scale-105 text-xs font-semibold px-3 py-1 rounded bg-blue-50 transition">
//                                                 View Post
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// }
