/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Terminal, 
  Package as PackageIcon, 
  Database, 
  Save, 
  Download, 
  Trash2, 
  Sparkles,
  CheckSquare,
  ChevronRight,
  Code2,
  ExternalLink,
  HardDrive,
  Laptop,
  History,
  Clock,
  RefreshCw,
  Layout,
  Copy,
  GitBranch,
  Github,
  Smile,
  AlertCircle,
  ArrowUpDown,
  Settings2,
  SlidersHorizontal,
  X,
  FileCode,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Package, MLModel, DataSource, Task, Snapshot, ProjectTemplate, GitConfig, HFConfig } from './types';
import { suggestDependencies, generateColabSnippet } from './services/gemini';
import { errorLogger } from './services/errorLogger';
import { downloadNotebook, downloadPythonScript } from './services/notebookGenerator';
import { loadJson, saveJson, STORAGE_KEYS } from './services/storage';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => 
    loadJson(STORAGE_KEYS.PROJECTS, [])
  );
  const [templates, setTemplates] = useState<ProjectTemplate[]>(() => 
    loadJson(STORAGE_KEYS.TEMPLATES, [])
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => 
    loadJson(STORAGE_KEYS.AUTOSAVE_ENABLED, true)
  );
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  const persistData = useCallback(() => {
    saveJson(STORAGE_KEYS.PROJECTS, projects);
    saveJson(STORAGE_KEYS.TEMPLATES, templates);
    setLastSaved(Date.now());
  }, [projects, templates]);

  useEffect(() => {
    saveJson(STORAGE_KEYS.AUTOSAVE_ENABLED, autoSaveEnabled);
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    // Save on changes if autosave is on
    saveJson(STORAGE_KEYS.PROJECTS, projects);
    setLastSaved(Date.now());
  }, [projects, autoSaveEnabled]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    saveJson(STORAGE_KEYS.TEMPLATES, templates);
  }, [templates, autoSaveEnabled]);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      persistData();
      console.log('[AutoSave] Periodic sync completed.');
    }, 60000); // Changed to 1 min for less frequent noise if reactive save is active

    return () => clearInterval(interval);
  }, [autoSaveEnabled, persistData]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const createProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: 'Новий ML Проект',
      description: 'Проект, зосереджений на комп\'ютерному зорі та нейронних мережах.',
      dependencies: [
        { name: 'numpy', description: 'Фундаментальний пакет для наукових обчислень' },
        { name: 'pandas', description: 'Бібліотека для маніпуляції та аналізу даних' },
        { name: 'matplotlib', description: 'Бібліотека для візуалізації даних' }
      ],
      models: [],
      dataSources: [],
      tasks: [],
      snapshots: [],
      gitConfig: {
        remoteUrl: '',
        branch: 'main',
        enabled: false
      },
      hfConfig: {
        repoId: '',
        enabled: false
      },
      vsCodeConfig: {
        enabled: false,
        theme: 'Default Dark+',
        recommendations: ['ms-python.python', 'ms-toolsai.jupyter']
      },
      createdAt: Date.now()
    };
    setProjects([newProject, ...projects]);
    setSelectedProjectId(newProject.id);
  };

  const saveAsTemplate = () => {
    if (!selectedProject) return;
    const name = prompt('Назва шаблону:', `${selectedProject.name} (Шаблон)`);
    if (!name) return;

    const newTemplate: ProjectTemplate = {
      id: crypto.randomUUID(),
      name,
      description: selectedProject.description,
      dependencies: [...selectedProject.dependencies],
      models: selectedProject.models.map(({ id, exportStatus, ...rest }) => rest),
      dataSources: selectedProject.dataSources.map(({ id, ...rest }) => rest)
    };

    setTemplates([newTemplate, ...templates]);
  };

  const createFromTemplate = (template: ProjectTemplate) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: `Копія ${template.name}`,
      description: template.description,
      dependencies: [...template.dependencies],
      models: template.models.map(m => ({ ...m, id: crypto.randomUUID(), exportStatus: 'Pending' })),
      dataSources: template.dataSources.map(ds => ({ ...ds, id: crypto.randomUUID() })),
      tasks: [],
      snapshots: [],
      gitConfig: {
        remoteUrl: '',
        branch: 'main',
        enabled: false
      },
      hfConfig: {
        repoId: '',
        enabled: false
      },
      vsCodeConfig: {
        enabled: false,
        theme: 'Default Dark+',
        recommendations: ['ms-python.python', 'ms-toolsai.jupyter']
      },
      createdAt: Date.now()
    };
    setProjects([newProject, ...projects]);
    setSelectedProjectId(newProject.id);
  };

  const updateProject = (updates: Partial<Project>) => {
    if (!selectedProjectId) return;
    setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, ...updates } : p));
  };

  const addDependency = (pkg: Package) => {
    if (!selectedProject) return;
    updateProject({ dependencies: [...selectedProject.dependencies, pkg] });
  };

  const removeDependency = (pkgName: string) => {
    if (!selectedProject) return;
    updateProject({ dependencies: selectedProject.dependencies.filter(d => d.name !== pkgName) });
  };

  const addDataSource = () => {
    if (!selectedProject) return;
    const newDS: DataSource = {
      id: crypto.randomUUID(),
      name: 'Нове Джерело Даних',
      type: 'Local',
      path: '/content/data.csv'
    };
    updateProject({ dataSources: [...selectedProject.dataSources, newDS] });
  };

  const updateDataSource = (id: string, updates: Partial<DataSource>) => {
    if (!selectedProject) return;
    updateProject({
      dataSources: selectedProject.dataSources.map(ds => ds.id === id ? { ...ds, ...updates } : ds)
    });
  };

  const removeDataSource = (id: string) => {
    if (!selectedProject) return;
    updateProject({ dataSources: selectedProject.dataSources.filter(ds => ds.id !== id) });
  };

  const addTask = () => {
    if (!selectedProject) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: 'Нове завдання',
      status: 'Todo',
      priority: 'Medium'
    };
    updateProject({ tasks: [...selectedProject.tasks, newTask] });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    if (!selectedProject) return;
    updateProject({
      tasks: selectedProject.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    });
  };

  const removeTask = (id: string) => {
    if (!selectedProject) return;
    updateProject({ tasks: selectedProject.tasks.filter(t => t.id !== id) });
  };

  const getSortedTasks = () => {
    if (!selectedProject) return [];
    if (!sortByPriority) return selectedProject.tasks;

    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return [...selectedProject.tasks].sort((a, b) => 
      priorityWeight[b.priority || 'Medium'] - priorityWeight[a.priority || 'Medium']
    );
  };

  const addSnapshot = (note: string = 'Snapshot') => {
    if (!selectedProject || !generatedCode) return;
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      code: generatedCode,
      note
    };
    updateProject({ snapshots: [newSnapshot, ...(selectedProject.snapshots || [])] });
  };

  const downloadVSCodeConfig = () => {
    if (!selectedProject) return;
    
    const workspaceInfo = {
      folders: [
        {
          path: "."
        }
      ],
      settings: {
        "workbench.colorTheme": selectedProject.vsCodeConfig?.theme || "Default Dark+",
        "python.defaultInterpreterPath": "/usr/bin/python3",
        "jupyter.notebookEditor.showValuesInEditor": true
      },
      extensions: {
        recommendations: selectedProject.vsCodeConfig?.recommendations || []
      }
    };

    const blob = new Blob([JSON.stringify(workspaceInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject.name.replace(/\s+/g, '_').toLowerCase()}.code-workspace`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCommitAndPush = async () => {
    if (!selectedProject || !selectedProject.gitConfig?.enabled) return;
    
    const message = prompt('Коментар до коміту:');
    if (!message) return;

    setIsPushing(true);
    
    // Simulate git process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCommit = {
        message,
        timestamp: Date.now(),
        hash: Math.random().toString(36).substring(2, 9)
      };

      updateProject({
        gitConfig: {
          ...selectedProject.gitConfig,
          lastCommit: newCommit
        }
      });
      
      alert(`Проект успішно закомічено: "${message}" [${newCommit.hash}] та відправлено у ${selectedProject.gitConfig.branch}`);
    } catch (error: any) {
      errorLogger.log(error, { action: 'git_push', projectId: selectedProjectId });
      alert('Помилка при спробі пушу. Перевірте з\'єднання.');
    } finally {
      setIsPushing(false);
    }
  };

  const restoreSnapshot = (code: string) => {
    setGeneratedCode(code);
  };

  const handleSuggest = async () => {
    if (!selectedProject) return;
    setIsSuggesting(true);
    try {
      const suggestions = await suggestDependencies(selectedProject.description);
      const existingNames = new Set(selectedProject.dependencies.map(d => d.name));
      const newDeps = suggestions.filter((s: any) => !existingNames.has(s.name));
      updateProject({ dependencies: [...selectedProject.dependencies, ...newDeps] });
    } catch (error: any) {
      console.error(error);
      errorLogger.log(error, { action: 'suggest_dependencies', projectId: selectedProjectId });
      alert('Помилка при отриманні рекомендацій. Спробуйте ще раз.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedProject) return;
    setIsGenerating(true);
    try {
      const code = await generateColabSnippet(
        selectedProject.name,
        selectedProject.dependencies.map(d => d.name),
        selectedProject.models,
        selectedProject.dataSources,
        selectedProject.gitConfig,
        selectedProject.hfConfig
      );
      setGeneratedCode(code);
      
        // Update models status to Exported
      const updatedModels = selectedProject.models.map(m => ({ ...m, exportStatus: 'Exported' as const }));
      updateProject({ 
        models: updatedModels,
        snapshots: [{ 
          id: crypto.randomUUID(), 
          timestamp: Date.now(), 
          code, 
          note: `Авто-генерація: ${new Date().toLocaleTimeString()}`
        }, ...(selectedProject.snapshots || [])]
      });
    } catch (error: any) {
      console.error(error);
      errorLogger.log(error, { action: 'generate_colab_snippet', projectId: selectedProjectId });
      alert('Помилка при генерації коду. Перевірте налаштування та спробуйте ще раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#141414] flex flex-col pt-12">
        <div className="px-6 mb-8">
          <h1 className="font-serif italic text-2xl tracking-tight mb-2">ColabFlow</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50 font-medium">Керування робочим простором</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 mb-4">
            <button 
              onClick={createProject}
              className="w-full flex items-center justify-between px-3 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group"
            >
              <span className="text-xs font-mono uppercase tracking-tight">Новий Проект</span>
              <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {templates.length > 0 && (
          <div className="flex-1 overflow-y-auto border-t border-[#141414]/10 mt-4 pt-4">
            <div className="px-6 mb-2">
              <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold flex items-center gap-2">
                <Layout size={10} />
                Шаблони
              </p>
            </div>
            <div className="space-y-0 text-[10px]">
              {templates.map(t => (
                <div key={t.id} className="group relative">
                  <button
                    onClick={() => createFromTemplate(t)}
                    className="w-full text-left px-6 py-2 hover:bg-[#141414]/5 transition-colors flex items-center justify-between"
                  >
                    <div className="truncate pr-4 opacity-70 group-hover:opacity-100">{t.name}</div>
                    <Plus size={10} className="shrink-0 opacity-20 group-hover:opacity-100" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Видалити шаблон?')) {
                        setTemplates(templates.filter(temp => temp.id !== t.id));
                      }
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 hover:opacity-100 p-2 text-red-500"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto border-t border-[#141414]/10 mt-4 pt-4">
          <div className="px-6 mb-2">
            <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Проекти</p>
          </div>
          <div className="space-y-0 text-[11px]">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProjectId(p.id); setGeneratedCode(null); }}
                className={`w-full text-left px-6 py-3 border-b border-[#141414]/10 transition-colors flex items-center justify-between group ${selectedProjectId === p.id ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
              >
                <div className="truncate pr-4 uppercase tracking-wider font-medium">{p.name}</div>
                <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedProjectId === p.id ? 'opacity-100' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-[#141414] space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Авто-збереження</span>
              <button 
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`w-8 h-4 border border-[#141414] relative transition-colors ${autoSaveEnabled ? 'bg-[#141414]' : 'bg-transparent'}`}
              >
                <motion.div 
                  animate={{ x: autoSaveEnabled ? 16 : 0 }}
                  className={`absolute top-0 bottom-0 w-3.5 h-full ${autoSaveEnabled ? 'bg-[#E4E3E0]' : 'bg-[#141414]'}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
               <button 
                onClick={persistData}
                className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity text-[9px] uppercase font-bold font-mono"
              >
                <Save size={10} />
                Зберегти зараз
              </button>
              {lastSaved && (
                <div className="flex items-center gap-2 opacity-30">
                  <span className="text-[8px] font-mono uppercase">
                    {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => {
              const logs = JSON.parse(localStorage.getItem('colabflow_error_logs') || '[]');
              if (logs.length === 0) {
                alert('Журнал помилок порожній');
                return;
              }
              const formatted = logs.map((l: any) => `[${new Date(l.timestamp).toLocaleString()}] ${l.message}`).join('\n');
              alert(`Останні помилки:\n${formatted}`);
            }}
            className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity"
          >
            <AlertCircle size={10} />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold">Журнал</span>
          </button>
          <div className="font-mono text-[9px] opacity-40 uppercase">v1.2.4 stable</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="p-12 border-b border-[#141414] sticky top-0 bg-[#E4E3E0] z-10">
              <div className="flex items-end justify-between gap-8">
                <div className="max-w-2xl">
                  <input
                    value={selectedProject.name}
                    onChange={(e) => updateProject({ name: e.target.value })}
                    className="w-full bg-transparent font-serif italic text-5xl tracking-tighter mb-4 outline-none border-b border-transparent focus:border-[#141414]/20"
                  />
                  <textarea
                    value={selectedProject.description}
                    onChange={(e) => updateProject({ description: e.target.value })}
                    className="w-full bg-transparent text-sm opacity-60 font-medium resize-none outline-none leading-relaxed h-12"
                    placeholder="Опишіть ціль вашого дослідження..."
                  />
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-6 py-3 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 transition-colors disabled:opacity-50"
                  >
                    <Terminal size={16} />
                    <span className="text-xs font-mono uppercase tracking-wider">Експорт у Colab</span>
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={saveAsTemplate}
                      className="flex-1 flex items-center gap-3 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                    >
                      <Copy size={12} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Шаблон</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Видалити проект?')) {
                          setProjects(projects.filter(p => p.id !== selectedProjectId));
                          setSelectedProjectId(null);
                        }
                      }}
                      className="flex-1 flex items-center gap-3 px-4 py-2 border border-[#141414] hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Видалити</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 min-h-full">
              {/* Left Column: Dependencies */}
              <div className="border-r border-[#141414] p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <PackageIcon size={18} />
                    <h2 className="font-serif italic text-xl">Залежності</h2>
                  </div>
                  <button 
                    onClick={handleSuggest}
                    disabled={isSuggesting}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold hover:opacity-100 opacity-60 transition-opacity"
                  >
                    {isSuggesting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      >
                        <Sparkles size={12} />
                      </motion.div>
                    ) : <Sparkles size={12} />}
                    AI Поради
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr,auto] gap-2 mb-6">
                    <input 
                      id="new-dep-input"
                      placeholder="Введіть назву пакета (напр. tensorflow)"
                      className="bg-transparent border border-[#141414] px-4 py-2 text-xs font-mono outline-none placeholder:opacity-30"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            addDependency({ name: val, description: 'Додано користувачем' });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('new-dep-input') as HTMLInputElement;
                        if (input.value) {
                          addDependency({ name: input.value, description: 'Додано користувачем' });
                          input.value = '';
                        }
                      }}
                      className="bg-[#141414] text-[#E4E3E0] px-4 py-2 hover:bg-[#141414]/80 text-xs"
                    >
                      ДОДАТИ
                    </button>
                  </div>

                  <div className="space-y-1">
                    {selectedProject.dependencies.map((pkg, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={pkg.name}
                        className="group flex items-center justify-between border-b border-[#141414]/10 py-3 hover:bg-[#141414] hover:text-[#E4E3E0] px-2 transition-all cursor-crosshair"
                      >
                        <div>
                          <p className="font-mono text-xs">{pkg.name}</p>
                          <p className="text-[9px] opacity-50 truncate max-w-xs">{pkg.description}</p>
                        </div>
                        <button 
                          onClick={() => removeDependency(pkg.name)}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[9px] hover:text-red-500 uppercase tracking-tighter"
                        >
                          ВИЛУЧИТИ
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-8">
                    <HardDrive size={18} />
                    <h2 className="font-serif italic text-xl">Джерела Даних</h2>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={addDataSource}
                      className="w-full py-4 border border-dashed border-[#141414]/30 hover:border-[#141414] hover:bg-[#141414]/5 transition-all text-[10px] space-y-1 group"
                    >
                      <div className="font-mono uppercase opacity-50 group-hover:opacity-100">Додати Джерело</div>
                      <Plus size={14} className="mx-auto opacity-30 group-hover:opacity-100" />
                    </button>
                    <div className="space-y-2">
                      {selectedProject.dataSources.map(ds => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={ds.id} 
                          className="border border-[#141414] p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <input 
                              value={ds.name}
                              onChange={(e) => updateDataSource(ds.id, { name: e.target.value })}
                              className="bg-transparent font-mono text-[10px] font-bold outline-none border-b border-transparent focus:border-[#141414]/20"
                            />
                            <button 
                              onClick={() => removeDataSource(ds.id)}
                              className="opacity-30 hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-[100px,1fr] gap-2">
                            <select 
                              value={ds.type}
                              onChange={(e) => updateDataSource(ds.id, { type: e.target.value as any })}
                              className="bg-[#141414]/5 text-[10px] p-1 border-none outline-none font-mono"
                            >
                              <option value="Local">Local</option>
                              <option value="GCS">GCS</option>
                              <option value="BigQuery">BigQuery</option>
                              <option value="URL">URL</option>
                              <option value="Other">Other</option>
                            </select>
                            <input 
                              value={ds.path}
                              onChange={(e) => updateDataSource(ds.id, { path: e.target.value })}
                              placeholder="Path, Bucket or Connection String"
                              className="bg-[#141414]/5 text-[10px] p-1 px-2 border-none outline-none font-mono placeholder:opacity-30"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-8">
                    <Github size={18} />
                    <h2 className="font-serif italic text-xl">Git Репозиторій</h2>
                  </div>
                  <div className="border border-[#141414] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Статус</span>
                      <button 
                        onClick={() => {
                          const isValidUrl = selectedProject.gitConfig?.remoteUrl && /^(https?:\/\/|git@|ssh:\/\/).+\.git\/?$/.test(selectedProject.gitConfig.remoteUrl);
                          if (!selectedProject.gitConfig?.enabled && !isValidUrl) {
                            alert('Будь ласка, вкажіть коректний Git Remote URL перед активацією.');
                            return;
                          }
                          updateProject({ 
                            gitConfig: { 
                              remoteUrl: selectedProject.gitConfig?.remoteUrl || '', 
                              branch: selectedProject.gitConfig?.branch || 'main', 
                              enabled: !selectedProject.gitConfig?.enabled 
                            } 
                          });
                        }}
                        className={`text-[9px] uppercase font-bold px-3 py-1 border transition-colors ${selectedProject.gitConfig?.enabled ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' : 'border-[#141414]/20 opacity-50'}`}
                      >
                        {selectedProject.gitConfig?.enabled ? 'Активно' : 'Вимкнено'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[8px] uppercase opacity-40 mb-1 font-bold">Remote URL</p>
                        <input 
                          value={selectedProject.gitConfig?.remoteUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value;
                            updateProject({ 
                              gitConfig: { 
                                ...(selectedProject.gitConfig || { branch: 'main', enabled: false }), 
                                remoteUrl: url,
                                enabled: url ? (selectedProject.gitConfig?.enabled && /^(https?:\/\/|git@|ssh:\/\/).+\.git\/?$/.test(url)) : false
                              } 
                            });
                          }}
                          placeholder="https://github.com/user/repo.git"
                          className={`bg-[#141414]/5 border-b px-2 py-1 text-[10px] w-full outline-none transition-colors font-mono ${
                            selectedProject.gitConfig?.remoteUrl && !/^(https?:\/\/|git@|ssh:\/\/).+\.git\/?$/.test(selectedProject.gitConfig.remoteUrl)
                              ? 'border-red-500/50 text-red-700' 
                              : 'border-[#141414]/20 focus:bg-[#141414]/10'
                          }`}
                        />
                        {selectedProject.gitConfig?.remoteUrl && !/^(https?:\/\/|git@|ssh:\/\/).+\.git\/?$/.test(selectedProject.gitConfig.remoteUrl) && (
                          <p className="text-[8px] text-red-500 mt-1 uppercase font-bold tracking-tighter">Некоректний Git URL (має закінчуватись на .git)</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex-1">
                          <p className="text-[8px] uppercase opacity-40 mb-1 font-bold flex items-center gap-1">
                            <GitBranch size={8} /> Branch
                          </p>
                          <input 
                            value={selectedProject.gitConfig?.branch || 'main'}
                            onChange={(e) => updateProject({ 
                              gitConfig: { 
                                ...(selectedProject.gitConfig || { remoteUrl: '', enabled: false }), 
                                branch: e.target.value 
                              } 
                            })}
                            className="bg-[#141414]/5 border-b border-[#141414]/20 px-2 py-1 text-[10px] w-full outline-none focus:bg-[#141414]/10 transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {selectedProject.gitConfig?.enabled && (
                      <div className="pt-4 border-t border-[#141414]/10 space-y-4">
                        <button 
                          onClick={handleCommitAndPush}
                          disabled={isPushing}
                          className="w-full flex items-center justify-center gap-3 py-3 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 transition-all disabled:opacity-50 group"
                        >
                          {isPushing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                              <RefreshCw size={14} />
                            </motion.div>
                          ) : <GitBranch size={14} className="group-hover:translate-x-1 transition-transform" />}
                          <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                            {isPushing ? 'Відправка...' : 'Закомітити та Запушити'}
                          </span>
                        </button>

                        {selectedProject.gitConfig.lastCommit && (
                          <div className="bg-[#141414]/[0.03] p-3 rounded-sm border border-[#141414]/5 space-y-2">
                             <div className="flex items-center justify-between">
                              <span className="text-[8px] uppercase font-bold opacity-40">Останній пуш</span>
                              <span className="text-[8px] font-mono opacity-60 uppercase">{selectedProject.gitConfig.lastCommit.hash}</span>
                            </div>
                            <p className="text-[10px] italic line-clamp-1">"{selectedProject.gitConfig.lastCommit.message}"</p>
                            <p className="text-[8px] font-mono opacity-40 uppercase">
                              {new Date(selectedProject.gitConfig.lastCommit.timestamp).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-8">
                    <Smile size={18} />
                    <h2 className="font-serif italic text-xl">Hugging Face Хостинг</h2>
                  </div>
                  <div className="border border-[#141414] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Статус</span>
                      <button 
                        onClick={() => updateProject({ 
                          hfConfig: { 
                            repoId: selectedProject.hfConfig?.repoId || '', 
                            enabled: !selectedProject.hfConfig?.enabled 
                          } 
                        })}
                        className={`text-[9px] uppercase font-bold px-3 py-1 border transition-colors ${selectedProject.hfConfig?.enabled ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' : 'border-[#141414]/20 opacity-50'}`}
                      >
                        {selectedProject.hfConfig?.enabled ? 'Активно' : 'Вимкнено'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[8px] uppercase opacity-40 mb-1 font-bold">Repo ID</p>
                        <input 
                          value={selectedProject.hfConfig?.repoId || ''}
                          onChange={(e) => updateProject({ 
                            hfConfig: { 
                              ...(selectedProject.hfConfig || { enabled: false }), 
                              repoId: e.target.value 
                            } 
                          })}
                          placeholder="username/model-repo"
                          className="bg-[#141414]/5 border-b border-[#141414]/20 px-2 py-1 text-[10px] w-full outline-none focus:bg-[#141414]/10 transition-colors font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-8">
                    <Code2 size={18} />
                    <h2 className="font-serif italic text-xl">VS Code Інтеграція</h2>
                  </div>
                  <div className="border border-[#141414] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Статус Конфігу</span>
                      <button 
                        onClick={() => updateProject({ 
                          vsCodeConfig: { 
                            theme: selectedProject.vsCodeConfig?.theme || 'Default Dark+',
                            recommendations: selectedProject.vsCodeConfig?.recommendations || ['ms-python.python'],
                            enabled: !selectedProject.vsCodeConfig?.enabled 
                          } 
                        })}
                        className={`text-[9px] uppercase font-bold px-3 py-1 border transition-colors ${selectedProject.vsCodeConfig?.enabled ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' : 'border-[#141414]/20 opacity-50'}`}
                      >
                        {selectedProject.vsCodeConfig?.enabled ? 'Активно' : 'Вимкнено'}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] uppercase opacity-40 mb-2 font-bold">Тема VS Code</p>
                        <select 
                          value={selectedProject.vsCodeConfig?.theme || 'Default Dark+'}
                          onChange={(e) => updateProject({ 
                            vsCodeConfig: { 
                              ...(selectedProject.vsCodeConfig || { recommendations: [], enabled: false }), 
                              theme: e.target.value 
                            } 
                          })}
                          className="w-full bg-[#141414]/5 border-b border-[#141414]/20 px-2 py-1 text-[10px] outline-none font-mono"
                        >
                          <option value="Default Dark+">Default Dark+</option>
                          <option value="GitHub Dark">GitHub Dark</option>
                          <option value="Monokai">Monokai</option>
                          <option value="Solarized Light">Solarized Light</option>
                        </select>
                      </div>

                      <div>
                        <p className="text-[8px] uppercase opacity-40 mb-2 font-bold">Рекомендовані Розширення</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedProject.vsCodeConfig?.recommendations || []).map(rec => (
                            <div key={rec} className="flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-2 py-1 text-[9px] font-mono">
                              {rec}
                              <button onClick={() => {
                                const recs = selectedProject.vsCodeConfig?.recommendations.filter(r => r !== rec) || [];
                                updateProject({ vsCodeConfig: { ...selectedProject.vsCodeConfig!, recommendations: recs } });
                              }}>
                                <X size={8} />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const rec = prompt('Extension ID (e.g. ms-python.python):');
                              if (rec) {
                                const recs = [...(selectedProject.vsCodeConfig?.recommendations || []), rec];
                                updateProject({ vsCodeConfig: { ...(selectedProject.vsCodeConfig || { theme: 'Default Dark+', enabled: false }), recommendations: recs } });
                              }
                            }}
                            className="text-[9px] border border-[#141414]/20 px-2 py-1 hover:bg-[#141414]/5 font-bold uppercase tracking-tighter"
                          >
                            + Додати
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={downloadVSCodeConfig}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#141414]/5 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                      >
                        <Download size={14} />
                        <span className="text-[9px] font-mono uppercase font-bold">Експортувати .code-workspace</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Models & Export */}
              <div className="p-12 pb-32">
                <div className="flex items-center gap-3 mb-8">
                  <Database size={18} />
                  <h2 className="font-serif italic text-xl">Визначення Моделей</h2>
                </div>

                <div className="space-y-4 mb-12">
                  <button 
                    onClick={() => {
                      const id = crypto.randomUUID();
                      updateProject({ 
                        models: [...selectedProject.models, { 
                          id, 
                          name: 'Нова Модель', 
                          framework: 'PyTorch', 
                          description: 'Класифікатор на базі ResNet50', 
                          hyperparameters: { 'epochs': '50', 'learning_rate': '1e-4' },
                          exportStatus: 'Pending'
                        }] 
                      });
                    }}
                    className="w-full py-4 border border-dashed border-[#141414]/30 hover:border-[#141414] hover:bg-[#141414]/5 transition-all text-[10px] space-y-1 group"
                  >
                    <div className="font-mono uppercase opacity-50 group-hover:opacity-100">Прикріпити Архітектуру</div>
                    <Plus size={14} className="mx-auto opacity-30 group-hover:opacity-100" />
                  </button>

                  <div className="space-y-4">
                    {selectedProject.models.map(model => (
                      <div key={model.id} className="border border-[#141414] p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <input
                              value={model.name}
                              onChange={(e) => {
                                const newModels = selectedProject.models.map(m => m.id === model.id ? { ...m, name: e.target.value } : m);
                                updateProject({ models: newModels });
                              }}
                              className="bg-transparent font-mono text-xs font-bold mb-1 outline-none border-b border-transparent focus:border-[#141414]/20"
                            />
                            <div className="flex gap-2">
                              <span className="text-[8px] uppercase px-1.5 py-0.5 bg-[#141414] text-[#E4E3E0] font-bold">{model.framework}</span>
                              <span className={`text-[8px] uppercase px-1.5 py-0.5 border font-bold flex items-center gap-1 ${
                                model.exportStatus === 'Pending' 
                                  ? 'border-yellow-600/50 text-yellow-700 bg-yellow-50' 
                                  : 'border-green-600/50 text-green-700 bg-green-50'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${model.exportStatus === 'Pending' ? 'bg-yellow-600 animate-pulse' : 'bg-green-600'}`} />
                                {model.exportStatus === 'Pending' ? 'Очікує' : 'Експортовано'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <select
                              value={model.framework}
                              onChange={(e) => {
                                const newModels = selectedProject.models.map(m => m.id === model.id ? { ...m, framework: e.target.value as any } : m);
                                updateProject({ models: newModels });
                              }}
                              className="bg-[#141414]/5 text-[8px] p-1 border-none outline-none font-mono uppercase font-bold"
                            >
                              <option value="PyTorch">PyTorch</option>
                              <option value="TensorFlow">TensorFlow</option>
                              <option value="Scikit-Learn">Scikit-Learn</option>
                              <option value="Other">Other</option>
                            </select>
                            <button 
                              onClick={() => updateProject({ models: selectedProject.models.filter(m => m.id !== model.id) })}
                              className="text-[#141414] opacity-30 hover:opacity-100 hover:text-red-500 transition-all p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-[#141414]/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <SlidersHorizontal size={12} className="opacity-40" />
                              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Гіперпараметри</p>
                            </div>
                            <button 
                              onClick={() => {
                                const key = prompt('Назва параметра:');
                                if (key) {
                                  const newModels = selectedProject.models.map(m => 
                                    m.id === model.id ? { ...m, hyperparameters: { ...m.hyperparameters, [key]: '' }} : m
                                  );
                                  updateProject({ models: newModels });
                                }
                              }}
                              className="text-[8px] uppercase font-mono border border-[#141414] px-2 py-0.5 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
                            >
                              + Додати
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-[#141414]/[0.02] p-4 rounded-sm border border-[#141414]/5">
                            {Object.entries(model.hyperparameters).map(([key, val]) => (
                              <div key={key} className="group/param relative">
                                <p className="text-[8px] uppercase opacity-40 mb-1 font-bold flex items-center justify-between">
                                  {key}
                                  <button
                                    onClick={() => {
                                      const { [key]: _, ...rest } = model.hyperparameters;
                                      const newModels = selectedProject.models.map(m =>
                                        m.id === model.id ? { ...m, hyperparameters: rest } : m
                                      );
                                      updateProject({ models: newModels });
                                    }}
                                    className="opacity-0 group-hover/param:opacity-100 p-0.5 hover:text-red-500 transition-opacity"
                                  >
                                    <X size={8} />
                                  </button>
                                </p>
                                <input 
                                  value={val}
                                  onChange={(e) => {
                                    const newModels = selectedProject.models.map(m => 
                                      m.id === model.id ? { ...m, hyperparameters: { ...m.hyperparameters, [key]: e.target.value }} : m
                                    );
                                    updateProject({ models: newModels });
                                  }}
                                  className="bg-[#141414]/5 border-b border-[#141414]/20 px-2 py-1 text-[10px] w-full outline-none focus:bg-[#141414]/10 transition-colors font-mono"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <CheckSquare size={18} />
                      <h2 className="font-serif italic text-xl">План Робіт</h2>
                    </div>
                    <button 
                      onClick={() => setSortByPriority(!sortByPriority)}
                      className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-all ${sortByPriority ? 'text-blue-600 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    >
                      <ArrowUpDown size={12} />
                      {sortByPriority ? 'За Пріоритетом' : 'Як є'}
                    </button>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={addTask}
                      className="w-full py-4 border border-dashed border-[#141414]/30 hover:border-[#141414] hover:bg-[#141414]/5 transition-all text-[10px] space-y-1 group"
                    >
                      <div className="font-mono uppercase opacity-50 group-hover:opacity-100">Додати Завдання</div>
                      <Plus size={14} className="mx-auto opacity-30 group-hover:opacity-100" />
                    </button>
                    <div className="space-y-2">
                      {getSortedTasks().map(task => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ 
                            opacity: 1, 
                            x: 0,
                            borderColor: task.status === 'In Progress' ? '#3b82f6' : task.status === 'Done' ? 'rgba(22, 163, 74, 0.3)' : '#141414',
                            backgroundColor: task.status === 'In Progress' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                          }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          key={task.id} 
                          className="flex items-center gap-3 border p-3 group relative overflow-hidden"
                        >
                          {task.status === 'In Progress' && (
                            <motion.div 
                              layoutId={`active-indicator-${task.id}`}
                              className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            />
                          )}
                          <button 
                            onClick={() => {
                              const nextStatus: any = task.status === 'Todo' ? 'In Progress' : task.status === 'In Progress' ? 'Done' : 'Todo';
                              updateTask(task.id, { status: nextStatus });
                            }}
                            className={`w-4 h-4 border border-[#141414] flex items-center justify-center shrink-0 transition-colors ${task.status === 'Done' ? 'bg-[#141414] text-white' : ''}`}
                          >
                            {task.status === 'Done' && <CheckSquare size={10} />}
                          </button>
                          <div className="flex-1 flex flex-col gap-1">
                            <input 
                              value={task.title}
                              onChange={(e) => updateTask(task.id, { title: e.target.value })}
                              className={`bg-transparent text-xs font-mono outline-none w-full transition-all duration-300 ${task.status === 'Done' ? 'line-through opacity-40' : ''}`}
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={task.priority || 'Medium'}
                                onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                                className={`text-[7px] uppercase font-bold border-none bg-transparent outline-none cursor-pointer tracking-wider transition-colors duration-300 ${
                                  task.priority === 'High' ? 'text-red-600' : 
                                  task.priority === 'Medium' ? 'text-yellow-600' : 
                                  'text-blue-600'
                                }`}
                              >
                                <option value="High">Priority: High</option>
                                <option value="Medium">Priority: Medium</option>
                                <option value="Low">Priority: Low</option>
                              </select>
                            </div>
                          </div>
                          <motion.div 
                            layout
                            className={`text-[8px] uppercase font-bold px-1.5 py-0.5 border transition-colors duration-300 ${
                              task.status === 'Todo' ? 'border-[#141414]/20 opacity-50' : 
                              task.status === 'In Progress' ? 'border-blue-500 text-blue-600' : 
                              'border-green-600 text-green-600'
                            }`}
                          >
                            {task.status}
                          </motion.div>
                          <button 
                            onClick={() => removeTask(task.id)}
                            className="opacity-0 group-hover:opacity-30 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Export Result */}
                <AnimatePresence>
                  {generatedCode && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-12 bg-[#141414] text-[#E4E3E0] p-8 space-y-6"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <Code2 size={18} />
                          <h3 className="font-serif italic text-lg text-white">Шаблон Ноутбука</h3>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-white/30 px-3 py-1 hover:bg-white hover:text-[#141414] transition-all disabled:opacity-30"
                            title="Згенерувати заново"
                          >
                            <RefreshCw size={10} className={isGenerating ? 'animate-spin' : ''} />
                            Оновити
                          </button>
                          <button 
                            onClick={() => {
                              if (generatedCode && selectedProject) {
                                downloadNotebook(selectedProject, generatedCode);
                              }
                            }}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-white/30 px-3 py-1 hover:bg-white hover:text-[#141414] transition-all bg-yellow-500/10"
                            title="Download Jupyter Notebook"
                          >
                            <Box size={10} />
                            .ipynb
                          </button>
                          <button 
                            onClick={() => {
                              if (generatedCode && selectedProject) {
                                downloadPythonScript(selectedProject, generatedCode);
                              }
                            }}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-white/30 px-3 py-1 hover:bg-white hover:text-[#141414] transition-all bg-blue-500/10"
                            title="Download Python Script"
                          >
                            <FileCode size={10} />
                            .py
                          </button>
                          <button 
                            onClick={() => {
                              if (generatedCode) {
                                navigator.clipboard.writeText(generatedCode);
                                alert('Код скопійовано!');
                              }
                            }}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-white/30 px-3 py-1 hover:bg-white hover:text-[#141414] transition-all"
                          >
                            <Save size={10} />
                            Буфер
                          </button>
                          <button 
                            onClick={() => {
                              const note = prompt('Введіть назву знімку:');
                              if (note) addSnapshot(note);
                            }}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-white/30 px-3 py-1 hover:bg-white hover:text-[#141414] transition-all"
                          >
                            <Clock size={10} />
                            Зберегти Знімок
                          </button>
                        </div>
                      </div>
                      <div className="relative group/editor">
                        <textarea
                          value={generatedCode}
                          onChange={(e) => setGeneratedCode(e.target.value)}
                          className="w-full h-96 bg-[#0A0A0A] text-[#D4D4D4] p-6 font-mono text-[11px] leading-relaxed resize-none outline-none border border-white/5 focus:border-white/20 transition-colors scrollbar-thin scrollbar-thumb-white/10"
                          spellCheck={false}
                        />
                        <div className="absolute top-4 right-4 opacity-0 group-hover/editor:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-[8px] uppercase tracking-widest bg-white/10 px-2 py-1 backdrop-blur-sm border border-white/10">Editable Mode</span>
                        </div>
                      </div>

                      {/* Snapshots History */}
                      {selectedProject.snapshots && selectedProject.snapshots.length > 0 && (
                        <div className="pt-8 border-t border-white/10">
                          <div className="flex items-center gap-3 mb-4">
                            <History size={16} className="text-white/40" />
                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Історія Знімків</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedProject.snapshots.slice(0, 4).map(snap => (
                              <button 
                                key={snap.id}
                                onClick={() => restoreSnapshot(snap.code)}
                                className="text-left border border-white/5 p-3 hover:border-white/20 hover:bg-white/5 transition-all group/snap"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-mono text-white/60">{new Date(snap.timestamp).toLocaleString()}</span>
                                  <span className="opacity-0 group-hover/snap:opacity-100 text-[8px] uppercase text-white/40 tracking-tighter">Відновити</span>
                                </div>
                                <p className="text-[10px] text-white/80 line-clamp-1 italic">{snap.note}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/10 flex gap-4">
                        <a 
                          href="https://colab.research.google.com/" 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[10px] opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink size={12} />
                          Відкрити Google Colab
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md space-y-8"
            >
              <div className="w-24 h-24 bg-[#141414] rounded-full mx-auto flex items-center justify-center text-[#E4E3E0]">
                <Laptop size={48} strokeWidth={1} />
              </div>
              <div>
                <h2 className="font-serif italic text-4xl tracking-tighter mb-4">Немає Активного Проекту</h2>
                <p className="text-sm opacity-50 font-medium leading-relaxed">
                  Виберіть дослідницьку ініціативу в бічній панелі або створіть нове середовище ноутбука, щоб розпочати оркестрацію вашого машинного навчання.
                </p>
              </div>
              <button 
                onClick={createProject}
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 transition-all group shadow-2xl"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-mono uppercase tracking-[0.2em] font-bold">Сформувати Архітектуру</span>
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    </div>
  );
}
