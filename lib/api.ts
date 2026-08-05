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
  image?: ProfileImage;
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
  role: "admin" | "user" | "homeowner" | "tradesperson";
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
    earnings: number;
  };
  today: {
    tradespeople: number;
    users: number;
    jobs: number;
    earnings: number;
  };
  jobsByDay: Array<{ label: string; count: number }>;
  userGrowth: Array<{ label: string; tradies: number; users: number }>;
  monthlyRevenue: Array<{ month: string; label: string; revenue: number; value: number }>;
  topServices: Array<{ name: string; count: number; value: number; earnings: number }>;
};

export type Application = {
  _id: string;
  status?: string;
  price?: number;
  additionalInfo?: string;
  userId?: AdminUser;
  tradespersonId?: AdminUser;
  jobId?: {
    _id: string;
    title?: string;
    locationText?: string;
    status?: string;
    visibility?: string;
    media?: string[];
  };
  createdAt?: string;
};

export type ProfilePayload = {
  u: AdminUser;
  tradiesReview?: unknown;
};

export type LegalDocumentType = "terms-of-service" | "privacy-policy";

export type LegalDocument = {
  type: LegalDocumentType;
  title: string;
  content: string;
  version: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

const baseURL =
  process.env.BACKEND_BASE_URL ||
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
  const response = await publicApi.post<ApiEnvelope<null>>(
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

export async function getAdminUser(userId: string) {
  const response = await api.get<ApiEnvelope<AdminUser>>(`/admin/users/${userId}`);
  return unwrap(response);
}

export async function updateTradespersonStatus(userId: string, action: "approve" | "reject" | "suspend") {
  const response = await api.patch<ApiEnvelope<AdminUser>>(`/admin/tradespeople/${userId}/status`, { action });
  return unwrap(response);
}

export async function getLegalDocument(type: LegalDocumentType) {
  const response = await api.get<ApiEnvelope<LegalDocument>>(`/admin/legal-documents/${type}`);
  return unwrap(response);
}

export async function updateLegalDocument(
  type: LegalDocumentType,
  payload: { title: string; content: string },
) {
  const response = await api.put<ApiEnvelope<LegalDocument>>(
    `/admin/legal-documents/${type}`,
    payload,
  );
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

export async function createCategory(payload: {
  name: string;
  status: "approved" | "pending" | "rejected";
  image: File;
}) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("status", payload.status);
  formData.append("image", payload.image);
  const response = await api.post<ApiEnvelope<Category>>("/admin/categories", formData);
  return unwrap(response);
}

export async function updateCategory(
  categoryId: string,
  payload: {
    name?: string;
    status?: "approved" | "rejected" | "pending";
    image?: File;
  },
) {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.status !== undefined) formData.append("status", payload.status);
  if (payload.image) formData.append("image", payload.image);
  const response = await api.patch<ApiEnvelope<Category>>(`/admin/categories/${categoryId}`, formData);
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
