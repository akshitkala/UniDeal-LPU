# Resend Email Service Audit Report

**Timestamp:** 2026-04-03T13:56:04.723Z
**Environment:** Production

## Summary
- **Total Tests:** 7
- **Passed:** 0 ✅
- **Failed:** 7 ❌
- **Mocked:** 0 (No API Key)

## Detailed Results

| Test Case | Status | Details |
|-----------|--------|---------|
| Welcome Email | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
| Listing Rejected | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
| Listing Deleted by Admin | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
| Listing Expired | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
| Account Banned | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
| Account Deleted | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
| Contact Message (Admin & User) | ❌ Fail | {"statusCode":422,"name":"validation_error","message":"Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format."} |
