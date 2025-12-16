export type PaginationResponse<T> = {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
};

export type User = {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
  role?: {
    _id?: string;
    name?: string;
    permissions?: Record<string, boolean>;
  };
  roleId: {
    name: string;
    _id: string;
    permissions: Record<string, boolean>;
  };
  orgId?: string;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  createdAt?: string;
};

export type Role = {
  _id?: string;
  name: string;
  // permissions map: permissionKey -> allowed
  permissions: Record<string, boolean>;
  orgId?: string;
  hierarchyLevel?: number;
};

export type Template = {
  _id?: string;
  name: string;
  description?: string;
  structure: unknown;
  orgId?: string;
  createdAt?: string;
};

export type WorkOrder = {
  _id?: string;
  templateId?: string;
  data?: unknown;
  orgSeq?: number;
  status?: string;
  assigneeId?: string;
  orgId?: string;
  history?: unknown[];
  createdAt?: string;
  dates?: {
    created?: string;
    start?: string | null;
    end?: string | null;
    approvedAt?: string | null;
  };
};

export type FileMeta = {
  _id?: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  path?: string;
  thumbnailPath?: string;
  orgId?: string;
  createdAt?: string;
};
