import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductQuestion, ProductQuestionAnswer } from '@/types';
import { sanitizeInput, sanitizePlainName, MAX_NAME_LEN } from './security';
import { logWarn } from './logger';

const MIN_QUESTION_LEN = 10;
const MAX_QUESTION_LEN = 300;
const MIN_ANSWER_LEN = 5;
const MAX_ANSWER_LEN = 500;

const MODERATOR_EMAIL = 'mehedivibecoding@gmail.com';

/**
 * 🛡️ নিরাপদ সার্ভার সেশন-ভেরিফায়েড অ্যাডমিন ও মডারেটর রোল ভ্যালিডেটর
 * কোনো লোকালস্টোরেজ বা ক্লায়েন্ট ডাটায় বিশ্বাস করা হবে না।
 */
export async function checkIsUserAdmin(
  supabase: SupabaseClient,
  userId?: string | null,
): Promise<boolean> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return false;

    // যদি নির্দিষ্ট কোনো userId দিয়ে ভেরিফাই করতে বলা হয় এবং বর্তমান সেশন আইডির সাথে না মিলে
    if (userId && user.id !== userId) {
      return false;
    }

    // ১. মডারেটরের নির্দিষ্ট জিমেইল যাচাই (শুধুমাত্র সার্ভার-ভেরিফায়েড অথেন্টিকেটেড ইমেইল)
    const verifiedEmail = (user.email || '').toLowerCase().trim();
    if (verifiedEmail === MODERATOR_EMAIL.toLowerCase()) {
      return true;
    }

    // ২. প্রোফাইল টেবিল থেকে অ্যাডমিন বা অনুমোদিত রোল যাচাই
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile) return false;

    if (profile.is_admin === true) return true;
    if (profile.role && ['admin', 'super_admin', 'moderator'].includes(profile.role)) {
      return true;
    }
    return false;
  } catch (e) {
    logWarn('[QnA] checkIsUserAdmin exception:', e);
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

    const { data: answers, error: aErr } = await supabase
      .from('product_question_answers')
      .select('id, question_id, user_id, author_name, is_admin, answer, created_at')
      .in('question_id', questionIds)
      .order('created_at', { ascending: true });

    if (aErr) {
      logWarn('[QnA] fetch answers error:', aErr);
    }

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
    const { data: { user } } = await supabase.auth.getUser();
    const liveUserId = user?.id || null;

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
    const { data: { user } } = await supabase.auth.getUser();
    const liveUserId = user?.id || null;

    // 🛡️ স্পুফিং রোধ: শুধুমাত্র প্রকৃত সার্ভার সেশন-ভেরিফায়েড মডারেটর/অ্যাডমিনই "is_admin: true" পেতে পারবে
    let isPrivilegedAdminOrMod = false;
    if (liveUserId) {
      isPrivilegedAdminOrMod = await checkIsUserAdmin(supabase, liveUserId);
    }

    // অ্যাডমিন ছাড়া অন্য কেউ "Vangcur টিম" ব্র্যান্ড নেম স্পুফ করতে পারবে না
    const finalAuthorName = isPrivilegedAdminOrMod
      ? 'Vangcur টিম'
      : (name && name !== 'Vangcur টিম' ? name : 'কাস্টমার');

    const { data, error } = await supabase
      .from('product_question_answers')
      .insert({
        question_id: payload.questionId,
        user_id: liveUserId,
        author_name: finalAuthorName,
        is_admin: isPrivilegedAdminOrMod,
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
