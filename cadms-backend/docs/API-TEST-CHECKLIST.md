# Postman API Test Checklist

## Basic checks
- [ ] `GET /api/health` returns 200.
- [ ] Invalid JSON returns a 4xx response.
- [ ] Unknown route returns 404.
- [ ] Protected route without token returns 401.
- [ ] Expired/invalid token returns 401.
- [ ] COMMON user receives 403 for ADMIN-only routes.
- [ ] Password is never returned in API responses.

## Database constraints
- [ ] Duplicate user email is rejected.
- [ ] Duplicate phone number is rejected.
- [ ] Complaint referencing an unknown station is rejected.
- [ ] SI assignment referencing an unknown officer is rejected.
- [ ] SI assignment to a non-SI officer is rejected.
- [ ] OC review by a non-OC officer is rejected.
- [ ] Invalid enum values are rejected.
- [ ] Period end before period start is rejected.

## Workflow
- [ ] COMMON user can create a complaint.
- [ ] COMMON user only sees their own complaints.
- [ ] Authorized staff can change complaint status.
- [ ] Assignment creates an investigation record.
- [ ] Investigation status can be updated by permitted roles.
- [ ] OC can create a review.
- [ ] Crime analyst can create and list analysis records.
- [ ] Admin can view audit logs.
