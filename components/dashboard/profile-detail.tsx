"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, Check, Mail, MapPin, Phone, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAdminUser, getApiMessage, updateTradespersonStatus } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { QueryError } from "@/components/dashboard/query-state";
import { formatDate } from "@/lib/utils";

type StatusAction = "approve" | "reject" | "suspend";

export function ProfileDetail({ role, title }: { role: "user" | "tradesperson"; title: string }) {
  const params = useParams<{ id: string }>();
  const userQuery = useQuery({
    queryKey: ["admin-user", params.id],
    queryFn: () => getAdminUser(params.id),
    select: (response) => response.data,
    enabled: Boolean(params.id),
  });
  const user = userQuery.data;

  if (userQuery.isLoading) return <ProfileSkeleton title={title} />;
  if (userQuery.isError) {
    return <QueryError title="Couldn't load this profile" onRetry={() => userQuery.refetch()} />;
  }

  const roleMatches = user && (role === "tradesperson" ? user.role === "tradesperson" : user.role === "user" || user.role === "homeowner");
  if (!roleMatches) {
    return (
      <section className="mx-auto max-w-6xl">
        <QueryError title="Profile not found" message="This account may have been removed or the profile link is invalid." />
      </section>
    );
  }

  const trades = Array.isArray(user.operatingTrades)
    ? user.operatingTrades.map((trade) => (typeof trade === "string" ? trade : trade.name)).filter(Boolean).join(", ")
    : "";
  const status = user.accountStatus || "unknown";

  return (
    <section className="mx-auto max-w-6xl">
      <Link
        href={role === "tradesperson" ? "/tradespeople" : "/users"}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to {role === "tradesperson" ? "tradespeople" : "customers"}
      </Link>

      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Account details</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0b2c52] via-[#13558c] to-[#2f73b7] sm:h-32" />
        <CardContent className="relative p-5 pt-0 sm:p-7 sm:pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-10 rounded-full border-4 border-white bg-white shadow-sm sm:-mt-12">
                <Avatar name={user.name} src={user.profileImage?.url} size={96} />
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-bold text-slate-950">{user.name || "Unnamed account"}</h2>
                  {role === "tradesperson" ? <Badge tone={status}>{status}</Badge> : null}
                </div>
                <p className="mt-1 text-sm capitalize text-slate-500">{user.role === "homeowner" ? "Customer" : user.role}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">Joined {formatDate(user.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <div className={role === "tradesperson" ? "mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]" : "mt-6"}>
        <Card>
          <CardContent className="p-5 sm:p-7">
            <h2 className="text-xl font-bold text-slate-950">{role === "tradesperson" ? "Tradesperson information" : "Customer information"}</h2>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <InfoItem icon={Mail} label="Email" value={user.email} />
              <InfoItem icon={Phone} label="Phone" value={user.phone} />
              <InfoItem icon={MapPin} label="Address" value={user.address} />
              {role === "tradesperson" ? <InfoItem label="Services" value={trades} /> : null}
              {role === "tradesperson" ? <InfoItem label="Service area" value={user.serviceArea} /> : null}
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{user.bio?.trim() || "Not provided"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {role === "tradesperson" ? <TradespersonActions userId={params.id} status={status} /> : null}
      </div>
    </section>
  );
}

function TradespersonActions({ userId, status }: { userId: string; status: string }) {
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<"reject" | "suspend" | null>(null);
  const statusMutation = useMutation({
    mutationFn: (action: StatusAction) => updateTradespersonStatus(userId, action),
    onSuccess: (response) => {
      toast.success(response.message);
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  return (
    <>
      <Card>
        <CardContent className="p-5 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950">Account actions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Update access for this tradesperson. The account owner will be notified.</p>
          <div className="mt-6 flex flex-col gap-3">
            {status !== "approved" ? (
              <Button type="button" variant="success" onClick={() => statusMutation.mutate("approve")} disabled={statusMutation.isPending}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Approve account
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setConfirmAction("suspend")} disabled={statusMutation.isPending}>
                <Ban className="h-4 w-4" aria-hidden="true" />
                Suspend account
              </Button>
            )}
            {status === "pending" ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmAction("reject")} disabled={statusMutation.isPending}>
                <X className="h-4 w-4" aria-hidden="true" />
                Reject application
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction === "suspend" ? "Suspend this tradesperson?" : "Reject this application?"}
        description={
          confirmAction === "suspend"
            ? "The account will immediately lose access until an admin approves it again."
            : "The tradesperson application will be rejected and the owner will be notified."
        }
        confirmLabel={confirmAction === "suspend" ? "Suspend account" : "Reject application"}
        busyLabel="Updating..."
        destructive
        busy={statusMutation.isPending}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && statusMutation.mutate(confirmAction)}
      />
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; value?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon ? <Icon className="h-4 w-4" aria-hidden={true} /> : null}
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-slate-800">{value?.trim() || "Not provided"}</dd>
    </div>
  );
}

function ProfileSkeleton({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="mb-7 text-3xl font-bold">{title}</h1>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </section>
  );
}
