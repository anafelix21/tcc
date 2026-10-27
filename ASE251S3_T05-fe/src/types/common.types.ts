export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
