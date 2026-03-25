"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LOCALES } from "@/lib/locales";
import { PlusIcon, Trash2Icon, KeyRoundIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

export interface LocalizationKeyData {
  _id: string;
  key: string;
  description?: string;
  values: Record<string, string>;
}

interface Props {
  projectSlug: string;
  defaultLanguage: string;
  otherLanguages: string[];
  initialKeys: LocalizationKeyData[];
}

interface TableRow {
  id: string;
  lang: string;
  value: string;
}

function langLabel(code: string): string {
  return LOCALES.find((l) => l.value === code)?.label ?? code;
}

let rowCounter = 0;
function newRowId() {
  return `row-${++rowCounter}`;
}

function rowsFromAllLanguages(
  k: LocalizationKeyData,
  defaultLanguage: string,
  otherLanguages: string[]
): TableRow[] {
  const allLangs = [defaultLanguage, ...otherLanguages];
  return allLangs.map((lang) => ({
    id: newRowId(),
    lang,
    value: k.values[lang] ?? "",
  }));
}

export default function KeysManager({ projectSlug, defaultLanguage, otherLanguages, initialKeys }: Props) {
  const [keys, setKeys] = useState<LocalizationKeyData[]>(initialKeys);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Inline table state
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [applyLoading, setApplyLoading] = useState(false);

  // Add Key dialog
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [addKeyError, setAddKeyError] = useState("");
  const [addKeyLoading, setAddKeyLoading] = useState(false);

  // Delete Key
  const [deleteKeyLoading, setDeleteKeyLoading] = useState(false);

  // Edit Key
  const [editKeyOpen, setEditKeyOpen] = useState(false);
  const [editKeyName, setEditKeyName] = useState("");
  const [editKeyDescription, setEditKeyDescription] = useState("");
  const [editKeyError, setEditKeyError] = useState("");
  const [editKeyLoading, setEditKeyLoading] = useState(false);

  function openEditKey() {
    if (!selectedKey) return;
    setEditKeyName(selectedKey.key);
    setEditKeyDescription(selectedKey.description ?? "");
    setEditKeyError("");
    setEditKeyOpen(true);
  }

  async function handleEditKey() {
    if (!selectedKey) return;
    if (!editKeyName.trim()) {
      setEditKeyError("Key name is required.");
      return;
    }
    if (editKeyName.trim() === selectedKey.key) {
      setEditKeyOpen(false);
      return;
    }
    setEditKeyLoading(true);
    setEditKeyError("");
    try {
      const res = await fetch(`/api/projects/${projectSlug}/keys/${selectedKey._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: editKeyName.trim(), description: editKeyDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditKeyError(data.message ?? "Failed to rename key.");
        toast.error(data.message ?? "Failed to rename key.");
        return;
      }
      const updated: LocalizationKeyData = {
        _id: data.key.id,
        key: data.key.key,
        description: data.key.description ?? "",
        values: data.key.values ?? {},
      };
      setKeys((prev) =>
        prev.map((k) => (k._id === updated._id ? updated : k)).sort((a, b) => a.key.localeCompare(b.key))
      );
      setEditKeyOpen(false);
      toast.success("Key renamed successfully.");
    } catch {
      setEditKeyError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setEditKeyLoading(false);
    }
  }

  const selectedKey = keys.find((k) => k._id === selectedKeyId) ?? null;

  // Sync table rows when selected key changes
  useEffect(() => {
    if (selectedKey) {
      setTableRows(rowsFromAllLanguages(selectedKey, defaultLanguage, otherLanguages));
    } else {
      setTableRows([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeyId]);

  const filteredKeys = useMemo(
    () =>
      search.trim()
        ? keys.filter((k) => k.key.toLowerCase().includes(search.trim().toLowerCase()))
        : keys,
    [keys, search]
  );

  const translationCount = useMemo(
    () => tableRows.filter((r) => r.value.trim()).length,
    [tableRows]
  );

  const isTableValid = useMemo(
    () => {
      const defaultRow = tableRows.find((r) => r.lang === defaultLanguage);
      return !!defaultRow && defaultRow.value.trim() !== "";
    },
    [tableRows, defaultLanguage]
  );

  // --- Add Key ---
  function openAddKey() {
    setNewKeyName("");
    setNewKeyDescription("");
    setAddKeyError("");
    setAddKeyOpen(true);
  }

  async function handleAddKey() {
    if (!newKeyName.trim()) {
      setAddKeyError("Key name is required.");
      return;
    }
    setAddKeyLoading(true);
    setAddKeyError("");
    try {
      const res = await fetch(`/api/projects/${projectSlug}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKeyName.trim(), description: newKeyDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddKeyError(data.message ?? "Failed to create key.");
        toast.error(data.message ?? "Failed to create key.");
        return;
      }
      const created: LocalizationKeyData = {
        _id: data.key.id,
        key: data.key.key,
        description: data.key.description ?? "",
        values: data.key.values ?? {},
      };
      setKeys((prev) => [...prev, created].sort((a, b) => a.key.localeCompare(b.key)));
      setSelectedKeyId(created._id);
      setAddKeyOpen(false);
      toast.success("Key created successfully.");
    } catch {
      setAddKeyError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setAddKeyLoading(false);
    }
  }

  // --- Delete Key ---
  async function handleDeleteKey() {
    if (!selectedKey) return;
    setDeleteKeyLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/keys/${selectedKey._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete key.");
        return;
      }
      setKeys((prev) => prev.filter((k) => k._id !== selectedKey._id));
      setSelectedKeyId(null);
      toast.success("Key deleted.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleteKeyLoading(false);
    }
  }

  // --- Table row actions ---
  function handleRemoveRow(id: string) {
    setTableRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleRowValueChange(id: string, value: string) {
    setTableRows((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
  }

  // --- Apply (bulk upsert) ---
  async function handleApply() {
    if (!selectedKey) return;
    setApplyLoading(true);
    try {
      const values: Record<string, string> = {};
      for (const row of tableRows) {
        if (row.lang.trim() && row.value.trim()) {
          values[row.lang.trim()] = row.value;
        }
      }
      const res = await fetch(`/api/projects/${projectSlug}/keys/${selectedKey._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to save.");
        return;
      }
      const updated: LocalizationKeyData = {
        _id: data.key.id,
        key: data.key.key,
        description: data.key.description ?? "",
        values: data.key.values ?? {},
      };
      setKeys((prev) => prev.map((k) => (k._id === updated._id ? updated : k)));
      setTableRows(rowsFromAllLanguages(updated, defaultLanguage, otherLanguages));
      toast.success("Translations saved.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setApplyLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — key list */}
        <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-3">
            <Input
              placeholder="Search keys…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 flex-1 text-xs"
            />
            <Button size="icon-sm" onClick={openAddKey} title="New key">
              <PlusIcon />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <KeyRoundIcon className="mb-3 size-8 text-zinc-300" />
                <p className="text-xs text-zinc-400">
                  {search ? "No matching keys." : "No keys yet."}
                </p>
                {!search && (
                  <Button size="xs" variant="outline" className="mt-3" onClick={openAddKey}>
                    Add first key
                  </Button>
                )}
              </div>
            ) : (
              <ul>
                {filteredKeys.map((k) => (
                  <li key={k._id}>
                    <button
                      onClick={() => setSelectedKeyId(k._id)}
                      className={`w-full px-4 py-2.5 text-left text-xs font-mono transition-colors hover:bg-zinc-50 ${
                        selectedKeyId === k._id
                          ? "bg-zinc-100 font-semibold text-zinc-900"
                          : "text-zinc-600"
                      }`}
                    >
                      {k.key}
                      <span className="ml-2 text-zinc-400">
                        ({Object.keys(k.values).length})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400">
            {keys.length} {keys.length === 1 ? "key" : "keys"}
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex flex-1 flex-col overflow-hidden bg-zinc-50">
          {!selectedKey ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <KeyRoundIcon className="size-10 text-zinc-300" />
              <p className="text-sm text-zinc-400">Select a key to view its translations.</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono text-sm font-semibold text-zinc-900">{selectedKey.key}</p>
                    <Button size="icon-xs" variant="outline" onClick={openEditKey} title="Rename key" className="text-zinc-400 hover:text-zinc-700">
                      <PencilIcon className="size-3.5" />
                    </Button>
                  </div>
                  {selectedKey.description ? (
                    <p className="mt-0.5 text-xs text-zinc-400 max-w-sm truncate" title={selectedKey.description}>
                      {selectedKey.description}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {translationCount} {translationCount === 1 ? "translation" : "translations"} 
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleApply} disabled={applyLoading || !isTableValid}>
                    {applyLoading ? "Saving…" : "Apply"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteKey}
                    disabled={deleteKeyLoading}
                  >
                    {deleteKeyLoading ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </div>

              {/* Inline table */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                        <TableHead className="w-64 pl-4">Language</TableHead>
                        <TableHead className="pl-2">Translation</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableRows.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={3} className="py-10 text-center text-sm text-zinc-400">
                            No translations yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableRows.map((row) => {
                          const isDefault = row.lang === defaultLanguage;
                          return (
                            <TableRow key={row.id} className="group">
                              <TableCell className="pl-4 py-1.5 align-middle">
                                <span className="text-sm text-zinc-700">
                                  {langLabel(row.lang)}
                                </span>
                                {isDefault && (
                                  <span className="ml-2 text-xs text-zinc-400">(default)</span>
                                )}
                              </TableCell>
                              <TableCell className="pl-2 py-1.5 align-middle">
                                <Input
                                  value={row.value}
                                  onChange={(e) =>
                                    handleRowValueChange(row.id, e.target.value)
                                  }
                                  placeholder="Enter translation…"
                                  className={isDefault && !row.value.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}
                                />
                              </TableCell>
                              <TableCell className="py-1.5 pr-3 align-middle">
                                {!isDefault && (
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveRow(row.id)}
                                    title="Remove row"
                                    className="opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2Icon />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Key dialog */}
      <Dialog open={editKeyOpen} onOpenChange={setEditKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit key</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-key-name">Key name</Label>
              <Input
                id="edit-key-name"
                value={editKeyName}
                onChange={(e) => setEditKeyName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-key-description">
                Description{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="edit-key-description"
                value={editKeyDescription}
                onChange={(e) => setEditKeyDescription(e.target.value)}
                placeholder="Describe the context of this key to help AI generate better translations…"
                rows={3}
              />
            </div>
            {editKeyError && <p className="text-xs text-destructive">{editKeyError}</p>}
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleEditKey} disabled={editKeyLoading}>
              {editKeyLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Key dialog */}
      <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New key</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-key-name">Key name</Label>
              <Input
                id="new-key-name"
                placeholder="e.g. common.button.save"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-key-description">
                Description{" "}
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="new-key-description"
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
                placeholder="Describe the context of this key to help AI generate better translations…"
                rows={3}
              />
            </div>
            {addKeyError && <p className="text-xs text-destructive">{addKeyError}</p>}
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleAddKey} disabled={addKeyLoading}>
              {addKeyLoading ? "Creating…" : "Create key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
