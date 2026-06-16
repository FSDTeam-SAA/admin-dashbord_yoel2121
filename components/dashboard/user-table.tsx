"use client";

import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUser, deleteUser, getApiMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/dashboard/pagination";
import { pageItems } from "@/lib/utils";

export function UserTable({
  users,
  loading,
  profileBasePath,
  queryKey,
}: {
  users: AdminUser[];
  loading: boolean;
  profileBasePath: "/users" | "/tradespeople";
  queryKey: unknown[];
}) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const perPage = 10;
  const visible = useMemo(() => pageItems(users, page, perPage), [users, page]);
  const removeMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  if (loading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-[64px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#dedede] text-base font-normal text-[#6d6d6d]">
            <th className="py-4 font-normal">Provider Name</th>
            <th className="py-4 font-normal">Email</th>
            <th className="py-4 font-normal">Services Offered</th>
            <th className="py-4 text-right font-normal">Action</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((user) => (
            <tr key={user._id} className="border-b border-[#dedede]">
              <td className="py-6">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.profileImage?.url} size={40} />
                  <span className="text-base">{user.name || "Unnamed user"}</span>
                </div>
              </td>
              <td className="py-6 text-base">{user.email}</td>
              <td className="py-6 text-base">
                {Array.isArray(user.operatingTrades) && user.operatingTrades.length
                  ? user.operatingTrades.map((trade) => (typeof trade === "string" ? trade : trade.name)).join(", ")
                  : user.serviceArea || "123"}
              </td>
              <td className="py-6">
                <div className="flex justify-end gap-5">
                  <Link href={`${profileBasePath}/${user._id}`} aria-label="View profile" className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-black/5">
                    <Eye className="h-5 w-5 text-[#202020]" />
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete user"
                    onClick={() => removeMutation.mutate(user._id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-5 w-5 text-[#ff1f2d]" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} total={users.length} perPage={perPage} onPageChange={setPage} />
    </div>
  );
}
