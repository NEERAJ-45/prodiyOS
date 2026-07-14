import type { KnowledgeRepository } from './interface';
import { StaticKnowledgeRepository } from './static-repository';

let repositoryInstance: KnowledgeRepository | null = null;

export function getRepository(): KnowledgeRepository {
  if (!repositoryInstance) {
    repositoryInstance = new StaticKnowledgeRepository();
  }
  return repositoryInstance;
}

export function resetRepository(): void {
  repositoryInstance = null;
}
