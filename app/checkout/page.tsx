'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts } from '@/lib/productData';
import {
  getCurrentUser, saveCurrentUser, checkOAuthCallback, mergeGuestOrdersToUser, signInWithGoogle,
} from '@/lib/authData';
import { showToast } from '@/lib/toast';
import LoginModal from '@/app/components/auth/LoginModal';
import PreConfirmLoginModal from '@/app/components/checkout/PreConfirmLoginModal';
import PolicyModal from '@/app/components/checkout/PolicyModal';
import {
  DISTRICTS,
  DEFAULT_SHIP_CFG,
  getShipOptions,
  shipPrice,
  validatePhone,
  validateAddress,
  validateEmail,
  validateTxnId,
  fetchBkashNumber,
  fetchShipConfig,
  type ShipConfig,
} from '@/lib/checkoutData';
import { saveDraft, clearDraft } from '@/lib/draftRecovery';
import { sendLead } from '@/lib/leadCapture';
import type { CartItem, CurrentUser } from '@/types';

interface CheckoutErrors {
  eN?: string;
  eP?: string;
  eD?: string;
  eA?: string;
  eEmail?: string;
  eShip?: string;
  eTxn?: string;
  eL4?: string;
}

const fieldLabelClass = 'mb-[5px] block font-body text-[12.5px] font-semibold text-ink';
const optionalTagClass = 'font-body text-[11px] font-normal text-muted';
const fieldInputClass =
  'w-full rounded-[9px] border-[1.5px] border-border-base bg-white px-[13px] py-2.5 font-body text-base text-ink transition-brand duration-brand outline-none focus:border-ink';
const fieldErrClass = 'mt-[3px] font-body text-[11px] text-brand-primary';
const btnBackClass =
  'rounded-[10px] bg-surface-muted px-5 py-3 font-body text-[13px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base';
