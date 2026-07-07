import axios from "axios";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ProfileImage = {
  url?: string;
  public_id?: string;
};

export type Category = {
  _id: string;
  name: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
};

export type CarouselItem = {
  _id: string;
  type: "ad" | "coupon";
  title: string;
  subtitle: string;
  image?: ProfileImage;
  link?: string;
  discountPercentage?: number | null;
  order?: number;
  isActive?: boolean;
  createdAt?: string;
};

export type AdminUser = {
  _id: string;
  name?: string;
  email: string;
  role: "admin" | "user" | "tradesperson";
  phone?: string;
  address?: string;
  bio?: string;
  accountStatus?: "pending" | "approved" | "rejected" | "suspended";
  profileImage?: ProfileImage;
  serviceArea?: string;
  operatingTrades?: Category[] | string[];
  createdAt?: string;
};

export type LoginData = {
  accessToken: string;
  refreshToken: string;
  role: string;
  _id: string;
  user: AdminUser;
};

export type Overview = {
  stats: {
    tradespeople: number;
    users: number;
    jobs: number;
  };
  jobsByDay: Array<{ label: string; count: number }>;
  userGrowth: Array<{ label: string; tradies: number; users: number }>;
};

export type Application = {
  _id: string;
  status?: string;
  price?: number;
  additionalInfo?: string;
  tradespersonId?: AdminUser;
  jobId?: {
    _id: string;
    title?: string;
    locationText?: string;
    status?: string;
    visibility?: string;
    relatedFiles?: string[];
  };
  createdAt?: string;
};

export type ProfilePayload = {
  u: AdminUser;
  tradiesReview?: unknown;
};

type TokenGetter = () => string | undefined | Promise<string | undefined>;

let tokenGetter: TokenGetter | undefined;

const baseURL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTPUBLICBASEURL ||
  "http://localhost:5006/api/v1";

const browserBaseURL = "/api/backend";

export const api = axios.create({
  baseURL: typeof window === "undefined" ? baseURL : browserBaseURL,
  withCredentials: true,
});

export const publicApi = axios.create({
  baseURL: typeof window === "undefined" ? baseURL : browserBaseURL,
  withCredentials: true,
});

export function setAccessTokenGetter(getter: TokenGetter) {
  tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
  const token = await tokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function unwrap<T>(response: { data: ApiEnvelope<T> }) {
  return response.data;
}

export function getApiMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    return data?.message || error.message || "Something went wrong";
  }
  return "Something went wrong";
}

export async function loginAdmin(payload: { email: string; password: string }) {
  const response = await publicApi.post<ApiEnvelope<LoginData>>("/auth/login", payload);
  return unwrap(response);
}

export async function forgotPassword(email: string) {
  const response = await publicApi.post<ApiEnvelope<{ otp?: number | string; email?: string } | null>>(
    "/auth/forget",
    { email },
  );
  return unwrap(response);
}

export async function verifyResetOtp(payload: { email: string; otp: string }) {
  const response = await publicApi.post<ApiEnvelope<null>>("/auth/verify-otp", payload);
  return unwrap(response);
}

export async function resetPassword(payload: { email: string; otp: string; password: string }) {
  const response = await publicApi.post<ApiEnvelope<null>>("/auth/reset-password", payload);
  return unwrap(response);
}

export async function getProfile() {
  const response = await api.get<ApiEnvelope<ProfilePayload>>("/users");
  return unwrap(response);
}

export async function updateProfile(payload: Partial<AdminUser>) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  const response = await api.put<ApiEnvelope<AdminUser>>("/users/update-profile", formData);
  return unwrap(response);
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const response = await api.put<ApiEnvelope<null>>("/users/change-password", payload);
  return unwrap(response);
}

export async function getOverview() {
  const response = await api.get<ApiEnvelope<Overview>>("/admin/overview");
  return unwrap(response);
}

export async function listUsers(params?: { role?: string; status?: string; q?: string }) {
  const response = await api.get<ApiEnvelope<AdminUser[]>>("/admin/users", { params });
  return unwrap(response);
}

export async function updateUserStatus(userId: string, action: "approve" | "reject" | "suspend") {
  const response = await api.patch<ApiEnvelope<AdminUser>>(`/admin/users/${userId}/status`, { action });
  return unwrap(response);
}

export async function deleteUser(userId: string) {
  const response = await api.delete<ApiEnvelope<Record<string, never>>>(`/admin/users/${userId}`);
  return unwrap(response);
}

export async function listCategories(params?: { status?: string }) {
  const response = await api.get<ApiEnvelope<Category[]>>("/admin/categories", { params });
  return unwrap(response);
}

export async function proposeCategory(name: string) {
  const response = await api.post<ApiEnvelope<Category>>("/categories/propose", { name });
  return unwrap(response);
}

export async function updateCategoryStatus(categoryId: string, status: "approved" | "rejected" | "pending") {
  const response = await api.patch<ApiEnvelope<Category>>(`/admin/categories/${categoryId}`, { status });
  return unwrap(response);
}

export async function deleteCategory(categoryId: string) {
  const response = await api.delete<ApiEnvelope<Record<string, never>>>(`/admin/categories/${categoryId}`);
  return unwrap(response);
}

export async function listCarousels(params?: { type?: string; isActive?: string }) {
  const response = await api.get<ApiEnvelope<CarouselItem[]>>("/admin/carousels", { params });
  return unwrap(response);
}

export async function createCarouselItem(payload: {
  type: "ad" | "coupon";
  title: string;
  subtitle: string;
  link?: string;
  discountPercentage?: string;
  order?: string;
  isActive: boolean;
  image: File;
}) {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("title", payload.title);
  formData.append("subtitle", payload.subtitle);
  formData.append("link", payload.link || "");
  formData.append("order", payload.order || "0");
  formData.append("isActive", String(payload.isActive));
  if (payload.type === "coupon") formData.append("discountPercentage", payload.discountPercentage || "");
  formData.append("image", payload.image);

  const response = await api.post<ApiEnvelope<CarouselItem>>("/admin/carousels", formData);
  return unwrap(response);
}

export async function updateCarouselItem(
  carouselId: string,
  payload: {
    type: "ad" | "coupon";
    title: string;
    subtitle: string;
    link?: string;
    discountPercentage?: string;
    order?: string;
    isActive: boolean;
    image?: File | null;
  },
) {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("title", payload.title);
  formData.append("subtitle", payload.subtitle);
  formData.append("link", payload.link || "");
  formData.append("order", payload.order || "0");
  formData.append("isActive", String(payload.isActive));
  if (payload.type === "coupon") formData.append("discountPercentage", payload.discountPercentage || "");
  if (payload.image) formData.append("image", payload.image);

  const response = await api.patch<ApiEnvelope<CarouselItem>>(`/admin/carousels/${carouselId}`, formData);
  return unwrap(response);
}

export async function deleteCarouselItem(carouselId: string) {
  const response = await api.delete<ApiEnvelope<Record<string, never>>>(`/admin/carousels/${carouselId}`);
  return unwrap(response);
}

export async function listApplications(params?: { status?: string }) {
  const response = await api.get<ApiEnvelope<Application[]>>("/admin/applications", { params });
  return unwrap(response);
}
