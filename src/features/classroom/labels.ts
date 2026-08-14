export const trainingTypeLabels: Record<string, string> = {
  online: "线上",
  offline: "线下",
  mixed: "混合",
};

export function formatPrice(isFree: boolean, price: string) {
  if (isFree || Number(price) === 0) return "免费";
  return `¥${price}`;
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
  };
  return labels[status] ?? status;
}
