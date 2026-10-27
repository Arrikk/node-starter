export class ApplicationError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(statusCode: number, message = "an error occurred", errors?: unknown) {
    super(message);
    this.statusCode = statusCode || 500;
    this.errors = errors;
  }
}

export class BadRequestError extends ApplicationError {
  constructor(message: string, errors?: unknown) {
    super(400, message || "Bad request.", errors);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(404, message || "Route not found.");
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(409, message);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string) {
    super(401, message || "You are unauthorized.");
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message?: string) {
    super(403, message || "Access Forbidden");
  }
}

export class TooManyRequestsError extends ApplicationError {
  constructor(message?: string, errors?: unknown) {
    super(429, message || "Too many requests. Please try again later.", errors);
  }
}

export class InternalServerError extends ApplicationError {
  constructor(message?: string) {
    super(500, message || "Something went wrong. Please try again.");
  }
}
