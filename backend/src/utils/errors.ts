import { ErrorCode, getErrorStatus } from '../types/api';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Array<{ field: string; message: string }>;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Array<{ field: string; message: string }>,
    isOperational = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = getErrorStatus(code);
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Array<{ field: string; message: string }>) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests') {
    super('RATE_LIMITED', message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super('INTERNAL_ERROR', message, undefined, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super('SERVICE_UNAVAILABLE', message);
  }
}