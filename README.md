# LoyaltyPass Mobile - React Native & Supabase

A production-grade mobile customer loyalty application built with **React Native**, **Expo**, **TypeScript**, and **Supabase** (PostgreSQL, Row Level Security, and Authentication).

---

## 1. Project Structure

```text
├── app/                              # React Native / Expo Router Screens
│   ├── (auth)/
│   │   └── login.tsx                 # Supabase email/password login & registration
│   ├── (customer)/
│   │   ├── home.tsx                  # Dynamic greeting, Loyalty Card, "Show My QR"
│   │   ├── qr.tsx                    # Safe customer QR code display screen
│   │   ├── points.tsx                # Real point balance and chronological history
│   │   └── account.tsx               # Profile info and Logout
│   └── (merchant)/
│       ├── home.tsx                  # Greeting, Today's Statistics, Scan QR button, Recent Transactions
│       ├── scan.tsx                  # Camera barcode scanner and verification
│       └── award-points.tsx          # Customer confirmation, points input, duplicate protection
│
├── services/                         # Business & Database Service Layer
│   ├── auth.ts                       # Supabase auth, session persistence, role routing
│   ├── loyalty.ts                    # SUM(points) calculation & customer transaction history
│   └── merchant.ts                   # Points Awarded Today, Transactions Today, verify customer, awardPoints RPC
│
├── lib/
│   └── supabase.ts                   # Supabase client initialization (Expo & Web compatible)
│
├── types/
│   └── index.ts                      # Profile, LoyaltyTransaction, MerchantStats, AwardPointsResult
│
├── supabase/
│   └── migrations/
│       └── 20261110_init_loyalty_schema.sql # PostgreSQL schema, RLS policies, trigger, & award_points RPC
│
├── src/                              # Interactive Mobile Simulator (Vite & Tailwind)
│   ├── App.tsx                       # Side-by-Side Dual Device Demo & Single Device Simulator
│   ├── components/
│   │   ├── PhoneFrame.tsx            # iOS & Android physical frame simulator
│   │   ├── QRGenerator.tsx           # High-resolution SVG QR Code generator
│   │   ├── CameraScanner.tsx         # Real camera stream scanner with html5-qrcode
│   │   └── SupabaseConfigModal.tsx   # Live Supabase connection inspector
│   └── views/                        # Dual-mode mobile touch views
│
├── app.json                          # Expo configuration (iOS & Android camera permissions)
├── package-expo.json                 # Standalone React Native / Expo dependencies
└── .env.example                      # Environment variables template
```

---

## 2. Technologies Used

- **Framework**: React Native with Expo SDK & TypeScript
- **Backend / Database**: Supabase PostgreSQL
- **Security**: Row Level Security (RLS) & PostgreSQL `SECURITY DEFINER` RPC (`award_points`)
- **Authentication**: Supabase Email & Password Auth
- **QR Generation**: High-res QR code generation (safe customer UUID only)
- **QR Scanning**: Expo Camera / Camera barcode scanning with duplicate scan prevention
- **State & Data Calculation**: Real-time `SUM(points)` derivation from transactions

---

## 3. Database Tables & Schema

### `public.profiles`
- `id` (UUID, Primary Key, references `auth.users(id)`)
- `email` (TEXT)
- `full_name` (TEXT)
- `role` (`user_role`: `'customer'` or `'merchant'`)
- `created_at` (TIMESTAMPTZ)

### `public.loyalty_transactions`
- `id` (UUID, Primary Key)
- `customer_id` (UUID, references `public.profiles(id)`)
- `merchant_id` (UUID, references `public.profiles(id)`)
- `points` (INTEGER, `CHECK (points > 0)`)
- `created_at` (TIMESTAMPTZ)

---

## 4. Row Level Security (RLS) Policies

1. **Profiles Table**:
   - `Users can view own profile`: `auth.uid() = id`
   - `Merchants can view customer profiles`: Authenticated merchants can view customers to identify them during scanning.
   - `Customers can view merchant profiles`: Authenticated customers can view merchant names in transaction history.
   - `Users can update own profile`: `auth.uid() = id`
2. **Loyalty Transactions Table**:
   - `Customers can view their own transactions`: `customer_id = auth.uid()`
   - `Merchants can view transactions awarded by them`: `merchant_id = auth.uid()`
   - `Merchants can insert transactions`: Verified merchants can insert transactions where `merchant_id = auth.uid()` and `points > 0`.
   - `Transactions are immutable`: No `UPDATE` or `DELETE` permitted.
3. **Database Function (`award_points`)**:
   - Validates that caller identity is strictly derived from `auth.uid()`.
   - Validates caller role is `merchant`.
   - Validates customer exists and points $> 0$.
   - Inserts transaction and computes real updated balance.

---

## 5. Environment Variables

Create `.env` using `.env.example`:

```env
# Expo React Native
EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Web Simulator
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

*Note: Never commit or include the Supabase `service_role` secret in the client application.*

---

## 6. How to Run the Project

### Interactive Browser Simulator (Port 3000)
```bash
npm install
npm run dev
```

### React Native / Expo Native Mobile (iOS / Android)
```bash
cp package-expo.json package.json
npx expo start
```
- Press `a` for Android Emulator.
- Press `i` for iOS Simulator.

---

## 7. Test Accounts

The schema and built-in engine provide pre-configured test credentials:

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Customer** | `john@example.com` | `password123` | John Doe |
| **Merchant** | `merchant@example.com` | `password123` | ABC Restaurant |

New test accounts can also be created instantly via the **Sign Up** tab.

---

## 8. Complete 8-Step Demonstration

1. **Step 1**: Open app as Customer (`john@example.com`). See dynamic greeting `"Good morning, John"` and Current Points: `0`.
2. **Step 2**: Tap **"Show My QR"**. John's static, safe customer QR code appears.
3. **Step 3**: Open Merchant Terminal (`merchant@example.com`). See `"Good morning, ABC Restaurant"`, Points Awarded Today: `0`, Transactions Today: `0`.
4. **Step 4**: Tap **"Scan Customer QR"**. Camera opens with reticle. Point at customer QR (or tap "Instant Scan: John Doe").
5. **Step 5**: Customer confirmation screen appears showing `John Doe` and `Current Points: 0`.
6. **Step 6**: Enter `10` points and tap **"Award Points"**.
7. **Step 7**: Button disables to prevent duplicate submissions, transaction is saved to Supabase, success message appears. Merchant sees `Transactions Today: 1`, `Points Awarded Today: 10`, and recent transaction `+10 pts`.
8. **Step 8**: Return to customer phone. John's balance updates in real-time to `10 Points`, and Points History shows `ABC Restaurant +10 points`.
