'use client';

import * as React from 'react';
import {
  DndContext, DragOverlay, useSensor, useSensors,
  PointerSensor, TouchSensor, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Building2, GripVertical } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  APPLIED:       { label: 'Applied',       color: 'border-blue-800/40 bg-blue-950/10', dot: 'bg-blue-500' },
  PHONE_SCREEN:  { label: 'Phone Screen',  color: 'border-cyan-800/40 bg-cyan-950/10', dot: 'bg-cyan-500' },
  TECH_ROUND_1:  { label: 'Tech Round 1',  color: 'border-violet-800/40 bg-violet-950/10', dot: 'bg-violet-500' },
  TECH_ROUND_2:  { label: 'Tech Round 2',  color: 'border-indigo-800/40 bg-indigo-950/10', dot: 'bg-indigo-500' },
  SYSTEM_DESIGN: { label: 'System Design', color: 'border-amber-800/40 bg-amber-950/10', dot: 'bg-amber-500' },
  HR_CULTURE:    { label: 'HR/Culture',    color: 'border-emerald-800/40 bg-emerald-950/10', dot: 'bg-emerald-500' },
  OFFER:         { label: 'Offer',         color: 'border-green-800/40 bg-green-950/10', dot: 'bg-green-500' },
};

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  priority: string;
}

function KanbanCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: application,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'p-3 rounded-lg border border-zinc-700/50 bg-zinc-900/80 cursor-grab active:cursor-grabbing transition-shadow',
        isDragging ? 'shadow-xl shadow-zinc-900/50 opacity-90 ring-2 ring-zinc-500' : 'hover:border-zinc-600',
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <p className="text-sm font-medium text-zinc-200 truncate">{application.company}</p>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{application.role}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn(
              'text-[9px] font-medium',
              application.priority === 'HIGH' ? 'bg-red-950 text-red-300 border-red-800' :
              application.priority === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-800' :
              'bg-zinc-800 text-zinc-400 border-zinc-700',
            )}>
              {application.priority}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ status, applications }: { status: string; applications: Application[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = statusConfig[status] || { label: status, color: 'border-zinc-800 bg-zinc-900/10', dot: 'bg-zinc-500' };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg border min-w-[260px] w-[260px] shrink-0 transition-colors',
        config.color,
        isOver && 'ring-2 ring-zinc-500',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/50">
        <div className={cn('h-2 w-2 rounded-full', config.dot)} />
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{config.label}</span>
        <span className="ml-auto text-[11px] text-zinc-600">{applications.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        {applications.map((app) => (
          <KanbanCard key={app.id} application={app} />
        ))}
        {applications.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-zinc-700">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function DragPreview({ application }: { application: Application }) {
  return (
    <div className="p-3 rounded-lg border border-zinc-600 bg-zinc-800 shadow-2xl w-60">
      <div className="flex items-start gap-2">
        <GripVertical className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200 truncate">{application.company}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{application.role}</p>
        </div>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  statuses: readonly string[];
  applications: Application[];
  onStatusChange: (id: string, newStatus: string) => void;
}

export function KanbanBoard({ statuses, applications, onStatusChange }: KanbanBoardProps) {
  const [activeApp, setActiveApp] = React.useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const app = applications.find((a) => a.id === event.active.id);
    if (app) setActiveApp(app);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = event;
    if (!over || !active) return;

    const appId = active.id as string;
    const newStatus = over.id as string;

    if (newStatus && newStatus !== active.data.current?.status) {
      onStatusChange(appId, newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {statuses.map((status) => (
          <Column
            key={status}
            status={status}
            applications={applications.filter((a) => a.status === status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp ? <DragPreview application={activeApp} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
