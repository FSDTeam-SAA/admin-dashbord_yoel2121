"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getOverview, listApplications } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/dashboard/pagination";
import { formatCount, pageItems } from "@/lib/utils";

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const fallbackRevenue = [15500, 11800, 19000, 21400, 20100, 19800, 13600, 23100, 21300, 18400, 27400, 30500];

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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

  const stats = overviewQuery.data?.stats;
  const revenueData = useMemo(
    () =>
      months.map((month, index) => ({
        month,
        value: fallbackRevenue[index] + (overviewQuery.data?.jobsByDay[index % 7]?.count || 0) * 250,
      })),
    [overviewQuery.data?.jobsByDay],
  );
  const recent = applicationsQuery.data || [];
  const visibleRecent = pageItems(recent, page, 3);

  return (
    <section className="mx-auto max-w-[1640px] space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={stats?.users} delta="+2,123 today" loading={overviewQuery.isLoading} />
        <StatCard title="Total Tradespersons" value={stats?.tradespeople} delta="+2 today" loading={overviewQuery.isLoading} />
        <StatCard title="Total Orders" value={stats?.jobs} delta="+2,123 today" loading={overviewQuery.isLoading} />
        <StatCard title="Total Earnings" value={12832} prefix="$ " delta="$2,123 today" loading={overviewQuery.isLoading} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-bold">Revenue</h2>
              <p className="mt-3 text-xl font-bold">$86,400.12</p>
            </div>
            <Button type="button" size="sm" className="min-w-[90px]">Month</Button>
          </div>
          <div className="h-[340px] w-full">
            {overviewQuery.isLoading || !mounted ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f73b7" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#ddecfb" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#d7d7d7" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}K`} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Area type="monotone" dataKey="value" stroke="#2f73b7" strokeWidth={0} fill="url(#revenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_405px]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-8 flex justify-between">
              <h2 className="text-[24px] font-bold">Recent Activity</h2>
              <Button type="button" size="sm">Last 24h</Button>
            </div>
            {applicationsQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="text-sm text-[#777]">
                      <tr>
                        <th className="pb-5 font-normal">Customer</th>
                        <th className="pb-5 font-normal">Tradesperson</th>
                        <th className="pb-5 font-normal">Service</th>
                        <th className="pb-5 font-normal">Service Amount</th>
                        <th className="pb-5 font-normal">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecent.map((item) => (
                        <tr key={item._id}>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name="Customer" size={38} />
                              <span>Savannah Nguyen</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={item.tradespersonId?.name} src={item.tradespersonId?.profileImage?.url} size={38} />
                              <span>{item.tradespersonId?.name || "Leslie Alexander"}</span>
                            </div>
                          </td>
                          <td className="py-3 font-bold">{item.jobId?.title || "Plumber"}</td>
                          <td className="py-3 font-bold">${item.price || 124}</td>
                          <td className="py-3">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "12-12-2025"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} total={recent.length} perPage={3} onPageChange={setPage} />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-6 flex items-start justify-between gap-3">
              <h2 className="text-[24px] font-bold">Top Performing Services</h2>
              <Button type="button" size="sm">All time</Button>
            </div>
            <div className="h-[260px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: "Plumber", value: 55 }, { name: "Cleaner", value: 25 }, { name: "Painting", value: 20 }]} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={2}>
                      {["#2f73b7", "#a9d4fb", "#deebf8"].map((color) => (
                        <Cell key={color} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              {["Plumber", "Cleaner", "Painting"].map((label, index) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: ["#2f73b7", "#a9d4fb", "#deebf8"][index] }} />
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ title, value, delta, prefix = "", loading }: { title: string; value?: number; delta: string; prefix?: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="flex h-[142px] flex-col justify-between p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        {loading ? <Skeleton className="h-7 w-28" /> : <p className="text-2xl font-bold text-primary">{prefix}{formatCount(value)}</p>}
        <p className="text-right text-sm font-semibold text-[#555]">{delta}</p>
      </CardContent>
    </Card>
  );
}
