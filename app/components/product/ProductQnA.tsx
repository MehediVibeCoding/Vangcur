'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useT } from '@/lib/i18n/useT';
import { showToast } from '@/lib/toast';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import UserAvatar from './UserAvatar';
import {
  fetchProductQuestions,
  submitProductQuestion,
  submitProductAnswer,
  checkIsUserAdmin,
} from '@/lib/productQnaData';
import type { ProductQuestion } from '@/types';

interface ProductQnAProps {
  productId: number | string;
  productName: string;
}

function QuestionMarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 2-3.05 4" /><path d="M12 17.5h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

export default function ProductQnA({ productId, productName }: ProductQnAProps) {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ask Question Modal State
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askName, setAskName] = useState('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askError, setAskError] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);

  // Answer Modal State
  const [answeringQuestion, setAnsweringQuestion] = useState<ProductQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [submittingA, setSubmittingA] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [data, adminStatus] = await Promise.all([
        fetchProductQuestions(supabase, productId),
        checkIsUserAdmin(supabase, currentUser?.id),
      ]);
      if (!cancelled) {
        setQuestions(data);
        setIsAdmin(adminStatus);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId, currentUser?.id, supabase]);

  useEffect(() => {
    if (askModalOpen || answeringQuestion) {
      lockBody();
    } else {
      unlockBody();
    }
    return () => unlockBody();
  }, [askModalOpen, answeringQuestion]);

  const openAskModal = () => {
    setAskName(currentUser?.name || '');
    setAskQuestion('');
    setAskError('');
    setAskModalOpen(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAskError('');
    setSubmittingQ(true);

    const res = await submitProductQuestion(supabase, {
      productId,
      userName: askName,
      question: askQuestion,
      userId: currentUser?.id || null,
    });

    setSubmittingQ(false);
    if (!res.ok || !res.data) {
      setAskError(res.error || t('প্রশ্ন জমা দেওয়া যায়নি'));
      return;
    }

    setQuestions((prev) => [res.data!, ...prev]);
    setAskModalOpen(false);
    showToast(t('✅ আপনার প্রশ্নটি সফলভাবে জমা হয়েছে!'));
  };

  const openAnswerModal = (q: ProductQuestion) => {
    setAnsweringQuestion(q);
    setAnswerText('');
    setAnswerError('');
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringQuestion) return;
    setAnswerError('');
    setSubmittingA(true);

    const authorName = isAdmin ? 'Vangcur টিম' : (currentUser?.name || 'প্রশ্নকর্তা');

    const res = await submitProductAnswer(supabase, {
      questionId: answeringQuestion.id,
      answer: answerText,
      authorName,
      userId: currentUser?.id || null,
      isAdmin,
    });

    setSubmittingA(false);
    if (!res.ok || !res.data) {
      setAnswerError(res.error || t('উত্তর জমা দেওয়া যায়নি'));
      return;
    }

    setQuestions((prev) => prev.map((q) => (
      q.id === answeringQuestion.id ? { ...q, answer: res.data } : q
    )));

    setAnsweringQuestion(null);
    showToast(t('✅ উত্তর সফলভাবে প্রকাশিত হয়েছে!'));
  };

  return (
    <div className="py-2">
      {/* Header & Ask Button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-base pb-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-bg text-brand-light">
              <QuestionMarkIcon />
            </span>
            {t('প্রশ্ন ও উত্তর (Q&A)')}
          </div>
          <p className="mt-1 font-body text-[12.5px] text-muted">
            {lang === 'en'
              ? `Have a question about ${productName}? Ask now and get answers from our team.`
              : `${productName} সম্পর্কে কোনো প্রশ্ন থাকলে এখানে জিজ্ঞেস করুন।`}
          </p>
        </div>

        <button
          onClick={openAskModal}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-bg/40 px-5 py-2.5 font-body text-[13px] font-bold text-brand-primary shadow-sm transition-brand duration-brand hover:border-brand-light hover:bg-brand-bg/70 hover:shadow-sh1"
        >
          <span>💬</span> {t('প্রশ্ন করুন')}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center font-body text-[13px] text-muted">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light mr-2" />
          {t('প্রশ্নোত্তর লোড হচ্ছে...')}
        </div>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-brand border border-dashed border-border-base bg-surface-muted/30 px-4 py-8 text-center">
          <div className="mb-2 text-2xl">💬</div>
          <p className="font-body text-sm font-bold text-ink">{t('এখনো কোনো প্রশ্ন করা হয়নি')}</p>
          <p className="mt-1 font-body text-[12.5px] text-muted">
            {t('এই প্রোডাক্ট সম্পর্কে আপনার কোনো কিছু জানার থাকলে সবার আগে প্রশ্ন করুন!')}
          </p>
          <button
            onClick={openAskModal}
            className="mt-3.5 rounded-full bg-brand-light px-5 py-2 font-body text-xs font-bold text-white shadow-sm transition-brand hover:bg-brand-light-hover"
          >
            {t('প্রথম প্রশ্নটি করুন')}
          </button>
        </div>
      )}

      {/* Questions List */}
      {!loading && questions.length > 0 && (
        <div className="flex flex-col gap-4">
          {questions.map((q) => {
            const dateStr = q.created_at
              ? new Date(q.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                year: 'numeric', month: 'short', day: 'numeric',
              })
              : '';

            // কে উত্তর দিতে পারবে: এডমিন অথবা প্রশ্নের আসল লেখক (যদি লগইন করা থাকে)
            const canAnswer = !q.answer && (isAdmin || (currentUser?.id && q.user_id === currentUser.id));

            return (
              <div
                key={q.id}
                className="rounded-brand border border-border-base bg-white p-4 shadow-sh1 transition-brand duration-brand hover:border-brand-light/30"
              >
                {/* Question Row */}
                <div className="flex items-start gap-3">
                  <UserAvatar name={q.user_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-body text-[13px] font-bold text-ink">{q.user_name}</span>
                      <span className="font-body text-[11px] text-muted">{dateStr}</span>
                    </div>
                    <p className="mt-1 font-body text-[13.5px] leading-relaxed text-ink/90">
                      {q.question}
                    </p>
                  </div>
                </div>

                {/* Answer Section */}
                {q.answer ? (
                  <div className="mt-3.5 flex items-start gap-3 rounded-[12px] border border-[#BAE0FD] bg-[#F0F9FF] p-3.5 sm:ml-9">
                    <UserAvatar
                      name={q.answer.author_name}
                      size="sm"
                      isAdmin={q.answer.is_admin}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-body text-[12.5px] font-bold text-ink">
                          {q.answer.author_name}
                        </span>
                        {q.answer.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 font-body text-[10px] font-bold text-white shadow-xs">
                            <CheckBadgeIcon /> Vangcur টিম
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-body text-[10px] font-semibold text-muted">
                            {t('প্রশ্নকর্তার উত্তর')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-body text-[13px] leading-relaxed text-ink/80">
                        {q.answer.answer}
                      </p>
                    </div>
                  </div>
                ) : canAnswer ? (
                  <div className="mt-3 flex justify-end sm:ml-9">
                    <button
                      onClick={() => openAnswerModal(q)}
                      className="rounded-lg border border-brand-light/40 bg-brand-bg/30 px-3 py-1.5 font-body text-xs font-bold text-brand-primary transition-brand hover:bg-brand-bg/70"
                    >
                      ✍️ {t('উত্তর দিন')}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Ask Question Modal */}
      {askModalOpen && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setAskModalOpen(false); }}
        >
          <div className="w-full max-w-[440px] rounded-[22px] bg-white p-6 shadow-sh3">
            <div className="mb-4 flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-display text-base font-bold text-ink">💬 {t('প্রশ্ন করুন')}</h3>
              <button
                onClick={() => setAskModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuestionSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block font-body text-xs font-bold text-ink">{t('আপনার নাম')}</label>
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={askName}
                  disabled={!!currentUser?.name}
                  onChange={(e) => setAskName(e.target.value)}
                  placeholder={t('আপনার নাম লিখুন')}
                  className="w-full rounded-xl border border-border-base bg-white px-3.5 py-2.5 font-body text-[13.5px] text-ink outline-none transition-brand focus:border-brand-light disabled:bg-surface-muted disabled:text-muted"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-body text-xs font-bold text-ink">{t('আপনার প্রশ্ন')}</label>
                  <span className="font-body text-[11px] text-muted">{askQuestion.length}/300</span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={300}
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value)}
                  placeholder={t('প্রোডাক্ট সম্পর্কে আপনি কী জানতে চান? (কমপক্ষে ১০ অক্ষর)')}
                  className="w-full rounded-xl border border-border-base bg-white p-3 font-body text-[13.5px] text-ink outline-none transition-brand focus:border-brand-light"
                />
              </div>

              {askError && (
                <div className="rounded-lg bg-red-50 p-2.5 font-body text-xs font-semibold text-red-600">
                  {askError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingQ || askQuestion.trim().length < 10}
                className="mt-1 w-full rounded-full bg-brand-light py-3 font-body text-sm font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover disabled:opacity-50"
              >
                {submittingQ ? t('জমা হচ্ছে...') : t('প্রশ্ন সাবমিট করুন')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Answer Question Modal */}
      {answeringQuestion && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setAnsweringQuestion(null); }}
        >
          <div className="w-full max-w-[440px] rounded-[22px] bg-white p-6 shadow-sh3">
            <div className="mb-4 flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-display text-base font-bold text-ink">✍️ {t('উত্তর লিখুন')}</h3>
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 rounded-lg bg-surface-muted p-3 font-body text-xs text-ink/80">
              <strong>{answeringQuestion.user_name}:</strong> &quot;{answeringQuestion.question}&quot;
            </div>

            <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-3.5">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-body text-xs font-bold text-ink">
                    {isAdmin ? t('Vangcur টিমের উত্তর') : t('আপনার উত্তর')}
                  </label>
                  <span className="font-body text-[11px] text-muted">{answerText.length}/500</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={t('সঠিক ও স্পষ্ট উত্তর লিখুন...')}
                  className="w-full rounded-xl border border-border-base bg-white p-3 font-body text-[13.5px] text-ink outline-none transition-brand focus:border-brand-light"
                />
              </div>

              {answerError && (
                <div className="rounded-lg bg-red-50 p-2.5 font-body text-xs font-semibold text-red-600">
                  {answerError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingA || answerText.trim().length < 5}
                className="mt-1 w-full rounded-full bg-brand-primary py-3 font-body text-sm font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover disabled:opacity-50"
              >
                {submittingA ? t('প্রকাশ হচ্ছে...') : t('উত্তর প্রকাশ করুন')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
