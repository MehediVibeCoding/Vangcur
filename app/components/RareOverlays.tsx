import WaitingOverlay from './checkout/WaitingOverlay';
import BgConfirmPopup from './checkout/BgConfirmPopup';
import PostReceiveInfoModal from './checkout/PostReceiveInfoModal';
import StockNotifyModal from './modals/StockNotifyModal';
import BackInStockToast from './modals/BackInStockToast';
import MembershipModal from './modals/MembershipModal';
import OfferPopup from './modals/OfferPopup';
import RecoveryToast from './modals/RecoveryToast';
import QuickOrderModal from './cart/QuickOrderModal';
import OrderRateLimitModal from './modals/OrderRateLimitModal';
import BulkOrderModal from './modals/BulkOrderModal';

export default function RareOverlays() {
  return (
    <>
      <WaitingOverlay />
      <BgConfirmPopup />
      <PostReceiveInfoModal />
      <StockNotifyModal />
      <BackInStockToast />
      <MembershipModal />
      <OfferPopup />
      <RecoveryToast />
      <QuickOrderModal />
      <OrderRateLimitModal />
      <BulkOrderModal />
    </>
  );
}
