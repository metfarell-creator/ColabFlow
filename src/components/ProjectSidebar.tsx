import React, { useState, useRef } from 'react';
import { Plus, Terminal, Trash2, Layout, Search, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
  onImportProjects: (projects: Project[]) => void;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  onImportProjects
}) => {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    a.download = `colabflow_all_projects_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportProject = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) return;

    const data = JSON.stringify(selectedProject, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const safeName = selectedProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeName}_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImportProjects(imported);
        }
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-64 border-r border-app-fg/20 flex flex-col bg-app-bg transition-colors duration-300">
      <div className="p-6 border-b border-app-fg/20 flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <Terminal size={20} />
          <h1 className="font-serif italic text-xl tracking-tight">ColabFlow</h1>
        </div>
        <button 
          onClick={onAddProject}
          className="p-1 hover:bg-app-fg hover:text-app-bg transition-colors rounded-sm"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-app-fg/10">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук..."
            className="w-full bg-app-fg/5 border border-transparent focus:border-app-fg px-9 py-2 text-xs outline-none transition-all placeholder:opacity-30"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 space-y-1">
          <div className="text-[10px] uppercase tracking-widest font-bold opacity-30 mb-4 px-2">Проєкти</div>
          <AnimatePresence mode="popLayout">
            {filteredProjects.map(project => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`group flex items-center justify-between p-2 cursor-pointer transition-colors ${
                  selectedProjectId === project.id 
                    ? 'bg-app-fg text-app-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]' 
                    : 'hover:bg-app-fg/5'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Layout size={14} className="shrink-0" />
                  <span className="text-xs font-medium truncate">{project.name}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id);
                  }}
                  className={`opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1 ${
                      selectedProjectId === project.id ? 'hover:text-red-400' : 'hover:text-red-600'
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredProjects.length === 0 && (
            <div className="text-[10px] text-center mt-8 opacity-30 italic px-4">
              {search ? 'Нічого не знайдено' : 'Немає активних проєктів'}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-app-fg/20 grid grid-cols-2 gap-2">
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all"
          title="Експортувати всі проєкти"
        >
          <Download size={12} />
          Експорт Всього
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all"
        >
          <Upload size={12} />
          Імпорт
        </button>
        <button 
          onClick={handleExportProject}
          disabled={!selectedProjectId}
          className="col-span-2 flex items-center justify-center gap-2 py-2 text-[10px] uppercase font-bold border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Експортувати вибраний проєкт"
        >
          <Download size={12} />
          Експорт Проєкту
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImport} 
          accept=".json" 
          className="hidden" 
        />
      </div>
    </div>
  );
};
