# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Whitelist Access Control**: Only authenticated users with verified emails (`request.auth.token.email_verified == true`) matching Daniel (`danielXzohar@gmail.com` / `danielxzohar@gmail.com` / `daniel*`) or Eden (`eden*`) may read or write any household data.
2. **Master Gate Relational Integrity**: Subcollection documents (`creditCards`, `fixedItems`, `directCharges`) cannot be created, read, updated, or deleted unless the parent `/households/{householdId}` document exists and the document's `householdId` matches the path parameter `{householdId}`.
3. **Strict Schema & Key Validation**: Every `create` and `update` operation must pass `isValid[Entity](incoming())`, enforcing exact key allowlists (`hasAll` and `hasOnly`), bounded string lengths, numeric ranges, and regex ID formats.
4. **Temporal & Identity Integrity**: `ownerId` must match `request.auth.uid`, `createdAt` must equal `request.time` on creation and remain immutable on updates, and `updatedAt` must equal `request.time` on every write.
5. **Query Enforcer on List Operations**: All `allow list` rules enforce `isWhitelistedFamilyMember()` and `resource.data.householdId == householdId` without expensive `get()` calls inside list rules.

## 2. The "Dirty Dozen" Payloads
1. **Unverified Email Spoof**: `{ "auth": { "uid": "u1", "token": { "email": "danielXzohar@gmail.com", "email_verified": false } } }` -> `PERMISSION_DENIED`
2. **Non-Whitelisted Intruder**: `{ "auth": { "uid": "u2", "token": { "email": "intruder@gmail.com", "email_verified": true } } }` -> `PERMISSION_DENIED`
3. **Shadow Field Injection on Household**: `{ "ownerId": "u1", "bankBalance": 10000, "monthlySalary": 34000, "streakCount": 1, "lastCreditUpdateIso": "2026-11-08", "lastBankUpdateIso": "2026-11-08", "isAdmin": true }` -> `PERMISSION_DENIED`
4. **Identity Spoofing (`ownerId != request.auth.uid`)**: `{ "ownerId": "someone_else", "bankBalance": 10000 }` -> `PERMISSION_DENIED`
5. **Orphaned Subcollection Write**: Creating `/households/non_existent_id/creditCards/c1` when `/households/non_existent_id` does not exist -> `PERMISSION_DENIED`
6. **ID Poisoning Attack**: Document ID with special characters or length > 128 (`cardId = "bad$id!@#"` ) -> `PERMISSION_DENIED`
7. **String Size Overflow (Denial of Wallet)**: `CreditCard.name` with 500 characters (`maxLength` is 80) -> `PERMISSION_DENIED`
8. **Invalid Enum Value on CreditCard**: `CreditCard.holder = "זר"` (not in `['דניאל', 'עדן', 'משותף']`) -> `PERMISSION_DENIED`
9. **Immutable Field Mutation (`createdAt` modified on update)**: Updating `Household` with `incoming().createdAt != existing().createdAt` -> `PERMISSION_DENIED`
10. **Forged Client Timestamp (`updatedAt != request.time`)**: Sending a past or future timestamp instead of `request.time` -> `PERMISSION_DENIED`
11. **Path Mismatch on Subcollection (`householdId` field != `{householdId}` path)**: Creating `/households/h1/fixedItems/f1` with `householdId: "h2"` -> `PERMISSION_DENIED`
12. **Value Poisoning on Update**: Updating `CreditCard.amount` with a string `"1000"` instead of a number -> `PERMISSION_DENIED`
