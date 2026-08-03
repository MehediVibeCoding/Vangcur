# Vangcur Design System

এই ফাইল সব design token-এর single source of truth। Component বানানোর সময় এখান থেকেই value নিতে হবে, অনুমান করা যাবে না।

---

## Brand Colors (নীল — pixel-sampled from logo, স্থায়ী সিদ্ধান্ত)

| Role | Hex | ব্যবহার |
|------|-----|---------|
| **Main/Background** | `#C3DEFC` | সাইটের base background — cream/white-এর জায়গায় এখন এই sky blue tint |
| **Contrast/Accent** (wordmark) | `#0058C7` | Button, heading, link, primary CTA — আগে যেখানে `--red` ছিল |
| **Secondary accent** (gadgets-script) | `#005EFC` | Selective — badge, hover, ছোট highlight touch, বেশি জায়গায় না |
| Dark (text) | `#1A1A1A` | অপরিবর্তিত — legacy থেকে |
| Gray (muted text) | `#6B7280` | অপরিবর্তিত |
| Border | `#E5E7EB` | অপরিবর্তিত |

**নোট:** Logo gradient/3D effect-এর কারণে এই hex approximation (pixel-sampled, অনুমান না)। Designer থেকে canonical hex পেলে আপডেট হবে।

---

## Typography (legacy থেকে অপরিবর্তিত)

- Body: `'DM Sans', sans-serif`
- বাংলা: `'Hind Siliguri', sans-serif`
- Display/heading accent: `'Playfair Display', serif`

---

## Spacing & Radius (legacy থেকে exact)

- Border radius (card/button): `12px`
- Shadow levels:
  - `sh1`: `0 1px 4px rgba(0,0,0,.07)`
  - `sh2`: `0 4px 18px rgba(0,0,0,.10)`
  - `sh3`: `0 8px 36px rgba(0,0,0,.13)`

---

## ব্যবহারের নিয়ম

1. কোনো component-এ hardcoded hex color লেখা যাবে না — Tailwind class (`bg-brand`, `text-dark`, `bg-sky-200`) ব্যবহার করতে হবে
2. নতুন color দরকার হলে প্রথমে এই ফাইলে যোগ করে তারপর ব্যবহার করা
3. Legacy CSS-এর spacing/layout বদলানো যাবে না — শুধু color scheme বদলাচ্ছে
