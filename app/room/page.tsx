"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import debounce from "lodash/debounce";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { BackgroundBeams } from "../../components/ui/background-beams";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
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
    [],
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
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="flex flex-col items-center p-4 relative z-10">
        <Card className="w-full max-w-4xl bg-inherit backdrop-blur-sm bg-opacity-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <Button
              className="text-lg bg-violet-400 hover:bg-violet-500 font-semibold"
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                alert("Room code copied to clipboard!");
              }}
            >
              {roomCode}
            </Button>
            <Badge variant={status === "Connected" ? "success" : "destructive"}>
              {status}
            </Badge>
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
              className="w-full min-h-[80vh] p-4 rounded-lg bg-neutral-100 border border-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start typing here..."
            />
            <div className="mt-4 flex justify-end items-center">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="font-semibold text-white bg-blue-400 hover:bg-blue-500"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Room link copied to clipboard!");
                  }}
                >
                  Copy Link
                </Button>
                <Button
                  className="font-semibold bg-red-500 hover:bg-red-600"
                  variant="destructive"
                  onClick={() => router.push("/")}
                >
                  Leave
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RoomWrapper = () => (
  <Suspense fallback={<div>Connecting to the room...</div>}>
    <Room />
  </Suspense>
);

export default RoomWrapper;
