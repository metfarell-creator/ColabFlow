import React from 'react';
import { Package as PackageIcon, Trash2, Box, RefreshCw, ArrowUpCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, OutdatedPackage } from '../types';

interface DependenciesPanelProps {
  dependencies: Package[];
  isSuggesting: boolean;
  isCheckingUpdates: boolean;
  outdatedDeps: OutdatedPackage[];
  onAddDependency: () => void;
  onUpdateDependencies: (deps: Package[]) => void;
  onSuggestDependencies: () => void;
  onCheckUpdates: () => void;
  onUpdateAll: () => void;
  onUpdateDependency: (name: string, newVersion: string) => void;
}

export const DependenciesPanel: React.FC<DependenciesPanelProps> = ({
  dependencies,
  isSuggesting,
  isCheckingUpdates,
  outdatedDeps,
  onAddDependency,
  onUpdateDependencies,
  onSuggestDependencies,
  onCheckUpdates,
  onUpdateAll,
  onUpdateDependency
}) => {
  const removeDependency = (name: string) => {
    onUpdateDependencies(dependencies.filter(d => d.name !== name));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <PackageIcon size={18} />
          <h2 className="font-serif italic text-xl">Залежності</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCheckUpdates}
            disabled={isCheckingUpdates || dependencies.length === 0}
            className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20 flex items-center gap-2"
            title="Перевірити оновлення"
          >
            <RefreshCw size={10} className={isCheckingUpdates ? 'animate-spin' : ''} />
            Оновити
          </button>
          <button 
            onClick={onSuggestDependencies}
            disabled={isSuggesting}
            className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20 flex items-center gap-2"
          >
            {isSuggesting && <Box size={10} className="animate-spin" />}
            AI Підказка
          </button>
          <button 
            onClick={onAddDependency}
            className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
          >
            + Додати
          </button>
        </div>
      </div>

      <AnimatePresence>
        {outdatedDeps.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={14} className="text-blue-500" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500">
                  Знайдено {outdatedDeps.length} застарілих пакетів
                </span>
              </div>
              <button 
                onClick={onUpdateAll}
                className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 text-[9px] uppercase font-bold hover:bg-blue-600 transition-colors"
              >
                <ArrowUpCircle size={12} />
                Оновити ВСЕ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {dependencies.map(dep => {
            const isOutdated = outdatedDeps.find(o => o.name === dep.name);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={dep.name} 
                className={`group border ${isOutdated ? 'border-blue-500/50 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.1)]' : 'border-app-fg'} p-4 flex items-start justify-between bg-card-bg hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,0.05)] transition-all relative overflow-hidden`}
              >
                {isOutdated && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-tighter">
                      Update
                    </div>
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-bold leading-none font-mono uppercase truncate">{dep.name}</h3>
                    {dep.version && (
                      <span className="text-[9px] font-mono opacity-40">v{dep.version}</span>
                    )}
                  </div>
                  <p className="text-[10px] opacity-60 line-clamp-1">{dep.description}</p>
                  {isOutdated && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[9px] text-blue-500 font-bold flex items-center gap-1">
                        <RefreshCw size={8} />
                        {isOutdated.currentVersion} → {isOutdated.latestVersion}
                      </p>
                      <button 
                        onClick={() => onUpdateDependency(dep.name, isOutdated.latestVersion)}
                        className="bg-blue-500 text-white text-[8px] px-2 py-0.5 font-bold uppercase hover:bg-blue-600 transition-colors"
                      >
                        Оновити
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => removeDependency(dep.name)}
                  className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1 hover:text-red-600 shrink-0 ml-2"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {dependencies.length === 0 && !isSuggesting && (
          <div className="col-span-2 border border-dashed border-app-fg/20 p-8 text-center bg-app-fg/[0.01]">
            <p className="text-[10px] uppercase font-mono tracking-wider opacity-30">Ви ще не додали жодного пакету</p>
          </div>
        )}
      </div>
    </div>
  );
};
