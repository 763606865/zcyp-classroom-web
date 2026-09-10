"use client";

import { Heart, Share2, Star } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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

export function CourseInteractions({ courseId, title }: { courseId: number; title: string }) {
  const { toast } = useToast();
  const [state, setState] = useState<CourseInteraction>({
    favorite_count: 0,
    like_count: 0,
    share_count: 0,
    favorited: false,
    liked: false,
  });
  const [busy, setBusy] = useState<"favorite" | "like" | "share">();
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
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant={state.favorited ? "primary" : "secondary"} disabled={busy === "favorite"} onClick={() => void toggleFavorite()}>
          <Star className={`mr-2 size-4 ${state.favorited ? "fill-current" : ""}`} />
          {state.favorited ? "已收藏" : "收藏"}
          {state.favorite_count ? ` ${state.favorite_count}` : ""}
        </Button>
        <Button variant={state.liked ? "primary" : "secondary"} disabled={busy === "like"} onClick={() => void toggleLike()}>
          <Heart className={`mr-2 size-4 ${state.liked ? "fill-current" : ""}`} />
          {state.liked ? "已点赞" : "点赞"}
          {state.like_count ? ` ${state.like_count}` : ""}
        </Button>
        <Button variant="secondary" disabled={busy === "share"} onClick={() => void forward()}>
          <Share2 className="mr-2 size-4" />
          转发{state.share_count ? ` ${state.share_count}` : ""}
        </Button>
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
