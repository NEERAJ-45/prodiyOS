'use client';

import * as React from 'react';
import { useMounted } from '@/hooks/useMounted';
import {
  FolderOpen, CheckCircle2, Sparkles, Layers,
  Plus, Pencil, Trash2, X, ExternalLink, Search, FileText, FileDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import DocViewer from '@cyntler/react-doc-viewer';
import '@cyntler/react-doc-viewer/dist/index.css';
import { cn } from '@/lib/utils';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useProjectsQuery, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';

type ProjectStatus = 'IDEA' | 'IN_PROGRESS' | 'COMPLETED' | 'MAINTAINING' | 'ARCHIVED';

interface ProjectFeature {
  name: string;
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  technologies: string[];
  features: ProjectFeature[];
  linkedConcepts: number;
  vision: string;
  architecture: string;
  architectureImage?: string;
  docs?: { name: string; url: string }[];
  lessons: string;
}

const STORAGE_KEY = 'projects-data';

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  IDEA: { label: 'Idea', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  MAINTAINING: { label: 'Maintaining', className: 'bg-amber-950 text-amber-300 border-amber-800' },
  ARCHIVED: { label: 'Archived', className: 'bg-zinc-900 text-zinc-500 border-zinc-800' },
};

const allStatuses: ProjectStatus[] = ['IDEA', 'IN_PROGRESS', 'COMPLETED', 'MAINTAINING', 'ARCHIVED'];


function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return <Badge variant="outline" className={cn('text-[10px] font-medium', config.className)}>{config.label}</Badge>;
}

