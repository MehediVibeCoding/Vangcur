export const OPEN_ACCOUNT_EVENT = 'vc:openAccount';
export const OPEN_TRACK_ORDER_EVENT = 'vc:openTrackOrder';
export const OPEN_OFFER_PAGE_EVENT = 'vc:openOfferPage';
export const OPEN_INFO_EVENT = 'vc:openInfo';

export const OPEN_CART_EVENT = 'vc:openCart';
export const OPEN_WISHLIST_EVENT = 'vc:openWishlist';

// প্রোডাক্ট কার্ড/প্রোডাক্ট পেজের হার্ট আইকনে ক্লিক করে wishlist-এ কিছু যোগ
// করার সাথে সাথে ডিসপ্যাচ হয় (detail: { x, y } — ক্লিক করা হার্ট বাটনের কেন্দ্রের
// viewport কো-অর্ডিনেট) — WishlistFlyOverlay এটা শুনে ওই বিন্দু থেকে Navbar-এর
// wishlist আইকন পর্যন্ত একটা উড়ন্ত হার্ট এনিমেট করে।
export const WISHLIST_FLY_EVENT = 'vc:wishlistFly';
// উড়ন্ত হার্টটা Navbar আইকনে "হিট" করার মুহূর্তে ডিসপ্যাচ হয় — Navbar এটা শুনে
// তার wishlist আইকনে জিগল + লিকুইড-ফিল এনিমেশন চালায়।
export const WISHLIST_NAV_HIT_EVENT = 'vc:wishlistNavHit';

export const OPEN_WAIT_OVERLAY_EVENT = 'vc:openWaitOverlay';
export const SHOW_BG_CONFIRM_EVENT = 'vc:showBgConfirmPopup';
export const GENERATE_INVOICE_EVENT = 'vc:generateInvoice';
export const OPEN_MEMBERSHIP_EVENT = 'vc:openMembership';
export const OPEN_ORDER_FORM_EVENT = 'vc:openOrderForm';
export const SHOW_POST_RECEIVE_INFO_EVENT = 'vc:showPostReceiveInfo';
