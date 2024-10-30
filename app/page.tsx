"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { BackgroundBeams } from "../components/ui/background-beams";

const Home = () => {
  const router = useRouter();
  const [newRoomCode, setNewRoomCode] = useState("");

  const joinRoom = () => {
    if (newRoomCode) {
      router.push(`/room?code=${newRoomCode.toUpperCase()}`);
    }
  };

  const createNewRoom = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    router.push(`/room?code=${code}`);
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        <Card className="w-full max-w-md backdrop-blur-sm bg-zinc-200 border border-gray-700">
          <CardHeader>
            <CardTitle
              className="text-8xl font-bold text-center text-black"
              style={{ fontFamily: "Pacifico, cursive" }}
            >
              Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={createNewRoom}
              variant="default"
              className="w-full bg-blue-600 text-white font-bold"
            >
              Create New Room
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newRoomCode}
                onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter Room Code"
                maxLength={6}
                className="flex-1 text-black"
              />
              <Button
                onClick={joinRoom}
                variant="default"
                className="bg-green-500 text-black font-bold"
              >
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
