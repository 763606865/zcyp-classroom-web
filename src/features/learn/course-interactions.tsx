"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { CourseInteraction } from "@/entities/learn";
import { getApiErrorMessage } from "@/lib/forms";
import {
  favoriteCourse,
  getCourseInteractions,
  likeCourse,
  shareCourse,
  unfavoriteCourse,
  unlikeCourse,
} from "./api";

function mergeInteraction(current: CourseInteraction, next?: CourseInteraction): CourseInteraction {
  if (!next) return current;
  return { ...current, ...next };
}

function ActionItem({
  icon,
  activeIcon,
  active,
  count,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  activeIcon: string;
  active: boolean;
  count?: number;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ fontSize: 14, color: active ? "#0F62FE" : "#555" }}
    >
      <img src={active ? activeIcon : icon} alt="" width={16} height={16} className="flex-shrink-0" />
      <span>{count ?? 0}</span>
    </button>
  );
}

export function CourseInteractions({
  courseId,
  title,
  onOpenCourseware,
  onOpenMobile,
}: {
  courseId: number;
  title: string;
  onOpenCourseware?: () => void;
  onOpenMobile?: () => void;
}) {
  const { toast } = useToast();
  const [state, setState] = useState<CourseInteraction>({
    favorite_count: 0,
    like_count: 0,
    share_count: 0,
    favorited: false,
    liked: false,
  });
  const [busy, setBusy] = useState<"favorite" | "like" | "share">();
  const [shared, setShared] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getCourseInteractions(courseId)
      .then((result) => {
        if (!cancelled) setState(result.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  async function refresh() {
    const result = await getCourseInteractions(courseId);
    setState(result.data);
  }

  async function toggleFavorite() {
    setBusy("favorite");
    try {
      const result = state.favorited ? await unfavoriteCourse(courseId) : await favoriteCourse(courseId);
      setState((current) => mergeInteraction(current, {
        ...result.data,
        favorited: !current.favorited,
        favorite_count: result.data.favorite_count ?? Math.max(0, (current.favorite_count ?? 0) + (current.favorited ? -1 : 1)),
      }));
      await refresh().catch(() => undefined);
    } catch (error) {
      toast({ title: "收藏失败", description: getApiErrorMessage(error) });
    } finally {
      setBusy(undefined);
    }
  }

  async function toggleLike() {
    setBusy("like");
    try {
      const result = state.liked ? await unlikeCourse(courseId) : await likeCourse(courseId);
      setState((current) => mergeInteraction(current, {
        ...result.data,
        liked: !current.liked,
        like_count: result.data.like_count ?? Math.max(0, (current.like_count ?? 0) + (current.liked ? -1 : 1)),
      }));
      await refresh().catch(() => undefined);
    } catch (error) {
      toast({ title: "点赞失败", description: getApiErrorMessage(error) });
    } finally {
      setBusy(undefined);
    }
  }

  async function forward() {
    setBusy("share");
    setShared(true);
    const pageUrl = typeof window === "undefined" ? "" : window.location.href;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pageUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }
    setShareUrl(pageUrl);
    setShareOpen(true);
    toast({ title: copied ? "链接已复制，或扫码进行查看" : "扫码查看，或手动复制下方链接" });
    try {
      const result = await shareCourse(courseId, "link");
      setState((current) => mergeInteraction(current, {
        ...result.data,
        share_count: result.data.share_count ?? (current.share_count ?? 0) + 1,
      }));
    } catch (error) {
      toast({ title: "转发失败", description: getApiErrorMessage(error, "分享未完成，未计入转发次数") });
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-7">
          <ActionItem
            icon="/images/study/study-like.png"
            activeIcon="/images/study/study-like-act.png"
            active={Boolean(state.liked)}
            count={state.like_count}
            label="点赞"
            disabled={busy === "like"}
            onClick={() => void toggleLike()}
          />
          <ActionItem
            icon="/images/study/study-collection.png"
            activeIcon="/images/study/study-collection-act.png"
            active={Boolean(state.favorited)}
            count={state.favorite_count}
            label="收藏"
            disabled={busy === "favorite"}
            onClick={() => void toggleFavorite()}
          />
          <ActionItem
            icon="/images/study/study-share.png"
            activeIcon="/images/study/study-share-act.png"
            active={shared}
            count={state.share_count}
            label="分享"
            disabled={busy === "share"}
            onClick={() => void forward()}
          />
        </div>
        <div className="flex items-center gap-7">
          <button
            type="button"
            onClick={onOpenCourseware}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ fontSize: 14, color: "#555" }}
          >
            <img src="/images/study/study-download.png" alt="" width={16} height={16} className="flex-shrink-0" />
            <span>课件下载</span>
          </button>
          <button
            type="button"
            onClick={onOpenMobile}
            className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ fontSize: 14, color: "#555" }}
          >
            <img src="/images/study/study-phone.png" alt="" width={16} height={16} className="flex-shrink-0" />
            <span>手机观看</span>
          </button>
        </div>
      </div>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle className="truncate pr-6">{title || "扫码查看课程"}</DialogTitle>
          <DialogDescription>链接已复制，或扫码进行查看</DialogDescription>
          <div className="mt-4 flex justify-center rounded-card border border-border bg-white p-4">
            {shareUrl ? <QRCodeSVG value={shareUrl} size={200} level="M" marginSize={2} /> : null}
          </div>
          {shareUrl ? <p className="mt-4 break-all text-center text-xs text-muted-foreground">{shareUrl}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
