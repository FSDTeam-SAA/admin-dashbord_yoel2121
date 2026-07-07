"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pagination } from "@/components/dashboard/pagination";
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
    discountPercentage: item.discountPercentage ? String(item.discountPercentage) : "",
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
  const visibleItems = useMemo(() => pageItems(orderedItems, page, 8), [orderedItems, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(orderedItems.length / 8));
    if (page > totalPages) setPage(totalPages);
  }, [orderedItems.length, page]);

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
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[36px] font-bold max-md:text-3xl">Carousels</h1>
        <Button type="button" onClick={openCreateModal} className="h-12 w-[170px] text-base max-sm:w-full">
          <Plus className="h-5 w-5" />
          Add Carousel
        </Button>
      </div>

      {carouselsQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-[#d7d7d7]">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b bg-[#f8fbfd] text-[#666]">
              <tr>
                <th className="px-5 py-4 font-normal">Image</th>
                <th className="px-5 py-4 font-normal">Title</th>
                <th className="px-5 py-4 font-normal">Type</th>
                <th className="px-5 py-4 font-normal">Discount</th>
                <th className="px-5 py-4 font-normal">Order</th>
                <th className="px-5 py-4 font-normal">Status</th>
                <th className="px-5 py-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item._id} className="border-b last:border-b-0">
                  <td className="px-5 py-5">
                    <div
                      className="h-14 w-24 rounded-[6px] bg-[#e7f6ff] bg-cover bg-center"
                      style={item.image?.url ? { backgroundImage: `url(${item.image.url})` } : undefined}
                    />
                  </td>
                  <td className="px-5 py-5">
                    <div className="font-semibold">{item.title}</div>
                    <div className="mt-1 max-w-[360px] truncate text-sm text-[#666]">{item.subtitle}</div>
                  </td>
                  <td className="px-5 py-5 capitalize">{item.type}</td>
                  <td className="px-5 py-5">{item.type === "coupon" ? `${item.discountPercentage || 0}%` : "-"}</td>
                  <td className="px-5 py-5">{item.order || 0}</td>
                  <td className="px-5 py-5">
                    <Badge tone={item.isActive ? "approved" : "suspended"}>{item.isActive ? "active" : "inactive"}</Badge>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="icon" variant="ghost" onClick={() => openEditModal(item)} aria-label="Edit carousel item">
                        <Pencil className="h-5 w-5 text-[#2e73b8]" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => setDeleteItem(item)} aria-label="Delete carousel item">
                        <Trash2 className="h-5 w-5 text-[#ff1f2d]" />
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
          <div className="px-5 pb-5">
            <Pagination page={page} total={orderedItems.length} perPage={8} onPageChange={setPage} />
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
        <ConfirmDeleteModal
          title={deleteItem.title}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 px-4 py-8">
      <div className="w-full max-w-[860px] rounded-[8px] bg-white p-5 shadow-2xl md:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-[24px] font-bold">{title}</h2>
          <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <Field label="Type">
            <select
              value={form.type}
              onChange={(event) => onChange((current) => ({ ...current, type: event.target.value as CarouselType }))}
              className="h-11 w-full rounded-[6px] border border-[#c9c9c9] bg-white px-4 text-sm outline-none transition focus:border-[#2fa7f0]"
            >
              <option value="ad">Ad</option>
              <option value="coupon">Coupon</option>
            </select>
          </Field>
          <Field label="Title">
            <Input value={form.title} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle} onChange={(event) => onChange((current) => ({ ...current, subtitle: event.target.value }))} />
          </Field>
          <Field label="Link">
            <Input value={form.link} onChange={(event) => onChange((current) => ({ ...current, link: event.target.value }))} />
          </Field>
          {form.type === "coupon" && (
            <Field label="Discount Percentage">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.discountPercentage}
                onChange={(event) => onChange((current) => ({ ...current, discountPercentage: event.target.value }))}
              />
            </Field>
          )}
          <Field label="Order">
            <Input type="number" value={form.order} onChange={(event) => onChange((current) => ({ ...current, order: event.target.value }))} />
          </Field>
          <label className="flex items-center gap-3 text-lg">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => onChange((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-5 w-5 accent-[#2e73b8]"
            />
            Active
          </label>
          <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed border-[#26a9f4] bg-[#181818] px-5 py-5 text-center text-white md:col-span-2">
            {previewUrl ? (
              <img src={previewUrl} alt="Carousel preview" className="mb-4 h-[116px] w-full max-w-[260px] rounded-[6px] object-cover" />
            ) : (
              <ImageUp className="mb-4 h-10 w-10" />
            )}
            <span className="text-base">Drop your files here</span>
            <span className="mt-5 max-w-full break-all text-base font-semibold">{fileName || "Choose File"}</span>
            <input type="file" accept="image/*" onChange={onImage} className="sr-only" />
          </label>
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button type="button" variant="outline" className="w-[110px]" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="w-[150px]">
              {busy ? "Saving..." : submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  title,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[430px] rounded-[8px] bg-white p-6 shadow-2xl">
        <h2 className="text-[24px] font-bold">Delete Carousel?</h2>
        <p className="mt-3 text-base text-[#555]">Are you sure you want to delete {title}?</p>
        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="outline" className="w-[96px]" onClick={onClose}>
            No
          </Button>
          <Button type="button" variant="destructive" className="w-[96px]" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting..." : "Yes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-lg">
      <span>{label}</span>
      {children}
    </label>
  );
}
