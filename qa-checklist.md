# ECS Cornerstone — Pre-Launch QA Checklist

_Generated 2026-09-08T23:03:55.431Z by `generateQAChecklist.ts`. Re-run the script to regenerate; do not edit by hand._

## Authentication Flows
- [ ] New company registers via /onboarding/register
- [ ] Stripe checkout completes and subscription activates
- [ ] Company admin receives welcome email
- [ ] Company admin logs in successfully
- [ ] JWT refresh works after token expiry
- [ ] Password change works
- [ ] Login with wrong password returns 401 (not 500)

## Assessment Flows
- [ ] Company admin creates a campaign (select position, add emails)
- [ ] Respondents receive invitation emails with working links
- [ ] Assessment loads correctly for all instrument types (PCA, WSA)
- [ ] Save-and-resume works (partial responses persist on refresh)
- [ ] Submit completes and shows profile result
- [ ] assessment_results row is created with correct profile
- [ ] PDF generation triggers after submit
- [ ] PDF uploads to S3 successfully
- [ ] Report-ready email is sent to respondent
- [ ] Admin completion notification is sent

## Report Delivery Flows
- [ ] Company admin can view result detail in dashboard
- [ ] Company admin can download report via signed URL
- [ ] Signed URL expires after 7 days
- [ ] Respondent can access report via email link token
- [ ] Respondent link shows "generating" if PDF not ready
- [ ] Respondent link shows "expired" after 7 days

## Billing Flows
- [ ] Starter plan enforces 10 assessment limit
- [ ] Growth plan enforces 50 assessment limit
- [ ] Exceeding limit returns 402 with clear message
- [ ] Past-due status shows warning banner in admin
- [ ] Billing portal link works from admin settings
- [ ] Subscription cancellation via portal reflects in platform

## Super Admin Flows
- [ ] Super admin can view all companies
- [ ] Super admin can change a company's plan
- [ ] Super admin can override subscription status
- [ ] Super admin can unlock Agent Placement for a company
- [ ] Unlock sends email with working 30-day token URL
- [ ] Agent Placement page validates token correctly
- [ ] Expired token shows correct expiry message
- [ ] Super admin can unlock FCAIO for a company
- [ ] FCAIO page validates token correctly
- [ ] Super admin can impersonate a company admin
- [ ] Impersonation banner shows during impersonated session
- [ ] Exit impersonation restores original session
- [ ] All super admin actions appear in audit log

## Security Checks
- [ ] Company admin cannot access another company's results (test with raw API call)
- [ ] Manager cannot access billing routes
- [ ] Respondent token from Company A cannot access Company B resources
- [ ] Gated page without token returns invalid message
- [ ] Expired gated token returns expiry message
- [ ] SQL injection attempt in email field is handled safely
- [ ] JWT from one user cannot be used after password change

## Edge Cases
- [ ] Assessment submission with missing instrument returns clear error
- [ ] Campaign creation with 0 emails returns validation error
- [ ] Campaign creation exceeding quota returns 402 before sending emails
- [ ] PDF generation failure does not crash the submit endpoint
- [ ] S3 upload failure is caught and logged (does not surface to respondent)
