# Dairy Infrastructure Portal - Test Credentials

## Overview
This document contains all test user credentials for the Dairy Infrastructure Management Portal. Use these credentials to test different user roles and functionalities.

---

## Super Admin

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@dairyportal.com | admin123 |

---

## Core System Roles (Common Password: `pass123`)

| Role | Full Name | Email/ID | Password |
|------|-----------|----------|----------|
| Admin | Supreme Admin | admin@test.com | pass123 |
| District Manager | Kavin DM | dm@test.com | pass123 |
| Transport Manager | TM Kumar | tm@test.com | pass123 |
| MPCS Officer | Officer Ravi | mpcs@test.com | pass123 |
| MPCS Officer (Extra 2) | MPCS Officer 2 to 3 | mpcs2@test.com to mpcs3@test.com | pass123 |
| Supervisor (Collection) | Supervisor Arun | coll@test.com | pass123 |
| Supervisor (Production) | Supervisor Bala | prod@test.com | pass123 |
| Supervisor (Extra 4) | Supervisor 3 to 6 | prod3@test.com to prod6@test.com | pass123 |
| Operator | Operator Selvam | op@test.com | pass123 |
| Operator (Extra 10) | Operator 2 to 11 | op2@test.com to op11@test.com | pass123 |
| Driver | Driver Mani | driver@test.com | pass123 |
| Driver (Extra 4) | Driver 2 to 5 | driver2@test.com to driver5@test.com | pass123 |

---

## Farmer Credentials

Farmers login using **phone number** and **password (date of birth in DDMMYYYY format)**.

### Farmer Credentials Format
- **Phone Number**: 10-digit number (e.g., 9876543210)
- **Password**: Date of birth in DDMMYYYY format (e.g., 01011990 = 01 Jan 1990)

### Sample Farmer (Working Credentials)
Below is the default farmer created by the seed script:

- **Farmer ID**: A1-DM1-MPCS1-F1
- **Phone**: 9876543210
- **Password (DOB DDMMYYYY)**: 01011990

### Extra Farmers Generated
- **Farmer IDs**: A1-DM1-MPCS1-F2 to F4
- **Phone**: 9876543212 to 9876543214
- **Password**: 01011990 (For all)

---

## Quick Reference - Passwords by Role

| Role | Password |
|------|----------|
| Super Admin | admin123 |
| All Other Staff | pass123 |
| Farmer | Date of Birth (DDMMYYYY) |

---

## Testing Tips

1. **Staff Login**: Use the email with `pass123` password at the main login page.
2. **Farmer Login**: Use phone number + DOB (DDMMYYYY) format at the farmer login page.
3. **Role Navigation**: After login, the dashboard automatically loads based on user role.
4. **Reseed Database**: Run `node seed-database-v2.js` in the `backend` folder to reset all data and recreate these users.

---

## Notes
- All passwords are hashed in the database using bcrypt.
- The current seed script (`seed-database-v2.js`) creates a single user for each role (except Supervisor) to simplify testing.
- The hierarchy is maintained: Admin -> DM -> (TM, MPCS, Supervisors) -> (Driver, Operator, Farmers).