function ProjectCard({ project, onSelect, onEdit, onDelete }: {
  project: Project; onSelect: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const doneCount = project.features.filter((f) => f.done).length;

  return (
    <Card className="group border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
            <CardTitle className="text-base font-medium text-zinc-100 truncate cursor-pointer">{project.name}</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1 line-clamp-1">{project.description}</CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-zinc-800 text-zinc-400">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="space-y-1">
          {project.features.slice(0, expanded ? project.features.length : 3).map((feature) => (
            <div key={feature.name} className="flex items-center gap-2 text-xs">
              <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', feature.done ? 'bg-emerald-500' : 'bg-zinc-700')} />
              <span className={cn(feature.done ? 'text-zinc-300' : 'text-zinc-600')}>{feature.name}</span>
            </div>
          ))}
          {!expanded && project.features.length > 3 && (
            <button className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5">+{project.features.length - 3} more</button>
          )}
        </div>

        {project.features.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>{doneCount}/{project.features.length} features</span>
              <span>{Math.round((doneCount / project.features.length) * 100)}%</span>
            </div>
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-500',
                  doneCount / project.features.length >= 1 ? 'bg-emerald-500' :
                  doneCount / project.features.length >= 0.6 ? 'bg-blue-500' :
                  doneCount / project.features.length >= 0.3 ? 'bg-amber-500' : 'bg-zinc-500'
                )}
                style={{ width: `${(doneCount / project.features.length) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-zinc-600 pt-1 border-t border-zinc-800">
          <Layers className="h-3 w-3" />
          <span>{project.linkedConcepts} linked concepts</span>
          <button
            className="ml-auto flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <span>Details</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ArchImage({ url }: { url: string }) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (url.startsWith('data:')) {
      const b = dataUrlToBlob(url);
      setBlobUrl(b);
      return () => URL.revokeObjectURL(b);
    }
    setBlobUrl(url);
  }, [url]);
  if (!blobUrl) return null;
  return (
    <div className="mt-2 border border-zinc-700 rounded-lg overflow-hidden cursor-pointer"
      onClick={() => window.open(blobUrl, '_blank')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={blobUrl} alt="Architecture diagram" className="w-full h-auto max-h-64 object-contain bg-zinc-950" />
    </div>
  );
}

function dataUrlToBlob(url: string): string {
  const [header, base64] = url.split(',', 2);
  const mime = header?.split(':')[1]?.split(';')[0] || 'application/octet-stream';
  const raw = atob(base64 || '');
  const len = raw.length;
  const buf = new ArrayBuffer(len);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < len; i++) bytes[i] = raw.charCodeAt(i);
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}

function ExpandedDialog({ project, open, onOpenChange }: { project: Project | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [viewingDoc, setViewingDoc] = React.useState<{ name: string; url: string } | null>(null);
  const [docBlobUrl, setDocBlobUrl] = React.useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = React.useState(false);

  React.useEffect(() => {
    if (!viewingDoc) {
      if (docBlobUrl) { URL.revokeObjectURL(docBlobUrl); setDocBlobUrl(null); }
      return;
    }
    if (viewingDoc.url.startsWith('data:')) {
      const url = dataUrlToBlob(viewingDoc.url);
      setDocBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setDocBlobUrl(viewingDoc.url);
  }, [viewingDoc, docBlobUrl]);

  if (!project) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <DialogTitle className="text-lg text-zinc-100">{project.name}</DialogTitle>
              <StatusBadge status={project.status} />
            </div>
            <DialogDescription className="text-sm text-zinc-500">{project.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Vision</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{project.vision}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Architecture</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{project.architecture}</p>
                {project.architectureImage && (
                  <ArchImage url={project.architectureImage} />
                )}
              </div>
              {project.docs && project.docs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Documents</h4>
                  <div className="space-y-1.5">
                    {project.docs.map((doc, i) => (
                      <button key={i} onClick={() => setViewingDoc(doc)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors text-left">
                        <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-300 truncate flex-1">{doc.name}</span>
                        <ExternalLink className="h-3 w-3 text-zinc-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Lessons Learned</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{project.lessons}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Technologies</h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-[11px] px-2 py-0.5 bg-zinc-800 text-zinc-400">{tech}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={viewingDoc !== null} onOpenChange={(v) => { if (!v) { setViewingDoc(null); setImageLoadError(false); } }}>
        {viewingDoc && (
          <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-zinc-100 text-sm truncate">{viewingDoc.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              {viewingDoc.url.startsWith('data:image/') ? (
                imageLoadError ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-red-400">Failed to load image.</p>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={docBlobUrl || viewingDoc.url} alt={viewingDoc.name}
                    onError={() => setImageLoadError(true)}
                    className="w-full h-full object-contain rounded-lg" />
                )
              ) : docBlobUrl ? (
                <DocViewer
                  documents={[{ uri: docBlobUrl, fileName: viewingDoc.name }]}
                  theme={{ primary: '#18181b', secondary: '#27272a', tertiary: '#3f3f46', textPrimary: '#e4e4e7', textSecondary: '#a1a1aa', textTertiary: '#71717a', disableThemeScrollbar: true }}
                  config={{ header: { disableHeader: false, disableFileName: false }, pdfZoom: { defaultZoom: 1, zoomJump: 0.5 }, pdfVerticalScrollByDefault: true }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
                </div>
              )}
            </div>
            <DialogFooter className="border-t border-zinc-800 pt-3 mt-2">
              <div className="flex gap-2 w-full justify-end">
                <Button variant="outline" size="sm" onClick={() => { setViewingDoc(null); setImageLoadError(false); }}>Close</Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  const a = document.createElement('a');
                  a.href = viewingDoc.url;
                  a.download = viewingDoc.name;
                  a.click();
                }}>
                  <FileDown className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

const emptyFeature = (): ProjectFeature => ({ name: '', done: false });

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const mounted = useMounted();
  const [dialogProject, setDialogProject] = React.useState<Project | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formDesc, setFormDesc] = React.useState('');
  const [formStatus, setFormStatus] = React.useState<ProjectStatus>('IDEA');
  const [formTech, setFormTech] = React.useState('');
  const [formTechs, setFormTechs] = React.useState<string[]>([]);
  const [formFeatures, setFormFeatures] = React.useState<ProjectFeature[]>([emptyFeature()]);
  const [formVision, setFormVision] = React.useState('');
  const [formArch, setFormArch] = React.useState('');
  const [formArchImage, setFormArchImage] = React.useState('');
  const [formDocs, setFormDocs] = React.useState<{ name: string; url: string }[]>([]);
  const [formLessons, setFormLessons] = React.useState('');
  const [formConcepts, setFormConcepts] = React.useState(0);

  const { userEmail } = useProfile();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | 'ALL'>('ALL');
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const { data: projectsData } = useProjectsQuery();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  React.useEffect(() => {
    if (!mounted) return;

    if (projectsData?.projects?.length) {
      setProjects(projectsData.projects as Project[]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsData.projects));
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setProjects(JSON.parse(saved)); } catch {}
    }
  }, [mounted, projectsData, userEmail]);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, mounted]);

  function openAdd() {
    setEditingId(null);
    setFormName(''); setFormDesc(''); setFormStatus('IDEA');
    setFormTech(''); setFormTechs([]); setFormFeatures([emptyFeature()]);
    setFormVision(''); setFormArch(''); setFormArchImage(''); setFormDocs([]); setFormLessons(''); setFormConcepts(0);
    setEditOpen(true);
  }

  function openEdit(p: Project) {
    setEditingId(p.id);
    setFormName(p.name); setFormDesc(p.description); setFormStatus(p.status);
    setFormTechs(p.technologies); setFormFeatures(p.features.length ? p.features : [emptyFeature()]);
    setFormVision(p.vision); setFormArch(p.architecture); setFormArchImage(p.architectureImage || '');
    setFormDocs(p.docs || []); setFormLessons(p.lessons); setFormConcepts(p.linkedConcepts);
    setFormTech('');
    setEditOpen(true);
  }

  function saveProject() {
    if (!formName.trim()) return;
    const features = formFeatures.filter((f) => f.name.trim());
    const doneCount = features.filter((f) => f.done).length;
    const progress = features.length > 0 ? Math.round((doneCount / features.length) * 100) : 0;

    const proj: Project & { progress?: number } = {
      id: editingId || `p-${Date.now()}`,
      name: formName.trim(),
      description: formDesc.trim(),
      status: formStatus,
      technologies: formTechs,
      features,
      linkedConcepts: formConcepts,
      vision: formVision.trim(),
      architecture: formArch.trim(),
      architectureImage: formArchImage,
      docs: formDocs,
      lessons: formLessons.trim(),
      progress,
    };

    if (editingId) {
      setProjects((prev) => prev.map((p) => p.id === editingId ? proj : p));
      if (userEmail) {
        updateProject.mutate({ id: editingId, data: proj });
      }
    } else {
      setProjects((prev) => [...prev, proj]);
      if (userEmail) {
        createProject.mutate({ ...proj, userEmail });
      }
    }
    setEditOpen(false);
  }

  function deleteProject(id: string) {
    setDeleteConfirm(id);
  }

  function confirmDelete() {
    if (!deleteConfirm) return;
    setProjects((prev) => prev.filter((p) => p.id !== deleteConfirm));
    if (userEmail) {
      deleteProjectMutation.mutate(deleteConfirm);
    }
    setDeleteConfirm(null);
  }

  function addTech() {
    const t = formTech.trim();
    if (t && !formTechs.includes(t)) { setFormTechs((p) => [...p, t]); setFormTech(''); }
  }

  function removeTech(t: string) {
    setFormTechs((p) => p.filter((x) => x !== t));
  }

  function updateFeature(idx: number, field: keyof ProjectFeature, value: string | boolean) {
    setFormFeatures((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  }

  function addFeature() {
    setFormFeatures((p) => [...p, emptyFeature()]);
  }

  function removeFeature(idx: number) {
    setFormFeatures((p) => p.filter((_, i) => i !== idx));
  }

  const filteredProjects = React.useMemo(() => {
    let list = projects;
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  }, [projects, statusFilter, searchQuery]);

  const stats = React.useMemo(() => [
    { label: 'Total', value: projects.length, icon: FolderOpen, color: 'text-blue-400' },
    { label: 'In Progress', value: projects.filter((p) => p.status === 'IN_PROGRESS').length, icon: Sparkles, color: 'text-amber-400' },
    { label: 'Completed', value: projects.filter((p) => p.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Concepts', value: projects.reduce((a, p) => a + p.linkedConcepts, 0), icon: Layers, color: 'text-violet-400' },
  ], [projects]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Project Hub</h1>
            <p className="text-sm text-zinc-500 mt-1">Track engineering projects end-to-end</p>
          </div>
          <Button variant="outline" size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Project
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={cn('p-2.5 rounded-lg bg-zinc-800/50', stat.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-zinc-100">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..." className="bg-zinc-800 border-zinc-700 text-zinc-200 pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['ALL', 'IDEA', 'IN_PROGRESS', 'COMPLETED', 'MAINTAINING', 'ARCHIVED'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-2.5 py-1 rounded text-[11px] font-medium border transition-colors',
                  statusFilter === s
                    ? s === 'ALL' ? 'bg-zinc-700 text-zinc-200 border-zinc-600'
                      : statusConfig[s as ProjectStatus].className
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                )}>
                {s === 'ALL' ? 'All' : statusConfig[s as ProjectStatus].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => { setDialogProject(project); setDialogOpen(true); }}
              onEdit={() => openEdit(project)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FolderOpen className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                {projects.length === 0 ? 'No projects yet.' : 'No projects match your filters.'}
              </p>
              {projects.length === 0 ? (
                <Button variant="outline" size="sm" onClick={openAdd} className="mt-3 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add your first
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }} className="mt-3 gap-1.5">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <ExpandedDialog project={dialogProject} open={dialogOpen} onOpenChange={setDialogOpen} />

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="bg-zinc-900 border-zinc-800 flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="text-zinc-100">{editingId ? 'Edit Project' : 'New Project'}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-6 py-2">
            <div className="space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Name</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Project name" className="bg-zinc-800 border-zinc-700 text-zinc-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Status</label>
                  <div className="flex flex-wrap gap-1">
                    {allStatuses.map((s) => (
                      <button key={s} onClick={() => setFormStatus(s)}
                        className={cn('px-2 py-1 rounded text-[10px] font-medium border transition-colors',
                          formStatus === s ? statusConfig[s].className : 'border-zinc-700 text-zinc-500')}>
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Description</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none placeholder:text-zinc-600"
                  placeholder="Brief description" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Technologies</label>
                <div className="flex gap-2">
                  <Input value={formTech} onChange={(e) => setFormTech(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                    placeholder="Add tech..." className="bg-zinc-800 border-zinc-700 text-zinc-200 flex-1" />
                  <Button variant="outline" size="sm" onClick={addTech}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {formTechs.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] mt-2 px-1.5 py-0 h-4 bg-zinc-800 text-zinc-400 gap-1">
                      {t}
                      <button onClick={() => removeTech(t)} className="hover:text-red-400"><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-400">Features</label>
                  <Button variant="outline" size="sm" onClick={addFeature} className="h-6 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {formFeatures.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="checkbox" checked={f.done} onChange={(e) => updateFeature(i, 'done', e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-800 accent-emerald-500" />
                      <input value={f.name} onChange={(e) => updateFeature(i, 'name', e.target.value)}
                        placeholder="Feature name" className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 outline-none placeholder:text-zinc-600" />
                      <button onClick={() => removeFeature(i)} className="text-zinc-600 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Vision</label>
                <textarea value={formVision} onChange={(e) => setFormVision(e.target.value)} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none placeholder:text-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Architecture</label>
                <textarea value={formArch} onChange={(e) => setFormArch(e.target.value)} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none placeholder:text-zinc-600" />
                <div className="flex items-center gap-3 mt-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded text-[11px] font-medium border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors">
                    {formArchImage ? 'Change Image' : 'Upload Architecture Diagram (JPG)'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setFormArchImage(ev.target?.result as string || '');
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                  {formArchImage && (
                    <button onClick={() => setFormArchImage('')}
                      className="text-[11px] text-red-400 hover:text-red-300 transition-colors">Remove</button>
                  )}
                </div>
                {formArchImage && (
                  <div className="mt-2 border border-zinc-700 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formArchImage} alt="Architecture diagram" className="w-full h-auto max-h-48 object-contain bg-zinc-950" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Documents</label>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors">
                  <FileText className="h-3 w-3" /> Add Document
                  <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const url = ev.target?.result as string || '';
                        setFormDocs((prev) => [...prev, { name: file.name, url }]);
                      };
                      reader.readAsDataURL(file);
                    }} />
                </label>
                {formDocs.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {formDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 cursor-pointer"
                        onClick={() => setFormDocs((prev) => prev.filter((_, j) => j !== i))}>
                        <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="text-xs text-zinc-300 truncate flex-1">{doc.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); setFormDocs((prev) => prev.filter((_, j) => j !== i)); }}
                          className="text-zinc-600 hover:text-red-400 shrink-0"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Lessons Learned</label>
                <textarea value={formLessons} onChange={(e) => setFormLessons(e.target.value)} rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none placeholder:text-zinc-600" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Linked Concepts</label>
                <Input type="number" min={0} value={formConcepts}
                  onChange={(e) => setFormConcepts(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 w-24" />
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 pt-2 border-t border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={saveProject} disabled={!formName.trim()}>
              {editingId ? 'Save' : 'Create'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteConfirm !== null} onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete Project</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="outline" size="sm" onClick={confirmDelete}
              className="bg-red-950 text-red-300 border-red-800 hover:bg-red-900">
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
