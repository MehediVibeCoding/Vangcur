"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useCartStore } from "@/lib/store/cartStore";
import { useLanguageStore } from "@/lib/store/languageStore";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/bodyScrollLock";
import { showToast } from "@/lib/toast";

// Header Watermark Gadget Line-Art (14% Opacity)
const HeaderDecor: React.FC = () => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14] text-ink"
    viewBox="0 0 400 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
  >
    {/* Headphones Line-Art */}
    <path
      d="M25 65 C25 35, 65 35, 65 65"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect x="20" y="55" width="10" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="60" y="55" width="10" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />

    {/* Smartwatch Line-Art */}
    <rect x="110" y="32" width="22" height="28" rx="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M115 32 V22 H127 V32" stroke="currentColor" strokeWidth="1.5" />
    <path d="M115 60 V70 H127 V60" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="121" cy="46" r="5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />

    {/* Gamepad / Controller Line-Art */}
    <rect x="175" y="35" width="45" height="25" rx="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M185 43 H191 M188 40 V46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="206" cy="43" r="2" fill="currentColor" />
    <circle cx="212" cy="47" r="2" fill="currentColor" />

    {/* Phone / Tablet Line-Art */}
    <rect x="260" y="25" width="28" height="48" rx="5" stroke="currentColor" strokeWidth="1.5" />
    <line x1="270" y1="30" x2="278" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="274" cy="65" r="2" stroke="currentColor" strokeWidth="1" />

    {/* Earbuds Case Line-Art */}
    <rect x="330" y="38" width="30" height="24" rx="8" stroke="currentColor" strokeWidth="1.5" />
    <line x1="330" y1="48" x2="360" y2="48" stroke="currentColor" strokeWidth="1" />
    <circle cx="340" cy="43" r="2" fill="currentColor" />
    <circle cx="350" cy="43" r="2" fill="currentColor" />

    {/* Connecting Circuit Waves */}
    <path
      d="M0 78 Q 90 70, 180 82 T 360 76 T 400 80"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="4 4"
    />
  </svg>
);

