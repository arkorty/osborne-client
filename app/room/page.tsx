"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import debounce from "lodash/debounce";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { BackgroundBeams } from "../../components/ui/background-beams";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";

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

const WS_URL = `wss://api.webark.in/textrt/api/v1`;

const Room = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code");

  const socketRef = useRef<WebSocket | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const debouncedSend = useCallback(
    debounce((ws: WebSocket, content: string, code: string) => {
      const message: TextUpdate = {
        type: "text-update",
        content,
        code,
      };
      ws.send(JSON.stringify(message));
    }, 100),
    [],
  );

  useEffect(() => {
    if (!isClient || !roomCode) return;

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("Connected");
      const message: JoinRoom = { type: "join-room", code: roomCode };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      if (
        message.type === "initial-content" ||
        message.type === "text-update"
      ) {
        setContent(message.content);
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected");
      socketRef.current = null;
    };

    ws.onerror = () => {
      setError("WebSocket error occurred");
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [roomCode, isClient]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      debouncedSend(socketRef.current, newContent, roomCode!);
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
            <CardTitle className="text-xl font-bold">{roomCode}</CardTitle>
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
              className="w-full min-h-[60vh] p-4 rounded-lg bg-white border border-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start typing here..."
            />
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-400">
                Share this room code with others: {roomCode}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="bg-blue-400 text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Room link copied to clipboard!");
                  }}
                >
                  Copy Room Link
                </Button>
                <Button variant="destructive" onClick={() => router.push("/")}>
                  Leave Room
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
  <Suspense fallback={<div>Loading...</div>}>
    <Room />
  </Suspense>
);

export default RoomWrapper;
