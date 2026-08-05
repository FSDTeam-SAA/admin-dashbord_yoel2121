"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ImageUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pagination } from "@/components/dashboard/pagination";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DashboardModal } from "@/components/dashboard/dashboard-modal";
import { QueryError } from "@/components/dashboard/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { pageItems } from "@/lib/utils";
import {
  CarouselItem,
  createCarouselItem,
  deleteCarouselItem,
  getApiMessage,
  listCarousels,
  updateCarouselItem,
} from "@/lib/api";

type CarouselType = "ad" | "coupon";

type CarouselForm = {
  type: CarouselType;
  title: string;
  subtitle: string;
  link: string;
  discountPercentage: string;
  order: string;
  isActive: boolean;
};

const initialForm: CarouselForm = {
  type: "ad",
  title: "",
  subtitle: "",
  link: "",
  discountPercentage: "",
  order: "0",
  isActive: true,
};

function formFromItem(item: CarouselItem): CarouselForm {
  return {
    type: item.type,
    title: item.title || "",
    subtitle: item.subtitle || "",
    link: item.link || "",
    discountPercentage: item.discountPercentage != null ? String(item.discountPercentage) : "",
    order: String(item.order || 0),
    isActive: item.isActive !== false,
  };
}

export default function CarouselsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<CarouselItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<CarouselItem | null>(null);
  const [form, setForm] = useState<CarouselForm>(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const carouselsQuery = useQuery({
    queryKey: ["admin-carousels"],
    queryFn: () => listCarousels(),
    select: (response) => response.data,
  });

  const orderedItems = useMemo(
    () => [...(carouselsQuery.data || [])].sort((first, second) => (first.order || 0) - (second.order || 0)),
    [carouselsQuery.data],
  );
  const totalPages = Math.max(1, Math.ceil(orderedItems.length / 8));
  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => pageItems(orderedItems, safePage, 8), [orderedItems, safePage]);

  const createMutation = useMutation({
    mutationFn: createCarouselItem,
    onSuccess: (response) => {
      toast.success(response.message);
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["admin-carousels"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCarouselItem>[1] }) => updateCarouselItem(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      closeFormModal();
      queryClient.invalidateQueries({ queryKey: ["admin-carousels"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCarouselItem,
    onSuccess: (response) => {
      toast.success(response.message);
      setDeleteItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin-carousels"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function resetUpload() {
    setImage(null);
    setFileName("");
    setPreviewUrl("");
  }

  function openCreateModal() {
    setForm(initialForm);
    resetUpload();
    setCreateOpen(true);
  }

  function openEditModal(item: CarouselItem) {
    setForm(formFromItem(item));
    resetUpload();
    setPreviewUrl(item.image?.url || "");
    setEditItem(item);
  }

  function closeFormModal() {
    setCreateOpen(false);
    setEditItem(null);
    setForm(initialForm);
    resetUpload();
  }

  function onImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (file && !file.type.startsWith("image/")) {
      event.target.value = "";
      return toast.error("Choose a valid image file");
    }
    if (file && file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      return toast.error("Image must be 5 MB or smaller");
    }
    setImage(file);
    setFileName(file?.name || "");
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : editItem?.image?.url || "");
  }

  function submitForm(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.subtitle.trim()) return toast.error("Subtitle is required");
    if (form.type === "coupon" && !form.discountPercentage.trim()) return toast.error("Discount percentage is required");
    const discount = Number(form.discountPercentage);
    if (form.type === "coupon" && (!Number.isFinite(discount) || discount < 0 || discount > 100)) {
      return toast.error("Discount percentage must be between 0 and 100");
    }
    const order = Number(form.order || 0);
    if (!Number.isInteger(order) || order < 0) return toast.error("Order must be a whole number of 0 or more");
    if (createOpen && !image) return toast.error("Image is required");

    const payload = {
      type: form.type,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      link: form.link.trim(),
      discountPercentage: form.discountPercentage.trim(),
      order: form.order.trim(),
      isActive: form.isActive,
      image,
    };

    if (editItem) {
      updateMutation.mutate({ id: editItem._id, payload });
    } else {
      if (!image) return toast.error("Image is required");
      createMutation.mutate({ ...payload, image });
    }
  }

  const formBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <section className="mx-auto max-w-[1510px]">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Content</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Carousels</h1>
          <p className="mt-2 text-sm text-slate-600">Manage promotional banners and coupons shown to customers.</p>
        </div>
        <Button type="button" onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add carousel
        </Button>
      </div>

      {carouselsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : carouselsQuery.isError ? (
        <QueryError title="Couldn't load carousel items" onRetry={() => carouselsQuery.refetch()} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-4">Image</th>
                <th scope="col" className="px-5 py-4">Title</th>
                <th scope="col" className="px-5 py-4">Type</th>
                <th scope="col" className="px-5 py-4">Discount</th>
                <th scope="col" className="px-5 py-4">Order</th>
                <th scope="col" className="px-5 py-4">Status</th>
                <th scope="col" className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item._id} className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70">
                  <td className="px-5 py-5">
                    <div
                      className="h-14 w-24 rounded-[6px] bg-[#e7f6ff] bg-cover bg-center"
                      style={item.image?.url ? { backgroundImage: `url(${item.image.url})` } : undefined}
                      role="img"
                      aria-label={item.image?.url ? `${item.title} preview` : "Image not provided"}
                    />
                  </td>
                  <td className="px-5 py-5">
                    <div className="font-semibold">{item.title}</div>
                    <div className="mt-1 max-w-[360px] truncate text-sm text-[#666]">{item.subtitle}</div>
                  </td>
                  <td className="px-5 py-5 capitalize">{item.type}</td>
                  <td className="px-5 py-5">{item.type === "coupon" ? `${item.discountPercentage ?? 0}%` : "-"}</td>
                  <td className="px-5 py-5">{item.order ?? 0}</td>
                  <td className="px-5 py-5">
                    <Badge tone={item.isActive ? "approved" : "suspended"}>{item.isActive ? "active" : "inactive"}</Badge>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="icon" variant="ghost" onClick={() => openEditModal(item)} aria-label="Edit carousel item">
                        <Pencil className="h-5 w-5 text-primary" aria-hidden="true" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => setDeleteItem(item)} aria-label="Delete carousel item">
                        <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!orderedItems.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[#666]">
                    No carousel items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {visibleItems.map((item) => (
              <article key={item._id} className="p-4">
                <div className="flex gap-3">
                  <div
                    className="h-16 w-24 shrink-0 rounded-lg bg-blue-50 bg-cover bg-center"
                    style={item.image?.url ? { backgroundImage: `url(${item.image.url})` } : undefined}
                    role="img"
                    aria-label={item.image?.url ? `${item.title} preview` : "Image not provided"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-bold text-slate-950">{item.title}</h2>
                      <Badge tone={item.isActive ? "approved" : "suspended"}>{item.isActive ? "active" : "inactive"}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.subtitle}</p>
                    <p className="mt-2 text-xs capitalize text-slate-500">{item.type}{item.type === "coupon" ? ` / ${item.discountPercentage ?? 0}% off` : ""} / order {item.order ?? 0}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(item)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setDeleteItem(item)} aria-label={`Delete ${item.title}`}>
                    <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            ))}
            {!orderedItems.length ? <p className="p-10 text-center text-sm text-slate-600">No carousel items found.</p> : null}
          </div>
          <div className="px-5 pb-5">
            <Pagination page={safePage} total={orderedItems.length} perPage={8} onPageChange={setPage} />
          </div>
        </div>
      )}

      {(createOpen || editItem) && (
        <FormModal
          title={editItem ? "Edit Carousel" : "Add Carousel"}
          form={form}
          fileName={fileName}
          previewUrl={previewUrl}
          busy={formBusy}
          submitText={editItem ? "Save Changes" : "Submit"}
          onChange={setForm}
          onImage={onImage}
          onClose={closeFormModal}
          onSubmit={submitForm}
        />
      )}

      {deleteItem && (
        <ConfirmDialog
          open
          title="Delete carousel item?"
          description={`"${deleteItem.title}" will be permanently removed from the carousel.`}
          confirmLabel="Delete item"
          busyLabel="Deleting..."
          destructive
          busy={deleteMutation.isPending}
          onClose={() => setDeleteItem(null)}
          onConfirm={() => deleteMutation.mutate(deleteItem._id)}
        />
      )}
    </section>
  );
}