export default function WishlistDrawer() {
  const { lang } = useLanguageStore();
  const wishlistStore = useWishlistStore();
  const cartStore = useCartStore();

  const items = wishlistStore.items || wishlistStore.wishlist || [];
  const isOpen = Boolean(wishlistStore.isWishlistOpen ?? wishlistStore.isOpen);

  const closeWishlist = () => {
    if (typeof wishlistStore.closeWishlist === "function") {
      wishlistStore.closeWishlist();
    } else if (typeof wishlistStore.setIsWishlistOpen === "function") {
      wishlistStore.setIsWishlistOpen(false);
    }
  };

  const removeItem = wishlistStore.removeItem || wishlistStore.removeFromWishlist;
  const clearWishlist = wishlistStore.clearWishlist;

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeWishlist();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Add single item to cart
  const handleAddToCart = (item: any) => {
    const addToCartFn = cartStore.addItem || cartStore.addToCart;
    if (addToCartFn) {
      addToCartFn({
        id: item.id,
        name: item.name,
        nameBn: item.nameBn,
        price: Number(item.price) || 0,
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        image: item.image,
        quantity: 1,
        slug: item.slug,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
      });
      showToast(
        lang === "bn"
          ? "পণ্যটি কার্টে যুক্ত করা হয়েছে!"
          : "Item added to cart successfully!",
        "success"
      );
    }
  };

  // Move all items to cart
  const handleMoveAllToCart = () => {
    const addToCartFn = cartStore.addItem || cartStore.addToCart;
    if (!addToCartFn || items.length === 0) return;

    items.forEach((item: any) => {
      addToCartFn({
        id: item.id,
        name: item.name,
        nameBn: item.nameBn,
        price: Number(item.price) || 0,
        originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
        image: item.image,
        quantity: 1,
        slug: item.slug,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
      });
    });

    showToast(
      lang === "bn"
        ? "সব পণ্য কার্টে যুক্ত করা হয়েছে!"
        : "All items added to cart!",
      "success"
    );

    closeWishlist();
    if (typeof cartStore.setIsCartOpen === "function") {
      cartStore.setIsCartOpen(true);
    } else if (typeof cartStore.openCart === "function") {
      cartStore.openCart();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen
          ? "visible pointer-events-auto opacity-100"
          : "invisible pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeWishlist}
      />

      {/* Drawer Panel */}
      <aside
        className={`absolute top-0 right-0 h-full w-full max-w-[420px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with Gadget Line-Art */}
        <div className="relative border-b border-ink/10 px-5 py-4 flex-shrink-0 overflow-hidden">
          <HeaderDecor />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-light/15 text-brand-light flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div>
                <h2 className="font-body text-[17px] sm:text-[18px] font-bold text-ink">
                  {lang === "bn" ? "পছন্দের তালিকা" : "Your Wishlist"}
                </h2>
                <p className="font-body text-[12px] font-semibold text-ink/60">
                  {lang === "bn"
                    ? `${items.length} টি পণ্য সংরক্ষিত রয়েছে`
                    : `${items.length} items saved`}
                </p>
              </div>
            </div>

            {/* Frosted Close Button */}
            <button
              onClick={closeWishlist}
              className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-md border border-ink/10 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-white transition-all active:scale-95 shadow-sm"
              aria-label="Close wishlist"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {items.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-light/10 text-brand-light flex items-center justify-center mb-4 border border-brand-light/20 shadow-sm">
              <svg
                className="w-10 h-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3 className="font-body text-[16px] font-bold text-ink mb-1">
              {lang === "bn"
                ? "পছন্দের তালিকা বর্তমানে খালি"
                : "Your wishlist is currently empty"}
            </h3>
            <p className="font-body text-[13px] text-ink/60 max-w-[240px] mb-6">
              {lang === "bn"
                ? "যেকোনো পণ্যে হার্ট আইকনে ক্লিক করে সংরক্ষণ করুন।"
                : "Click the heart icon on any product to save it for later."}
            </p>
            <button
              onClick={closeWishlist}
              className="rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-6 py-2.5 font-body text-[14px] font-bold text-white shadow-sh2 hover:brightness-[1.03] active:scale-95 transition-all"
            >
              {lang === "bn" ? "পণ্য এক্সপ্লোর করুন" : "Explore Products"}
            </button>
          </div>
        ) : (
          /* Items List */
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {items.map((item: any) => {
              const price = Number(item.price) || 0;
              const originalPrice = item.originalPrice ? Number(item.originalPrice) : null;
              const displayName =
                lang === "bn" && item.nameBn ? item.nameBn : item.name;

              return (
                <div
                  key={item.id}
                  className="bg-white/85 backdrop-blur-sm rounded-2xl p-3.5 border border-ink/5 shadow-sm flex items-center gap-3.5 transition-all hover:bg-white"
                >
                  {/* Product Image */}
                  <Link
                    href={item.slug ? `/product/${item.slug}` : "#"}
                    onClick={closeWishlist}
                    className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-brand-bg/60 border border-ink/5 flex-shrink-0 block"
                  >
                    <Image
                      src={item.image || "/vangcur-logo.png"}
                      alt={displayName || "Product"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.slug ? `/product/${item.slug}` : "#"}
                      onClick={closeWishlist}
                      className="font-body text-[13.5px] sm:text-[14px] font-bold text-ink truncate mb-1 block hover:text-brand-light transition-colors"
                    >
                      {displayName}
                    </Link>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-body text-[14px] font-bold text-brand-light">
                        ৳{price.toLocaleString("en-US")}
                      </span>
                      {originalPrice && originalPrice > price && (
                        <span className="font-body text-[12px] font-semibold text-ink/40 line-through">
                          ৳{originalPrice.toLocaleString("en-US")}
                        </span>
                      )}
                    </div>

                    {/* Action: Add to Cart button */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-light/10 hover:bg-brand-light text-brand-light hover:text-white px-3 py-1 font-body text-[12px] font-bold transition-all active:scale-95"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <span>{lang === "bn" ? "কার্টে নিন" : "Add to Cart"}</span>
                    </button>
                  </div>

                  {/* Delete from Wishlist Button */}
                  <button
                    onClick={() => {
                      if (removeItem) {
                        removeItem(item.id);
                      }
                    }}
                    className="text-ink/40 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all active:scale-90 flex-shrink-0"
                    aria-label="Remove from wishlist"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="border-t border-ink/10 bg-white/90 backdrop-blur-md p-4 sm:p-5 space-y-3 flex-shrink-0">
            {/* Primary Action: Move All to Cart */}
            <button
              onClick={handleMoveAllToCart}
              className="w-full rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 hover:brightness-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>
                {lang === "bn" ? "সব আইটেম কার্টে নিন" : "Move All to Cart"}
              </span>
            </button>

            {/* Clear All Wishlist */}
            {clearWishlist && (
              <button
                onClick={() => {
                  clearWishlist();
                  showToast(
                    lang === "bn"
                      ? "পছন্দের তালিকা খালি করা হয়েছে"
                      : "Wishlist cleared",
                    "info"
                  );
                }}
                className="w-full text-center font-body text-[13px] font-semibold text-ink/50 hover:text-red-500 transition-colors py-1"
              >
                {lang === "bn" ? "তালিকা খালি করুন" : "Clear Wishlist"}
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
