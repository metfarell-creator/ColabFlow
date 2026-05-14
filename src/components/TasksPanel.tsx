import React from 'react';
import { Target, Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';

interface TasksPanelProps {
  tasks: Task[];
  onAddTask: () => void;
  onUpdateTasks: (tasks: Task[]) => void;
  sortByPriority: boolean;
  onToggleSort: () => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  tasks,
  onAddTask,
  onUpdateTasks,
  sortByPriority,
  onToggleSort
}) => {
  const updateTask = (id: string, updates: Partial<Task>) => {
    onUpdateTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTask = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortByPriority) {
      const priorityMap = { High: 3, Medium: 2, Low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    }
    return 0; // Maintain original order if not sorting by priority
  });

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Target size={18} />
          <h2 className="font-serif italic text-xl">Завдання</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSort}
            className={`text-[9px] uppercase font-bold tracking-widest transition-opacity ${sortByPriority ? 'opacity-100 underline decoration-2 underline-offset-4' : 'opacity-30'}`}
          >
            Пріоритет
          </button>
          <button 
            onClick={onAddTask}
            className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
          >
            + Нове Завдання
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map(task => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ 
                layout: { duration: 0.3, type: "spring", bounce: 0.2 },
                opacity: { duration: 0.2 }
              }}
              key={task.id} 
              className="group border border-app-fg p-4 flex items-center justify-between bg-card-bg hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,0.05)] transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => updateTask(task.id, { status: task.status === 'Done' ? 'Todo' : 'Done' })}
                className="transition-colors hover:scale-110 active:scale-95"
              >
                {task.status === 'Done' ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : (
                  <Circle size={18} className="opacity-20 hover:opacity-100" />
                )}
              </button>
              <div className="flex-1">
                <input 
                  value={task.title}
                  onChange={(e) => updateTask(task.id, { title: e.target.value })}
                  className={`bg-transparent text-xs outline-none block w-full ${task.status === 'Done' ? 'line-through opacity-40' : 'font-medium'}`}
                  placeholder="Що потрібно зробити?"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-app-fg/5">
                <Clock size={10} className="opacity-40" />
                <select
                  value={task.priority}
                  onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                  className="bg-transparent text-[8px] uppercase font-bold border-none outline-none cursor-pointer"
                >
                  <option value="Low" className="text-[#141414]">Low</option>
                  <option value="Medium" className="text-[#141414]">Medium</option>
                  <option value="High" className="text-[#141414]">High</option>
                </select>
              </div>
              <button 
                onClick={() => removeTask(task.id)}
                className="opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity"
              >
                <Plus className="rotate-45" size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {tasks.length === 0 && (
          <div className="border border-dashed border-app-fg/20 p-8 text-center bg-app-fg/[0.01]">
            <p className="text-[10px] uppercase font-mono tracking-wider opacity-30">Список завдань порожній</p>
          </div>
        )}
      </div>
    </div>
  );
};
