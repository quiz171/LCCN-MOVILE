# Security Specification — LCCN Digital Church App

## 1. Data Invariants

1. **Identity & Email Verification**: All reads and writes require an authenticated Firebase user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
2. **Member PII Isolation**: Member phone numbers and email addresses in `/members/{memberId}` are strictly restricted to the profile owner (`memberId == request.auth.uid`) or an authorized administrator whose assigned scope (`diocese_secretary`, `division_admin`, or `church_admin`) encloses that member's `dioceseId`, `divisionId`, or `churchId`.
3. **Zero Self-Escalation**: No user may create or mutate `/admins/{adminId}` or `/adminInvites/{inviteId}` unless they are the bootstrapped administrator or an active `diocese_secretary`, or they hold a matching verified `adminInvite` document whose email matches `request.auth.token.email`.
4. **Scoped Authority**:
   - `diocese_secretary`: Can manage announcements, events, divisions, districts, and churches within their assigned `dioceseId`.
   - `division_admin`: Can manage division/church announcements, division/church events, districts, and churches strictly within their assigned `divisionId`.
   - `church_admin`: Can manage church-scoped announcements, church-scoped events, and update church profile details (`name`, `pastorName`, `address`, `serviceSchedule`, `phone`) strictly within their assigned `churchId`.
5. **Temporal & Structural Integrity**: All `createdAt`, `publishedAt`, and `updatedAt` timestamps must match `request.time`. All strings, arrays, and document IDs enforce bounded lengths and strict key allowlists (`hasAll` + `hasOnly`).

## 2. "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **Shadow Field Injection on Member Registration**: Creating `/members/{uid}` with an extra `"role": "diocese_secretary"` or `"isAdmin": true` ghost field. -> Rejected by `hasOnly(...)`.
2. **Cross-UID Member Impersonation**: Creating `/members/other_user_uid` while signed in as `uid_a`. -> Rejected by `memberId == request.auth.uid` and `incoming().uid == request.auth.uid`.
3. **Unauthenticated Directory Read**: Reading `/churches/area_1_church` without `request.auth`. -> Rejected by `isVerifiedUser()`.
4. **Member PII Scraping**: Authenticated regular member calling `getDocs(collection(db, 'members'))` or `getDoc(doc(db, 'members', 'other_uid'))`. -> Rejected because user is neither owner nor in `admins`.
5. **Self-Assigned Admin Escalation**: Regular member writing `/admins/{uid}` with `{ role: "diocese_secretary" }` and no valid `adminInvites` doc. -> Rejected by `canClaimInvite` / `isDioceseAdmin`.
6. **Spoofed Admin Invite Claim**: Regular member trying to claim an invite created for another email address. -> Rejected by `invite.email == request.auth.token.email`.
7. **Cross-Scope Announcement Publish**: `church_admin` for Area 1 Church creating an announcement with `visibilityScope: "diocese"` or targeting another church's `churchId`. -> Rejected by `canManageScope`.
8. **Cross-Division Event Edit**: `division_admin` for Division A updating an event belonging to Division B. -> Rejected by `canManageScope` on `existing()` and `incoming()`.
9. **Church Admin Reparenting Attack**: `church_admin` attempting to change `dioceseId` or `divisionId` on `/churches/{churchId}`. -> Rejected by `affectedKeys().hasOnly(...)` and immutability checks.
10. **Oversized Payload / Denial-of-Wallet**: Sending a 50KB string in `announcement.title` or 50 items in `church.serviceSchedule`. -> Rejected by `.size() <= max` bounds.
11. **Timestamp Forgery**: Creating an announcement with a backdated `publishedAt` instead of `request.time`. -> Rejected by `incoming().publishedAt == request.time`.
12. **ID Poisoning**: Creating a document with a 500-character ID or invalid characters (`../admin`). -> Rejected by `isValidId()`.
