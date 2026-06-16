"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteCategory, getApiMessage, listCategories, proposeCategory, updateCategoryStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/dashboard/pagination";
import { pageItems } from "@/lib/utils";

export default function CategoryPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [page, setPage] = useState(1);
  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listCategories(),
    select: (response) => response.data,
  });
  const visible = useMemo(() => pageItems(categoriesQuery.data || [], page, 5), [categoriesQuery.data, page]);

  const createMutation = useMutation({
    mutationFn: proposeCategory,
    onSuccess: (response) => {
      toast.success(response.message);
      setName("");
      setFileName("");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => updateCategoryStatus(id, status),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    setFileName(event.target.files?.[0]?.name || "");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return toast.error("Category name is required");
    createMutation.mutate(name.trim());
  }

  return (
    <section className="mx-auto max-w-[1510px]">
      <h1 className="mb-14 text-[36px] font-bold max-md:mb-8 max-md:text-3xl">Category</h1>
      <form onSubmit={onSubmit} className="space-y-10">
        <label className="block space-y-2">
          <span className="text-[22px] font-bold">Category Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Plumber" className="h-[52px] bg-[#f9f9f9]" />
        </label>
        <label className="flex min-h-[480px] cursor-pointer flex-col items-center justify-center rounded-[6px] border border-dashed border-[#26a9f4] bg-[#181818] px-5 text-center text-white max-lg:min-h-[360px]">
          <ImageUp className="mb-5 h-11 w-11" />
          <span className="text-base">Drop your files here</span>
          <span className="mt-7 text-base font-semibold">{fileName || "Choose File"}</span>
          <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
        </label>
        <Button type="submit" disabled={createMutation.isPending} size="lg" className="h-[78px] w-[287px] text-[26px] max-sm:w-full">
          {createMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </form>

      <div className="mt-12">
        {categoriesQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b text-[#666]">
                <tr>
                  <th className="py-4 font-normal">Category</th>
                  <th className="py-4 font-normal">Status</th>
                  <th className="py-4 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((category) => (
                  <tr key={category._id} className="border-b">
                    <td className="py-5 text-base font-semibold">{category.name}</td>
                    <td className="py-5">
                      <Badge tone={category.status}>{category.status || "approved"}</Badge>
                    </td>
                    <td className="py-5">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="success" onClick={() => updateMutation.mutate({ id: category._id, status: "approved" })}>
                          Approve
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => updateMutation.mutate({ id: category._id, status: "rejected" })}>
                          Reject
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => deleteMutation.mutate(category._id)} aria-label="Delete category">
                          <Trash2 className="h-5 w-5 text-[#ff1f2d]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} total={categoriesQuery.data?.length || 0} perPage={5} onPageChange={setPage} />
          </div>
        )}
      </div>
    </section>
  );
}
