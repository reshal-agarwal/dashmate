export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INSUFFICIENT_WALLET: 'INSUFFICIENT_WALLET',
  ORDER_NOT_CANCELLABLE: 'ORDER_NOT_CANCELLABLE',
  COURIER_NOT_ONLINE: 'COURIER_NOT_ONLINE',
  COURIER_NOT_VERIFIED: 'COURIER_NOT_VERIFIED',
  RESTAURANT_NOT_VERIFIED: 'RESTAURANT_NOT_VERIFIED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  PICKUP_CODE_MISMATCH: 'PICKUP_CODE_MISMATCH',
  DELIVERY_CODE_MISMATCH: 'DELIVERY_CODE_MISMATCH',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,
  INSUFFICIENT_CREDITS: 400,
  INSUFFICIENT_WALLET: 400,
  ORDER_NOT_CANCELLABLE: 400,
  COURIER_NOT_ONLINE: 400,
  COURIER_NOT_VERIFIED: 403,
  RESTAURANT_NOT_VERIFIED: 403,
  INVALID_STATUS_TRANSITION: 400,
  PICKUP_CODE_MISMATCH: 400,
  DELIVERY_CODE_MISMATCH: 400,
};

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: ApiErrorDetail[];
  requestId: string;
}

export interface ApiMeta {
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiFailure {
  success: false;
  error: ApiError;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function createSuccess<T>(data: T, meta?: Partial<ApiMeta>): ApiSuccess<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createFailure(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: ApiErrorDetail[]
): ApiFailure {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

export function getErrorStatus(code: ErrorCode): number {
  return ERROR_STATUS_MAP[code] ?? 500;
}