export const trainingTypeLabels: Record<string, string> = {
  online: "线上",
  offline: "线下",
  mixed: "混合",
  live: "线上直播",
};

/** 授课方式文字色值映射 */
export const trainingTypeColors: Record<string, string> = {
  online: "#F16767",
  offline: "green",
  mixed: "#0F62FE",
  live: "#0F62FE",
};

export function classScheduleStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待开班",
    ongoing: "进行中",
    finished: "已结班",
    cancelled: "已取消",
  };
  return labels[status] ?? status;
}

export function stripHtml(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function formatPrice(isFree: boolean, price: string) {
  if (isFree || Number(price) === 0) return "免费";
  return `¥${price}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "待定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "待定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待支付",
    paid: "已支付",
    failed: "支付失败",
    not_started: "未开始",
    unpublished: "未开始",
    published: "报名中",
    ongoing: "进行中",
    learning: "学习中",
    completed: "已完成",
    enrolled: "已报名",
    cancelled: "已取消",
    refunded: "已退款",
    expired: "已过期",
    active: "在读",
    quit: "已退出",
    in_progress: "进行中",
    submitted: "已提交",
    scored: "已出分",
    timeout: "已超时",
    draft: "草稿",
    reviewed: "已批改",
    returned: "已退回",
    closed: "已关闭",
  };
  return labels[status] ?? status;
}

export function homeworkProgressLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "未开始",
    draft: "草稿",
    submitted: "待批改",
    reviewed: "已批改",
    returned: "已退回",
  };
  return labels[status] ?? statusLabel(status);
}

export function examProgressLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "未开始",
    in_progress: "作答中",
    submitted: "待阅卷",
    scored: "已出分",
    timeout: "已超时",
  };
  return labels[status] ?? statusLabel(status);
}

export function payChannelLabel(channel?: string | null) {
  const labels: Record<string, string> = {
    auto: "自动",
    free: "免费开通",
    mock: "模拟支付",
    wechat: "微信支付",
    alipay: "支付宝",
  };
  return channel ? (labels[channel] ?? channel) : "未选择";
}

export function formatAmount(amount?: string | null) {
  if (amount == null || amount === "") return "—";
  if (Number(amount) === 0) return "¥0.00";
  return `¥${amount}`;
}

/** 根据 like_count 计算推荐图标数量（0-10→1, 10-20→2, 20-30→3, 30-40→4, 40+→5，最多5个） */
export function getLikeIconCount(likeCount?: number | null): number {
  if (!likeCount || likeCount <= 0) return 0;
  const count = Math.ceil(likeCount / 10);
  return Math.min(count, 5);
}
