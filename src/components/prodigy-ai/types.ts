export type Meta = {
  configured: boolean;
  url: string;
  defaultWorkspace: string;
  defaultWorkspaceName: string;
};

export type Runtime = {
  dockerVersion: string;
  cpus: number;
  memTotal: number;
  instances: number;
  running: number;
  tasksRunning: number;
};

export type Workspace = {
  id: string;
  name: string;
  path: string;
  created_at: number;
};

export type Instance = {
  id: string;
  name: string;
  container_id: string | null;
  workspace_id: string;
  status: string;
  health: string | null;
  exhausted: boolean;
  profile: string | null;
  created_at: number;
};

export type Task = {
  id: string;
  workspace_id: string;
  instance_id: string | null;
  prompt: string;
  status: string;
  exit_code: number | null;
  attempts: number;
  parent_id: string | null;
  error: string | null;
  created_at: number;
  updated_at: number;
};

export type Checkpoint = {
  id: string;
  task_id: string;
  instance_id: string;
  git_ref: string | null;
  summary: string;
  output_tail: string;
  ts: number;
};

export type TaskDetail = {
  task: Task | null;
  checkpoints: Checkpoint[];
  output: string;
};
