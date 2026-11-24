const { Prisma } = require("@prisma/client");

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      status = 409;
      message = "A record with one of these unique values already exists.";
      details = err.meta?.target;
    } else if (err.code === "P2025") {
      status = 404;
      message = "The requested record was not found.";
    } else if (err.code === "P2003") {
      status = 409;
      message = "This operation conflicts with a related record.";
    } else if (err.code === "P2014") {
      status = 409;
      message = "This operation would violate a required relationship.";
    }
  }

  if (err.name === "ZodError") {
    status = 400;
    message = "Validation failed.";
    details = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV !== "production" && status === 500 ? { stack: err.stack } : {})
  });
}

module.exports = { notFound, errorHandler };
