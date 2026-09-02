import { Button } from "@/components/ui/button";

export function TopicPager({
  page,
  lastPage,
  loading,
  onPageChange,
}: {
  page: number;
  lastPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (lastPage <= 1) return null;
  return (
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="secondary" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)}>上一页</Button>
      <Button variant="secondary" disabled={loading || page >= lastPage} onClick={() => onPageChange(page + 1)}>下一页</Button>
    </div>
  );
}