const btnNextClass =
  'flex-1 rounded-[10px] bg-ink px-6 py-3 font-body text-sm font-bold text-white transition-brand duration-brand hover:bg-brand-primary disabled:opacity-60';

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isQuickOrder, setIsQuickOrder] = useState(false);
  const [cartWarnVisible, setCartWarnVisible] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dist, setDist] = useState('');
  const [addr, setAddr] = useState('');
  const [email, setEmail] = useState('');
  const [selectedShip, setSelectedShip] = useState('');
  const [errors, setErrors] = useState<CheckoutErrors>({});

  const [txn, setTxn] = useState('');
  const [last4, setLast4] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [bkashNum, setBkashNum] = useState('01816365504');
  const [copyLabel, setCopyLabel] = useState('Copy');

  const [termsChecked, setTermsChecked] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [shake, setShake] = useState(false);
  const [shipCfg, setShipCfg] = useState<ShipConfig>(DEFAULT_SHIP_CFG);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const confirmLockRef = useRef(false);

  const [showPreConfirm, setShowPreConfirm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginInitialMode, setLoginInitialMode] = useState<'login' | 'register'>('login');
  const submitOrderNowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const quickOrder = JSON.parse(sessionStorage.getItem('vc_quick_order_items') || 'null');
      if (Array.isArray(quickOrder) && quickOrder.length) {
        sessionStorage.removeItem('vc_quick_order_items');
        setCartItems(quickOrder);
        setIsQuickOrder(true);
        setCartWarnVisible(false);
      } else {
        const cart = JSON.parse(localStorage.getItem('vc_cart') || '[]');
        setCartItems(Array.isArray(cart) ? cart : []);
        setIsQuickOrder(false);
        setCartWarnVisible(!Array.isArray(cart) || cart.length === 0);
      }
    } catch {
      setCartWarnVisible(true);
    }
    try {
      const draft = JSON.parse(sessionStorage.getItem('vc_form_draft') || 'null');
      if (draft) {
        if (draft.name) setName(draft.name);
        if (draft.phone) setPhone(draft.phone);
        if (draft.dist) setDist(draft.dist);
        if (draft.addr) setAddr(draft.addr);
        if (draft.email) setEmail(draft.email);
        if (draft.txn) setTxn(draft.txn);
        if (draft.l4) setLast4(draft.l4);
      }
      const savedShip = sessionStorage.getItem('vc_ship');
      if (savedShip) setSelectedShip(savedShip);
    } catch {
      // ignore
    }
    fetchBkashNumber(supabase).then(setBkashNum);
    fetchShipConfig(supabase).then(setShipCfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      let action: string | null = null;
      try { action = localStorage.getItem('vc_post_login_action'); } catch { /* ignore */ }
      if (action !== 'confirmOrder') return;

      const safeUser = await checkOAuthCallback(supabase);
      const user = safeUser || getCurrentUser();
      if (!user) return;

      if (safeUser) {
        saveCurrentUser(safeUser);
        await mergeGuestOrdersToUser(supabase, safeUser.email || '', safeUser.id || '');
      }
      try { localStorage.removeItem('vc_post_login_action'); } catch { /* ignore */ }

      let pending: Record<string, unknown> | null = null;
      try {
        const raw = localStorage.getItem('vc_pending_order_data');
        localStorage.removeItem('vc_pending_order_data');
        pending = raw ? JSON.parse(raw) : null;
      } catch { /* ignore */ }
      if (pending) {
        if (pending.name) setName(pending.name as string);
        if (pending.phone) setPhone(pending.phone as string);
        if (pending.dist) setDist(pending.dist as string);
        if (pending.addr) setAddr(pending.addr as string);
        if (pending.email !== undefined) setEmail(pending.email as string);
        if (pending.txn) setTxn(pending.txn as string);
        if (pending.l4) setLast4(pending.l4 as string);
        if (pending.ship) setSelectedShip(pending.ship as string);
      }

      showToast('✅ লগইন সফল — অর্ডার সম্পন্ন হচ্ছে...');
      setTimeout(() => submitOrderNowRef.current && submitOrderNowRef.current(), 350);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'vc_form_draft',
        JSON.stringify({ name, phone, dist, addr, email, txn, l4: last4 }),
      );
    } catch {
      // ignore
    }
    saveDraft({ name, phone, dist, addr, email, items: cartItems, ship: selectedShip });
  }, [name, phone, dist, addr, email, txn, last4, cartItems, selectedShip]);

  const leadIdRef = useRef<string | null>(null);
  const orderDoneRef = useRef(false);
  useEffect(() => {
    if (!leadIdRef.current) {
      try {
        leadIdRef.current = sessionStorage.getItem('vc_lead_id') || `LD-${Date.now()}`;
        sessionStorage.setItem('vc_lead_id', leadIdRef.current);
      } catch {
        leadIdRef.current = `LD-${Date.now()}`;
      }
    }
    const fireLead = () => {
      if (orderDoneRef.current) return;
      sendLead({ leadId: leadIdRef.current as string, name, phone, dist, addr, email, items: cartItems });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fireLead();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', fireLead);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', fireLead);
    };
  }, [name, phone, dist, addr, email, cartItems]);

  const shipOptions = getShipOptions(dist);

  useEffect(() => {
    if (selectedShip && !shipOptions.some((opt) => opt.key === selectedShip)) {
      setSelectedShip('');
      try {
        sessionStorage.removeItem('vc_ship');
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dist]);

  const selectShip = (key: string) => {
    setSelectedShip(key);
    try {
      sessionStorage.setItem('vc_ship', key);
    } catch {
      // ignore
    }
  };

  const goToStep2 = () => {
    if (cartItems.length === 0) {
      setCartWarnVisible(true);
      return;
    }
    const nextErrors: CheckoutErrors = {};
    if (!name.trim()) nextErrors.eN = 'নাম দিন';
    if (!validatePhone(phone.trim())) nextErrors.eP = 'দয়া করে সঠিক মোবাইল নম্বর দিন';
    if (!dist) nextErrors.eD = 'জেলা সিলেক্ট করুন';
    if (!validateAddress(addr.trim())) nextErrors.eA = 'দয়া করে বিস্তারিত ঠিকানা দিন (যেমন: রোড বা বাসা নম্বর)';
    if (email.trim() && !validateEmail(email.trim())) nextErrors.eEmail = 'সঠিক ইমেইল লিখুন (যেমন: name@gmail.com)';
    if (!selectedShip) nextErrors.eShip = 'শিপিং অপশন সিলেক্ট করুন';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStep(2);
    }
  };

  const goToStep3 = () => {
    const txnUpper = txn.trim().toUpperCase();
    const l4 = last4.trim();
    if (!txnUpper && !l4) {
      setErrors((e) => ({ ...e, eTxn: 'ট্রানজেকশন আইডি অবশ্যই ১০ ক্যারেক্টার হতে হবে', eL4: 'Transaction ID অথবা শেষ ৪ ডিজিট দিন' }));
      return;
    }
    if (txnUpper) {
      if (!validateTxnId(txnUpper)) {
        setErrors((e) => ({ ...e, eTxn: 'দয়া করে সঠিক ১০ সংখ্যার বিকাশ ট্রানজেকশন আইডি দিন' }));
        return;
      }
      setTxn(txnUpper);
    }
    if (l4 && l4.length !== 4) {
      setErrors((e) => ({ ...e, eL4: 'Transaction ID অথবা শেষ ৪ ডিজিট দিন' }));
      return;
    }
    setErrors((e) => ({ ...e, eTxn: undefined, eL4: undefined }));
    setStep(3);
  };

  const goBack = (n: number) => setStep(n);

  const toggleTerms = () => {
    setTermsChecked((v) => !v);
    setTermsError(false);
  };

  const policyAgreeAndConfirm = () => {
    setTermsChecked(true);
    setPolicyModalOpen(false);
    if (!getCurrentUser()) {
      setShowPreConfirm(true);
      return;
    }
    submitOrderNow();
  };

  const copyBkash = async () => {
    const num = bkashNum.replace(/\D/g, '');
    try {
      await navigator.clipboard.writeText(num);
    } catch {
      // clipboard may be unavailable
    }
    setCopyLabel('✅ কপি হয়েছে!');
    setTimeout(() => setCopyLabel('Copy'), 2000);
  };

  const sc = shipPrice(selectedShip, shipCfg);
  const sub = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = sub + sc;
  const balance = Math.max(0, total - 200);

  const handleConfirmClick = () => {
    if (!termsChecked) {
      setTermsError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (!getCurrentUser()) {
      setShowPreConfirm(true);
      return;
    }
    submitOrderNow();
  };

  const submitOrderNow = useCallback(async () => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;
    setSubmitting(true);

    try {
      try {
        const rl = await supabase.rpc('check_and_set_rate_limit', { p_phone: phone.trim() });
        if (rl.data === false) {
          setSubmitting(false);
          confirmLockRef.current = false;
          showToast('⏳ একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন');
          return;
        }
      } catch {
        const lastOrderTime = parseInt(localStorage.getItem('vc_last_order_time') || '0', 10);
        if (Date.now() - lastOrderTime < 30000) {
          setSubmitting(false);
          confirmLockRef.current = false;
          showToast('⏳ একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন');
          return;
        }
      }

      let num = `#VC-${Date.now().toString(36).toUpperCase()}`;
      try {
        const { data: counterData, error: counterErr } = await supabase.rpc('increment_order_counter');
        if (!counterErr && counterData) num = `#VC-${counterData}`;
      } catch {
        // fallback already set above
      }

      let authoritativeProds = DEFAULT_PRODS;
      try {
        const customRows = await fetchCustomProducts(supabase);
        if (customRows.length) authoritativeProds = mergeCustomProducts(DEFAULT_PRODS, customRows);
      } catch {
        // fetchCustomProducts already retries internally and returns [] on failure
      }
      const verifiedItems = cartItems.map((i) => {
        const prod = authoritativeProds.find((p) => String(p.id) === String(i.id));
        return prod ? { ...i, price: prod.price, name: prod.name, emoji: (prod.imgs || ['📦'])[0] } : i;
      });
      const vSub = verifiedItems.reduce((s, i) => s + i.price * i.qty, 0);
      const vTotal = vSub + sc;

      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      const { data: insData, error: insErr } = await supabase
        .from('orders')
        .insert({
          order_num: num,
          created_at: new Date().toISOString(),
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_district: dist,
          customer_address: addr.trim(),
          customer_email: email.trim() || '',
          items: verifiedItems,
          shipping: selectedShip,
          shipping_cost: sc,
          subtotal: vSub,
          total: vTotal,
          payment_txn: txn || '',
          payment_last4: last4 || '',
          status: 'pending',
          ...(currentUserId ? { user_id: currentUserId } : {}),
        })
        .select('id')
        .single();

      if (insErr) {
        setSubmitting(false);
        confirmLockRef.current = false;
        showToast('❌ দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।');
        return;
      }

      localStorage.setItem('vc_cart', '[]');
      orderDoneRef.current = true;
      clearDraft();
      try {
        sessionStorage.removeItem('vc_form_draft');
        sessionStorage.removeItem('vc_lead_id');
        localStorage.setItem('vc_pending_ls', insData.id);
        localStorage.setItem('vc_pending_num_ls', num);
        localStorage.setItem('vc_pending_ts', String(Date.now()));
        localStorage.setItem('vc_last_order_time', String(Date.now()));
      } catch {
        // ignore
      }
      if (!currentUserId) {
        try {
          const guestOrders = JSON.parse(localStorage.getItem('vc_guest_orders') || '[]');
          guestOrders.push({ id: insData.id, orderNum: num });
          localStorage.setItem('vc_guest_orders', JSON.stringify(guestOrders));
        } catch {
          // ignore
        }
      }

      router.push('/');
    } catch {
      setSubmitting(false);
      confirmLockRef.current = false;
      showToast('❌ নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, cartItems, sc, name, dist, addr, email, selectedShip, txn, last4]);

  useEffect(() => { submitOrderNowRef.current = submitOrderNow; }, [submitOrderNow]);

  const preConfirmSkip = () => {
    setShowPreConfirm(false);
    submitOrderNow();
  };
  const preConfirmGoLogin = () => {
    setShowPreConfirm(false);
    setLoginInitialMode('login');
    setShowLoginModal(true);
  };
  const preConfirmGoRegister = () => {
    setShowPreConfirm(false);
    setLoginInitialMode('register');
    setShowLoginModal(true);
  };
  const preConfirmGoGoogle = async () => {
    const pendingData = {
      items: cartItems, ship: selectedShip, name, phone, dist, addr, email, txn, l4: last4, savedAt: Date.now(),
    };
    try {
      localStorage.setItem('vc_pending_order_data', JSON.stringify(pendingData));
      localStorage.setItem('vc_post_login_action', 'confirmOrder');
    } catch {
      // ignore
    }
    setShowPreConfirm(false);
    const { error } = await signInWithGoogle(supabase, '/checkout');
    if (error) {
      showToast('❌ Google লগইন ব্যর্থ হয়েছে');
      try {
        localStorage.removeItem('vc_pending_order_data');
        localStorage.removeItem('vc_post_login_action');
      } catch {
        // ignore
      }
    }
  };

  const closeCheckout = () => router.push('/');

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="mx-auto min-h-screen w-full max-w-[640px] bg-white">
          <div className="flex items-center justify-between border-b border-border-base px-6 pt-5">
            <h2 className="font-body text-[17px] font-bold text-ink">অর্ডার করুন</h2>
            {step === 1 && (
              <button
                onClick={closeCheckout}
                className="rounded-lg border-[1.5px] border-border-base bg-surface-muted px-[13px] py-1.5 font-body text-[12.5px] font-semibold text-ink"
              >
                ✕ বন্ধ করুন
              </button>
            )}
          </div>

          {step !== 3 && isQuickOrder && cartItems.length > 0 && (
            <div className="border-b border-border-base bg-white px-6 py-2.5">
              <div className="mb-[7px] font-body text-[11px] font-bold uppercase tracking-wide text-muted">
                YOUR ORDER
              </div>
              <div className="flex flex-col gap-[5px] text-ink">
                {cartItems.map((i) => (
                  <div key={i.id} className="flex justify-between font-body text-[13px]">
                    <span>{i.emoji || '📦'} {i.name} × {i.qty}</span>
                    <span>৳{(i.price * i.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-[7px] flex justify-between border-t border-border-base pt-[7px] font-body text-[13px] font-bold text-ink">
                <span>Subtotal</span>
                <span>৳{sub.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex px-6 pb-2.5 pt-[13px]">
            {[{ n: 1, label: 'তথ্য' }, { n: 2, label: 'পেমেন্ট' }, { n: 3, label: 'নিশ্চিত' }].map((s) => (
              <div key={s.n} className={`flex-1 text-center font-body text-[11px] font-semibold ${step === s.n ? 'text-ink' : step > s.n ? 'text-ink' : 'text-muted'}`}>
                <div
                  className={`mx-auto mb-[3px] flex h-5 w-5 items-center justify-center rounded-full font-body text-[10px] font-bold ${step > s.n ? 'bg-success text-white' : step === s.n ? 'bg-ink text-white' : 'bg-border-base text-muted'}`}
                >
                  {s.n}
                </div>
                <div>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white px-6 pb-1.5 pt-1.5">
            <div className="mb-[5px] h-[5px] overflow-hidden rounded-full bg-border-base">
              <div
                className="h-full rounded-full bg-success transition-[width] duration-300"
                style={{ width: `${{ 1: 33, 2: 66, 3: 100 }[step]}%` }}
              />
            </div>
            <div className="text-right font-body text-[11px] font-semibold text-success">
              {step === 3 ? '✅ প্রায় সম্পন্ন!' : step === 2 ? 'আর মাত্র ১ ধাপ!' : 'আর মাত্র ২ ধাপ!'}
            </div>
          </div>

          {step === 1 && (
            <div className="px-6 py-5">
              {cartWarnVisible && (
                <div className="mb-3.5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] p-3.5 font-body text-[13px] font-semibold leading-[1.55] text-[#991B1B]">
                  ⚠️ আপনার কার্ট খালি। অনুগ্রহ করে প্রথমে একটি প্রোডাক্ট কার্টে যোগ করুন অথবা প্রোডাক্টের পেজ থেকে
                  &quot;এখনই অর্ডার করুন&quot; বাটনে ক্লিক করুন।
                </div>
              )}
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>পূর্ণ নাম *</label>
                <input className={fieldInputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার পূর্ণ নাম" />
                {errors.eN && <div className={fieldErrClass}>{errors.eN}</div>}
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>ফোন নম্বর * <span className={optionalTagClass}>(বাংলাদেশি নম্বর)</span></label>
                <input
                  className={fieldInputClass}
                  value={phone}
                  maxLength={11}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="01XXXXXXXXX"
                />
                {errors.eP && <div className={fieldErrClass}>{errors.eP}</div>}
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>জেলা *</label>
                <select className={fieldInputClass} value={dist} onChange={(e) => setDist(e.target.value)}>
                  <option value="">জেলা সিলেক্ট করুন</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.eD && <div className={fieldErrClass}>{errors.eD}</div>}
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
                <textarea
                  className={fieldInputClass}
                  rows={3}
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  placeholder="গ্রাম/মহল্লা, রোড, বাসা নম্বর সহ বিস্তারিত লিখুন"
                />
                {errors.eA && <div className={fieldErrClass}>{errors.eA}</div>}
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>ইমেইল <span className={optionalTagClass}>(ঐচ্ছিক — ইনভয়েস পাঠানো হবে)</span></label>
                <input className={fieldInputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@gmail.com" />
                {errors.eEmail && <div className={fieldErrClass}>{errors.eEmail}</div>}
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>শিপিং *</label>
                <div className="flex flex-col gap-[9px]">
                  {shipOptions.map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] px-3.5 py-3 transition-brand duration-brand ${selectedShip === opt.key ? 'border-ink bg-surface-muted' : 'border-border-base'}`}
                      onClick={() => selectShip(opt.key)}
                    >
                      <input type="radio" name="ship" checked={selectedShip === opt.key} readOnly className="accent-ink" />
                      <div>
                        <div className="font-body text-[13px] font-semibold text-ink">{opt.name}</div>
                        <div className="font-body text-[11px] text-muted">{opt.sub}</div>
                      </div>
                      <div className="ml-auto font-body text-sm font-bold text-ink">৳{shipPrice(opt.key, shipCfg)}</div>
                    </label>
                  ))}
                </div>
                {errors.eShip && <div className={fieldErrClass}>{errors.eShip}</div>}
              </div>
              <div className="flex gap-[9px] pt-3.5">
                <button className={`${btnNextClass} flex-1`} onClick={goToStep2}>পরবর্তী → পেমেন্ট</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="px-6 py-5">
              <div className="mb-4 rounded-[16px] border-[1.5px] border-border-base bg-white p-5">
                <div className="mb-3.5 inline-flex items-center gap-[7px] rounded-lg bg-surface-muted px-[13px] py-[7px] font-body text-[13px] font-bold">
                  💳 এডভান্স পেমেন্ট <span className="font-body text-base font-extrabold text-brand-primary">৳২০০</span>
                </div>
                <p className="mb-3.5 font-body text-[13px] leading-[1.6] text-muted">অর্ডার নিশ্চিত করতে নিচের bKash নম্বরে ২০০ টাকা Send Money করুন।</p>
                <div className="mb-2.5 flex flex-col gap-3 rounded-[16px] border-[1.5px] border-[#FDA4AF] bg-gradient-to-br from-[#FFF5F5] to-[#FFE4E6] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-white/60 bg-white/40 p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-logo-icon_beuxfl.png" alt="bKash" className="h-11 w-11 flex-shrink-0 object-contain" />
                      </div>
                      <div>
                        <div className="mb-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">bKash Send Money</div>
                        <div className="font-body text-[19px] font-extrabold leading-none tracking-wide text-[#E63946]">{bkashNum}</div>
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1.5 rounded-full border-[1.5px] border-[rgba(225,29,72,0.22)] bg-[rgba(225,29,72,0.08)] px-4 py-2 font-body text-xs font-bold text-[#E11D48] transition-colors duration-200 hover:bg-[#E11D48] hover:text-white"
                      onClick={copyBkash}
                      style={copyLabel !== 'Copy' ? { background: '#10B981', color: '#fff', borderColor: '#10B981' } : undefined}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      {copyLabel}
                    </button>
                  </div>
                  <button className="mt-2.5 flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-dashed border-[#D1D5DB] bg-transparent px-3.5 py-2.5 font-body text-[12.5px] text-[#6B7280] transition-colors duration-200 hover:bg-[#F9FAFB]" onClick={() => setQrOpen((v) => !v)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /></svg>
                    <span>{qrOpen ? 'QR কোড বন্ধ করুন' : 'QR কোড দিয়ে পেমেন্ট করুন'}</span>
                    <span className="inline-block text-xs transition-transform duration-300" style={qrOpen ? { transform: 'rotate(180deg)' } : undefined}>▾</span>
                  </button>
                  <div className={`overflow-hidden transition-[max-height,opacity] duration-[400ms] ${qrOpen ? 'mt-2.5 max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex items-start gap-3.5 rounded-[10px] border border-[#E5E7EB] bg-white p-3.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://res.cloudinary.com/dkjzleczw/image/upload/v1785388318/bkash-payment-qr_zmr6dz.jpg" alt="bKash QR" className="h-[140px] w-[140px] flex-shrink-0 rounded-md object-cover" />
                      <div className="pt-0.5">
                        <div className="mb-2 font-body text-[12.5px] font-semibold text-[#1F6B3A]">বিকাশ অ্যাপ দিয়ে স্ক্যান করুন</div>
                        <div className="font-body text-[11.5px] leading-[1.9] text-[#374151]">
                          ১. বিকাশ অ্যাপ খুলুন<br />২. QR স্ক্যান বাটনে ক্লিক করুন<br />৩. এই QR টি স্ক্যান করুন<br />৪. পরিমাণ ২০০ টাকা দিন<br />৫. পেমেন্ট সম্পন্ন করুন
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mb-0 font-body text-[11.5px] text-muted">Personal নম্বরে Send Money করুন (Payment নয়)</p>
                <div className="mt-3.5 rounded-r-lg border-l-[3px] border-brand-primary bg-[#FEF2F2] px-[13px] py-2.5 font-body text-xs leading-[1.6] text-[#7F1D1D]">
                  ⚠️ ভুল তথ্য দিলে পেমেন্ট যাচাই সম্ভব হবে না এবং অর্ডার বাতিল হবে।
                </div>
              </div>
              <div className="mb-3 text-center font-body text-[13px] font-bold text-ink">
                নিচের যেকোনো একটি দেওয়া বাধ্যতামূলক
              </div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>ট্রানজেকশন আইডি <span className={optionalTagClass}>(১০ ক্যারেক্টার, যেমন: 8N5O2A3BDE)</span></label>
                <input className={fieldInputClass} value={txn} maxLength={10} onChange={(e) => setTxn(e.target.value)} placeholder="bKash Transaction ID" />
                {errors.eTxn && <div className={fieldErrClass}>{errors.eTxn}</div>}
              </div>
              <div className="my-4 flex items-center gap-3 font-body text-[11px] font-bold tracking-wide text-muted before:h-[1.5px] before:flex-1 before:bg-border-base after:h-[1.5px] after:flex-1 after:bg-border-base">অথবা</div>
              <div className="mb-[15px]">
                <label className={fieldLabelClass}>Send Money করা bKash নম্বরের শেষ ৪ ডিজিট</label>
                <input className={fieldInputClass} value={last4} maxLength={4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder="যেমন: 5504" />
                {errors.eL4 && <div className={fieldErrClass}>{errors.eL4}</div>}
              </div>
              <div className="flex gap-[9px] pt-3.5">
                <button className={btnBackClass} onClick={() => goBack(1)}>← পেছনে</button>
                <button className={btnNextClass} onClick={goToStep3}>পরবর্তী → নিশ্চিত করুন</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="px-6 py-5">
              <div className="relative mb-5 rounded-[16px] border-[1.5px] border-border-base bg-surface-muted p-[18px]">
                <span className="mb-3 block font-body text-[11px] font-bold uppercase tracking-wide text-muted">📋 অর্ডার মেমো (Invoice)</span>
                <div>
                  {cartItems.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-1.5 py-1.5 font-body text-[12.5px] text-[#374151]">
                      <span className="flex items-center gap-1.5">
                        {i.emoji || '📦'} {i.name.length > 28 ? `${i.name.slice(0, 28)}...` : i.name} × {i.qty}
                      </span>
                      <span>৳{(i.price * i.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-1.5 font-body text-[12.5px] text-[#374151]"><span>Subtotal</span><span>৳{sub.toLocaleString()}</span></div>
                <div className="flex justify-between py-1.5 font-body text-[12.5px] text-[#374151]"><span>ডেলিভারি চার্জ (Shipping)</span><span>৳{sc}</span></div>
                <div className="my-3 h-px border-t-2 border-dashed border-border-base" />
                <div className="flex justify-between font-body text-[14.5px] font-extrabold text-ink"><span>সর্বমোট বিল (Total)</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex justify-between py-1.5 font-body text-[13px] font-semibold text-success"><span>✅ Paid (bKash Advance)</span><span>- ৳২০০</span></div>
                <div className="flex justify-between py-1.5 font-body text-[13px] font-bold text-brand-primary"><span>বাকি বিল (Cash on Delivery)</span><span>৳{balance.toLocaleString()}</span></div>
              </div>

              <div className="relative mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#F59E0B] bg-[#FFFBEB] p-4">
                <span className="mb-2.5 block font-body text-[10px] font-bold uppercase tracking-wide text-[#B45309]">📦 ডেলিভারি লেবেল (Shipping Label)</span>
                <div className="flex gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-[#78350F]"><div className="w-5 flex-shrink-0">👤</div><div>{name}</div></div>
                <div className="flex gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-[#78350F]"><div className="w-5 flex-shrink-0">📞</div><div>{phone}</div></div>
                <div className="flex gap-2 py-0.5 font-body text-[12.5px] leading-[1.8] text-[#78350F]">
                  <div className="w-5 flex-shrink-0">📍</div>
                  <div>{dist && dist !== 'ঢাকা' ? `${dist}, ${addr}` : addr}</div>
                </div>
              </div>

              <div
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-[1.5px] bg-surface-muted px-3.5 py-3 transition-brand duration-brand ${shake ? 'animate-[shake_.4s]' : ''} ${termsError ? 'border-[#ef4444]' : 'border-border-base'}`}
                onClick={toggleTerms}
              >
                <div className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded border-2 transition-brand duration-brand ${termsChecked ? 'border-ink bg-ink' : 'border-border-base bg-white'}`}>
                  {termsChecked && <span className="font-body text-[13px] font-extrabold leading-none text-white">✓</span>}
                </div>
                <div className="font-body text-xs leading-[1.6] text-ink">
                  আমি ভাঙচুরের সকল{' '}
                  <span
                    onClick={(e) => { e.stopPropagation(); setPolicyModalOpen(true); }}
                    className="cursor-pointer font-semibold text-info underline"
                  >
                    নীতিমালা ও শর্তাবলী
                  </span>{' '}
                  পড়েছি এবং মেনে নিচ্ছি।
                </div>
              </div>
              {termsError && (
                <div className={`${fieldErrClass} ml-3.5 mt-1.5`}>
                  অর্ডার কনফার্ম করতে শর্তাবলী মেনে নেওয়া আবশ্যক
                </div>
              )}

              <div className="flex gap-[9px] pt-3.5">
                <button className={btnBackClass} onClick={() => goBack(2)}>← পেছনে</button>
                <button className={btnNextClass} onClick={handleConfirmClick} disabled={submitting}>
                  {submitting ? '⏳ প্রক্রিয়া হচ্ছে...' : '✅ অর্ডার কনফার্ম করুন'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PreConfirmLoginModal
        isOpen={showPreConfirm}
        onClose={() => setShowPreConfirm(false)}
        onLogin={preConfirmGoLogin}
        onRegister={preConfirmGoRegister}
        onGoogle={preConfirmGoGoogle}
        onSkip={preConfirmSkip}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        orderMode
        initialMode={loginInitialMode}
        onAuthSuccess={() => submitOrderNow()}
        onBackFromOrder={() => setShowPreConfirm(true)}
      />
      <PolicyModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        onAgreeAndConfirm={policyAgreeAndConfirm}
      />
    </>
  );
}
