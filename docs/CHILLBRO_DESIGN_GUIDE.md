# Chillbro Mobile App — Design System & Style Guide

This guide captures the exact visual identity, color scheme, typography, iconography, and component patterns extracted from the **Chillbro** web platform for seamless mobile app development.

---

## 1. Brand Identity & Copy Guidelines

- **Brand Name:** Chillbro
- **Primary Tagline:** `GOOD DRINKS. GREAT TIMES.`
- **Top Announcement Slogan:** `GOOD DRINKS BRING PEOPLE TOGETHER`
- **Eyebrow / Sub-headline:** `Australia's trusted liquor delivery`
- **Legal Compliance Notice:** `Alcohol will not be sold to anyone under the age of 18. Drink Responsibly.`
- **Core Value Proposition:** Express 30–45 min express delivery in Sydney, NSW & surrounding areas. 100% Genuine Australian licensed retailer.

---

## 2. Color Palette & Theme Tokens

### 2.1 Primary & Dark Theme Colors
Used in topbar, navigation header, hero backdrop, brand banners, and footer:
```css
--color-bg-darkest:     #0D0F12;  /* Deepest charcoal / true dark base */
--color-bg-dark:        #16191E;  /* Main header, topbar, and dark cards */
--color-bg-dark-card:   #1E2229;  /* Elevated card background on dark mode */
--color-bg-dark-border: #2A2F3A;  /* Subtle dark border */
```

### 2.2 Gold & Brand Accent Colors
Used in primary action buttons (`.btn-gold`), highlight tags, badges, and promotional headers:
```css
--color-gold-primary:   #D4AF37;  /* Classic metallic gold / primary brand accent */
--color-gold-hover:     #E5C058;  /* Lighter gold for pressed/hover states */
--color-gold-dark:      #B38F24;  /* Deep antique gold for active borders */
--color-gold-soft:      #FDF8EC;  /* Ultra-light champagne gold for card backdrops */
--color-gold-text:      #C8A038;  /* Contrast gold text on dark backgrounds */
```

### 2.3 Light & Surface Neutrals
Used in light mode pages, general catalog cards, list items, and backgrounds:
```css
--color-surface-white:  #FFFFFF;  /* Card surface, modal sheets */
--color-bg-light:       #F8FAFC;  /* Default screen background */
--color-bg-subtle:      #F1F5F9;  /* Secondary pill background, input fields */
--color-border-light:   #E2E8F0;  /* Card borders, horizontal dividers */
--color-border-subtle:  #EDF2F7;  /* Subtle list item separators */
```

### 2.4 Typography Colors
```css
--color-text-primary:   #0F172A;  /* Dark slate / main headings and body text */
--color-text-secondary: #475569;  /* Secondary descriptions, meta specs */
--color-text-muted:     #94A3B8;  /* Timestamps, placeholder text, hints */
--color-text-on-dark:   #FFFFFF;  /* Headings on dark/hero sections */
--color-text-dim-dark:  #CBD5E1;  /* Secondary text on dark/hero sections */
```

### 2.5 Semantic & Badge Colors
```css
--color-badge-danger:   #EF4444;  /* Cart notification pill, alerts */
--color-rating-star:    #F59E0B;  /* Customer star rating gold/amber */
--color-badge-success:  #10B981;  /* Verified customer, stock in-hand */
--color-delivery-badge: #D97706;  /* 30-45 min delivery amber tag */
--color-delivery-bg:    #FEF3C7;  /* Light amber background for delivery pill */
```

---

## 3. Typography Hierarchy

### 3.1 Recommended Fonts
- **iOS:** `System` (San Francisco / SF Pro Display)
- **Android:** `Roboto` or `Inter`
- **Display Headings (Chillbro Logo & Hero):** Bold, heavy-weight display font with uppercase tracked styling.

### 3.2 Type Scale

| Role | Font Size | Weight | Line Height | Letter Spacing | Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Hero Title (H1)** | `32px` | `800` (Extra Bold) | `38px` | `-0.5px` | "Enjoy Your Weekend" |
| **Hero Sub (H2)** | `22px` | `600` (Semi Bold) | `28px` | `0px` | "With Australia's Favourite Drinks" |
| **Section Title (H3)**| `20px` | `700` (Bold) | `26px` | `-0.3px` | "Shop by Category", "Best Sellers" |
| **Card / Promo (H4)** | `16px` | `700` (Bold) | `22px` | `0px` | Product names, Member Rewards |
| **Body (Regular)** | `14px` | `400` (Regular) | `20px` | `0px` | Product descriptions, promo text |
| **Body (Semi Bold)**| `14px` | `600` (Semi Bold) | `20px` | `0px` | Button labels, price tags |
| **Caption / Meta** | `12px` | `500` (Medium) | `16px` | `0.2px` | Delivery time, volume (700mL), ratings |
| **Eyebrow / Badge** | `11px` | `700` (Bold) | `14px` | `1.5px` | ALL CAPS: "AUSTRALIA'S TRUSTED..." |

---

## 4. UI Components & Visual Patterns

