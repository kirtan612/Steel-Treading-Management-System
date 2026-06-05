const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error("Error:", err);

  // Sequelize database/UUID casting error
  if (err.name === "SequelizeDatabaseError" && err.message.includes("invalid input syntax for type uuid")) {
    const message = "Resource not found (invalid ID format)";
    error = { message, statusCode: 400 };
  }

  // Sequelize duplicate key / unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    const messages = err.errors.map(val => `${val.path.charAt(0).toUpperCase() + val.path.slice(1)} '${val.value}' already exists`);
    const message = messages.join(", ");
    error = { message, statusCode: 400 };
  }

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const messages = err.errors.map(val => val.message);
    const message = messages.join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401, code: "TOKEN_EXPIRED" };
  }

  const response = {
    success: false,
    message: error.message || "Server Error"
  };

  // Add error code if present
  if (error.code) {
    response.code = error.code;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;