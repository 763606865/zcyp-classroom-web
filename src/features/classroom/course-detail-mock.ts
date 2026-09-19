/** 课程详情页 mock 数据，后续替换为接口。 */

import type { CourseCard } from '@/entities/classroom';

export interface CourseChapter {
  id: number;
  title: string;
  sort: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: number;
  title: string;
  duration_seconds: number;
  is_free_preview: boolean;
  sort: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CourseDetailMock {
  id: number;
  title: string;
  slug: string;
  cover: string;
  summary: string;
  description: string;
  is_free: boolean;
  price: string;
  like_count: number;
  lesson_count: number;
  duration_minutes: number;
  validity_days: number;
  teacher: {
    name: string;
    title?: string;
  } | null;
  chapters: CourseChapter[];
  faq: FaqItem[];
  qr_text_primary: string;
  qr_text_secondary: string;
  recommend_courses: CourseCard[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

const mockChapters: CourseChapter[] = [
  {
    id: 1,
    title: 'AI赋能智慧课程建设培训',
    sort: 1,
    lessons: [
      { id: 1, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: true, sort: 1 },
      { id: 2, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 2 },
      { id: 3, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 3 },
      { id: 4, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 4 },
    ],
  },
  {
    id: 2,
    title: 'AI赋能智慧课程建设培训',
    sort: 2,
    lessons: [
      { id: 5, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 1 },
      { id: 6, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 2 },
      { id: 7, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 3 },
      { id: 8, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 4 },
    ],
  },
  {
    id: 3,
    title: 'AI赋能智慧课程建设培训',
    sort: 3,
    lessons: [
      { id: 9, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 1 },
      { id: 10, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 2 },
      { id: 11, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 3 },
      { id: 12, title: 'AI赋能智慧课程建设培训', duration_seconds: 416, is_free_preview: false, sort: 4 },
    ],
  },
];

const mockFaq: FaqItem[] = [
  { question: '如何查看已购课程？', answer: '点击个人中心然后选择我的课程' },
  { question: '课程购买后可以更换吗？', answer: '课程购买后不支持更换，请确认后再购买。' },
  { question: '直播结束后会有回放吗？', answer: '直播结束后会生成回放，可在课程章节中观看。' },
  { question: '无法登录怎么办？', answer: '请检查账号密码是否正确，或联系客服热线。' },
  { question: '如何用手机听课？', answer: '关注中测高科公众号，在菜单中找到我的课程即可。' },
  { question: '课程过期了怎么办？', answer: '课程过期后可联系客服申请延期，具体以平台规则为准。' },
];

const mockRecommendCourses: CourseCard[] = [
  {
    id: 101,
    title: 'AI时代数智化学习能力提升课提升课提升课',
    slug: 'ai-digital-learning',
    cover: '/images/course/bg.png',
    summary: '技术流名师领学 省时省力冲高分',
    type: 'online',
    is_free: false,
    price: '2345',
    like_count: 30,
    lesson_count: 4,
    duration_minutes: 240,
    teacher: { id: 1, name: '张山峰', title: '讲师' },
  },
  {
    id: 102,
    title: '计量检测基础与实务操作课程',
    slug: 'metrology-basics',
    cover: '/images/course/bg1.png',
    summary: '从基础理论到现场实操的全面培训',
    type: 'mixed',
    is_free: false,
    price: '1680',
    like_count: 25,
    lesson_count: 8,
    duration_minutes: 480,
    teacher: { id: 2, name: '李教授', title: '高级讲师' },
  },
  {
    id: 103,
    title: '实验室认可与质量管理体系',
    slug: 'lab-quality-system',
    cover: '/images/course/banner-bg.png',
    summary: '系统学习实验室认可流程与质量管理',
    type: 'online',
    is_free: false,
    price: '1980',
    like_count: 20,
    lesson_count: 6,
    duration_minutes: 360,
    teacher: { id: 3, name: '王专家', title: '资深讲师' },
  },
];

export const courseDetailMock: CourseDetailMock = {
  id: 1,
  title: '重庆人文科技学院– AI赋能智慧课程建设培训',
  slug: 'ai-empowered-course',
  cover: '/images/course/banner-bg.png',
  summary:
    '本课程萃取彼得·德鲁克管理精髓，以"管理自我 → 管理他人 → 管理业务"三位一体模型为主线，配套定制诊断、情景演练、导师陪跑，让中基层管理者拿到"可复制的管理操作系统"。',
  description:
    '本课程萃取彼得·德鲁克管理精髓，以"管理自我 → 管理他人 → 管理业务"三位一体模型为主线，配套定制诊断、情景演练、导师陪跑，让中基层管理者拿到"可复制的管理操作系统"。',
  is_free: false,
  price: '145',
  like_count: 45,
  lesson_count: 12,
  duration_minutes: 154,
  validity_days: 90,
  teacher: { name: '张山峰', title: '主讲老师' },
  chapters: mockChapters,
  faq: mockFaq,
  qr_text_primary: '关注中测高科公众号',
  qr_text_secondary: '职业技能培训，职业考证、求职招聘一网打尽',
  recommend_courses: mockRecommendCourses,
};

export function getCourseDetailBySlug(slug: string): CourseDetailMock | null {
  if (slug === courseDetailMock.slug) return courseDetailMock;
  return courseDetailMock;
}

export { formatDuration, formatTotalDuration };