### 4.1 Top Announcement & Delivery Bar
- **Background:** `#0D0F12` (Dark)
- **Content:**
  - Left: Location indicator pin (`Sydney, NSW`) with chevron + Delivery SLA badge (`30–45 min delivery`).
  - Center: Highlighted gold text (`GOOD DRINKS BRING PEOPLE TOGETHER`).
  - Right: 18+ age verification warning + Help & Support link.

### 4.2 Main Navigation & Header
- **Background:** `#16191E` (Dark Charcoal)
- **Brand Logo:** `Chillbro` (White, heavy bold) with subtitle `GOOD DRINKS. GREAT TIMES.` in gold (`#D4AF37`) with letter spacing.
- **Search Bar:** Pill-shaped input (`borderRadius: 24`, background `#2A2F3A` or `#F1F5F9`), magnifying glass icon.
- **Action Icons:**
  - Location Selector Pill (`Sydney, NSW — Change location`)
  - Wishlist Heart (`#FFFFFF`)
  - User Sign-in Icon
  - Cart Floating Button with item counter badge (`bg-danger` `#EF4444`) and total price (e.g. `$0.00`).

### 4.3 Hero Section
- **Background:** Dark image with warm amber/gold atmospheric backlight.
- **Eyebrow Tag:** "Australia's trusted liquor delivery"
- **Primary CTA:** Solid Gold button (`background: #D4AF37`, `color: #0D0F12`, `fontWeight: 'bold'`).
- **Secondary CTA:** Outlined White button (`borderWidth: 1.5`, `borderColor: #FFFFFF`, `color: #FFFFFF`).
- **Offer Badge:** Floating circular or rounded badge: `SAVE UP TO 20% ON SELECTED BRANDS`.

### 4.4 Trust Strip (5 Key Pillars)
A horizontal scrolling strip with 5 icons:
1. `Licensed Australian Retailer` — 100% Genuine Products (Shield icon)
2. `30–45 Min Delivery` — In Sydney & surrounding areas (Truck icon)
3. `Age Verified 18+` — ID check at delivery (User/ID icon)
4. `Secure Payment` — Multiple payment options (Credit card icon)
5. `Thousands of Happy Customers` — 4.8/5 average rating (Star icon)

### 4.5 Category Cards
- **Card Format:** Image container with dark linear gradient overlay.
- **Aspect Ratio:** `1:1` or `4:3` rounded cards (`borderRadius: 12`).
- **Typography:** White bold category title (`Whisky`, `Wine`, `Beer`, `Spirits`, `RTDs`, `Gifts`) + Sub-label (`"Premium selection"`, `"Local & global"`).

### 4.6 Product Card (Best Sellers)
- **Card Container:** Clean white card (`#FFFFFF`), subtle border (`#E2E8F0`), `borderRadius: 14`, padding `12px`.
- **Top Bar:** Wishlist heart icon button (top right).
- **Product Image:** Centered bottle imagery with light gray or white backdrop.
- **Rating:** Gold star icon (`#F59E0B`) with rating text (`4.8 (320)`).
- **Title:** `Glenfiddich 12YO` (Bold 15px, `#0F172A`).
- **Subtitle:** `Single Malt Scotch Whisky • 700mL` (13px, `#64748B`).
- **Price Row:**
  - Price: `$89.99` (Bold 16px, `#0F172A`).
  - Delivery Tag: Pill with truck icon and `30–45 mins` (background `#FEF3C7`, text `#B45309`).
- **Action Button:** Full-width "Add to Cart" button (`background: #0F172A` or `#D4AF37`).

### 4.7 Occasion Grid
- **Occasions:** Weekend BBQ, Date Night, Cocktail Party, Dinner Party, Corporate Gifts, Housewarming.
- **Presentation:** Background lifestyle photo with darkened gradient and centered white bold text.

---

## 5. React Native Icon Mappings (`@expo/vector-icons`)

| Website FontAwesome Icon | Expo Icon Library | Component Name |
| :--- | :--- | :--- |
| `fa-location-dot` | `Ionicons` | `location-sharp` |
| `fa-truck` / `fa-truck-fast` | `MaterialCommunityIcons` | `truck-fast-outline` / `truck-delivery` |
| `fa-magnifying-glass` | `Feather` / `Ionicons` | `search` |
| `fa-heart` (regular / solid) | `Ionicons` | `heart-outline` / `heart` |
| `fa-cart-shopping` | `Feather` / `Ionicons` | `shopping-bag` / `cart` |
| `fa-shield-halved` | `Ionicons` | `shield-checkmark-outline` |
| `fa-star` | `Ionicons` | `star` (`#F59E0B`) |
| `fa-user` | `Feather` | `user` |
| `fa-circle-exclamation` | `Ionicons` | `alert-circle-outline` |
| `fa-arrow-right` | `Feather` | `arrow-right` |

---

## 6. Implementation Checklist for Mobile App

- [x] Extracted all colors, typography, and styling into `docs/CHILLBRO_DESIGN_GUIDE.md`
- [x] Generated quick reference text file `CHILLBRO_STYLE_GUIDE.txt`
- [x] Created typed configuration `src/config/theme.ts` for direct use across React Native components
