"use client";

import { useState, useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, CircleDollarSign, Users, Wrench } from "lucide-react";
import { getOverview, listApplications } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/dashboard/pagination";
import { EmptyState, QueryError } from "@/components/dashboard/query-state";
import { formatCount, formatCurrency, formatDate, pageItems } from "@/lib/utils";

const chartColors = ["#2f73b7", "#67a9df", "#9bc9ed", "#c7e3f6", "#e2eff9"];
const emptySubscribe = () => () => undefined;

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: getOverview,
    select: (response) => response.data,
  });
  const applicationsQuery = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => listApplications(),
    select: (response) => response.data,
  });

  const overview = overviewQuery.data;
  const recent = applicationsQuery.data || [];
  const totalPages = Math.max(1, Math.ceil(recent.length / 5));
  const safePage = Math.min(page, totalPages);
  const visibleRecent = pageItems(recent, safePage, 5);
  const monthlyRevenue = overview?.monthlyRevenue || [];
  const topServices = overview?.topServices || [];

  return (
    <section className="mx-auto max-w-[1640px] space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Overview</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Live marketplace activity and account performance.</p>
        </div>
        <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary">Updated from live data</span>
      </div>

      {overviewQuery.isError ? (
        <QueryError title="Couldn't load dashboard metrics" onRetry={() => overviewQuery.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Customers"
            value={overview?.stats.users}
            delta={overview?.today.users}
            deltaLabel="new today"
            loading={overviewQuery.isLoading}
            icon={Users}
          />
          <StatCard
            title="Tradespeople"
            value={overview?.stats.tradespeople}
            delta={overview?.today.tradespeople}
            deltaLabel="new today"
            loading={overviewQuery.isLoading}
            icon={Wrench}
          />
          <StatCard
            title="Jobs"
            value={overview?.stats.jobs}
            delta={overview?.today.jobs}
            deltaLabel="created today"
            loading={overviewQuery.isLoading}
            icon={BriefcaseBusiness}
          />
          <StatCard
            title="Revenue"
            value={overview?.stats.earnings}
            delta={overview?.today.earnings}
            deltaLabel="earned today"
            loading={overviewQuery.isLoading}
            icon={CircleDollarSign}
            currency
          />
        </div>
      )}

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Payment performance</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">Revenue</h2>
              <p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(overview?.stats.earnings)}</p>
            </div>
            <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">Last 12 months</span>
          </div>
          <div className="h-[280px] w-full sm:h-[340px]">
            {overviewQuery.isLoading || !isClient ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : monthlyRevenue.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f73b7" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#2f73b7" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                  <Area type="monotone" dataKey="value" stroke="#2f73b7" strokeWidth={3} fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No revenue yet" message="Successful payments will populate this chart." />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Recent applications</h2>
                <p className="mt-1 text-sm text-slate-500">Latest quotes submitted across jobs.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{recent.length} total</span>
            </div>
            {applicationsQuery.isLoading ? (
              <div className="space-y-3 p-5 sm:p-6">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
              </div>
            ) : applicationsQuery.isError ? (
              <div className="p-5 sm:p-6"><QueryError title="Couldn't load recent applications" onRetry={() => applicationsQuery.refetch()} /></div>
            ) : recent.length === 0 ? (
              <div className="p-5 sm:p-6"><EmptyState title="No applications yet" message="New job applications will appear here." /></div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[780px] text-left">
                    <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th scope="col" className="px-5 py-4 sm:px-6">Customer</th>
                        <th scope="col" className="px-5 py-4">Tradesperson</th>
                        <th scope="col" className="px-5 py-4">Service</th>
                        <th scope="col" className="px-5 py-4">Quote</th>
                        <th scope="col" className="px-5 py-4">Status</th>
                        <th scope="col" className="px-5 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleRecent.map((item) => (
                        <tr key={item._id} className="transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 sm:px-6">
                            <Person name={item.userId?.name} email={item.userId?.email} src={item.userId?.profileImage?.url} fallback="Unknown customer" />
                          </td>
                          <td className="px-5 py-4">
                            <Person name={item.tradespersonId?.name} email={item.tradespersonId?.email} src={item.tradespersonId?.profileImage?.url} fallback="Unknown tradesperson" />
                          </td>
                          <td className="max-w-52 truncate px-5 py-4 text-sm font-semibold text-slate-800">{item.jobId?.title || "Untitled job"}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">{formatCurrency(item.price)}</td>
                          <td className="px-5 py-4"><Badge tone={item.status}>{item.status || "unknown"}</Badge></td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {visibleRecent.map((item) => (
                    <article key={item._id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Person name={item.tradespersonId?.name} email={item.tradespersonId?.email} src={item.tradespersonId?.profileImage?.url} fallback="Unknown tradesperson" />
                        <Badge tone={item.status}>{item.status || "unknown"}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <Metric label="Job" value={item.jobId?.title || "Untitled job"} />
                        <Metric label="Quote" value={formatCurrency(item.price)} />
                        <Metric label="Customer" value={item.userId?.name || item.userId?.email || "Unknown"} />
                        <Metric label="Date" value={formatDate(item.createdAt)} />
                      </div>
                    </article>
                  ))}
                </div>
                <div className="border-t border-slate-100 px-5 pb-5 sm:px-6">
                  <Pagination page={safePage} total={recent.length} perPage={5} onPageChange={setPage} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 sm:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">Top services</h2>
              <p className="mt-1 text-sm text-slate-500">Jobs grouped by service category.</p>
            </div>
            {overviewQuery.isLoading || !isClient ? (
              <Skeleton className="mt-6 h-72 w-full rounded-xl" />
            ) : topServices.length ? (
              <>
                <div className="mt-4 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topServices} dataKey="count" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={3}>
                        {topServices.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCount(Number(value)), "Jobs"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {topServices.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-slate-700">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="font-bold text-slate-950">{formatCount(item.count)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-6"><EmptyState title="No service data yet" message="Services will rank here after jobs are posted." /></div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  delta,
  deltaLabel,
  loading,
  icon: Icon,
  currency = false,
}: {
  title: string;
  value?: number;
  delta?: number;
  deltaLabel: string;
  loading: boolean;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  currency?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{title}</p>
            {loading ? <Skeleton className="mt-3 h-8 w-28" /> : <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{currency ? formatCurrency(value) : formatCount(value)}</p>}
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
            <Icon className="h-5 w-5" aria-hidden={true} />
          </span>
        </div>
        <p className="mt-5 text-xs font-medium text-slate-500">
          <span className="font-bold text-emerald-700">+{currency ? formatCurrency(delta) : formatCount(delta)}</span> {deltaLabel}
        </p>
      </CardContent>
    </Card>
  );
}

function Person({ name, email, src, fallback }: { name?: string; email?: string; src?: string; fallback: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name || email} src={src} size={38} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{name || fallback}</p>
        {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 font-medium text-slate-800">{value}</p>
    </div>
  );
}
