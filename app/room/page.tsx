"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link2, LogOut, Sun, Moon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import debounce from "lodash/debounce";
import dotenv from "dotenv";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider, useTheme } from "next-themes";

dotenv.config();

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

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

  const debouncedSend = useCallback(
    debounce((ws: WebSocket, content: string, code: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        const message: TextUpdate = {
          type: "text-update",
          content,
          code,
        };
        ws.send(JSON.stringify(message));
      }
    }, 100),
    []
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

  const { setTheme, resolvedTheme } = useTheme();

  if (!isClient) return null;

  if (!roomCode) {
    router.push("/");
    return null;
  }

  return (
    <div className="relative min-h-screen bg-[#fbf1c7] dark:bg-[#282828]">
      <div className="flex justify-center">
        <div className="flex flex-col items-center p-1 relative z-10 w-full min-h-screen max-w-5xl bg-[#ebdbb2] dark:bg-[#282828] shadow-md">
          <div className="flex flex-row items-center justify-between p-2 w-full">
            <div className="flex gap-2">
              <HoverCard>
                <HoverCardTrigger>
                  <Button
                    className="text-sm bg-[#d3869b] hover:bg-[#d65d0e] font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(roomCode);
                      alert("Room code copied to clipboard!");
                    }}
                  >
                    {roomCode}
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto bg-[#fabd2f] text-xs">
                  copy room code
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                <HoverCardTrigger>
                  <Button
                    variant="default"
                    className="text-white bg-[#458588] w-10 hover:bg-[#83a598] p-1"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Room link copied to clipboard!");
                    }}
                  >
                    <Link2 size={16} className="text-[#fbf1c7]" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto bg-[#fabd2f] text-xs">
                  copy link to this page
                </HoverCardContent>
              </HoverCard>
              <HoverCard>
                <HoverCardTrigger>
                  <Button
                    className="bg-[#cc241d] w-10 hover:bg-[#fb4934] p-1"
                    variant="destructive"
                    onClick={() => router.push("/")}
                  >
                    <LogOut size={16} className="text-[#fbf1c7]" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto bg-[#fabd2f] text-xs">
                  return to home
                </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex gap-2">
              <Button
                className="text-sm bg-[#d5c4a1] dark:bg-[#665c54] hover:bg-[#bdae93] dark:hover:bg-[#504945] font-medium"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {resolvedTheme === "dark" ? (
                  <Sun size={16} className="text-[#fbf1c7]" />
                ) : (
                  <Moon size={16} className="text-[#282828]" />
                )}
              </Button>
              <HoverCard>
                <HoverCardTrigger>
                  <Badge
                    variant={status === "Connected" ? "success" : "destructive"}
                    className={`text-xs ${
                      status === "Connected"
                        ? "bg-[#b8bb26] dark:bg-[#98971a]"
                        : "bg-[#fb4934] dark:bg-[#cc241d]"
                    }`}
                  >
                    {status}
                  </Badge>
                </HoverCardTrigger>
                <HoverCardContent className="py-1 px-2 w-auto bg-[#b8bb26] dark:bg-[#98971a] text-xs">
                  {status === "Connected"
                    ? "connected to the server"
                    : "not connected to the server"}
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
          <div className="flex-grow flex flex-col p-2 w-full">
            {error && status !== "Connected" && (
              <div className="mb-2 p-2 bg-[#fb4934]/10 text-[#cc241d] rounded text-sm">
                {error}
              </div>
            )}
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-grow w-full p-2 rounded-md bg-[#ebdbb2] dark:bg-[#3c3836] border border-[#665c54] dark:border-[#665c54] resize-none font-jetbrains-mono text-sm text-[#3c3836] dark:text-[#ebdbb2]"
              placeholder="What's on your mind?"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonMirror = () => {
  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col items-center p-4 relative z-10">
        <div className="w-full max-w-6xl bg-inherit backdrop-blur-sm bg-opacity-0">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-[6.3rem] h-[2.25rem] rounded bg-violet-300" />
            </div>
            <Skeleton className="w-20 h-6 rounded bg-green-300" />
          </div>
          <div>
            <Skeleton className="w-full min-h-[80vh] p-4 rounded-lg bg-neutral-200 border border-gray-300" />
            <div className="mt-4 flex justify-end items-center">
              <div className="flex gap-2">
                <Skeleton className="w-10 h-10 rounded bg-blue-300" />
                <Skeleton className="w-10 h-10 rounded bg-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomWrapper = () => (
  <ThemeProvider attribute="class" defaultTheme="dark">
    <Suspense fallback={<SkeletonMirror />}>
      <div className={`${jetbrainsMono.variable} font-sans`}>
        <Room />
      </div>
    </Suspense>
  </ThemeProvider>
);

export default RoomWrapper;
