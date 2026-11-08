import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('Dirty Dozen Security Invariants in firestore.rules', () => {
  // 1. Default deny catch-all
  assert.ok(rulesContent.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));

  // 2. Mandatory email_verified check
  assert.ok(rulesContent.includes('request.auth.token.email_verified == true'));

  // 3. Whitelist check for Daniel and Eden
  assert.ok(rulesContent.includes("request.auth.token.email == 'danielXzohar@gmail.com'"));
  assert.ok(rulesContent.includes("request.auth.token.email.matches('^[eE]den.*@.*$')"));

  // 4. Strict key validation (hasAll and hasOnly) on all 4 entities
  assert.ok(rulesContent.includes('function isValidHousehold(data)'));
  assert.ok(rulesContent.includes('function isValidCreditCard(data, householdId)'));
  assert.ok(rulesContent.includes('function isValidFixedItem(data, householdId)'));
  assert.ok(rulesContent.includes('function isValidDirectCharge(data, householdId)'));
  assert.ok(rulesContent.includes('data.keys().hasAll('));
  assert.ok(rulesContent.includes('data.keys().hasOnly('));

  // 5. Identity integrity (ownerId == request.auth.uid)
  assert.ok(rulesContent.includes('data.ownerId == request.auth.uid'));

  // 6. Temporal integrity (request.time and immutable createdAt)
  assert.ok(rulesContent.includes('incoming().createdAt == request.time'));
  assert.ok(rulesContent.includes('incoming().updatedAt == request.time'));
  assert.ok(rulesContent.includes('incoming().createdAt == existing().createdAt'));

  // 7. Master Gate relational check on subcollections
  assert.ok(rulesContent.includes('exists(/databases/$(database)/documents/households/$(householdId))'));

  // 8. Query Enforcer on allow list without expensive get() inside list
  assert.ok(rulesContent.includes('allow list: if isWhitelistedFamilyMember() &&\n          existing().householdId == householdId;'));
});
