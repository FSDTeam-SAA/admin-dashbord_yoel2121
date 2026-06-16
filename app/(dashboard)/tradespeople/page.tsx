"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { listUsers } from "@/lib/api";
import { UserTable } from "@/components/dashboard/user-table";

export default function TradespeoplePage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-[1560px]" />}>
      <TradespeopleContent />
    </Suspense>
  );
}

function TradespeopleContent() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const usersQuery = useQuery({
    queryKey: ["admin-users", "tradesperson", q],
    queryFn: () => listUsers({ role: "tradesperson", q: q || undefined }),
    select: (response) => response.data,
  });

  return (
    <section className="mx-auto max-w-[1560px]">
      <UserTable users={usersQuery.data || []} loading={usersQuery.isLoading} profileBasePath="/tradespeople" queryKey={["admin-users"]} />
    </section>
  );
}
