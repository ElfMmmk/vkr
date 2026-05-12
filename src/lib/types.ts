export type RequestStatus =
  | "new"
  | "in_progress"
  | "approved"
  | "completed"
  | "rejected";

export type UserRole = "admin" | "manager" | "client";

export type PageKey = "home" | "about" | "services" | "contacts";

export type PageContent = {
  id: string;
  pageKey: PageKey;
  title: string;
  body: string;
  blocks: Record<string, string>;
  updatedAt?: string;
};

export type Service = {
  id: string;
  title: string;
  slug: string;
  description: string;
  details: string;
  displayOrder: number;
  isActive: boolean;
};

export type Tag = {
  id: string;
  title: string;
  slug: string;
  description: string;
};

export type PortfolioImage = {
  id: string;
  storagePath: string;
  publicUrl: string;
  title: string;
  caption: string;
  parentType: "project" | "page" | "service" | "free";
  parentId: string | null;
  sortOrder: number;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImageId: string | null;
  coverImageUrl: string;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  services: Service[];
  tags: Tag[];
  gallery: PortfolioImage[];
};

export type OrderRequest = {
  id: string;
  clientUserId?: string | null;
  clientName: string;
  contactMethod: string;
  contactValue: string;
  serviceId: string | null;
  serviceTitle: string;
  comment: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt?: string;
};

export type PortfolioFilter = {
  service?: string;
  tag?: string;
  services?: string[];
  tags?: string[];
  sort?: "default" | "newest" | "oldest";
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminNotification = {
  id: string;
  type: "request_created" | "request_status_changed" | "system";
  title: string;
  body: string;
  entityType: string;
  entityId: string | null;
  audienceRole: "admin" | "manager";
  createdAt: string;
  readAt?: string | null;
};
