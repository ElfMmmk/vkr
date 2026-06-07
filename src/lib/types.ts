export type RequestStatus =
  | "new"
  | "in_progress"
  | "approved"
  | "completed"
  | "rejected";

export type ContractStatus = "draft" | "sent" | "accepted" | "cancelled";

export type UserRole = "admin" | "manager" | "client";

export type AnalyticsEventType = "page_view" | "cta_click";

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
  packages: ServicePackage[];
  addons: ServiceAddon[];
};

export type ServicePackage = {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  badge: string;
  bestFor: string;
  outcome: string;
  includedItems: string[];
  priceFrom: number;
  priceTo: number;
  durationFromDays: number;
  durationToDays: number;
  displayOrder: number;
  isActive: boolean;
  isRecommended: boolean;
};

export type ServiceAddon = {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
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
  packageId: string | null;
  packageTitle: string;
  packageDescription: string;
  packagePriceFrom: number | null;
  packagePriceTo: number | null;
  packageDurationFromDays: number | null;
  packageDurationToDays: number | null;
  selectedAddons: OrderAddonSnapshot[];
  referenceProjectId: string | null;
  referenceProjectTitle: string;
  referenceProjectSlug: string;
  resultDescription: string;
  stylePreferences: string;
  materials: string;
  desiredDeadline: string;
  estimatedPriceFrom: number | null;
  estimatedPriceTo: number | null;
  estimatedDurationFromDays: number | null;
  estimatedDurationToDays: number | null;
  comment: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt?: string;
  contract?: OrderContract | null;
  attachments: OrderAttachment[];
  statusHistory?: RequestStatusHistory[];
};

export type AnalyticsEvent = {
  id: string;
  eventType: AnalyticsEventType;
  path: string;
  search: string;
  referrer: string;
  href: string;
  label: string;
  sourceHash: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type OrderAddonSnapshot = {
  id: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
};

export type OrderContract = {
  id: string;
  requestId: string;
  finalPrice: number;
  finalDurationDays: number;
  workScope: string;
  materials: string;
  managerComment: string;
  status: ContractStatus;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type OrderAttachment = {
  id: string;
  requestId: string;
  clientUserId?: string | null;
  storagePath: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  signedUrl?: string;
};

export type RequestStatusHistory = {
  id: string;
  requestId: string;
  fromStatus?: RequestStatus | null;
  toStatus: RequestStatus;
  changedByUserId?: string | null;
  changedByRole: string;
  createdAt: string;
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

export type AdminUserListResult = {
  items: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
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
