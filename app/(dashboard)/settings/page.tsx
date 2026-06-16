"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changePassword, getApiMessage, getProfile, updateProfile } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn, splitName } from "@/lib/utils";

type Tab = "profile" | "password";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    select: (response) => response.data.u,
  });
  const user = profileQuery.data;
  const names = useMemo(() => splitName(user?.name), [user?.name]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", bio: "" });
  const [editing, setEditing] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    setForm({
      firstName: names.firstName || "Mr",
      lastName: names.lastName || "Raja",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
    });
  }, [names.firstName, names.lastName, user?.bio, user?.email, user?.phone]);

  const profileMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        bio: form.bio,
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwords),
    onSuccess: (response) => {
      toast.success(response.message);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function submitProfile(event: FormEvent) {
    event.preventDefault();
    profileMutation.mutate();
  }

  function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords do not match");
    passwordMutation.mutate();
  }

  return (
    <section className="mx-auto max-w-[1550px]">
      <div className="mb-14 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[36px] font-bold max-md:text-3xl">Settings</h1>
        <div className="grid gap-5 sm:grid-cols-2 xl:w-[640px]">
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>Personal Information</TabButton>
          <TabButton active={tab === "password"} onClick={() => setTab("password")}>Change Password</TabButton>
        </div>
      </div>

      {profileQuery.isLoading ? (
        <div className="space-y-10">
          <Skeleton className="h-[145px] w-full" />
          <Skeleton className="h-[505px] w-full" />
        </div>
      ) : (
        <>
          <Card className="mb-10">
            <CardContent className="flex min-h-[145px] items-center justify-between gap-4 px-5 md:px-8">
              <div className="flex items-center gap-4">
                <Avatar name={user?.name} src={user?.profileImage?.url} size={120} />
                <div>
                  <h2 className="text-[24px] font-bold">{user?.name || "Brooklyn Simmons"}</h2>
                  <p className="mt-2 text-lg">@{user?.role || "admin"}</p>
                </div>
              </div>
              {tab === "profile" && (
                <Button type="button" variant="secondary" className="w-[106px]" onClick={() => setEditing((current) => !current)}>
                  <Pencil className="h-5 w-5" />
                  Edit
                </Button>
              )}
            </CardContent>
          </Card>

          {tab === "profile" ? (
            <Card>
              <CardContent className="p-5 md:p-6">
                <div className="mb-9 flex items-center justify-between gap-3">
                  <h2 className="text-[24px] font-bold">Personal Information</h2>
                  <Button type="button" variant="secondary" className="w-[106px]" onClick={() => setEditing((current) => !current)}>
                    <Pencil className="h-5 w-5" />
                    Edit
                  </Button>
                </div>
                <form onSubmit={submitProfile} className="grid gap-6 md:grid-cols-2">
                  <Field label="First Name" value={form.firstName} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
                  <Field label="Last Name" value={form.lastName} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
                  <Field label="Email Address" value={form.email} disabled onChange={() => undefined} />
                  <Field label="Phone" value={form.phone} disabled={!editing} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
                  <label className="space-y-2 text-lg md:col-span-2">
                    <span>Bio</span>
                    <Textarea value={form.bio} disabled={!editing} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} className="min-h-[147px]" />
                  </label>
                  {editing && (
                    <div className="md:col-span-2 flex justify-end">
                      <Button type="submit" variant="secondary" className="w-[178px]" disabled={profileMutation.isPending}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 md:p-6">
                <h2 className="mb-5 text-[22px] font-bold">Change password</h2>
                <form onSubmit={submitPassword} className="grid gap-7 xl:grid-cols-3">
                  <PasswordField label="Current Password" value={passwords.currentPassword} onChange={(value) => setPasswords((current) => ({ ...current, currentPassword: value }))} />
                  <PasswordField label="New Password" value={passwords.newPassword} onChange={(value) => setPasswords((current) => ({ ...current, newPassword: value }))} />
                  <PasswordField label="Confirm New Password" value={passwords.confirmPassword} onChange={(value) => setPasswords((current) => ({ ...current, confirmPassword: value }))} />
                  <div className="xl:col-span-3 flex justify-end">
                    <Button type="submit" variant="secondary" className="w-[178px]" disabled={passwordMutation.isPending}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[61px] rounded-[6px] border border-[#2fa7f0] px-5 text-[24px] font-bold transition max-sm:text-lg",
        active ? "border-transparent bg-[#bfeeff] text-black" : "bg-white text-[#2fa7f0]",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, value, disabled, onChange }: { label: string; value: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-lg">
      <span>{label}</span>
      <Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-lg">
      <span>{label}</span>
      <PasswordInput value={value} onChange={(event) => onChange(event.target.value)} placeholder="................" className="border-[#2fa7f0]" />
    </label>
  );
}
