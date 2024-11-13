"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link2, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import debounce from "lodash/debounce";
import dotenv from "dotenv";

dotenv.config();

interface TextUpdate {
  type: "text-update";
  content: string;
  code: string;
}

interface InitialContent {
  type: "initial-content";
  content: string;
  code: string;
}

interface JoinRoom {
  type: "join-room";
  code: string;
}

type Message = TextUpdate | InitialContent | JoinRoom;

const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL}/room/api/v2`;

const Room = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code");

  const socketRef = useRef<WebSocket | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");

  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const debouncedSend = debounce(
    (ws: WebSocket, content: string, code: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        const message: TextUpdate = {
          type: "text-update",
          content,
          code,
        };
        ws.send(JSON.stringify(message));
      }
    },
    100
  );

  const connectSocket = useCallback(() => {
    if (!roomCode || socketRef.current?.readyState === WebSocket.OPEN) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected");
      setError("");
      const message: JoinRoom = { type: "join-room", code: roomCode };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      if (
        message.type === "initial-content" ||
        message.type === "text-update"
      ) {
        if (message.content !== contentRef.current) {
          setContent(message.content);
        }
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected");

      setTimeout(() => {
        if (socketRef.current === ws) {
          socketRef.current = null;
        }
      }, 0);
    };

    ws.onerror = () => {
      setError("WebSocket error occurred");

      setTimeout(() => {
        if (socketRef.current === ws) {
          connectSocket();
        }
      }, 1000);
    };
  }, [roomCode]);

  useEffect(() => {
    if (!isClient || !roomCode) return;

    connectSocket();

    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      debouncedSend.cancel();
    };
  }, [roomCode, isClient, connectSocket, debouncedSend]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      debouncedSend(socketRef.current, newContent, roomCode!);
    } else if (status === "Disconnected") {
      debouncedSend.cancel();
      connectSocket();
    }
  };

  if (!isClient) return null;

  if (!roomCode) {
    router.push("/");
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col items-center p-4 relative z-10">
        <Card className="w-full max-w-6xl bg-inherit backdrop-blur-sm bg-opacity-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <HoverCard>
              <HoverCardTrigger>
                <Button
                  className="text-lg bg-violet-400 hover:bg-violet-500 font-semibold"
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    alert("Room code copied to clipboard!");
                  }}
                >
                  {roomCode}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="py-1 px-2 w-auto bg-violet-200 text-xs">
                copy room code
              </HoverCardContent>
            </HoverCard>
            <HoverCard>
              <HoverCardTrigger>
                <Badge
                  variant={status === "Connected" ? "success" : "destructive"}
                >
                  {status}
                </Badge>
              </HoverCardTrigger>
              <HoverCardContent className="py-1 px-2 w-auto bg-green-200 text-xs">
                {status === "Connected"
                  ? "connected to the server"
                  : "not connected to the server"}
              </HoverCardContent>
            </HoverCard>
          </CardHeader>
          <CardContent>
            {error && status !== "Connected" && (
              <div className="mb-4 p-4 bg-red-500/10 text-red-500 rounded">
                {error}
              </div>
            )}
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full min-h-[85vh] p-4 rounded-lg bg-neutral-100 border border-gray-300"
              placeholder="What's on your mind?"
            />
            <div className="mt-4 flex justify-end items-center">
              <div className="flex gap-2">
                <HoverCard>
                  <HoverCardTrigger>
                    <Button
                      variant="default"
                      className="w-10 h-10 text-white bg-blue-400 hover:bg-blue-500"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Room link copied to clipboard!");
                      }}
                    >
                      <Link2></Link2>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="py-1 px-2 w-auto bg-blue-200 text-xs"
                    side="top"
                  >
                    copy link to this page
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger>
                    <Button
                      className="w-10 h-10 bg-red-500 hover:bg-red-600"
                      variant="destructive"
                      onClick={() => router.push("/")}
                    >
                      <LogOut></LogOut>
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="py-1 px-2 w-auto bg-red-200 text-xs"
                    side="top"
                  >
                    return to home
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const SkeletonMirror = () => {
  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col items-center p-4 relative z-10">
        <Card className="w-full max-w-6xl bg-inherit backdrop-blur-sm bg-opacity-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-[6.3rem] h-[2.25rem] rounded bg-violet-300" />
            </div>
            <Skeleton className="w-20 h-6 rounded bg-green-300" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full min-h-[85vh] p-4 rounded-lg bg-neutral-200 border border-gray-300" />
            <div className="mt-4 flex justify-end items-center">
              <div className="flex gap-2">
                <Skeleton className="w-10 h-10 rounded bg-blue-300" />
                <Skeleton className="w-10 h-10 rounded bg-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RoomWrapper = () => (
  <Suspense fallback={<SkeletonMirror />}>
    <Room />
  </Suspense>
);

export default RoomWrapper;
