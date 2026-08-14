import type { Metadata } from "next";
import { TrainingListView } from "@/features/classroom/training-list";

export const metadata: Metadata = {
  title: "培训项目",
};

export default function TrainingsPage() {
  return (
    <main>
      <TrainingListView />
    </main>
  );
}
