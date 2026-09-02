/** 专题页展示用 mock，后续可换成后台配置。 */

export const courseTopicMock = {
  heroSubtitle: "对接计量检测岗位，按热度与推荐选课。",
  stats: [
    { label: "公开课", value: "86", unit: "门" },
    { label: "本月学习", value: "3200", unit: "人次" },
    { label: "推荐课", value: "12", unit: "门" },
  ],
  heroNote: "计量，让数据更可信",
  heroTagline: "精准 · 科学 · 公正",
  directions: [
    { id: "metrology", label: "计量员" },
    { id: "lab", label: "实验室认可" },
    { id: "length", label: "长度" },
    { id: "force", label: "力学" },
    { id: "thermo", label: "热工" },
    { id: "electric", label: "电学" },
    { id: "digital", label: "数字化" },
  ],
  featuredTags: ["法律法规", "现场实操"],
  featuredSummary: "从计量法律法规、量值传递到现场实操，帮助学员按岗位能力选课并衔接考核。",
  chooseSteps: [
    { title: "明确岗位", desc: "确定从事岗位或学习目标" },
    { title: "选择形式", desc: "选择课程方向与上课形式" },
    { title: "提交咨询", desc: "提交需求，老师为你推荐课程" },
  ],
};

export const scheduleTopicMock = {
  heroSubtitle: "查看近期开班与进行中的班级，按时间报名。",
  stats: [
    { label: "本月开班", value: "6", unit: "期" },
    { label: "进行中", value: "3", unit: "个班" },
    { label: "可报名", value: "4", unit: "个" },
    { label: "覆盖方向", value: "5", unit: "个" },
  ],
  locations: ["全国", "杭州", "北京", "上海", "广州"],
  calendarMonth: "2026年9月",
  calendarHighlightDays: [8, 12, 18, 22, 28],
  steps: [
    { title: "提交咨询", desc: "留下岗位与意向开班时间" },
    { title: "确认班级", desc: "教务匹配班级、地点与名额" },
    { title: "缴费报名", desc: "确认费用后完成报名" },
    { title: "到班学习", desc: "按开班时间参加学习与考核" },
  ],
  notices: [
    { q: "可以插班吗？", a: "部分进行中班级支持插班，以教务确认为准。" },
    { q: "是否含午餐与住宿？", a: "线下班食宿安排以当期开班通知为准，线上班不含。" },
    { q: "结业是否发证？", a: "完成学习并考核合格后，可申请培训证明。" },
  ],
};

export const teacherTopicMock = {
  heroSubtitle: "讲师来自计量检测一线，兼顾标准解读与现场实操。",
  stats: [
    { label: "专职讲师", value: "28", unit: "人" },
    { label: "覆盖领域", value: "12", unit: "个" },
    { label: "企业内训", value: "80+", unit: "场" },
  ],
  domains: ["长度计量", "力学", "热工", "电学", "实验室认可", "不确定度"],
  chiefTags: ["几何量", "比对专家"],
  chiefBio: "长期从事长度计量与几何量检测，参与多项省级比对，主讲岗位培训与企业内训。",
  methods: [
    { title: "标准解读", desc: "把法规、规范和考核要点讲清楚，便于落到作业文件。" },
    { title: "真机实操", desc: "结合仪器与现场案例，还原检测与校准场景。" },
    { title: "考核辅导", desc: "围绕考核路径组织模拟、答疑与错题复盘。" },
  ],
  quotes: [
    { name: "王同学", text: "老师把不确定度评定拆成步骤，回去就能编校准证书。" },
    { name: "李同学", text: "面授时对着真机讲，比只看讲义更容易上手。" },
  ],
};
