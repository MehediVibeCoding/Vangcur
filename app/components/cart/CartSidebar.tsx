"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useLanguageStore } from "@/lib/store/languageStore";

export interface CartSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

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

export default function CartSidebar({
  isOpen: propIsOpen,
  onClose: propOnClose,
}: CartSidebarProps) {
  const router = useRouter();
  const { lang } = useLanguageStore();

  // Safely support both props from GlobalOverlays and Zustand CartState
  const cartStore = useCartStore();
  const rawCart = (cartStore as unknown as Record<string, unknown>);
  const items = Array.isArray(rawCart.cart)
    ? (rawCart.cart as Array<{
        id: string;
        name: string;
        nameBn?: string;
        price: number;
        originalPrice?: number;
        image?: string;
        quantity: number;
        selectedColor?: string;
        selectedSize?: string;
        slug?: string;
      }>)
    : Array.isArray(rawCart.items)
    ? (rawCart.items as Array<{
        id: string;
        name: string;
        nameBn?: string;
        price: number;
        originalPrice?: number;
        image?: string;
        quantity: number;
        selectedColor?: string;
        selectedSize?: string;
        slug?: string;
      }>)
    : [];

  const isStoreOpen = Boolean(rawCart.isCartOpen ?? rawCart.isOpen);
  const isOpen = propIsOpen !== undefined ? propIsOpen : isStoreOpen;

  const closeCart = () => {
    if (propOnClose) {
      propOnClose();
    }
    if (typeof rawCart.closeCart === "function") {
      (rawCart.closeCart as () => void)();
    } else if (typeof rawCart.setIsCartOpen === "function") {
      (rawCart.setIsCartOpen as (val: boolean) => void)(false);
    }
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (typeof rawCart.updateQuantity === "function") {
      (rawCart.updateQuantity as (itemId: string, q: number) => void)(id, qty);
    }
  };

  const handleRemoveItem = (id: string) => {
    if (typeof rawCart.removeFromCart === "function") {
      (rawCart.removeFromCart as (itemId: string) => void)(id);
    } else if (typeof rawCart.removeItem === "function") {
      (rawCart.removeItem as (itemId: string) => void)(id);
    }
  };

  // Native Self-contained Body Scroll Lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + itemPrice * qty;
  }, 0);

  const totalItemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const handleCheckoutClick = () => {
    closeCart();
    router.push("/checkout");
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
        onClick={closeCart}
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
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <h2 className="font-body text-[17px] sm:text-[18px] font-bold text-ink">
                  {lang === "bn" ? "আপনার শপিং কার্ট" : "Your Shopping Cart"}
                </h2>
                <p className="font-body text-[12px] font-semibold text-ink/60">
                  {lang === "bn"
                    ? `${totalItemsCount} টি আইটেম যুক্ত রয়েছে`
                    : `${totalItemsCount} items added`}
                </p>
              </div>
            </div>

            {/* Frosted Close Button */}
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-md border border-ink/10 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-white transition-all active:scale-95 shadow-sm"
              aria-label="Close cart"
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
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className="font-body text-[16px] font-bold text-ink mb-1">
              {lang === "bn" ? "কার্ট বর্তমানে খালি আছে" : "Your cart is currently empty"}
            </h3>
            <p className="font-body text-[13px] text-ink/60 max-w-[240px] mb-6">
              {lang === "bn"
                ? "আপনার পছন্দের আকর্ষণীয় গ্যাজেটগুলো কার্টে যুক্ত করুন।"
                : "Add your favorite trending gadgets to your cart."}
            </p>
            <button
              onClick={closeCart}
              className="rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-6 py-2.5 font-body text-[14px] font-bold text-white shadow-sh2 hover:brightness-[1.03] active:scale-95 transition-all"
            >
              {lang === "bn" ? "কেনাকাটা শুরু করুন" : "Start Shopping"}
            </button>
          </div>
        ) : (
          /* Items List */
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {items.map((item) => {
              const itemPrice = Number(item.price) || 0;
              const itemQty = Number(item.quantity) || 1;
              const itemTotal = itemPrice * itemQty;
              const displayName =
                lang === "bn" && item.nameBn ? item.nameBn : item.name;

              return (
                <div
                  key={`${item.id}-${item.selectedColor || "default"}-${item.selectedSize || "default"}`}
                  className="bg-white/85 backdrop-blur-sm rounded-2xl p-3.5 border border-ink/5 shadow-sm flex items-center gap-3.5 transition-all hover:bg-white"
                >
                  {/* Product Image */}
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-brand-bg/60 border border-ink/5 flex-shrink-0">
                    <Image
                      src={item.image || "/vangcur-logo.png"}
                      alt={displayName || "Product"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-body text-[13.5px] sm:text-[14px] font-bold text-ink truncate mb-1">
                      {displayName}
                    </h4>

                    {/* Variant Badge (if any) */}
                    {(item.selectedColor || item.selectedSize) && (
                      <p className="font-body text-[11.5px] font-semibold text-ink/60 mb-1.5 flex items-center gap-1.5">
                        {item.selectedColor && (
                          <span className="bg-brand-bg px-2 py-0.5 rounded-md border border-ink/5">
                            {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="bg-brand-bg px-2 py-0.5 rounded-md border border-ink/5">
                            {item.selectedSize}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Price and Quantity Controls */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-body text-[14px] font-bold text-brand-light">
                        ৳{itemTotal.toLocaleString("en-US")}
                      </span>

                      {/* Stepper Buttons */}
                      <div className="flex items-center rounded-lg bg-brand-bg/80 border border-ink/10 p-0.5">
                        <button
                          onClick={() => {
                            if (itemQty > 1) {
                              handleUpdateQuantity(item.id, itemQty - 1);
                            } else {
                              handleRemoveItem(item.id);
                            }
                          }}
                          className="w-6 h-6 rounded-md bg-white text-ink/70 flex items-center justify-center hover:text-ink active:scale-90 transition-all font-bold text-[13px] shadow-xs"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-body text-[12.5px] font-bold text-ink">
                          {itemQty}
                        </span>
                        <button
                          onClick={() => {
                            handleUpdateQuantity(item.id, itemQty + 1);
                          }}
                          className="w-6 h-6 rounded-md bg-white text-ink/70 flex items-center justify-center hover:text-ink active:scale-90 transition-all font-bold text-[13px] shadow-xs"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => {
                      handleRemoveItem(item.id);
                    }}
                    className="text-ink/40 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all active:scale-90 flex-shrink-0"
                    aria-label="Remove item"
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

        {/* Footer / Checkout CTA */}
        {items.length > 0 && (
          <div className="border-t border-ink/10 bg-white/90 backdrop-blur-md p-4 sm:p-5 space-y-3.5 flex-shrink-0">
            {/* Subtotal summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-body text-[14px] text-ink/70">
                <span>{lang === "bn" ? "মোট আইটেম" : "Total Items"}</span>
                <span className="font-bold text-ink">
                  {lang === "bn"
                    ? `- ${totalItemsCount} পিছ`
                    : `- ${totalItemsCount} Pcs`}
                </span>
              </div>
              <div className="flex items-center justify-between font-body text-[16px] font-bold text-ink">
                <span>{lang === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
                <span className="text-[17px] text-brand-light">
                  ৳{subtotal.toLocaleString("en-US")}
                </span>
              </div>
            </div>

            {/* Delivery Assurance */}
            <div className="flex items-center gap-2 rounded-xl bg-brand-bg/70 px-3 py-2 border border-brand-light/20 text-[12px] font-semibold text-ink/80">
              <svg
                className="w-4 h-4 text-brand-light flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>
                {lang === "bn"
                  ? "ক্যাশ অন ডেলিভারি এবং দ্রুততম হোম ডেলিভারি সুবিধা"
                  : "Cash on Delivery & Express Fast Delivery"}
              </span>
            </div>

            {/* Primary Checkout Button */}
            <button
              onClick={handleCheckoutClick}
              className="w-full rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 hover:brightness-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{lang === "bn" ? "চেকআউট করুন" : "Proceed to Checkout"}</span>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
