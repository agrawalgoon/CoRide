/**
 * Reusable request body validation middleware using Zod schemas.
 * Returns consistent 400 Bad Request on validation failures.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          message: issues[0]?.message || 'Validation error',
          code: 'VALIDATION_ERROR',
          details: issues
        }
      });
    }

    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};
