import QuickOrderBridge from './checkout/QuickOrderBridge';
import WaitingOverlay from './checkout/WaitingOverlay';
import BgConfirmPopup from './checkout/BgConfirmPopup';
import PostOrderInfoModal from './checkout/PostOrderInfoModal';
import StockNotifyModal from './modals/StockNotifyModal';
import BackInStockToast from './modals/BackInStockToast';
import MembershipModal from './modals/MembershipModal';
import InvoiceModal from './modals/InvoiceModal';
import OfferPopup from './modals/OfferPopup';
import RecoveryToast from './modals/RecoveryToast';

export default function RareOverlays() {
  return (
    <>
      <QuickOrderBridge />
      <WaitingOverlay />
      <BgConfirmPopup />
      <PostOrderInfoModal />
      <StockNotifyModal />
      <BackInStockToast />
      <MembershipModal />
      <InvoiceModal />
      <OfferPopup />
      <RecoveryToast />
    </>
  );
}
