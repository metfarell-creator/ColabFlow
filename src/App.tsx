/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  Terminal, 
  Package as PackageIcon, 
  Database, 
  Save, 
  Download, 
  Upload,
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
  Box,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { ProjectSidebar } from './components/ProjectSidebar';
import { ModelsPanel } from './components/ModelsPanel';
import { IntegrationsPanel } from './components/IntegrationsPanel';
import { TasksPanel } from './components/TasksPanel';
import { DependenciesPanel } from './components/DependenciesPanel';
import { scanCode } from './services/safetyScanner';
import { Project, Package, MLModel, DataSource, Task, Snapshot, ProjectTemplate, OutdatedPackage } from './types';
import { suggestDependencies, generateColabSnippet, checkOutdatedDependencies } from './services/gemini';
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
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [outdatedDeps, setOutdatedDeps] = useState<Record<string, OutdatedPackage[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => 
    loadJson(STORAGE_KEYS.AUTOSAVE_ENABLED, true)
  );
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const notebookInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) node.value = '';
  }, []);
  const notebookRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
    }, 30000); // 30 seconds as requested

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
      
      toast.success('Проект успішно закомічено', {
        description: `"${message}" [${newCommit.hash}] відправлено у ${selectedProject.gitConfig.branch}`
      });
    } catch (error: any) {
      errorLogger.log(error, { 
        action: 'git_push', 
        projectId: selectedProjectId,
        remoteUrl: selectedProject?.gitConfig?.remoteUrl,
        branch: selectedProject?.gitConfig?.branch
      });
      toast.error('Помилка при спробі пушу', {
        description: 'Перевірте з\'єднання та Git URL.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleGitClone = async () => {
    if (!selectedProject || !selectedProject.gitConfig?.remoteUrl) {
      toast.error('URL репозиторію не вказано');
      return;
    }

    setIsCloning(true);
    try {
      // Simulate cloning process
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // If URL contains "error", simulate a failure
          if (selectedProject.gitConfig?.remoteUrl.toLowerCase().includes('error')) {
            reject(new Error('Репозиторій не знайдено або доступ заборонено. Перевірте URL.'));
          } else {
            resolve(true);
          }
        }, 2000);
      });

      toast.success('Репозиторій успішно клоновано', {
        description: `Налаштування синхронізовано з ${selectedProject.gitConfig.remoteUrl}`
      });
      
      updateProject({
        gitConfig: {
          ...selectedProject.gitConfig,
          enabled: true
        }
      });
    } catch (error: any) {
      errorLogger.log(error, { 
        action: 'git_clone', 
        projectId: selectedProjectId,
        remoteUrl: selectedProject?.gitConfig?.remoteUrl
      });
      toast.error('Помилка клонування', {
        description: error.message || 'Не вдалося клонувати репозиторій. Перевірте мережу та правильність URL.'
      });
    } finally {
      setIsCloning(false);
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
      toast.success(`Додано ${newDeps.length} нових залежностей`);
    } catch (error: any) {
      console.error(error);
      errorLogger.log(error, { action: 'suggest_dependencies', projectId: selectedProjectId });
      toast.error('Помилка AI', {
        description: 'Не вдалося отримати рекомендації.'
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCheckUpdates = async () => {
    if (!selectedProject || selectedProject.dependencies.length === 0) return;
    setIsCheckingUpdates(true);
    try {
      const outdated = await checkOutdatedDependencies(selectedProject.dependencies);
      setOutdatedDeps(prev => ({ ...prev, [selectedProject.id]: outdated }));
      if (outdated.length > 0) {
        toast.info(`Знайдено ${outdated.length} застарілих залежностей`);
      } else {
        toast.success('Всі залежності актуальні');
      }
    } catch (error: any) {
      errorLogger.log(error, { action: 'check_outdated_dependencies', projectId: selectedProjectId });
      toast.error('Помилка перевірки оновлень');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleImportNotebook = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ipynb')) {
      toast.error('Некоректний формат файлу. Оберіть .ipynb');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.cells || !Array.isArray(data.cells)) {
          throw new Error('Некоректна структура ноутбука');
        }

        const codeCells = data.cells
          .filter((cell: any) => cell.cell_type === 'code')
          .map((cell: any) => {
            const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
            return source;
          })
          .join('\n\n# ---\n\n');

        if (!codeCells.trim()) {
          toast.warning('У ноутбуку не знайдено коду');
        } else {
          setGeneratedCode(codeCells);
          toast.success('Ноутбук успішно імпортовано');
          
          // If a project is selected, suggest naming it or linking it
          if (selectedProject) {
            addSnapshot(`Імпорт: ${file.name}`);
          }
        }
      } catch (err) {
        errorLogger.log(err, { action: 'import_notebook', fileName: file.name });
        toast.error('Помилка при зчитуванні ноутбука. Можливо, файл пошкоджений.');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateDependencies = () => {
    if (!selectedProject) return;
    const outdated = outdatedDeps[selectedProject.id] || [];
    if (outdated.length === 0) return;

    const newDependencies = selectedProject.dependencies.map(dep => {
      const update = outdated.find(u => u.name === dep.name);
      if (update) {
        return { ...dep, version: update.latestVersion };
      }
      return dep;
    });

    updateProject({ dependencies: newDependencies });
    setOutdatedDeps(prev => ({ ...prev, [selectedProject.id]: [] }));
    toast.success('Залежності оновлено');
  };

  const handleUpdateDependency = (name: string, newVersion: string) => {
    if (!selectedProject) return;
    
    const newDependencies = selectedProject.dependencies.map(dep => 
      dep.name === name ? { ...dep, version: newVersion } : dep
    );

    updateProject({ dependencies: newDependencies });
    setOutdatedDeps(prev => ({
      ...prev,
      [selectedProject.id]: (prev[selectedProject.id] || []).filter(o => o.name !== name)
    }));
    toast.success(`Пакет ${name} оновлено до v${newVersion}`);
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
      toast.success('Код згенеровано успішно');
    } catch (error: any) {
      console.error(error);
      errorLogger.log(error, { action: 'generate_colab_snippet', projectId: selectedProjectId });
      toast.error('Помилка генерації', {
        description: 'Перевірте налаштування та спробуйте ще раз.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-app-bg text-app-fg font-sans overflow-hidden transition-colors duration-300">
      <Toaster position="bottom-right" theme={theme} />
      {/* Sidebar */}
      <ProjectSidebar 
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => { setSelectedProjectId(id); setGeneratedCode(null); }}
        onAddProject={createProject}
        onDeleteProject={(id) => {
          if (confirm('Видалити проект?')) {
            setProjects(projects.filter(p => p.id !== id));
            if (selectedProjectId === id) setSelectedProjectId(null);
            toast.success('Проект видалено');
          }
        }}
        onImportProjects={(imported) => {
          setProjects([...imported, ...projects]);
          toast.success(`Імпортовано ${imported.length} проєктів`);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="p-12 border-b border-app-fg sticky top-0 bg-app-bg z-10">
              <div className="flex items-end justify-between gap-8">
                <div className="max-w-2xl">
                  <input
                    value={selectedProject.name}
                    onChange={(e) => updateProject({ name: e.target.value })}
                    className="w-full bg-transparent font-serif italic text-5xl tracking-tighter mb-4 outline-none border-b border-transparent focus:border-app-fg/20"
                  />
                  <textarea
                    value={selectedProject.description}
                    onChange={(e) => updateProject({ description: e.target.value })}
                    className="w-full bg-transparent text-sm opacity-60 font-medium resize-none outline-none leading-relaxed h-12"
                    placeholder="Опишіть ціль вашого дослідження..."
                  />
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex justify-end mb-2">
                    <button 
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      className="p-2 border border-app-fg hover:bg-app-fg hover:text-app-bg transition-all"
                      title={theme === 'light' ? 'Переключити на темну тему' : 'Переключити на світлу тему'}
                    >
                      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-3 px-6 py-3 bg-app-fg text-app-bg hover:bg-app-fg/90 transition-colors disabled:opacity-50"
                  >
                    <Terminal size={16} />
                    <span className="text-xs font-mono uppercase tracking-wider">Експорт у Colab</span>
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={saveAsTemplate}
                      className="flex-1 flex items-center gap-3 px-4 py-2 border border-app-fg hover:bg-app-fg hover:text-app-bg transition-colors"
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
                      className="flex-1 flex items-center gap-3 px-4 py-2 border border-app-fg hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Видалити</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 min-h-full">
              {/* Left Column */}
              <div className="border-r border-app-fg/20 p-12 space-y-16">
                <DependenciesPanel 
                  dependencies={selectedProject.dependencies}
                  isSuggesting={isSuggesting}
                  isCheckingUpdates={isCheckingUpdates}
                  outdatedDeps={outdatedDeps[selectedProject.id] || []}
                  onAddDependency={() => {
                    const name = prompt('Назва пакета:');
                    if (name) addDependency({ name, description: 'Додано вручну' });
                  }}
                  onUpdateDependencies={(deps) => updateProject({ dependencies: deps })}
                  onSuggestDependencies={handleSuggest}
                  onCheckUpdates={handleCheckUpdates}
                  onUpdateAll={handleUpdateDependencies}
                  onUpdateDependency={handleUpdateDependency}
                />

                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-8">
                    <HardDrive size={18} />
                    <h2 className="font-serif italic text-xl">Джерела Даних</h2>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={addDataSource}
                      className="w-full py-4 border border-dashed border-app-fg/30 hover:border-app-fg hover:bg-app-fg/5 transition-all text-[10px] space-y-1 group"
                    >
                      <div className="font-mono uppercase opacity-50 group-hover:opacity-100">Додати Джерело</div>
                      <Plus size={14} className="mx-auto opacity-30 group-hover:opacity-100" />
                    </button>
                    <div className="space-y-2">
                      {selectedProject.dataSources.map(ds => (
                        <div key={ds.id} className="border border-app-fg p-4 space-y-3 bg-card-bg/50">
                          <div className="flex items-center justify-between">
                            <input 
                              value={ds.name}
                              onChange={(e) => updateDataSource(ds.id, { name: e.target.value })}
                              className="bg-transparent font-mono text-[10px] font-bold outline-none border-b border-transparent focus:border-app-fg/20"
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
                              className="bg-app-fg/5 text-[10px] p-1 border-none outline-none font-mono"
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
                              className="bg-app-fg/5 text-[10px] p-1 px-2 border-none outline-none font-mono placeholder:opacity-30"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <IntegrationsPanel 
                  project={selectedProject}
                  isPushing={isPushing}
                  isCloning={isCloning}
                  onUpdateProject={updateProject}
                  onCommitAndPush={handleCommitAndPush}
                  onGitClone={handleGitClone}
                  onDownloadVSCode={downloadVSCodeConfig}
                />
              </div>

              {/* Right Column: Models & Tasks & Export */}
              <div className="p-12 pb-32">
                <ModelsPanel 
                  models={selectedProject.models}
                  onAddModel={() => {
                    const id = crypto.randomUUID();
                    updateProject({ 
                      models: [...selectedProject.models, { 
                        id, 
                        name: 'Нова Модель', 
                        framework: 'PyTorch', 
                        description: 'Масштабована архітектура', 
                        hyperparameters: { 'epochs': '10' },
                        exportStatus: 'Pending'
                      }] 
                    });
                  }}
                  onUpdateModels={(models) => updateProject({ models })}
                />

                <TasksPanel 
                  tasks={selectedProject.tasks}
                  onAddTask={addTask}
                  onUpdateTasks={(tasks) => updateProject({ tasks })}
                  sortByPriority={sortByPriority}
                  onToggleSort={() => setSortByPriority(!sortByPriority)}
                />
              </div>
            </div>

            {/* Export Result */}
                <AnimatePresence>
                  {generatedCode && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="mt-12 bg-app-fg text-app-bg p-8 space-y-6 shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <Code2 size={18} />
                          <h3 className="font-serif italic text-lg text-white">Шаблон Ноутбука</h3>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="file" 
                            accept=".ipynb" 
                            className="hidden" 
                            ref={notebookRef}
                            onChange={handleImportNotebook}
                          />
                          <button 
                            onClick={() => notebookRef.current?.click()}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-app-bg/30 px-3 py-1 hover:bg-app-bg hover:text-app-fg transition-all"
                            title="Import Jupyter Notebook"
                          >
                            <Upload size={10} />
                            Імпорт
                          </button>
                          <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-app-bg/30 px-3 py-1 hover:bg-app-bg hover:text-app-fg transition-all disabled:opacity-30"
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
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-app-bg/30 px-3 py-1 hover:bg-app-bg hover:text-app-fg transition-all bg-yellow-500/10"
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
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-app-bg/30 px-3 py-1 hover:bg-app-bg hover:text-app-fg transition-all bg-blue-500/10"
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
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-app-bg/30 px-3 py-1 hover:bg-app-bg hover:text-app-fg transition-all"
                          >
                            <Save size={10} />
                            Буфер
                          </button>
                          <button 
                            onClick={() => {
                              const note = prompt('Введіть назву знімку:');
                              if (note) addSnapshot(note);
                            }}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold border border-app-bg/30 px-3 py-1 hover:bg-app-bg hover:text-app-fg transition-all"
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
                        {scanCode(generatedCode).length > 0 && (
                          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-sm">
                            <div className="flex items-center gap-2 text-red-400 mb-2">
                              <AlertCircle size={14} />
                              <span className="text-[10px] uppercase font-bold tracking-widest">Виявлені вразливості</span>
                            </div>
                            <div className="space-y-2">
                              {scanCode(generatedCode).map((v, i) => (
                                <div key={i} className="text-[9px] text-red-300/70 border-l border-red-500/30 pl-3">
                                  {v.reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
            ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md space-y-8"
            >
              <div className="w-24 h-24 bg-app-fg rounded-full mx-auto flex items-center justify-center text-app-bg">
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
                className="inline-flex items-center gap-3 px-8 py-4 bg-app-fg text-app-bg hover:bg-app-fg/90 transition-all group shadow-2xl"
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.03]"></div>
      </div>
    </div>
  );
}
