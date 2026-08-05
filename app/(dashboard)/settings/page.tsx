"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, KeyRound, Pencil, UserRound, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminUser, changePassword, getApiMessage, getProfile, updateProfile } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { QueryError } from "@/components/dashboard/query-state";
import { cn, splitName } from "@/lib/utils";

type Tab = "profile" | "password";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    select: (response) => response.data.u,
  });
  const user = profileQuery.data;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your profile details and account security.</p>
      </div>

      <div role="tablist" aria-label="Settings sections" className="mb-6 inline-flex w-full rounded-xl border border-slate-200 bg-slate-100 p-1 sm:w-auto">
        <TabButton id="profile-tab" controls="profile-panel" active={tab === "profile"} onClick={() => setTab("profile")} icon={UserRound}>
          Personal information
        </TabButton>
        <TabButton id="password-tab" controls="password-panel" active={tab === "password"} onClick={() => setTab("password")} icon={KeyRound}>
          Password
        </TabButton>
      </div>

      {profileQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-[440px] w-full rounded-2xl" />
        </div>
      ) : profileQuery.isError || !user ? (
        <QueryError title="Couldn't load your settings" onRetry={() => profileQuery.refetch()} />
      ) : (
        <>
          <Card className="mb-6 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-[#0b2c52] via-[#13558c] to-[#2f73b7] sm:h-24" />
            <CardContent className="flex flex-col gap-4 p-5 pt-0 sm:flex-row sm:items-end sm:justify-between sm:p-6 sm:pt-0">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                <div className="-mt-9 w-fit rounded-full border-4 border-white bg-white shadow-sm sm:-mt-10">
                  <Avatar name={user.name} src={user.profileImage?.url} size={84} />
                </div>
                <div className="min-w-0 pb-1">
                  <h2 className="truncate text-xl font-bold text-slate-950">{user.name || "Admin account"}</h2>
                  <p className="mt-1 text-sm capitalize text-slate-500">{user.role || "admin"}</p>
                </div>
              </div>
              <p className="break-all text-sm text-slate-500">{user.email}</p>
            </CardContent>
          </Card>

          {tab === "profile" ? (
            <div id="profile-panel" role="tabpanel" aria-labelledby="profile-tab">
              <ProfileForm key={[user.name, user.phone, user.bio].join("|")} user={user} />
            </div>
          ) : (
            <div id="password-panel" role="tabpanel" aria-labelledby="password-tab">
              <PasswordForm />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function profileFormFromUser(user: AdminUser) {
  const names = splitName(user.name);
  return {
    firstName: names.firstName,
    lastName: names.lastName,
    email: user.email || "",
    phone: user.phone || "",
    bio: user.bio || "",
  };
}

function ProfileForm({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const originalForm = useMemo(() => profileFormFromUser(user), [user]);
  const [form, setForm] = useState(originalForm);
  const [editing, setEditing] = useState(false);
  const profileMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function cancelEditing() {
    setForm(originalForm);
    setEditing(false);
  }

  function submitProfile(event: FormEvent) {
    event.preventDefault();
    if (!form.firstName.trim() && !form.lastName.trim()) return toast.error("Name is required");
    profileMutation.mutate();
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-7">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Personal information</h2>
            <p className="mt-1 text-sm text-slate-500">These details appear on your administrator profile.</p>
          </div>
          {editing ? (
            <Button type="button" variant="ghost" onClick={cancelEditing} disabled={profileMutation.isPending}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </Button>
          )}
        </div>
        <form onSubmit={submitProfile} className="grid gap-5 md:grid-cols-2">
          <Field label="First name" name="firstName" value={form.firstName} disabled={!editing} autoComplete="given-name" onChange={(value) => setForm((current) => ({ ...current, firstName: value }))} />
          <Field label="Last name" name="lastName" value={form.lastName} disabled={!editing} autoComplete="family-name" onChange={(value) => setForm((current) => ({ ...current, lastName: value }))} />
          <Field label="Email address" name="email" type="email" value={form.email} disabled autoComplete="email" onChange={() => undefined} />
          <Field label="Phone" name="phone" type="tel" value={form.phone} disabled={!editing} autoComplete="tel" onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
            <span>Bio</span>
            <Textarea
              name="bio"
              value={form.bio}
              disabled={!editing}
              onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
              className="min-h-36 font-normal"
              placeholder={editing ? "Add a short administrator bio" : "Not provided"}
            />
          </label>
          {editing ? (
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" className="w-full sm:w-auto sm:min-w-40" disabled={profileMutation.isPending}>
                <Check className="h-4 w-4" aria-hidden="true" />
                {profileMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwords),
    onSuccess: (response) => {
      toast.success(response.message);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (passwords.newPassword.length < 8) return toast.error("New password must be at least 8 characters");
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error("Passwords do not match");
    passwordMutation.mutate();
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-7">
        <div className="mb-7">
          <h2 className="text-xl font-bold text-slate-950">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Use at least 8 characters and avoid reusing an old password.</p>
        </div>
        <form onSubmit={submitPassword} className="grid gap-5 lg:grid-cols-3">
          <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" value={passwords.currentPassword} onChange={(value) => setPasswords((current) => ({ ...current, currentPassword: value }))} />
          <PasswordField label="New password" name="newPassword" autoComplete="new-password" value={passwords.newPassword} onChange={(value) => setPasswords((current) => ({ ...current, newPassword: value }))} />
          <PasswordField label="Confirm new password" name="confirmPassword" autoComplete="new-password" value={passwords.confirmPassword} onChange={(value) => setPasswords((current) => ({ ...current, confirmPassword: value }))} />
          <div className="flex justify-end lg:col-span-3">
            <Button type="submit" className="w-full sm:w-auto sm:min-w-40" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function TabButton({
  id,
  controls,
  active,
  children,
  onClick,
  icon: Icon,
}: {
  id: string;
  controls: string;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:flex-none sm:px-5",
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden={true} />
      {children}
    </button>
  );
}

function Field({ label, name, type = "text", value, disabled, autoComplete, onChange }: { label: string; name: string; type?: string; value: string; disabled?: boolean; autoComplete?: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <Input name={name} type={type} value={value} disabled={disabled} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} className="font-normal" />
    </label>
  );
}

function PasswordField({ label, name, value, autoComplete, onChange }: { label: string; name: string; value: string; autoComplete: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <PasswordInput name={name} value={value} required minLength={8} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} className="font-normal" />
    </label>
  );
}