function FormModal({
  title,
  form,
  fileName,
  previewUrl,
  busy,
  submitText,
  onChange,
  onImage,
  onClose,
  onSubmit,
}: {
  title: string;
  form: CarouselForm;
  fileName: string;
  previewUrl: string;
  busy: boolean;
  submitText: string;
  onChange: React.Dispatch<React.SetStateAction<CarouselForm>>;
  onImage: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <DashboardModal open title={title} description="Use a clear image and concise copy for the customer-facing carousel." busy={busy} onClose={onClose} maxWidth="max-w-[860px]">
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <Field label="Type">
            <select
              name="type"
              value={form.type}
              onChange={(event) => onChange((current) => ({ ...current, type: event.target.value as CarouselType }))}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="ad">Ad</option>
              <option value="coupon">Coupon</option>
            </select>
          </Field>
          <Field label="Title">
            <Input name="title" maxLength={100} required value={form.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="Subtitle">
            <Input name="subtitle" maxLength={180} required value={form.subtitle} onChange={(event) => onChange((current) => ({ ...current, subtitle: event.target.value }))} />
          </Field>
          <Field label="Link">
            <Input name="link" type="text" placeholder="/offers or https://example.com" value={form.link} onChange={(event) => onChange((current) => ({ ...current, link: event.target.value }))} />
          </Field>
          {form.type === "coupon" && (
            <Field label="Discount Percentage">
              <Input
                type="number"
                name="discountPercentage"
                min="0"
                max="100"
                value={form.discountPercentage}
                onChange={(event) => onChange((current) => ({ ...current, discountPercentage: event.target.value }))}
              />
            </Field>
          )}
          <Field label="Order">
            <Input name="order" type="number" min="0" step="1" value={form.order} onChange={(event) => onChange((current) => ({ ...current, order: event.target.value }))} />
          </Field>
          <label className="flex items-center gap-3 text-lg">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => onChange((current) => ({ ...current, isActive: event.target.checked }))}
              name="isActive"
              className="h-5 w-5 accent-primary"
            />
            Active
          </label>
          <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-5 py-5 text-center text-slate-800 transition hover:border-primary hover:bg-blue-50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 md:col-span-2">
            {previewUrl ? (
              <div className="mb-4 h-[116px] w-full max-w-[260px] rounded-lg bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${previewUrl})` }} role="img" aria-label="Carousel image preview" />
            ) : (
              <ImageUp className="mb-4 h-10 w-10 text-primary" aria-hidden="true" />
            )}
            <span className="text-base font-semibold">{fileName || (previewUrl ? "Replace image" : "Choose an image")}</span>
            <span className="mt-1 text-xs text-slate-500">PNG, JPG or WebP / up to 5 MB</span>
            <input type="file" name="image" accept="image/png,image/jpeg,image/webp" onChange={onImage} className="sr-only" />
          </label>
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row md:col-span-2">
            <Button type="button" variant="outline" className="w-full sm:w-[110px]" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="w-full sm:w-[150px]">
              {busy ? "Saving..." : submitText}
            </Button>
          </div>
        </form>
    </DashboardModal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
