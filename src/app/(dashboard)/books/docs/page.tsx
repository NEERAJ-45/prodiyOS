'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { FileCode, Plus, Pencil, Trash2, Loader2, FileUp, GripVertical, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { toast } from '@/components/ui/toast';
import {
  useArticlesQuery,
  useSaveArticle,
  useDeleteArticle,
  type ArticleData,
  type ArticleCodeFile,
  type ArticleAsset,
} from '@/hooks/use-articles';
import { ArticleEditorDialog } from '@/components/articles/ArticleEditorDialog';

export default function DocsPage() {
  const { data, isLoading } = useArticlesQuery();
  const saveArticle = useSaveArticle();
  const deleteArticle = useDeleteArticle();

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<ArticleData | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const articles: ArticleData[] = data?.articles ?? [];

  function openNew() {
    setEditingArticle(null);
    setEditorOpen(true);
  }

  function openEdit(article: ArticleData) {
    setEditingArticle(article);
    setEditorOpen(true);
  }

  function handleSave(data: { id?: string; title: string; content: string; codeFiles: ArticleCodeFile[]; assets: ArticleAsset[] }) {
    saveArticle.mutate(data, {
      onSuccess: () => {
        toast({ title: data.id ? 'Article updated' : 'Article created' });
        setEditorOpen(false);
        setEditingArticle(null);
      },
      onError: () => toast({ variant: 'destructive', title: 'Failed to save article' }),
    });
  }

  function handleDelete(id: string) {
    deleteArticle.mutate(id, {
      onSuccess: () => toast({ title: 'Article deleted' }),
      onError: () => toast({ variant: 'destructive', title: 'Failed to delete' }),
    });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => prev === id ? null : id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        </p>
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Write Article
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : articles.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <FileCode className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">No articles yet</p>
            <p className="text-xs text-zinc-600 mt-1">Click &ldquo;Write Article&rdquo; to create your first research note</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleExpand(article.id)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-zinc-100 truncate">{article.title}</h3>
                          {article.codeFiles.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                              <GripVertical className="h-3 w-3" />
                              {article.codeFiles.length}
                            </span>
                          )}
                          {article.assets.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                              <Image className="h-3 w-3" />
                              {article.assets.length}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {article.content ? (
                            article.content.length > 120
                              ? article.content.slice(0, 120).replace(/[#*`\[\]]/g, '') + '...'
                              : article.content.replace(/[#*`\[\]]/g, '')
                          ) : 'No content'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleExpand(article.id)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => openEdit(article)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-4 border-t border-zinc-800 pt-4"
                      >
                        {article.content && (
                          <div className="prose prose-invert prose-sm max-w-none bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {article.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {article.codeFiles.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Code Files</h4>
                            {article.codeFiles.map((file, i) => (
                              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border-b border-zinc-800">
                                  <FileUp className="h-3 w-3 text-zinc-500" />
                                  <span className="text-xs text-zinc-300">{file.name}</span>
                                  <span className="text-[10px] text-zinc-600 ml-auto">{file.language}</span>
                                </div>
                                <pre className="p-3 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
                                  <code>{file.content}</code>
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}

                        {article.assets.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Assets</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {article.assets.map((asset, i) => (
                                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                                  {asset.mimeType.startsWith('image/') ? (
                                    <img src={asset.data} alt={asset.name} className="w-full h-20 object-cover rounded" />
                                  ) : (
                                    <div className="w-full h-20 flex items-center justify-center bg-zinc-800 rounded">
                                      <FileUp className="h-5 w-5 text-zinc-500" />
                                    </div>
                                  )}
                                  <p className="text-[10px] text-zinc-500 mt-1 truncate">{asset.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <ArticleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initial={editingArticle ? {
          id: editingArticle.id,
          title: editingArticle.title,
          content: editingArticle.content,
          codeFiles: editingArticle.codeFiles,
          assets: editingArticle.assets,
        } : undefined}
        onSave={handleSave}
        isPending={saveArticle.isPending}
      />
    </div>
  );
}
