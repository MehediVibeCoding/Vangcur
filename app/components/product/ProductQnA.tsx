'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useT } from '@/lib/i18n/useT';
import { showToast } from '@/lib/toast';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import UserAvatar from './UserAvatar';
import {
  submitProductQuestion,
  submitProductAnswer,
  checkIsUserAdmin,
} from '@/lib/productQnaData';
import type { ProductQuestion, ProductQuestionAnswer } from '@/types';

interface ProductQnAProps {
  productId: number | string;
  productName: string;
}

function SolidChatQuestionIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={`text-white fill-current ${className}`.trim()}>
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
    </svg>
  );
}

function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ReplyCurveIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

interface QuestionWithThread extends Omit<ProductQuestion, 'answer'> {
  adminAnswer?: ProductQuestionAnswer | null;
  authorReply?: ProductQuestionAnswer | null;
}

export default function ProductQnA({ productId, productName }: ProductQnAProps) {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);

  const [questions, setQuestions] = useState<QuestionWithThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ask Modal
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askName, setAskName] = useState('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askError, setAskError] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);

  // Reply/Answer Modal
  const [replyTarget, setReplyTarget] = useState<{ question: QuestionWithThread; isFollowUp: boolean } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [submittingR, setSubmittingR] = useState(false);

  const loadQuestionsData = useCallback(async () => {
    setLoading(true);
    try {
      const [qData, adminStatus] = await Promise.all([
        supabase
          .from('product_questions')
          .select('id, product_id, user_id, user_name, question, created_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false }),
        checkIsUserAdmin(supabase, currentUser?.id),
      ]);

      setIsAdmin(adminStatus);

      if (qData.data && qData.data.length > 0) {
        const qIds = qData.data.map((q) => q.id);
        const { data: answersData } = await supabase
          .from('product_question_answers')
          .select('id, question_id, user_id, author_name, is_admin, answer, created_at')
          .in('question_id', qIds)
          .order('created_at', { ascending: true });

        const mapped: QuestionWithThread[] = qData.data.map((q) => {
          const qAnswers = (answersData || []).filter((a) => a.question_id === q.id);
          const adminAns = qAnswers.find((a) => a.is_admin) || null;
          const authorAns = qAnswers.find((a) => !a.is_admin) || null;
          return {
            ...q,
            adminAnswer: adminAns,
            authorReply: authorAns,
          };
        });
        setQuestions(mapped);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }, [productId, currentUser?.id, supabase]);

  useEffect(() => {
    loadQuestionsData();
  }, [loadQuestionsData]);

  useEffect(() => {
    if (askModalOpen || replyTarget) {
      lockBody();
    } else {
      unlockBody();
    }
    return () => unlockBody();
  }, [askModalOpen, replyTarget]);

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

    setQuestions((prev) => [{ ...res.data!, adminAnswer: null, authorReply: null }, ...prev]);
    setAskModalOpen(false);
    showToast(t('✅ আপনার প্রশ্নটি সফলভাবে জমা হয়েছে!'));
  };

  const openReplyModal = (question: QuestionWithThread, isFollowUp: boolean) => {
    setReplyTarget({ question, isFollowUp });
    setReplyText('');
    setReplyError('');
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    setReplyError('');
    setSubmittingR(true);

    const authorName = isAdmin
      ? 'Vangcur টিম'
      : (currentUser?.name || replyTarget.question.user_name || 'প্রশ্নকর্তা');

    const res = await submitProductAnswer(supabase, {
      questionId: replyTarget.question.id,
      answer: replyText,
      authorName,
      userId: currentUser?.id || null,
      isAdmin,
    });

    setSubmittingR(false);
    if (!res.ok || !res.data) {
      setReplyError(res.error || t('উত্তর জমা দেওয়া যায়নি বা অনুমতি নেই।'));
      return;
    }

    setQuestions((prev) => prev.map((q) => {
      if (q.id === replyTarget.question.id) {
        if (isAdmin) {
          return { ...q, adminAnswer: res.data };
        } else {
          return { ...q, authorReply: res.data };
        }
      }
      return q;
    }));

    setReplyTarget(null);
    showToast(t('✅ উত্তর সফলভাবে প্রকাশিত হয়েছে!'));
  };

  const handleDeleteQuestion = async (qId: number | string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই প্রশ্নটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('product_questions').delete().eq('id', qId);
      if (error) throw error;
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
      showToast(t('প্রশ্নটি মুছে ফেলা হয়েছে'));
    } catch {
      showToast(t('মুছে ফেলা সম্ভব হয়নি'));
    }
  };

  const handleDeleteAnswer = async (ansId: number | string, qId: number | string, isAdm: boolean) => {
    if (!window.confirm('আপনি কি এই উত্তরটি মুছে ফেলতে চান?')) return;
    try {
      const { error } = await supabase.from('product_question_answers').delete().eq('id', ansId);
      if (error) throw error;
      setQuestions((prev) => prev.map((q) => {
        if (q.id === qId) {
          return isAdm ? { ...q, adminAnswer: null } : { ...q, authorReply: null };
        }
        return q;
      }));
      showToast(t('উত্তরটি মুছে ফেলা হয়েছে'));
    } catch {
      showToast(t('মুছে ফেলা সম্ভব হয়নি'));
    }
  };

  const hasQuestions = questions.length > 0;

  return (
    <div className="py-2">
      {/* Header Block — বর্ডার লাইন ছাড়া পরিষ্কার স্পেসিং ও স্কাই-ব্লু আইকন */}
      <div className="mb-5 flex flex-col gap-1">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
            <SolidChatQuestionIcon />
          </span>
          <span>
            {lang === 'en' ? (
              <>Customer <span className="text-brand-light">Q&A</span></>
            ) : (
              <>কাস্টমার <span className="text-brand-light">প্রশ্নোত্তর (Q&A)</span></>
            )}
          </span>
        </div>
        <p className="font-body text-[12.5px] text-muted">
          {lang === 'en'
            ? `Have a question about ${productName}? Ask now and get answers from our team.`
            : `${productName} সম্পর্কে কোনো প্রশ্ন থাকলে এখানে জেনে নিন।`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center font-body text-[13px] text-muted">
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
          {t('প্রশ্নোত্তর লোড হচ্ছে...')}
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasQuestions && (
        <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-border-base bg-surface-muted/50 p-6 text-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-white">
            <SolidChatQuestionIcon className="h-5 w-5 fill-current text-white" />
          </div>
          <p className="font-body text-sm font-bold text-ink">{t('এখনো কোনো প্রশ্ন করা হয়নি')}</p>
          <p className="mt-1 max-w-sm font-body text-xs text-muted">
            {t('এই প্রোডাক্ট সম্পর্কে আপনার কোনো কিছু জানার থাকলে সবার আগে প্রশ্ন করুন!')}
          </p>
          <button
            onClick={openAskModal}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-xs font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover"
          >
            <PlusIcon /> {t('প্রথম প্রশ্নটি করুন')}
          </button>
        </div>
      )}

      {/* Questions List & Bottom Button */}
      {!loading && hasQuestions && (
        <div className="flex flex-col gap-4">
          {questions.map((q) => {
            const dateStr = q.created_at
              ? new Date(q.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                year: 'numeric', month: 'short', day: 'numeric',
              })
              : '';

            const isAuthor = currentUser?.id && q.user_id === currentUser.id;
            const canDeleteQuestion = isAdmin || isAuthor;
            const canAdminAnswer = isAdmin && !q.adminAnswer;
            const canAuthorFollowUp = isAuthor && q.adminAnswer && !q.authorReply;

            return (
              <div
                key={q.id}
                className="relative rounded-brand border border-border-base bg-white p-4 shadow-sh1 transition-brand duration-brand hover:border-brand-light/30"
              >
                {/* ১. Question Row */}
                <div className="flex items-start gap-3">
                  <UserAvatar name={q.user_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="font-body text-[13px] font-bold text-ink">{q.user_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-body text-[11px] text-muted">{dateStr}</span>
                        {canDeleteQuestion && (
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            title={t('প্রশ্ন মুছে ফেলুন')}
                            className="text-muted/60 transition-colors hover:text-red-500"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 font-body text-[13.5px] leading-relaxed text-ink/90">
                      {q.question}
                    </p>
                  </div>
                </div>

                {/* ২. Admin Official Answer */}
                {q.adminAnswer ? (
                  <div className="mt-3.5 flex items-start gap-3 rounded-[12px] border border-[#BAE0FD] bg-[#F0F9FF] p-3.5 sm:ml-9">
                    <UserAvatar
                      name={q.adminAnswer.author_name}
                      size="sm"
                      isAdmin
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[12.5px] font-bold text-ink">
                            {q.adminAnswer.author_name}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-2 py-0.5 font-body text-[10px] font-bold text-white shadow-xs">
                            <CheckBadgeIcon /> Vangcur টিম
                          </span>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAnswer(q.adminAnswer!.id, q.id, true)}
                            title={t('উত্তর মুছে ফেলুন')}
                            className="text-muted/60 transition-colors hover:text-red-500"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 font-body text-[13px] leading-relaxed text-ink/80">
                        {q.adminAnswer.answer}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between pt-1 sm:ml-9">
                    <span className="font-body text-[11px] italic text-amber-700/80">
                      ⏳ {t('Vangcur টিমের উত্তরের অপেক্ষায়...')}
                    </span>
                    {canAdminAnswer && (
                      <button
                        onClick={() => openReplyModal(q, false)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-light/50 bg-brand-bg/40 px-3 py-1 font-body text-xs font-bold text-brand-primary hover:bg-brand-bg"
                      >
                        <ReplyCurveIcon /> {t('উত্তর দিন (Admin)')}
                      </button>
                    )}
                  </div>
                )}

                {/* ৩. Author 1-Time Follow-up Reply */}
                {q.authorReply && (
                  <div className="mt-2.5 flex items-start gap-3 rounded-[12px] border border-border-base bg-surface-muted/60 p-3 sm:ml-16">
                    <UserAvatar
                      name={q.authorReply.author_name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[12px] font-bold text-ink">
                            {q.authorReply.author_name}
                          </span>
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-body text-[9.5px] font-semibold text-muted">
                            {t('প্রশ্নকর্তার মন্তব্য')}
                          </span>
                        </div>

                        {(isAdmin || isAuthor) && (
                          <button
                            onClick={() => handleDeleteAnswer(q.authorReply!.id, q.id, false)}
                            title={t('মন্তব্য মুছে ফেলুন')}
                            className="text-muted/60 transition-colors hover:text-red-500"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                      <p className="mt-1 font-body text-[12.5px] leading-relaxed text-ink/80">
                        {q.authorReply.answer}
                      </p>
                    </div>
                  </div>
                )}

                {canAuthorFollowUp && (
                  <div className="mt-2.5 flex justify-end sm:ml-9">
                    <button
                      onClick={() => openReplyModal(q, true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-base bg-white px-3 py-1 font-body text-xs font-semibold text-brand-primary shadow-xs hover:border-brand-light"
                    >
                      <ReplyCurveIcon /> {t('ফলো-আপ মন্তব্য দিন')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Button */}
          <div className="mt-2 flex justify-center pt-2">
            <button
              onClick={openAskModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-xs font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover"
            >
              <PlusIcon /> {t('নতুন প্রশ্ন করুন')}
            </button>
          </div>
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
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-white">
                  <SolidChatQuestionIcon />
                </span>
                {t('প্রশ্ন করুন')}
              </h3>
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

      {/* Reply/Answer Modal */}
      {replyTarget && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setReplyTarget(null); }}
        >
          <div className="w-full max-w-[440px] rounded-[22px] bg-white p-6 shadow-sh3">
            <div className="mb-4 flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <ReplyCurveIcon className="text-brand-primary" /> 
                {isAdmin ? t('Vangcur টিমের উত্তর') : t('আপনার ফলো-আপ মন্তব্য')}
              </h3>
              <button
                onClick={() => setReplyTarget(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 rounded-lg bg-surface-muted p-3 font-body text-xs text-ink/80">
              <strong>{replyTarget.question.user_name}:</strong> &quot;{replyTarget.question.question}&quot;
            </div>

            <form onSubmit={handleReplySubmit} className="flex flex-col gap-3.5">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-body text-xs font-bold text-ink">
                    {isAdmin ? t('অফিসিয়াল উত্তর লিখুন') : t('আপনার মন্তব্য')}
                  </label>
                  <span className="font-body text-[11px] text-muted">{replyText.length}/500</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isAdmin ? t('সঠিক ও স্পষ্ট উত্তর লিখুন...') : t('আপনার মন্তব্য লিখুন...')}
                  className="w-full rounded-xl border border-border-base bg-white p-3 font-body text-[13.5px] text-ink outline-none transition-brand focus:border-brand-light"
                />
              </div>

              {replyError && (
                <div className="rounded-lg bg-red-50 p-2.5 font-body text-xs font-semibold text-red-600">
                  {replyError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingR || replyText.trim().length < 5}
                className="mt-1 w-full rounded-full bg-brand-primary py-3 font-body text-sm font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover disabled:opacity-50"
              >
                {submittingR ? t('প্রকাশ হচ্ছে...') : t('প্রকাশ করুন')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
