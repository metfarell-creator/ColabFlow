import React from 'react';
import { Github, RefreshCw, GitBranch, Smile, Code2, Download, X, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { Project, GitConfig, HFConfig, VSCodeConfig } from '../types';

interface IntegrationsPanelProps {
  project: Project;
  isPushing: boolean;
  isCloning: boolean;
  onUpdateProject: (updates: Partial<Project>) => void;
  onCommitAndPush: () => void;
  onGitClone: () => void;
  onDownloadVSCode: () => void;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  project,
  isPushing,
  isCloning,
  onUpdateProject,
  onCommitAndPush,
  onGitClone,
  onDownloadVSCode
}) => {
  return (
    <div className="space-y-12">
      {/* Version Control Integration */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <GitBranch size={18} />
          <h2 className="font-serif italic text-xl">Version Control</h2>
        </div>
        <div className="border border-app-fg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Status</span>
            <button 
              onClick={() => onUpdateProject({ 
                gitConfig: { ...project.gitConfig!, enabled: !project.gitConfig?.enabled } 
              })}
              className={`text-[9px] uppercase font-bold px-3 py-1 border transition-colors ${project.gitConfig?.enabled ? 'bg-app-fg text-app-bg border-app-fg' : 'border-app-fg/20 opacity-50'}`}
            >
              {project.gitConfig?.enabled ? 'Active' : 'Inactive'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <p className="text-[8px] uppercase opacity-40 mb-1 font-bold">Remote Repository URL</p>
                <input 
                  value={project.gitConfig?.remoteUrl || ''}
                  onChange={(e) => onUpdateProject({ gitConfig: { ...project.gitConfig!, remoteUrl: e.target.value } })}
                  placeholder="https://github.com/user/repository.git"
                  className="bg-app-fg/5 border-b border-app-fg/20 px-2 py-1 text-[10px] w-full outline-none font-mono"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[8px] uppercase opacity-40 mb-1 font-bold">Branch</p>
                <input 
                  value={project.gitConfig?.branch || ''}
                  onChange={(e) => onUpdateProject({ gitConfig: { ...project.gitConfig!, branch: e.target.value } })}
                  placeholder="main"
                  className="bg-app-fg/5 border-b border-app-fg/20 px-2 py-1 text-[10px] w-full outline-none font-mono"
                />
              </div>
            </div>

            <button 
              onClick={onGitClone}
              disabled={isCloning || !project.gitConfig?.remoteUrl}
              className="w-full flex items-center justify-center gap-2 py-3 border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all disabled:opacity-30"
            >
              <Terminal size={14} className={isCloning ? 'animate-spin' : ''} />
              <span className="text-[10px] uppercase font-bold tracking-widest">
                {isCloning ? 'Cloning Repository...' : 'Clone Repository'}
              </span>
            </button>

            {project.gitConfig?.enabled && (
              <div className="pt-6 border-t border-app-fg/10 space-y-4">
                <button 
                  onClick={onCommitAndPush}
                  disabled={isPushing}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-app-fg text-app-bg hover:bg-app-fg/90 transition-all disabled:opacity-50 group"
                >
                  {isPushing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Terminal size={14} />
                    </motion.div>
                  ) : <Github size={16} />}
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                    {isPushing ? 'Pushing Changes...' : 'Commit & Push Changes'}
                  </span>
                </button>

                {project.gitConfig?.lastCommit && (
                  <div className="bg-app-fg/[0.03] p-3 rounded-sm border border-app-fg/5 space-y-2">
                     <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase font-bold opacity-40">Last Sync</span>
                      <span className="text-[8px] font-mono opacity-60 uppercase">{project.gitConfig.lastCommit.hash}</span>
                    </div>
                    <p className="text-[10px] italic line-clamp-1">"{project.gitConfig.lastCommit.message}"</p>
                    <p className="text-[8px] font-mono opacity-40 uppercase text-right">
                      {new Date(project.gitConfig.lastCommit.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hugging Face Config */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Smile size={18} />
          <h2 className="font-serif italic text-xl">Hugging Face</h2>
        </div>
        <div className="border border-app-fg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Status</span>
            <button 
              onClick={() => onUpdateProject({ hfConfig: { ...project.hfConfig!, enabled: !project.hfConfig?.enabled } })}
              className={`text-[9px] uppercase font-bold px-3 py-1 border transition-colors ${project.hfConfig?.enabled ? 'bg-app-fg text-app-bg border-app-fg' : 'border-app-fg/20 opacity-50'}`}
            >
              {project.hfConfig?.enabled ? 'Active' : 'Inactive'}
            </button>
          </div>
          <div>
            <p className="text-[8px] uppercase opacity-40 mb-1 font-bold">Repository ID</p>
            <input 
              value={project.hfConfig?.repoId || ''}
              onChange={(e) => onUpdateProject({ hfConfig: { ...project.hfConfig!, repoId: e.target.value } })}
              placeholder="user/dataset-id"
              className="bg-app-fg/5 border-b border-app-fg/20 px-2 py-1 text-[10px] w-full outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* VS Code Config */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Code2 size={18} />
          <h2 className="font-serif italic text-xl">VS Code</h2>
        </div>
        <div className="border border-app-fg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Status</span>
            <button 
              onClick={() => onUpdateProject({ 
                vsCodeConfig: { 
                  ...(project.vsCodeConfig || { theme: 'Default Dark+', recommendations: [], enabled: false }), 
                  enabled: !project.vsCodeConfig?.enabled 
                } 
              })}
              className={`text-[9px] uppercase font-bold px-3 py-1 border transition-colors ${project.vsCodeConfig?.enabled ? 'bg-app-fg text-app-bg border-app-fg' : 'border-app-fg/20 opacity-50'}`}
            >
              {project.vsCodeConfig?.enabled ? 'Active' : 'Inactive'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[8px] uppercase opacity-40 mb-2 font-bold">Theme</p>
              <select 
                value={project.vsCodeConfig?.theme || 'Default Dark+'}
                onChange={(e) => onUpdateProject({ 
                  vsCodeConfig: { 
                    ...(project.vsCodeConfig || { recommendations: [], enabled: false }), 
                    theme: e.target.value 
                  } 
                })}
                className="w-full bg-app-fg/5 border-b border-app-fg/20 px-2 py-1 text-[10px] outline-none font-mono"
              >
                <option value="Default Dark+" className="text-[#141414]">Default Dark+</option>
                <option value="GitHub Dark" className="text-[#141414]">GitHub Dark</option>
                <option value="Monokai" className="text-[#141414]">Monokai</option>
                <option value="Solarized Light" className="text-[#141414]">Solarized Light</option>
              </select>
            </div>

            <div>
              <p className="text-[8px] uppercase opacity-40 mb-2 font-bold">Extensions</p>
              <div className="flex flex-wrap gap-2">
                {(project.vsCodeConfig?.recommendations || []).map(rec => (
                  <div key={rec} className="flex items-center gap-2 bg-app-fg text-app-bg px-2 py-1 text-[9px] font-mono">
                    {rec}
                    <button onClick={() => {
                      const recs = project.vsCodeConfig?.recommendations.filter(r => r !== rec) || [];
                      onUpdateProject({ vsCodeConfig: { ...project.vsCodeConfig!, recommendations: recs } });
                    }}>
                      <X size={8} />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const rec = prompt('Extension ID:');
                    if (rec) {
                      const recs = [...(project.vsCodeConfig?.recommendations || []), rec];
                      onUpdateProject({ vsCodeConfig: { ...(project.vsCodeConfig || { theme: 'Default Dark+', enabled: false }), recommendations: recs } });
                    }
                  }}
                  className="text-[9px] border border-app-fg/20 px-2 py-1 hover:bg-app-fg/5 font-bold uppercase tracking-tighter"
                >
                  +
                </button>
              </div>
            </div>

            <button 
              onClick={onDownloadVSCode}
              className="w-full flex items-center justify-center gap-2 py-3 bg-app-fg/5 border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all"
            >
              <Download size={14} />
              <span className="text-[9px] font-mono uppercase font-bold">Export Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
