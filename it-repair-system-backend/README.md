# IT Repair Office API (Express + MariaDB)

REST API starter for the screens supplied: login/register, user management, equipment categories, repair requests, repair status management, and dashboard summary. phpMyAdmin is used to administer the MariaDB database; the Express API connects directly to MariaDB.

## 1. Requirements
- Node.js 18+
- MariaDB/MySQL running locally or on a server
- phpMyAdmin (optional UI for running SQL and viewing tables)

## 2. Create database
1. Open phpMyAdmin.
2. Import `database/schema.sql` (or paste it into the SQL tab).
3. Create a dedicated database user. Example SQL (change the password):
```sql
CREATE USER 'repair_app'@'localhost' IDENTIFIED BY 'change_this_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON it_repair.* TO 'repair_app'@'localhost';
FLUSH PRIVILEGES;
```
If Node runs on another host, adjust the MariaDB account host and firewall rules accordingly. Avoid using the MariaDB root account in the app.

## 3. Run API
```bash
npm install
```
Copy `.env.example` to `.env`, then set the DB credentials and a long random `JWT_SECRET`.
```bash
npm run dev
```
API listens at `http://localhost:3000`. Check `GET /api/health`.

## 4. Bootstrap the first admin
Public registration intentionally creates `user` role only. Do not expose admin signup.
1. Register a user using `POST /api/auth/register`.
2. In phpMyAdmin SQL tab, promote that account:
```sql
UPDATE users SET role='admin' WHERE email='your-admin@example.com';
```
3. Log in again to receive a token containing the admin role.

## 5. Endpoints

All JSON request bodies use `Content-Type: application/json`. Authenticated endpoints use:
`Authorization: Bearer <token>`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | API + DB health |
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | Signed in | Current profile |
| GET | `/api/users?q=&role=&status=&page=1&limit=10` | Admin | Search/filter users |
| POST | `/api/users` | Admin | Add user (includes password, role, status) |
| PATCH | `/api/users/:id` | Admin | Edit profile, role, status, or password |
| DELETE | `/api/users/:id` | Admin | Delete user if no repair-ticket references |
| GET | `/api/categories` | Public | List equipment categories |
| POST | `/api/categories` | Admin | Add category |
| PATCH | `/api/categories/:id` | Admin | Edit category |
| DELETE | `/api/categories/:id` | Admin | Delete category if unused |
| POST | `/api/tickets` | Signed in | Submit a repair request |
| GET | `/api/tickets?q=&status=&page=1&limit=10` | Signed in | List tickets; normal users see only their own |
| GET | `/api/tickets/:id` | Signed in | Ticket detail; users can only see their own |
| PATCH | `/api/tickets/:id/status` | Admin/technician | Update status and optional assignee |
| GET | `/api/dashboard/summary` | Admin/technician | Counts and recent tickets |

### Roles and values
- User role: `admin`, `technician`, `user`
- User status: `active`, `inactive`
- Repair status: `pending`, `in_progress`, `completed`
- Gender: `male`, `female`, `other`, `prefer_not_to_say`

## 6. Example requests

Register:
```http
POST /api/auth/register
Content-Type: application/json

{
  "first_name": "Somchai",
  "last_name": "Jai Dee",
  "phone": "0812345678",
  "email": "somchai@example.com",
  "password": "ChangeMe123",
  "address": "IT Department",
  "birth_date": "2000-01-01",
  "gender": "male"
}
```

Login:
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "somchai@example.com", "password": "ChangeMe123" }
```
Copy `token` from the response and set it as `Authorization: Bearer <token>`.

Create repair ticket:
```json
{
  "category_id": 1,
  "device_name": "Desktop PC",
  "brand_model": "Dell OptiPlex",
  "problem_description": "เปิดเครื่องไม่ติด",
  "location": "แผนกบัญชี ชั้น 2"
}
```

Update ticket:
```json
{ "status": "in_progress", "assigned_to": 2 }
```

## Notes
- phpMyAdmin is a database administration interface, not the database server. Start MariaDB/MySQL separately.
- This is a starter implementation; before production, add audit logs, stronger request validation, password reset/email verification, backups, HTTPS, and tests.
- `POST /api/auth/register` does not accept a role by design, to prevent users from registering as admins.
