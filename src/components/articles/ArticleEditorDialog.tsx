'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileCode, Image, Plus, Trash2, GripVertical, FileUp } from 'lucide-react';
import type { ArticleCodeFile, ArticleAsset } from '@/hooks/use-articles';

const LANGUAGES = [
  'text', 'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
  'go', 'rust', 'sql', 'bash', 'json', 'xml', 'yaml', 'html', 'css',
  'scss', 'markdown',
];

interface ArticleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: {
    id?: string;
    title: string;
    content: string;
    codeFiles: ArticleCodeFile[];
    assets: ArticleAsset[];
  };
  onSave: (data: {
    id?: string;
    title: string;
    content: string;
    codeFiles: ArticleCodeFile[];
    assets: ArticleAsset[];
  }) => void;
  isPending: boolean;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ArticleEditorDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  isPending,
}: ArticleEditorDialogProps) {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [codeFiles, setCodeFiles] = React.useState<ArticleCodeFile[]>([]);
  const [assets, setAssets] = React.useState<ArticleAsset[]>([]);
  const [activeTab, setActiveTab] = React.useState('write');

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '');
      setContent(initial?.content || '');
      setCodeFiles(initial?.codeFiles || []);
      setAssets(initial?.assets || []);
      setActiveTab('write');
    }
  }, [open, initial]);

  const isValid = title.trim().length > 0;

  function addCodeFile() {
    setCodeFiles((prev) => [...prev, { name: '', language: 'text', content: '' }]);
  }

  function updateCodeFile(index: number, field: keyof ArticleCodeFile, value: string) {
    setCodeFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeCodeFile(index: number) {
    setCodeFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newAssets: ArticleAsset[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = await readFileAsBase64(file);
      newAssets.push({ name: file.name, mimeType: file.type, data });
    }
    setAssets((prev) => [...prev, ...newAssets]);
    e.target.value = '';
  }

  function removeAsset(index: number) {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!isValid) return;
    onSave({
      id: initial?.id,
      title: title.trim(),
      content,
      codeFiles,
      assets,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {initial?.id ? 'Edit Article' : 'Write Article'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="bg-zinc-900 border-zinc-700 text-zinc-100"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="write" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5">
                <FileCode className="h-3.5 w-3.5" />
                Write
              </TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5">
                <GripVertical className="h-3.5 w-3.5" />
                Code ({codeFiles.length})
              </TabsTrigger>
              <TabsTrigger value="assets" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5">
                <Image className="h-3.5 w-3.5" />
                Assets ({assets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="flex-1 flex gap-3 mt-3 overflow-hidden">
              <div className="flex-1 flex flex-col">
                <label className="text-xs text-zinc-500 mb-1">Markdown</label>
<textarea
  value={content}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
  placeholder="Write your article in markdown..."
  className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm resize-none rounded-lg p-3 outline-none focus:border-primary/50"
/>
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <label className="text-xs text-zinc-500 mb-1">Preview</label>
                <div className="flex-1 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg p-4 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*Start writing to see preview...*'}
                  </ReactMarkdown>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-3 overflow-y-auto flex-1 space-y-3">
              {codeFiles.map((file, i) => (
                <div key={i} className="flex items-start gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={file.name}
                        onChange={(e) => updateCodeFile(i, 'name', e.target.value)}
                        placeholder="Filename (e.g. server.ts)"
                        className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 text-xs h-8"
                      />
                      <Select value={file.language} onValueChange={(v) => updateCodeFile(i, 'language', v)}>
                        <SelectTrigger className="w-[130px] bg-zinc-800 border-zinc-700 text-zinc-100 text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang} value={lang} className="text-xs">
                              {lang}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCodeFile(i)}
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
<textarea
  value={file.content}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateCodeFile(i, 'content', e.target.value)}
  placeholder="Paste your code here..."
  className="min-h-[100px] bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono text-xs resize-y rounded-lg p-2 outline-none focus:border-primary/50"
/>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCodeFile} className="border-dashed border-zinc-700 text-zinc-400 w-full">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Code File
              </Button>
            </TabsContent>

            <TabsContent value="assets" className="mt-3 overflow-y-auto flex-1 space-y-3">
              {assets.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {assets.map((asset, i) => (
                    <div key={i} className="relative group bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      {asset.mimeType.startsWith('image/') ? (
                        <img
                          src={asset.data}
                          alt={asset.name}
                          className="w-full h-24 object-cover rounded mb-1"
                        />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-zinc-800 rounded mb-1">
                          <FileUp className="h-6 w-6 text-zinc-500" />
                        </div>
                      )}
                      <p className="text-[10px] text-zinc-400 truncate">{asset.name}</p>
                      <button
                        onClick={() => removeAsset(i)}
                        className="absolute top-1 right-1 p-1 rounded bg-red-950/80 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-500 transition-colors">
                <FileUp className="h-4 w-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Upload assets (images, files...)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.zip,.json,.csv"
                  onChange={handleAssetUpload}
                  className="hidden"
                />
              </label>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={handleSave} disabled={!isValid || isPending}>
            {isPending ? 'Saving...' : 'Save Article'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
