"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminUser, getApiMessage, listUsers, updateUserStatus } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { splitName } from "@/lib/utils";

export function ProfileDetail({ role, title }: { role: "user" | "tradesperson"; title: string }) {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["admin-users", role],
    queryFn: () => listUsers({ role }),
    select: (response) => response.data,
  });
  const user = usersQuery.data?.find((item) => item._id === params.id);
  const names = splitName(user?.name);
  const statusMutation = useMutation({
    mutationFn: (action: "approve" | "reject") => updateUserStatus(params.id, action),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  if (usersQuery.isLoading) return <ProfileSkeleton title={title} />;
  if (!user) return <p className="text-lg font-semibold">Profile not found.</p>;

  return (
    <section className="mx-auto max-w-[1650px]">
      <h1 className="mb-16 text-[36px] font-bold max-md:mb-8 max-md:text-3xl">{title}</h1>
      <Card className="mb-10">
        <CardContent className="flex min-h-[166px] items-center gap-4 px-5 md:px-8">
          <Avatar name={user.name} src={user.profileImage?.url} size={126} />
          <h2 className="text-[28px] font-bold max-sm:text-xl">{user.name || "Unnamed user"}</h2>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 md:p-6">
          <h2 className="mb-9 text-[28px] font-bold max-sm:text-xl">User Information</h2>
          <ReadOnlyFields user={user} firstName={names.firstName} lastName={names.lastName} />
        </CardContent>
      </Card>
      <div className="mt-20 flex gap-6 max-sm:mt-8 max-sm:flex-col">
        <Button type="button" variant="success" size="lg" className="w-[210px] max-sm:w-full" onClick={() => statusMutation.mutate("approve")} disabled={statusMutation.isPending}>
          Approve
        </Button>
        <Button type="button" variant="destructive" size="lg" className="w-[210px] max-sm:w-full" onClick={() => statusMutation.mutate("reject")} disabled={statusMutation.isPending}>
          Reject
        </Button>
      </div>
    </section>
  );
}

function ReadOnlyFields({ user, firstName, lastName }: { user: AdminUser; firstName: string; lastName: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <label className="space-y-2 text-lg">
        <span>First Name</span>
        <Input value={firstName || "Mr"} readOnly />
      </label>
      <label className="space-y-2 text-lg">
        <span>Last Name</span>
        <Input value={lastName || "Raja"} readOnly />
      </label>
      <label className="space-y-2 text-lg">
        <span>Email Address</span>
        <Input value={user.email} readOnly />
      </label>
      <label className="space-y-2 text-lg">
        <span>Phone</span>
        <Input value={user.phone || "(307) 555-0133"} readOnly />
      </label>
      <label className="space-y-2 text-lg md:col-span-2">
        <span>Bio</span>
        <Textarea value={user.bio || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."} readOnly className="min-h-[151px]" />
      </label>
    </div>
  );
}

function ProfileSkeleton({ title }: { title: string }) {
  return (
    <section>
      <h1 className="mb-16 text-[36px] font-bold">{title}</h1>
      <Skeleton className="mb-10 h-[166px] w-full" />
      <Skeleton className="h-[505px] w-full" />
    </section>
  );
}
