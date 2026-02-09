
# Security Review: Denied.care

## Executive Summary

Your project has **2 security findings** that need attention - one critical and one moderate. The good news is that your client-side code follows security best practices, but the database layer needs immediate fixes.

---

## Critical Issues (Must Fix)

### 1. Waitlist Emails Publicly Readable
**Severity: CRITICAL**

**The Problem:** The `waitlist` table has RLS enabled with an INSERT policy, but no SELECT policy. This means anyone with your Supabase URL and anon key (which are public in your frontend code) can query and download all email addresses.

**Real-World Risk:** 
- Spammers could harvest your waitlist emails
- Competitors could steal your lead list
- GDPR/privacy violations for European users

**The Fix:**
Add a policy that blocks all public reads:
```sql
CREATE POLICY "Deny public reads on waitlist"
  ON public.waitlist
  FOR SELECT
  USING (false);
```

---

## Moderate Issues

### 2. Overly Permissive INSERT Policy
**Severity: MODERATE**

**The Problem:** The current policy `WITH CHECK (true)` allows any INSERT without restrictions. While this is intentional for a public waitlist, it enables abuse.

**Real-World Risk:**
- Attackers could spam your database with millions of fake emails
- Database storage exhaustion
- Denial of service for legitimate signups

**Recommendations:**
1. Add rate limiting via a Supabase Edge Function
2. Consider adding CAPTCHA verification before insert
3. Add email validation at the database level

---

## What's Good (No Changes Needed)

### Client-Side Security
- **Input Validation**: Email validation with regex before submission
- **Error Handling**: Errors are caught and shown via toast, not exposed in detail
- **No XSS Vulnerabilities**: No `dangerouslySetInnerHTML` with user input (only used in chart.tsx for static theme styles)
- **No Sensitive Data in localStorage**: Only Supabase auth tokens stored (expected behavior)

### Code Quality
- No hardcoded credentials or secrets
- No external URL injections
- Console logging is minimal and only for debugging errors

---

## Implementation Plan

### Phase 1: Immediate Fixes (Database)

**Step 1: Block Public Reads on Waitlist Table**

Add a new migration to deny SELECT access to the waitlist table. Only authenticated admin users should be able to view waitlist entries (you can add admin access later when you implement authentication).

**Step 2: Consider Rate Limiting (Optional Enhancement)**

Create an edge function that wraps the waitlist signup to add rate limiting per IP address. This prevents spam attacks but is optional for MVP.

---

## Security Checklist for Future Development

When you implement authentication and user features, ensure:

1. **User Roles**: Store roles in a separate `user_roles` table (not on profiles)
2. **Protected Routes**: Add auth checks to `/profile` and `/my-trips` pages
3. **RLS on User Data**: Any user-specific tables need proper `auth.uid()` policies
4. **Email Verification**: Don't auto-confirm signups unless explicitly needed

---

## Technical Details

### Current Database Schema
```text
+-------------------+
|     waitlist      |
+-------------------+
| id (uuid, PK)     |
| email (text)      |
| created_at (ts)   |
+-------------------+
```

### Current RLS Policies
| Table | Policy | Command | Check |
|-------|--------|---------|-------|
| waitlist | Anyone can join the waitlist | INSERT | true |
| waitlist | (MISSING) | SELECT | - |
| waitlist | (MISSING) | UPDATE | - |
| waitlist | (MISSING) | DELETE | - |

### Migration SQL to Apply
```sql
-- Block all public reads on waitlist
CREATE POLICY "Deny public reads on waitlist"
  ON public.waitlist
  FOR SELECT
  USING (false);

-- Block all updates (emails should not be editable)
CREATE POLICY "Deny updates on waitlist"
  ON public.waitlist
  FOR UPDATE
  USING (false);

-- Block all deletes (preserve waitlist integrity)
CREATE POLICY "Deny deletes on waitlist"
  ON public.waitlist
  FOR DELETE
  USING (false);
```

---

## Summary

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| Waitlist emails publicly readable | Critical | Needs Fix | Add SELECT USING (false) policy |
| Permissive INSERT policy | Moderate | Monitor | Consider rate limiting later |
| Client-side input validation | N/A | Good | No changes needed |
| XSS protection | N/A | Good | No changes needed |

**Recommended Priority:** Fix the critical SELECT policy issue before launching or collecting real user emails.
