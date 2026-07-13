'use client';

import * as React from 'react';
import { CheckCircle2, Circle, Pencil, Check, X, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Priority = 'must' | 'should' | 'nice';

interface Task {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  priority: Priority;
  link?: string;
}

export function CustomTaskList({
  tasks,
  completed,
  onToggle,
  onAdd,
  onDelete,
  onEdit,
  logActivity,
}: {
  tasks: Task[];
  completed: Set<string>;
  onToggle: (id: string) => void;
  onAdd: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, task: Task) => void;
  logActivity: (text: string) => void;
}) {
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = React.useState('');
  const [editTaskTime, setEditTaskTime] = React.useState('');
  const [editTaskDifficulty, setEditTaskDifficulty] = React.useState('');
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [showAddTask, setShowAddTask] = React.useState(false);

  function handleDelete(taskId: string) {
    onDelete(taskId);
  }

  function handleStartEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskTime(task.time);
    setEditTaskDifficulty(task.difficulty);
  }

  function handleSaveEdit() {
    if (!editTaskTitle.trim() || !editingTaskId) return;
    onEdit(editingTaskId, {
      id: editingTaskId,
      title: editTaskTitle.trim(),
      time: editTaskTime,
      difficulty: editTaskDifficulty,
      priority: 'should',
    });
    setEditingTaskId(null);
  }

  function handleAdd() {
    const title = newTaskTitle.trim();
    if (!title) return;
    onAdd({
      id: `custom-${Date.now()}`,
      title,
      time: '30 min',
      difficulty: 'Custom',
      priority: 'should',
    });
    setNewTaskTitle('');
    logActivity(`Added custom daily task "${title}"`);
  }

  return (
    <Card className="bg-card/50 border-zinc-800">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm font-medium text-zinc-200">Additional Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1 space-y-2">
        {tasks.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-2">No additional tasks yet.</p>
        )}
        {tasks.map((task) => {
          const isDone = completed.has(task.id);
          const isEditing = editingTaskId === task.id;
          if (isEditing) {
            return (
              <div key={task.id} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-2.5">
                <Input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} className="flex-1 h-7 text-xs bg-zinc-800 border-zinc-700" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingTaskId(null); }} autoFocus />
                <Input value={editTaskTime} onChange={(e) => setEditTaskTime(e.target.value)} className="w-14 h-7 text-xs bg-zinc-800 border-zinc-700" />
                <select value={editTaskDifficulty} onChange={(e) => setEditTaskDifficulty(e.target.value)} className="h-7 text-[10px] bg-zinc-800 border border-zinc-700 rounded px-1 text-zinc-300 outline-none">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
                <button onClick={handleSaveEdit} className="p-1 rounded hover:bg-zinc-800 text-green-500 cursor-pointer">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setEditingTaskId(null)} className="p-1 rounded hover:bg-zinc-800 text-red-500 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }
          return (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-2.5 transition-all group',
                isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30',
              )}
            >
              <button onClick={() => onToggle(task.id)} className="shrink-0 cursor-pointer">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                )}
              </button>
              <span className={cn('flex-1 text-sm', isDone && 'line-through text-zinc-600')}>
                {task.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-zinc-600">{task.time}</span>
                <button onClick={() => handleStartEdit(task)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer">
                  <Pencil className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(task.id)} className="p-1 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 pt-1">
          {showAddTask ? (
            <>
              <Input
                placeholder="Add a custom task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { handleAdd(); setShowAddTask(false); }
                  if (e.key === 'Escape') setShowAddTask(false);
                }}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 text-sm flex-1"
                autoFocus
              />
              <Button variant="outline" size="icon" onClick={() => { handleAdd(); setShowAddTask(false); }} disabled={!newTaskTitle.trim()}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowAddTask(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <button
              onClick={() => { setShowAddTask(true); setNewTaskTitle(''); }}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Add a task"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
