"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Check, ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Category,
  createCategory,
  deleteCategory,
  getApiMessage,
  listCategories,
  updateCategory,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { EmptyState, QueryError } from "@/components/dashboard/query-state";
import { Pagination } from "@/components/dashboard/pagination";
import { formatDate, pageItems } from "@/lib/utils";

type EditorState = { category?: Category; approveAfterSave?: boolean };

export default function CategoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Category | null>(null);
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listCategories(),
    select: (response) => response.data,
  });
  const categories = categoriesQuery.data || [];
  const totalPages = Math.max(1, Math.ceil(categories.length / 8));
  const safePage = Math.min(page, totalPages);
  const visible = pageItems(categories, safePage, 8);

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (response) => {
      toast.success(response.message);
      setEditor(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCategory>[1] }) => updateCategory(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      setEditor(null);
      setRejectTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (response) => {
      toast.success(response.message);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function approve(category: Category) {
    if (!category.image?.url) {
      toast.info("Add an image before approving this category");
      setEditor({ category, approveAfterSave: true });
      return;
    }
    updateMutation.mutate({ id: category._id, payload: { status: "approved" } });
  }

  return (
    <section className="mx-auto max-w-[1510px]">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Marketplace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Categories</h1>
          <p className="mt-2 text-sm text-slate-600">Create services and review categories proposed by tradespeople.</p>
        </div>
        <Button type="button" onClick={() => setEditor({})} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add category
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
        </div>
      ) : categoriesQuery.isError ? (
        <QueryError title="Couldn't load categories" onRetry={() => categoriesQuery.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" message="Create the first category to organize marketplace jobs." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-4">Category</th>
                  <th scope="col" className="px-5 py-4">Created</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((category) => (
                  <tr key={category._id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <CategoryIdentity category={category} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(category.createdAt)}</td>
                    <td className="px-5 py-4"><Badge tone={category.status}>{category.status || "unknown"}</Badge></td>
                    <td className="px-5 py-4">
                      <CategoryActions
                        category={category}
                        busy={updateMutation.isPending || deleteMutation.isPending}
                        onApprove={() => approve(category)}
                        onReject={() => setRejectTarget(category)}
                        onEdit={() => setEditor({ category })}
                        onDelete={() => setDeleteTarget(category)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {visible.map((category) => (
              <article key={category._id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <CategoryIdentity category={category} />
                  <Badge tone={category.status}>{category.status || "unknown"}</Badge>
                </div>
                <p className="mt-3 text-xs text-slate-500">Created {formatDate(category.createdAt)}</p>
                <div className="mt-4">
                  <CategoryActions
                    category={category}
                    busy={updateMutation.isPending || deleteMutation.isPending}
                    onApprove={() => approve(category)}
                    onReject={() => setRejectTarget(category)}
                    onEdit={() => setEditor({ category })}
                    onDelete={() => setDeleteTarget(category)}
                  />
                </div>
              </article>
            ))}
          </div>
          <div className="border-t border-slate-100 px-4 pb-5 sm:px-5">
            <Pagination page={safePage} total={categories.length} perPage={8} onPageChange={setPage} />
          </div>
        </div>
      )}

      {editor ? (
        <CategoryEditor
          key={`${editor.category?._id || "create"}-${editor.approveAfterSave ? "approve" : "edit"}`}
          state={editor}
          busy={createMutation.isPending || updateMutation.isPending}
          onClose={() => setEditor(null)}
          onSubmit={(payload) => {
            if (editor.category) updateMutation.mutate({ id: editor.category._id, payload });
            else createMutation.mutate(payload as Parameters<typeof createCategory>[0]);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title={`Reject ${rejectTarget?.name || "this category"}?`}
        description="The category will no longer be available for approval until an admin changes its status."
        confirmLabel="Reject category"
        busyLabel="Rejecting..."
        destructive
        busy={updateMutation.isPending}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => rejectTarget && updateMutation.mutate({ id: rejectTarget._id, payload: { status: "rejected" } })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || "this category"}?`}
        description="This permanently removes the category. Existing jobs may still reference its old record."
        confirmLabel="Delete category"
        busyLabel="Deleting..."
        destructive
        busy={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </section>
  );
}

function CategoryIdentity({ category }: { category: Category }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        role="img"
        aria-label={category.image?.url ? `${category.name} category` : "Category image not provided"}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 bg-cover bg-center text-primary"
        style={category.image?.url ? { backgroundImage: `url(${category.image.url})` } : undefined}
      >
        {!category.image?.url ? <ImageUp className="h-5 w-5" aria-hidden="true" /> : null}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">{category.name}</p>
        {!category.image?.url ? <p className="mt-0.5 text-xs font-medium text-amber-700">Image required</p> : null}
      </div>
    </div>
  );
}

function CategoryActions({ category, busy, onApprove, onReject, onEdit, onDelete }: { category: Category; busy: boolean; onApprove: () => void; onReject: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
      {category.status !== "approved" ? (
        <Button type="button" size="sm" variant="success" onClick={onApprove} disabled={busy}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Approve
        </Button>
      ) : null}
      {category.status === "pending" ? (
        <Button type="button" size="sm" variant="outline" onClick={onReject} disabled={busy}>
          <X className="h-4 w-4" aria-hidden="true" />
          Reject
        </Button>
      ) : null}
      <Button type="button" size="icon" variant="ghost" onClick={onEdit} disabled={busy} aria-label={`Edit ${category.name}`}>
        <Pencil className="h-5 w-5 text-primary" aria-hidden="true" />
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={onDelete} disabled={busy} aria-label={`Delete ${category.name}`}>
        <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
      </Button>
    </div>
  );
}

function CategoryEditor({ state, busy, onClose, onSubmit }: { state: EditorState; busy: boolean; onClose: () => void; onSubmit: (payload: { name: string; status: "approved" | "pending" | "rejected"; image?: File }) => void }) {
  const category = state.category;
  const [name, setName] = useState(category?.name || "");
  const [status, setStatus] = useState<"approved" | "pending" | "rejected">(state.approveAfterSave ? "approved" : category?.status || "approved");
  const [image, setImage] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState(category?.image?.url || "");

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function onImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose a valid image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be 5 MB or smaller");
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return toast.error("Category name is required");
    if (!category && !image) return toast.error("Category image is required");
    if (status === "approved" && !image && !category?.image?.url) return toast.error("Add an image before approving");
    onSubmit({ name: cleanName, status, image });
  }

  return (
    <DashboardModal
      open
      title={category ? "Edit category" : "Add category"}
      description={state.approveAfterSave ? "This proposal needs an image before it can be approved." : "Keep category names clear and upload a recognizable service image."}
      busy={busy}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          <span>Category name</span>
          <Input name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Plumbing" required />
        </label>
        <label className="space-y-2 text-sm font-semibold text-slate-700">
          <span>Status</span>
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Category image</span>
          <label className="group flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-5 text-center transition hover:border-primary hover:bg-blue-50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
            {previewUrl ? (
              <div className="mb-4 h-28 w-full max-w-xs rounded-lg bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${previewUrl})` }} role="img" aria-label="Selected category image preview" />
            ) : (
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm"><ImageUp className="h-6 w-6" aria-hidden="true" /></span>
            )}
            <span className="font-semibold text-slate-800">{image?.name || (previewUrl ? "Replace image" : "Choose an image")}</span>
            <span className="mt-1 text-xs text-slate-500">PNG, JPG or WebP / up to 5 MB</span>
            <input type="file" name="image" accept="image/png,image/jpeg,image/webp" onChange={onImage} className="sr-only" />
          </label>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : category ? "Save changes" : "Create category"}</Button>
        </div>
      </form>
    </DashboardModal>
  );
}
