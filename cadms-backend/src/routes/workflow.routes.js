const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, allowRoles } = require("../middleware/auth");
const c = require("../controllers/workflow.controller");
router.use(authenticate);

router.get("/dashboard", allowRoles("ADMIN", "DUTYOFFICER", "OC", "CRIMEANALYST"), asyncHandler(c.dashboard));

router.get("/evidence", allowRoles("ADMIN", "DUTYOFFICER", "SI", "OC"), asyncHandler(c.listEvidence));
router.post("/evidence", allowRoles("ADMIN", "DUTYOFFICER", "SI"), asyncHandler(c.addEvidence));

router.get("/assignments", allowRoles("ADMIN", "DUTYOFFICER", "OC", "SI"), asyncHandler(c.listAssignments));
router.post("/assignments", allowRoles("ADMIN", "DUTYOFFICER", "OC"), asyncHandler(c.assignSI));

router.get("/investigations", allowRoles("ADMIN", "DUTYOFFICER", "SI", "OC"), asyncHandler(c.listInvestigations));
router.patch("/investigations/:id/status", allowRoles("ADMIN", "SI", "OC"), asyncHandler(c.updateInvestigation));

router.get("/reviews", allowRoles("ADMIN", "DUTYOFFICER", "OC"), asyncHandler(c.listReviews));
router.post("/reviews", allowRoles("ADMIN", "OC"), asyncHandler(c.createReview));

router.get("/crime-analysis", allowRoles("ADMIN", "CRIMEANALYST", "OC"), asyncHandler(c.listAnalyses));
router.post("/crime-analysis", allowRoles("ADMIN", "CRIMEANALYST"), asyncHandler(c.createAnalysis));

router.get("/audit-logs", allowRoles("ADMIN"), asyncHandler(c.listAuditLogs));
module.exports = router;
