import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { TrainingListView } from "@/features/classroom/training-list";

export const metadata: Metadata = {
  title: "培训项目",
};

export default function TrainingsPage() {
  return <TrainingListView />;
}
