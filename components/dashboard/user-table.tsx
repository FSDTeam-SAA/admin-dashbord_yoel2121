"use client";

import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminUser, deleteUser, getApiMessage } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { EmptyState, QueryError } from "@/components/dashboard/query-state";
import { Pagination } from "@/components/dashboard/pagination";
import { formatDate, pageItems } from "@/lib/utils";

function servicesFor(user: AdminUser) {
  if (!Array.isArray(user.operatingTrades) || user.operatingTrades.length === 0) return "—";
  return user.operatingTrades
    .map((trade) => (typeof trade === "string" ? trade : trade.name))
    .filter(Boolean)
    .join(", ");
}

export function UserTable({
  users,
  loading,
  error,
  onRetry,
  profileBasePath,
  queryKey,
  title,
  kind,
  searchQuery,
}: {
  users: AdminUser[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  profileBasePath: "/users" | "/tradespeople";
  queryKey: unknown[];
  title: string;
  kind: "user" | "tradesperson";
  searchQuery?: string;
}) {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(users.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(() => pageItems(users, safePage, perPage), [users, safePage]);
  const removeMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (response) => {
      toast.success(response.message);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (mutationError) => toast.error(getApiMessage(mutationError)),
  });

  return (
    <>
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">People</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {loading ? "Loading records…" : `${users.length} ${users.length === 1 ? "record" : "records"}`}
            {searchQuery ? ` matching “${searchQuery}”` : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <QueryError title={`Couldn't load ${title.toLowerCase()}`} onRetry={onRetry} />
      ) : users.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching people" : `No ${title.toLowerCase()} yet`}
          message={searchQuery ? "Try a different name or email in the search field." : "New accounts will appear here automatically."}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-4">Name</th>
                  <th scope="col" className="px-5 py-4">Email</th>
                  <th scope="col" className="px-5 py-4">{kind === "tradesperson" ? "Services" : "Joined"}</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((user) => (
                  <tr key={user._id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.profileImage?.url} size={42} />
                        <span className="font-semibold text-slate-900">{user.name || "Unnamed account"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                      {kind === "tradesperson" ? servicesFor(user) : formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={user.accountStatus}>{user.accountStatus || "unknown"}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`${profileBasePath}/${user._id}`}
                          aria-label={`View ${user.name || user.email}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-blue-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${user.name || user.email}`}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {visible.map((user) => (
              <article key={user._id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={user.name} src={user.profileImage?.url} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-bold text-slate-950">{user.name || "Unnamed account"}</h2>
                      <Badge tone={user.accountStatus}>{user.accountStatus || "unknown"}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{user.email}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {kind === "tradesperson" ? servicesFor(user) : `Joined ${formatDate(user.createdAt)}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`${profileBasePath}/${user._id}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    View profile
                  </Link>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${user.name || user.email}`} onClick={() => setDeleteTarget(user)}>
                    <Trash2 className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 pb-5 sm:px-5">
            <Pagination page={safePage} total={users.length} perPage={perPage} onPageChange={setPage} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name || "this account"}?`}
        description="This permanently removes the account. This action cannot be undone."
        confirmLabel="Delete account"
        busyLabel="Deleting..."
        destructive
        busy={removeMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeMutation.mutate(deleteTarget._id)}
      />
    </>
  );
}
