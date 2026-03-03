# Bitespeed Identity Reconciliation API

This project implements the **/identify** endpoint for Bitespeed's Identity Reconciliation problem.

It links contacts based on shared email and/or phone numbers and maintains primary-secondary relationships.

---

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM

---

## API Endpoint

### POST `/identify`

Identifies and links contacts based on email and phone number.

---

## Request Body

```json
{
  "email": "isha@biteS.com",
  "phoneNumber": "123456"
}
```

- Both fields are optional, but at least one must be provided.

**Response**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["doc@bitespeed.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

## How It Works

1. Searches for existing contacts matching email or phoneNumber.
2. If none exist → creates a new primary contact.
3. If matches exist:
    - Oldest contact becomes primary
    - Others become secondary
    - Missing email/phone is added as a new secondary contact

4. Returns consolidated contact details.

---

## Database Schema
```prisma
model Contact {
  id             Int      @id @default(autoincrement())
  email          String?
  phoneNumber    String?
  linkedId       Int?
  linkPrecedence String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```
---

## Setup Instructions

### 1️. Clone Repository

```bash
git clone <https://github.com/Isha12D/identity-reconciliation>
cd <repo-name>
```

---

### 2️. Install Dependencies

```bash
npm install
```

---

### 3️. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

---

### 4️. Run Migrations

```bash
npx prisma migrate dev --name init
```

---

### 5️. Start Server

```bash
npm run dev
```

Server runs on:

```
http://localhost:3000
```

---

## Testing With Postman

### Endpoint

```
POST http://localhost:3000/identify
```

### Body → Raw → JSON

```json
{
  "email": "isha@biteS.com",
  "phoneNumber": "123456"
}
```

---

## 🔎 Optional: View Database

```bash
npx prisma studio
```
---

## Notes
- Oldest contact is always treated as primary.
- Duplicate information is not stored.
- Fully transactional using Prisma $transaction.
- Built with strict TypeScript typing.