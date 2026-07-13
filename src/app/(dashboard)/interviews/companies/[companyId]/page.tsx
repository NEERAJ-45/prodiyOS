'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProfile } from '@/components/providers/ProfileProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2, ArrowLeft, Save, DollarSign, Cpu, Users, Heart, Plus, X, Globe, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Contact {
  name: string;
  role: string;
  email: string;
  linkedin: string;
}

interface Company {
  id: string;
  name: string;
  compRange: string;
  techStack: string[];
  contacts: Contact[];
  whyInterested: string;
  notes: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userEmail } = useProfile();
  const companyId = params.companyId as string;

  const [company, setCompany] = React.useState<Company | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [editCompRange, setEditCompRange] = React.useState('');
  const [editTechStack, setEditTechStack] = React.useState<string[]>([]);
  const [editWhy, setEditWhy] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [editContacts, setEditContacts] = React.useState<Contact[]>([]);
  const [newTech, setNewTech] = React.useState('');

  React.useEffect(() => {
    setMounted(true);
    if (!userEmail || !companyId) return;

    fetch(`/api/companies/${companyId}`)
      .then((r) => r.json())
      .then((data) => {
        const c = data.company;
        if (c) {
          setCompany(c);
          setEditCompRange(c.compRange || '');
          setEditTechStack(c.techStack || []);
          setEditWhy(c.whyInterested || '');
          setEditNotes(c.notes || '');
          setEditContacts(c.contacts || []);
        }
      })
      .catch(() => {});
  }, [userEmail, companyId]);

  async function saveCompany() {
    if (!company) return;
    setSaving(true);
    try {
      await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compRange: editCompRange,
          techStack: editTechStack,
          contacts: editContacts,
          whyInterested: editWhy,
          notes: editNotes,
        }),
      });
      toast.success('Company details saved');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  }

  function addTech() {
    const t = newTech.trim();
    if (t && !editTechStack.includes(t)) {
      setEditTechStack((prev) => [...prev, t]);
      setNewTech('');
    }
  }

  function removeTech(t: string) {
    setEditTechStack((prev) => prev.filter((x) => x !== t));
  }

  function addContact() {
    setEditContacts((prev) => [...prev, { name: '', role: '', email: '', linkedin: '' }]);
  }

  function updateContact(idx: number, field: keyof Contact, value: string) {
    setEditContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  }

  function removeContact(idx: number) {
    setEditContacts((prev) => prev.filter((_, i) => i !== idx));
  }

  if (!mounted || !company) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/interviews')} className="text-zinc-500 hover:text-zinc-300">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-zinc-400" />
            <h1 className="text-xl font-semibold text-zinc-100">{company.name}</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={saveCompany} disabled={saving} className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-zinc-500" />
              Compensation Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={editCompRange}
              onChange={(e) => setEditCompRange(e.target.value)}
              placeholder="e.g. $120k - $180k"
              className="bg-zinc-800 border-zinc-700 text-zinc-200"
            />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <Heart className="h-4 w-4 text-zinc-500" />
              Why Interested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={editWhy}
              onChange={(e) => setEditWhy(e.target.value)}
              rows={3}
              placeholder="Why this company?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 outline-none resize-none focus:border-zinc-600 placeholder:text-zinc-600"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-zinc-500" />
            Tech Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Add tech..."
              className="bg-zinc-800 border-zinc-700 text-zinc-200 flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
            />
            <Button variant="outline" size="sm" onClick={addTech} className="shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {editTechStack.map((t) => (
              <Badge key={t} variant="secondary" className="gap-1 px-2 py-1 text-xs bg-zinc-800 text-zinc-300">
                {t}
                <button onClick={() => removeTech(t)} className="hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {editTechStack.length === 0 && (
              <span className="text-xs text-zinc-600">No technologies added</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            Contacts & Referrals
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={addContact} className="text-zinc-500 hover:text-zinc-300 gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {editContacts.map((contact, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Contact #{idx + 1}</span>
                <button onClick={() => removeContact(idx)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={contact.name}
                  onChange={(e) => updateContact(idx, 'name', e.target.value)}
                  placeholder="Name"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs h-8"
                />
                <Input
                  value={contact.role}
                  onChange={(e) => updateContact(idx, 'role', e.target.value)}
                  placeholder="Role"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-zinc-600" />
                  <Input
                    value={contact.email}
                    onChange={(e) => updateContact(idx, 'email', e.target.value)}
                    placeholder="Email"
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs h-8"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3 text-zinc-600" />
                  <Input
                    value={contact.linkedin}
                    onChange={(e) => updateContact(idx, 'linkedin', e.target.value)}
                    placeholder="LinkedIn URL"
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs h-8"
                  />
                </div>
              </div>
            </div>
          ))}
          {editContacts.length === 0 && (
            <p className="text-sm text-zinc-600 text-center py-4">No contacts added yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-100">General Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={4}
            placeholder="Any additional notes..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 outline-none resize-y focus:border-zinc-600 placeholder:text-zinc-600 min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
