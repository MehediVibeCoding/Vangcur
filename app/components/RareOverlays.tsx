import WaitingOverlay from './checkout/WaitingOverlay';
import BgConfirmPopup from './checkout/BgConfirmPopup';
import PostReceiveInfoModal from './checkout/PostReceiveInfoModal';
import StockNotifyModal from './modals/StockNotifyModal';
import BackInStockToast from './modals/BackInStockToast';
import MembershipModal from './modals/MembershipModal';
import InvoiceModal from './modals/InvoiceModal';
import OfferPopup from './modals/OfferPopup';
import RecoveryToast from './modals/RecoveryToast';

export default function RareOverlays() {
  return (
    <>
      <WaitingOverlay />
      <BgConfirmPopup />
      <PostReceiveInfoModal />
      <StockNotifyModal />
      <BackInStockToast />
      <MembershipModal />
      <InvoiceModal />
      <OfferPopup />
      <RecoveryToast />
    </>
  );
}
