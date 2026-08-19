import type { CourseLearn, LearnLesson, LessonProgress } from "@/entities/learn";

export function flattenLessons(data: CourseLearn): LearnLesson[] {
  return [...data.chapters.flatMap((chapter) => chapter.lessons), ...(data.ungrouped_lessons ?? [])];
}

export function applyLessonProgress(
  current: CourseLearn,
  lessonId: number,
  lessonProgress: LessonProgress,
  courseProgress: CourseLearn["enrollment"],
): CourseLearn {
  const patchLesson = (lesson: LearnLesson) =>
    lesson.id === lessonId ? { ...lesson, progress: lessonProgress } : lesson;
  const next: CourseLearn = {
    ...current,
    enrollment: { ...current.enrollment, ...courseProgress },
    chapters: current.chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map(patchLesson),
    })),
    ungrouped_lessons: current.ungrouped_lessons?.map(patchLesson),
  };
  return {
    ...next,
    summary: {
      ...current.summary,
      completed_lessons: flattenLessons(next).filter((lesson) => lesson.progress?.status === "completed").length,
    },
  };
}
