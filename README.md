# 🍻 Chillbro On-Demand Liquor Delivery Mobile Application

A production-grade, full-stack React Native / Expo mobile application (iOS & Android) with an Express & PostgreSQL backend, designed specifically for **Chillbro**'s express 30–45 minute liquor delivery marketplace.

---

## 🌟 Key Features

1. **Brand Aesthetic & Design System**:
   - Built to match Chillbro's luxury dark/gold identity (`#D4AF37` Gold, `#16191E` Header, `#0D0F12` Darkest Base).
   - Documented in [CHILLBRO_STYLE_GUIDE.txt](file:///Users/vb/Desktop/mobile%20app/CHILLBRO_STYLE_GUIDE.txt) and [CHILLBRO_DESIGN_GUIDE.md](file:///Users/vb/Desktop/mobile%20app/docs/CHILLBRO_DESIGN_GUIDE.md).

2. **Customer Authentication & 6-Digit OTP**:
   - Secure customer signup and login with hashed passwords (`bcryptjs`).
   - 6-digit numeric OTP confirmation recorded in PostgreSQL `otps` table for signup and password reset.
   - Development helper toast/banner showing the OTP code for instant verification during review.

3. **Multi-Vendor Discovery & Filterable Storefronts**:
   - Marketplace dashboard displaying nearby licensed vendors (Kumar K, Siva, John) with distance, SLA, rating, and product counts.
   - Dedicated vendor storefronts with real-time category filtering (Whisky, Wine, Beer, Spirits, RTDs, Gin, Vodka), in-stock toggles, and sorting (Featured, Price Low-High, Price High-Low).

4. **Product Details Page (PDP)**:
   - High-resolution imagery, ABV pill, origin tags, volume/size selector, live stock availability counter, and interactive quantity stepper.

5. **Single-Vendor Cart Enforcement with Conflict Overwrite**:
   - Enforces the strict single-vendor rule: a customer checkout must only contain items from one vendor at a time.
   - If an item from a different vendor is added, a popup modal alerts the customer:
     > *"Hey, you already have items from [Vendor A] in your cart. Do you want to overwrite your cart or cancel?"*
   - Selecting **"Overwrite Cart"** flushes the prior vendor's items and locks the cart to the new vendor.

6. **Omnichannel Persistent Database Cart**:
   - Cart items are persisted to the remote PostgreSQL database (`carts` and `cart_items` tables) synchronized with the customer's account so carts remain consistent across mobile and web.

7. **Express Checkout & Stripe Payment**:
   - Delivery address input with unit/floor details and delivery instructions.
   - Mandatory **18+ Australian Liquor Verification** declaration checkbox.
   - Integrated Stripe card payment form with automatic bill breakdown (Subtotal, Delivery Fee, Tax, Total).

8. **Live Inventory Decrement & Order Recording**:
   - When an order is placed, an atomic database transaction generates the order record, item records, flushes the user's active cart, and **atomically decrements `products.qty` inventory**.
   - Confirmation screen with real-time delivery ETA countdown (30–45 mins).

9. **Customer Profile & Order History**:
   - "My Orders" tab with status badges (Order Placed, Store Preparing, Out for Delivery, Delivered).
   - Profile management with account details update and OTP-based password reset.

---

## 📁 Project Structure

```
mobile app/
├── App.tsx                          # Master mobile app router & tab navigator
├── app.json                         # Expo configuration
├── package.json                     # Dependencies & scripts
├── eslint.config.js                 # Flat ESLint configuration
├── CHILLBRO_STYLE_GUIDE.txt         # Quick reference design tokens
├── docs/
│   └── CHILLBRO_DESIGN_GUIDE.md     # Full design system & UI specs
├── src/
│   ├── config/
│   │   ├── apiConfig.ts             # Environment-aware backend endpoint resolver
│   │   └── theme.ts                 # Typed color, typography, spacing & border tokens
│   ├── types/
│   │   └── index.ts                 # Domain TypeScript interfaces (Vendor, Product, Cart, Order, User)
│   ├── services/
│   │   └── api.ts                   # Typed API client connecting to Express server
│   ├── context/
│   │   ├── AuthContext.tsx          # Authentication & OTP state management
│   │   └── CartContext.tsx          # Cart state with single-vendor conflict handling
│   ├── components/
│   │   ├── Header.tsx               # Chillbro topbar & search navigation
│   │   ├── FilterBar.tsx            # Category pills, in-stock switch & sorter
│   │   ├── ProductCard.tsx          # 2-column bottle card with stock badge
│   │   ├── OtpModal.tsx             # 6-digit numeric OTP entry modal
│   │   └── VendorConflictModal.tsx  # Single-vendor overwrite popup modal
│   └── screens/
│       ├── AuthScreen.tsx           # Login & Create Account screen
│       ├── MarketplaceHomeScreen.tsx# Vendor discovery cards
│       ├── VendorStorefrontScreen.tsx# Filterable product grid
│       ├── ProductDetailsScreen.tsx # Bottle PDP with volume selector
│       ├── CartScreen.tsx           # Cart breakdown with steppers
│       ├── CheckoutScreen.tsx       # Address, 18+ declaration & Stripe form
│       ├── ThankYouScreen.tsx       # Order confirmation & ETA countdown
│       ├── MyOrdersScreen.tsx       # Order history with status tags
│       └── ProfileScreen.tsx        # Profile editing & OTP password reset
└── server/
    ├── package.json                 # Backend dependencies (express, pg, bcryptjs, etc.)
    ├── .env                         # Remote DigitalOcean PostgreSQL credentials
    ├── test_all_scenarios.js        # 19 automated integration test scenarios
    └── src/
        ├── db.js                    # PostgreSQL pool with SSL configuration
        ├── index.js                 # Express server entry point
        ├── migrations/
        │   └── 001_create_carts_and_orders.js # Schema migration script
        └── routes/
            ├── auth.js              # Auth & OTP endpoints
            ├── vendors.js           # Vendor discovery & filterable catalog
            ├── cart.js              # Omnichannel cart & 409 conflict logic
            ├── orders.js            # Atomic order placement & stock decrements
            └── profile.js           # User profile & credentials
```

---

## 🚀 Running the Project

### 1. Start the Backend API Server
In a terminal window:
```bash
npm run server
# or
cd server && npm start
```
The backend server runs on `http://localhost:5001` and connects directly to the DigitalOcean PostgreSQL database.

### 2. Start the Expo Mobile App
In a second terminal window:
```bash
npm start
# or
npx expo start
```
- Press **`i`** for iOS Simulator
- Press **`a`** for Android Emulator
- Press **`w`** for Web Browser preview
- Or scan the QR code with **Expo Go** on your physical device.

---

## 🧪 Testing & Verification

### Run Backend Integration Tests (19 Scenarios)
Verify complete database integrity, OTP issuance, authentication, single-vendor cart 409 conflict interception, overwrite resolution, atomic inventory decrement, and order placement:
```bash
node server/test_all_scenarios.js
```
*(All 19 scenarios pass with 0 errors)*.

### Run TypeScript Compilation & Linting
```bash
npx tsc --noEmit
npx eslint src/ App.tsx
npx expo-doctor
```
*(100% type-safe, 0 TypeScript errors, 0 ESLint errors/warnings, 20/20 expo-doctor checks passed)*.
