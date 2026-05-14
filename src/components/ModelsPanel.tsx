import React from 'react';
import { Box, Plus, Trash2, SlidersHorizontal, X } from 'lucide-react';
import { MLModel } from '../types';

interface ModelsPanelProps {
  models: MLModel[];
  onAddModel: () => void;
  onUpdateModels: (models: MLModel[]) => void;
}

export const ModelsPanel: React.FC<ModelsPanelProps> = ({
  models,
  onAddModel,
  onUpdateModels
}) => {
  const updateModel = (id: string, updates: Partial<MLModel>) => {
    onUpdateModels(models.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeModel = (id: string) => {
    onUpdateModels(models.filter(m => m.id !== id));
  };

  const addHyperparameter = (modelId: string) => {
    const key = prompt('Назва параметра:');
    if (key) {
      const model = models.find(m => m.id === modelId);
      if (model) {
        updateModel(modelId, { 
          hyperparameters: { ...model.hyperparameters, [key]: '' } 
        });
      }
    }
  };

  const removeHyperparameter = (modelId: string, key: string) => {
     const model = models.find(m => m.id === modelId);
      if (model) {
        const { [key]: _, ...rest } = model.hyperparameters;
        updateModel(modelId, { hyperparameters: rest });
      }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Box size={18} />
          <h2 className="font-serif italic text-xl">Моделі</h2>
        </div>
        <button 
          onClick={onAddModel}
          className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
        >
          + Нова Модель
        </button>
      </div>

      <div className="space-y-6">
        {models.map(model => (
          <div key={model.id} className="border border-app-fg p-6 space-y-4 bg-card-bg/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <input 
                  value={model.name}
                  onChange={(e) => updateModel(model.id, { name: e.target.value })}
                  className="bg-transparent text-sm font-bold outline-none block mb-1 w-full"
                  placeholder="Назва моделі"
                />
                <div className="flex items-center gap-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-app-fg text-app-bg px-1.5 py-0.5">
                    {model.framework}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                 <select
                  value={model.framework}
                  onChange={(e) => updateModel(model.id, { framework: e.target.value as any })}
                  className="bg-app-fg/5 text-[8px] p-1 border-none outline-none font-mono uppercase font-bold"
                >
                  <option value="PyTorch" className="text-[#141414]">PyTorch</option>
                  <option value="TensorFlow" className="text-[#141414]">TensorFlow</option>
                  <option value="Scikit-Learn" className="text-[#141414]">Scikit-Learn</option>
                  <option value="Other" className="text-[#141414]">Other</option>
                </select>
                <button 
                  onClick={() => removeModel(model.id)}
                  className="text-app-fg opacity-30 hover:opacity-100 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-app-fg/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={12} className="opacity-40" />
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Гіперпараметри</p>
                </div>
                <button 
                  onClick={() => addHyperparameter(model.id)}
                  className="text-[8px] uppercase font-mono border border-app-fg px-2 py-0.5 hover:bg-app-fg hover:text-app-bg transition-colors"
                >
                  + Додати
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-app-fg/[0.02] p-4 rounded-sm border border-app-fg/5">
                {Object.entries(model.hyperparameters).map(([key, val]) => (
                  <div key={key} className="group/param relative">
                    <p className="text-[8px] uppercase opacity-40 mb-1 font-bold flex items-center justify-between">
                      {key}
                      <button
                        onClick={() => removeHyperparameter(model.id, key)}
                        className="opacity-0 group-hover/param:opacity-100 p-0.5 hover:text-red-500 transition-opacity"
                      >
                        <X size={8} />
                      </button>
                    </p>
                    <input 
                      value={val}
                      onChange={(e) => {
                        updateModel(model.id, { 
                          hyperparameters: { ...model.hyperparameters, [key]: e.target.value }
                        });
                      }}
                      className="bg-app-fg/5 border-b border-app-fg/20 px-2 py-1 text-[10px] w-full outline-none focus:bg-app-fg/10 transition-colors font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
