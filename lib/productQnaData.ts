import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductQuestion, ProductQuestionAnswer } from '@/types';
import { sanitizeInput, sanitizePlainName, MAX_NAME_LEN } from './security';
import { logWarn } from './logger';

const MIN_QUESTION_LEN = 10;
const MAX_QUESTION_LEN = 300;
const MIN_ANSWER_LEN = 5;
const MAX_ANSWER_LEN = 500;

export async function checkIsUserAdmin(
  supabase: SupabaseClient,
  userId?: string | null,
): Promise<boolean> {
  let targetId = userId;
  let userEmail: string | null = null;

  try {
    const { data } = await supabase.auth.getSession();
    if (!targetId) targetId = data?.session?.user?.id || null;
    userEmail = data?.session?.user?.email || null;
  } catch {
    // fallback
  }

  // মডারেটরের নির্দিষ্ট জিমেইল থাকলে সরাসরি এক্সেস দেওয়া
  if (userEmail && userEmail.toLowerCase() === 'mehedivibecoding@gmail.com') {
    return true;
  }

  if (!targetId) return false;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, role, email')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !data) return false;
    
    if (data.email && data.email.toLowerCase() === 'mehedivibecoding@gmail.com') return true;
    if (data.role && ['admin', 'super_admin', 'moderator'].includes(data.role)) return true;
    return !!data.is_admin;
  } catch {
    return false;
  }
}

export async function fetchProductQuestions(
  supabase: SupabaseClient,
  productId: number | string,
): Promise<ProductQuestion[]> {
  try {
    const { data: questions, error: qErr } = await supabase
      .from('product_questions')
      .select('id, product_id, user_id, user_name, question, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (qErr || !questions || !questions.length) return [];

    const questionIds = questions.map((q) => q.id);

    const { data: answers } = await supabase
      .from('product_question_answers')
      .select('id, question_id, user_id, author_name, is_admin, answer, created_at')
      .in('question_id', questionIds);

    const answerMap: Record<string, ProductQuestionAnswer> = {};
    if (answers) {
      answers.forEach((ans) => {
        answerMap[String(ans.question_id)] = ans as ProductQuestionAnswer;
      });
    }

    return questions.map((q) => ({
      ...q,
      answer: answerMap[String(q.id)] || null,
    })) as ProductQuestion[];
  } catch (e) {
    logWarn('[QnA] fetchProductQuestions error:', e);
    return [];
  }
}

export interface SubmitQuestionPayload {
  productId: number | string;
  userName: string;
  question: string;
  userId?: string | null;
}

export async function submitProductQuestion(
  supabase: SupabaseClient,
  payload: SubmitQuestionPayload,
): Promise<{ ok: boolean; data?: ProductQuestion; error?: string }> {
  const name = sanitizePlainName(payload.userName || '').trim();
  const qText = sanitizeInput(payload.question || '').trim();

  if (!name || name.length < 2 || name.length > MAX_NAME_LEN) {
    return { ok: false, error: 'অনুগ্রহ করে সঠিক নাম দিন (২-৩০ অক্ষর)' };
  }

  if (!qText || qText.length < MIN_QUESTION_LEN || qText.length > MAX_QUESTION_LEN) {
    return { ok: false, error: `প্রশ্নটি কমপক্ষে ${MIN_QUESTION_LEN} এবং সর্বোচ্চ ${MAX_QUESTION_LEN} অক্ষরের হতে হবে` };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const liveUserId = sessionData?.session?.user?.id || payload.userId || null;

    const { data, error } = await supabase
      .from('product_questions')
      .insert({
        product_id: payload.productId,
        user_id: liveUserId,
        user_name: name,
        question: qText,
      })
      .select('id, product_id, user_id, user_name, question, created_at')
      .single();

    if (error || !data) {
      logWarn('[QnA] submitProductQuestion error:', error);
      return { ok: false, error: 'প্রশ্ন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।' };
    }

    return { ok: true, data: { ...data, answer: null } as ProductQuestion };
  } catch (e) {
    logWarn('[QnA] submitProductQuestion exception:', e);
    return { ok: false, error: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' };
  }
}

export interface SubmitAnswerPayload {
  questionId: number | string;
  answer: string;
  authorName: string;
  userId?: string | null;
  isAdmin?: boolean;
}

export async function submitProductAnswer(
  supabase: SupabaseClient,
  payload: SubmitAnswerPayload,
): Promise<{ ok: boolean; data?: ProductQuestionAnswer; error?: string }> {
  const aText = sanitizeInput(payload.answer || '').trim();
  const name = sanitizePlainName(payload.authorName || '').trim();

  if (!aText || aText.length < MIN_ANSWER_LEN || aText.length > MAX_ANSWER_LEN) {
    return { ok: false, error: `উত্তরটি কমপক্ষে ${MIN_ANSWER_LEN} এবং সর্বোচ্চ ${MAX_ANSWER_LEN} অক্ষরের হতে হবে` };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const liveUserId = sessionData?.session?.user?.id || payload.userId || null;

    // এডমিন বা মডারেটর যাচাই
    let userIsAdminOrMod = payload.isAdmin;
    if (liveUserId) {
      userIsAdminOrMod = await checkIsUserAdmin(supabase, liveUserId);
    }

    const { data, error } = await supabase
      .from('product_question_answers')
      .insert({
        question_id: payload.questionId,
        user_id: liveUserId,
        author_name: name || (userIsAdminOrMod ? 'Vangcur টিম' : 'ইউজার'),
        is_admin: !!userIsAdminOrMod,
        answer: aText,
      })
      .select('id, question_id, user_id, author_name, is_admin, answer, created_at')
      .single();

    if (error || !data) {
      logWarn('[QnA] submitProductAnswer error:', error);
      return { ok: false, error: 'উত্তর জমা দেওয়া যায়নি বা অনুমতি নেই।' };
    }

    return { ok: true, data: data as ProductQuestionAnswer };
  } catch (e) {
    logWarn('[QnA] submitProductAnswer exception:', e);
    return { ok: false, error: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' };
  }
}
