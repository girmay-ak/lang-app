"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow, isToday, format } from "date-fns";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import {
  notificationService,
  type NotificationRecord,
  type NotificationRow,
} from "@/lib/services/notification-service";

interface NotificationsViewProps {
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationsView({
  onUnreadCountChange,
}: NotificationsViewProps) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "likes" | "comments" | "requests"
  >("all");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const realtimeRef = useRef<ReturnType<
    typeof notificationService.subscribeToUserNotifications
  > | null>(null);
  const { toast } = useToast();

  const sortedNotifications = useMemo(
    () => notificationService.sortNotifications(notifications),
    [notifications],
  );

  const unreadCount = useMemo(
    () => sortedNotifications.filter((notif) => !notif.is_read).length,
    [sortedNotifications],
  );

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const { notifications: items, userId } =
          await notificationService.listForCurrentUser();
        setNotifications(items);
        setCurrentUserId(userId);
      } catch (error) {
        console.error("[NotificationsView] Failed to load notifications:", error);
        toast({
          variant: "destructive",
          title: "Could not load notifications",
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong while fetching notifications.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    return () => {
      realtimeRef.current?.unsubscribe();
      realtimeRef.current = null;
    };
  }, [toast]);

  useEffect(() => {
    if (isLoading) return;
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, isLoading, onUnreadCountChange]);

  const mergeNotification = useCallback((record: NotificationRecord) => {
    setNotifications((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex((item) => item.id === record.id);
      if (existingIndex !== -1) {
        next[existingIndex] = {
          ...next[existingIndex],
          ...record,
          related_users:
            record.related_users.length > 0
              ? record.related_users
              : next[existingIndex].related_users,
        };
      } else {
        next.push(record);
      }
      return notificationService.sortNotifications(next);
    });
  }, []);

  const handleRealtimeInsert = useCallback(
    async (payload: RealtimePostgresChangesPayload<NotificationRow>) => {
      if (!payload.new) return;
      try {
        const hydrated = await notificationService.hydrateRow(
          payload.new as NotificationRow,
        );
        mergeNotification(hydrated);
      } catch (error) {
        console.error("[NotificationsView] Failed to hydrate INSERT payload:", error);
      }
    },
    [mergeNotification],
  );

  const handleRealtimeUpdate = useCallback(
    async (payload: RealtimePostgresChangesPayload<NotificationRow>) => {
      if (!payload.new) return;
      try {
        const hydrated = await notificationService.hydrateRow(
          payload.new as NotificationRow,
        );
        mergeNotification(hydrated);
      } catch (error) {
        console.error("[NotificationsView] Failed to hydrate UPDATE payload:", error);
      }
    },
    [mergeNotification],
  );

  const handleRealtimeDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<NotificationRow>) => {
      const deletedId =
        (payload.old as NotificationRow | null)?.id ??
        (payload.new as NotificationRow | null)?.id;
      if (!deletedId) return;
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== deletedId),
      );
    },
    [],
  );

  useEffect(() => {
    if (!currentUserId) return;
    realtimeRef.current?.unsubscribe();
    const subscription = notificationService.subscribeToUserNotifications(
      currentUserId,
      {
        onInsert: handleRealtimeInsert,
        onUpdate: handleRealtimeUpdate,
        onDelete: handleRealtimeDelete,
      },
    );
    realtimeRef.current = subscription;
    return () => {
      subscription.unsubscribe();
      if (realtimeRef.current === subscription) {
        realtimeRef.current = null;
      }
    };
  }, [currentUserId, handleRealtimeDelete, handleRealtimeInsert, handleRealtimeUpdate]);

  const getNotificationType = (
    type: string,
  ): "likes" | "comment" | "follow" => {
    if (type.includes("favorited") || type.includes("likes")) return "likes";
    if (type.includes("reply") || type.includes("comment")) return "comment";
    if (type.includes("friend_request") || type.includes("follow"))
      return "follow";
    return "likes"; // default
  };

  const filteredNotifications = sortedNotifications.filter((notif) => {
    if (activeFilter === "all") return true;
    const notifType = getNotificationType(notif.notification_type);
    if (activeFilter === "likes") return notifType === "likes";
    if (activeFilter === "comments") return notifType === "comment";
    if (activeFilter === "requests") return notifType === "follow";
    return true;
  });

  const todayNotifications = filteredNotifications.filter((n) =>
    isToday(new Date(n.created_at)),
  );
  const olderNotifications = filteredNotifications.filter(
    (n) => !isToday(new Date(n.created_at)),
  );

  const handleNotificationOpen = useCallback(
    async (notification: NotificationRecord) => {
      if (notification.is_read) return;
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
      } catch (error) {
        console.error("[NotificationsView] Failed to mark notification as read:", error);
        toast({
          variant: "destructive",
          title: "Could not update notification",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a moment.",
        });
      }
    },
    [toast],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!currentUserId || unreadCount === 0 || isMarkingAllRead) return;
    try {
      setIsMarkingAllRead(true);
      await notificationService.markAllAsRead(currentUserId);
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
      toast({
        title: "All caught up",
        description: "Every notification has been marked as read.",
      });
    } catch (error) {
      console.error("[NotificationsView] Failed to mark all as read:", error);
      toast({
        variant: "destructive",
        title: "Unable to mark all as read",
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsMarkingAllRead(false);
    }
  }, [currentUserId, isMarkingAllRead, toast, unreadCount]);

  const handleFollowBack = useCallback(
    async (notification: NotificationRecord) => {
      const requestorId = notification.data?.user_id;
      if (!requestorId || typeof requestorId !== "string") {
        toast({
          variant: "destructive",
          title: "Unable to follow back",
          description: "We could not find who sent this request.",
        });
        return;
      }

      try {
        await notificationService.acceptFollowRequest(requestorId);
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
        const displayName =
          notification.related_users?.[0]?.full_name ?? "your new friend";
        toast({
          title: "Followed back",
          description: `You and ${displayName} are now connected.`,
        });
      } catch (error) {
        console.error("[NotificationsView] Failed to follow back:", error);
        toast({
          variant: "destructive",
          title: "Could not follow back",
          description:
            error instanceof Error ? error.message : "Please try again later.",
        });
      }
    },
    [toast],
  );

  const handleDiscardRequest = useCallback(
    async (notification: NotificationRecord) => {
      const requestorId = notification.data?.user_id;
      if (!requestorId || typeof requestorId !== "string") {
        toast({
          variant: "destructive",
          title: "Unable to discard request",
          description: "We could not identify this request.",
        });
        return;
      }

      try {
        await notificationService.declineFollowRequest(requestorId);
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
        toast({
          title: "Request dismissed",
          description: "The follow request has been removed.",
        });
      } catch (error) {
        console.error("[NotificationsView] Failed to discard request:", error);
        toast({
          variant: "destructive",
          title: "Could not discard request",
          description:
            error instanceof Error ? error.message : "Please try again later.",
        });
      }
    },
    [toast],
  );

  const getNotificationIcon = (type: string) => {
    const notifType = getNotificationType(type);
    switch (notifType) {
      case "likes":
        return (
          <div className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full p-1 border-2 border-slate-900">
            <Heart className="h-2.5 w-2.5 text-white fill-white" />
          </div>
        );
      case "comment":
        return (
          <div className="absolute -top-0.5 -right-0.5 bg-blue-500 rounded-full p-1 border-2 border-slate-900">
            <MessageCircle className="h-2.5 w-2.5 text-white fill-white" />
          </div>
        );
      case "follow":
        return (
          <div className="absolute -top-0.5 -right-0.5 bg-orange-500 rounded-full p-1 border-2 border-slate-900">
            <UserPlus className="h-2.5 w-2.5 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, "d MMM");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
        </div>
      </div>

      <div className="bg-slate-900/30 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("likes")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "likes"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            Loves
          </button>
          <button
            onClick={() => setActiveFilter("comments")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "comments"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveFilter("requests")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "requests"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            Mutual Requests
          </button>
        </div>
          <Button
            size="sm"
            variant="outline"
            disabled={isMarkingAllRead || unreadCount === 0}
            onClick={handleMarkAllRead}
            className="h-9 min-w-[150px] rounded-lg border-white/20 bg-transparent text-xs font-semibold text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarkingAllRead ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Marking…
              </span>
            ) : (
              `Mark all as read${unreadCount > 0 ? ` (${unreadCount})` : ""}`
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {sortedNotifications.length === 0 && !isLoading ? (
          <div className="text-center py-12 mt-6">
            <p className="text-white/60">No notifications yet</p>
            <p className="text-white/40 text-sm mt-2">
              You'll see notifications here when people interact with you!
            </p>
          </div>
        ) : (
          <>
            {/* Today Section */}
            {todayNotifications.length > 0 && (
              <div className="mt-6">
                <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Today
                </h2>
                <div className="space-y-2">
                  {todayNotifications.map((notification) => {
                    const notifType = getNotificationType(
                      notification.notification_type,
                    );
                    const users = notification.related_users || [];
                    const userNames =
                      users.length > 0
                        ? users.map((u) => u.full_name ?? "Language Explorer")
                        : [notification.title?.split(" ")[0] ?? "Someone"];
                    const userAvatars =
                      users.length > 0
                        ? users.map(
                            (u) => u.avatar_url || "/placeholder-user.jpg",
                          )
                        : ["/placeholder-user.jpg"];
                    const isUnread = !notification.is_read;

                    const cardClasses = [
                      "group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50",
                      isUnread
                        ? "bg-cyan-500/10 border-cyan-400/40 hover:bg-cyan-500/15"
                        : "bg-slate-800/30 border-white/10 hover:bg-slate-800/45",
                    ].join(" ");

                    return (
                      <div
                        key={notification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationOpen(notification)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleNotificationOpen(notification);
                          }
                        }}
                        className={cardClasses}
                      >
                        {/* Post thumbnail or avatar */}
                        <div className="relative flex-shrink-0">
                          {notification.data?.postImage ? (
                            <img
                              src={
                                notification.data.postImage ||
                                "/placeholder.svg"
                              }
                              alt="Post"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={userAvatars[0] || "/placeholder-user.jpg"}
                              />
                              <AvatarFallback>
                                {userNames[0]?.[0] ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {getNotificationIcon(notification.notification_type)}
                          {isUnread && (
                            <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
                          )}
                        </div>

                        {/* User avatars */}
                        {userAvatars.length > 0 && (
                          <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                            {userAvatars.slice(0, 3).map((avatar, idx) => (
                              <Avatar
                                key={idx}
                                className="h-7 w-7 border-2 border-slate-900"
                              >
                                <AvatarImage
                                  src={avatar || "/placeholder-user.jpg"}
                                />
                                <AvatarFallback>
                                  {userNames[idx]?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug text-white">
                            <span className="font-semibold">
                              {userNames.join(", ")}
                            </span>{" "}
                            <span className="text-gray-400">
                              {notification.body || notification.title}
                            </span>
                          </p>

                          {/* Action buttons for follow notifications */}
                          {notifType === "follow" && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs rounded-lg border-white/20 text-gray-300 hover:bg-white/10 bg-transparent"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDiscardRequest(notification);
                                }}
                              >
                                Discard
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-xl"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleFollowBack(notification);
                                }}
                              >
                                Follow Back
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-[11px] text-gray-500 flex-shrink-0">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last 7 Days Section */}
            {olderNotifications.length > 0 && (
              <div className="mt-6">
                <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Last 7 Days
                </h2>
                <div className="space-y-2">
                  {olderNotifications.map((notification) => {
                    const users = notification.related_users || [];
                    const userNames =
                      users.length > 0
                        ? users.map((u) => u.full_name ?? "Language Explorer")
                        : [notification.title?.split(" ")[0] ?? "Someone"];
                    const userAvatars =
                      users.length > 0
                        ? users.map(
                            (u) => u.avatar_url || "/placeholder-user.jpg",
                          )
                        : ["/placeholder-user.jpg"];
                    const isUnread = !notification.is_read;
                    const cardClasses = [
                      "group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50",
                      isUnread
                        ? "bg-cyan-500/10 border-cyan-400/40 hover:bg-cyan-500/15"
                        : "bg-slate-800/30 border-white/10 hover:bg-slate-800/45",
                    ].join(" ");

                    return (
                      <div
                        key={notification.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationOpen(notification)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleNotificationOpen(notification);
                          }
                        }}
                        className={cardClasses}
                      >
                        {/* Post thumbnail */}
                        <div className="relative flex-shrink-0">
                          {notification.data?.postImage ? (
                            <img
                              src={
                                notification.data.postImage ||
                                "/placeholder.svg"
                              }
                              alt="Post"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={userAvatars[0] || "/placeholder-user.jpg"}
                              />
                              <AvatarFallback>
                                {userNames[0]?.[0] ?? "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {getNotificationIcon(notification.notification_type)}
                          {isUnread && (
                            <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
                          )}
                        </div>

                        {/* User avatars */}
                        {userAvatars.length > 0 && (
                          <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                            {userAvatars.slice(0, 3).map((avatar, idx) => (
                              <Avatar
                                key={idx}
                                className="h-7 w-7 border-2 border-slate-900"
                              >
                                <AvatarImage
                                  src={avatar || "/placeholder-user.jpg"}
                                />
                                <AvatarFallback>
                                  {userNames[idx]?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] leading-snug text-white">
                            <span className="font-semibold">
                              {userNames.join(", ")}
                            </span>{" "}
                            <span className="text-gray-400">
                              {notification.body || notification.title}
                            </span>
                          </p>
                        </div>

                        {/* Time */}
                        <span className="text-[11px] text-gray-500 flex-shrink-0">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
