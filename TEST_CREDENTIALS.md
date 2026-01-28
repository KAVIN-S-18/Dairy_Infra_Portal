# Dairy Infrastructure Portal - Test Credentials

## Overview
This document contains all test user credentials for the Dairy Infrastructure Management Portal. Use these credentials to test different user roles and functionalities.

---

## Super Admin

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@dairyportal.com | admin123 |

---

## Admin (Cooperative)

| Admin ID | Full Name | Email | Password |
|----------|-----------|-------|----------|
| A1 | Admin 1 | admin1@cooperative.com | admin@123 |
| A2 | Admin 2 | admin2@cooperative.com | admin@123 |

---

## District Managers

| DM ID | Full Name | Email | Password |
|-------|-----------|-------|----------|
| A1-DM1 | District Manager 1 under A1 | dm1@admin1.com | dm@123 |
| A1-DM2 | District Manager 2 under A1 | dm2@admin1.com | dm@123 |
| A2-DM1 | District Manager 1 under A2 | dm1@admin2.com | dm@123 |
| A2-DM2 | District Manager 2 under A2 | dm2@admin2.com | dm@123 |

---

## Supervisors

All supervisors use password: `sup@123`

### Under A1-DM1
- sup1@dm1.com
- sup2@dm1.com

### Under A1-DM2
- sup1@dm2.com
- sup2@dm2.com

### Under A2-DM1
- sup1@dm3.com
- sup2@dm3.com

### Under A2-DM2
- sup1@dm4.com
- sup2@dm4.com

---

## Operators

All operators use password: `op@123`

### Under A1-DM1
- op1@dm1.com
- op2@dm1.com

### Under A1-DM2
- op1@dm2.com
- op2@dm2.com

### Under A2-DM1
- op1@dm3.com
- op2@dm3.com

### Under A2-DM2
- op1@dm4.com
- op2@dm4.com

---

## MPCS Officers

All MPCS officers use password: `mpcs@123`

### Under A1-DM1
- mpcs1@dm1.com
- mpcs2@dm1.com

### Under A1-DM2
- mpcs1@dm2.com
- mpcs2@dm2.com

### Under A2-DM1
- mpcs1@dm3.com
- mpcs2@dm3.com

### Under A2-DM2
- mpcs1@dm4.com
- mpcs2@dm4.com

---

## Transport Managers

All transport managers use password: `tm@123`

| TM ID | Full Name | Email |
|-------|-----------|-------|
| A1-DM1-TM1 | Transport Manager under A1-DM1 | tm1@dm1.com |
| A1-DM2-TM1 | Transport Manager under A1-DM2 | tm1@dm2.com |
| A2-DM1-TM1 | Transport Manager under A2-DM1 | tm1@dm3.com |
| A2-DM2-TM1 | Transport Manager under A2-DM2 | tm1@dm4.com |

---

## Drivers

All drivers use password: `driver@123`

### Under A1-DM1-TM1
- driver1@tm1.com
- driver2@tm1.com

### Under A1-DM2-TM1
- driver1@tm2.com
- driver2@tm2.com

### Under A2-DM1-TM1
- driver1@tm3.com
- driver2@tm3.com

### Under A2-DM2-TM1
- driver1@tm4.com
- driver2@tm4.com

---

## Farmers

Farmers login using **phone number** and **password (date of birth in DDMMYYYY format)**.

### Farmer Credentials Format
- **Phone Number**: 10-digit number (e.g., 9870294203)
- **Password**: Date of birth in DDMMYYYY format (e.g., 17021981 = 17 Feb 1981)

### Sample Farmers
Run the following command to get current farmer credentials:
```bash
cd backend
node get-farmer-credentials.js
```

This will display:
```
Farmer 1:
  Farmer ID: A1-DM1-MPCS1-F1
  Phone: 9870294203
  Password (DOB DDMMYYYY): 17021981

Farmer 2:
  Farmer ID: A1-DM1-MPCS1-F2
  Phone: 9857547034
  Password (DOB DDMMYYYY): 03081982
```

**Note**: Phone numbers and DOB are randomly generated on each seed, so run the script above to get current credentials.

---

## Quick Reference - Passwords by Role

| Role | Password |
|------|----------|
| Super Admin | admin123 |
| Admin | admin@123 |
| District Manager | dm@123 |
| Supervisor | sup@123 |
| Operator | op@123 |
| MPCS Officer | mpcs@123 |
| Transport Manager | tm@123 |
| Driver | driver@123 |
| Farmer | Date of Birth (DDMMYYYY) |

---

## Testing Tips

1. **Admin Login**: Use any admin email with `admin@123` password at `/login`
2. **Farmer Login**: Use phone number + DOB (DDMMYYYY) format at `/farmer-login`
3. **Role Navigation**: After login, the dashboard automatically loads based on user role
4. **Reseed Database**: Run `node seed-database-v2.js` in the backend folder to regenerate all users and farmer phone numbers

---

## Generated Statistics

- **Admins**: 2
- **District Managers**: 4 (2 per admin)
- **Supervisors**: 8 (2 per district manager)
- **Operators**: 8 (2 per district manager)
- **MPCS Officers**: 8 (2 per district manager)
- **Transport Managers**: 4 (1 per district manager)
- **Drivers**: 8 (2 per transport manager)
- **Farmers**: 24 (3 per MPCS officer)
- **Total Users**: 62+

---

## Notes

- All passwords are hashed in the database using bcrypt
- Farmer credentials are dynamically generated on each seed
- Email format for each role helps identify their hierarchy
- Use these credentials for development and testing purposes only
