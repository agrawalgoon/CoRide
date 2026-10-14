import { Prisma } from '@prisma/client';

/**
 * Centralized application error handling middleware.
 * Formats errors into consistent JSON responses and prevents exposing sensitive database details.
 */
export const errorHandler = (err, req, res, next) => {
  // Log error message safely on the server side
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle known Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this unique value already exists.';
        break;
      case 'P2025':
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'Requested record not found.';
        break;
      case 'P2003':
        statusCode = 400;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Referenced relational record constraint failed.';
        break;
      default:
        statusCode = 400;
        code = `DB_REQUEST_ERROR_${err.code}`;
        message = 'Database operation failed.';
        break;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid data provided for database operation.';
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Database service is currently unreachable.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.incompatible ? { incompatible: true, suggestions: err.suggestions || [], canCreateNewRide: true } : {}),
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }
  });
};

/**
 * 404 handler for unmatched routes.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND'
    }
  });
};
