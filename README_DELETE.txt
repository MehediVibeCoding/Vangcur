Phase C — Wishlist স্লাইস

নতুন ফাইল:
- lib/store/wishlistStore.ts

REPLACE করতে হবে (extract করে root-এ overwrite):
- lib/productData.ts
- app/components/cart/WishlistDrawer.tsx
- app/components/cart/FloatWishBadge.tsx
- app/components/home/ProductCard.tsx
- app/components/auth/AccountPage.tsx
- app/components/auth/LoginModal.tsx
- app/ClientHome.tsx
- app/product/[slug]/ProductDetailClient.tsx

মুছে ফেলার কিছু নেই এই ধাপে।
package.json পরিবর্তন লাগবে না — zustand আগের (Cart) ধাপেই যোগ হয়ে গেছে।
