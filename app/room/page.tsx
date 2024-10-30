"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import debounce from "lodash/debounce";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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

const WS_URL = `ws://localhost:8080`;

const Room = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code");

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const [error, setError] = useState("");

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
    if (!roomCode) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setStatus("Connected");
      const message: JoinRoom = {
        type: "join-room",
        code: roomCode,
      };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      switch (message.type) {
        case "initial-content":
          setContent(message.content);
          break;
        case "text-update":
          setContent(message.content);
          break;
        default:
          console.error("Unknown message type:", message.type);
      }
    };

    ws.onclose = () => {
      setStatus("Disconnected");
      setSocket(null);
    };

    ws.onerror = (error) => {
      setError("WebSocket error: " + error.message);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomCode]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (socket?.readyState === WebSocket.OPEN) {
      debouncedSend(socket, newContent, roomCode!);
    }
  };

  if (!roomCode) {
    return null; // Handle case where roomCode is not defined
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
                  variant="primary"
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

export default Room;
