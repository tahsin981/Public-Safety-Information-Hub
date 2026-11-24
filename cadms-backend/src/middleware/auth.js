const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required. Provide a Bearer token.");
  }

  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, "Invalid or expired access token.");
  }

  const user = await prisma.user.findUnique({
    where: { user_id: payload.sub },
    select: {
      user_id: true,
      user_name: true,
      email: true,
      role: true,
      employee_code: true,
      phone_number: true
    }
  });

  if (!user) throw new HttpError(401, "Account no longer exists.");
  req.user = user;
  next();
});

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, "You do not have permission to perform this action."));
  }
  next();
};

module.exports = { authenticate, allowRoles };
