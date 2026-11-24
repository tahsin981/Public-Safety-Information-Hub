const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const controller = require("../controllers/auth.controller");
router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.get("/me", authenticate, asyncHandler(controller.me));
router.post("/logout", authenticate, asyncHandler(controller.logout));
module.exports = router;
