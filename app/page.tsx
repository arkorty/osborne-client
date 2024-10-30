"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
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
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <BackgroundBeams className="absolute inset-0 w-full h-full z-0" />
      <Card className="relative z-10 max-w-md backdrop-blur-sm shadow-lg bg-white/0 bg-opacity-0 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center">
        <Card className="relative z-10 w-[172px] h-[172px] backdrop-blur-md shadow-lg bg-white/70 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <svg
              className="w-16 h-16 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="2" width="18" height="20" rx="2" ry="2" />
              <rect x="10" y="12" width="4" height="8" />
              <line x1="10" y1="2" x2="10" y2="12" />
            </svg>
            <span className="text-4xl font-bold text-center text-gray-800 dark:text-white">
              Room
            </span>
          </div>
        </Card>
        <CardContent className="mt-4 flex flex-col items-center space-y-4">
          <Button
            onClick={createNewRoom}
            variant="default"
            className="w-full bg-blue-600 text-white py-3 text-lg font-semibold rounded-lg hover:bg-blue-700"
          >
            Create New Room
          </Button>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={newRoomCode}
              onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter Room Code"
              maxLength={6}
              className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg"
            />
            <Button
              onClick={joinRoom}
              variant="default"
              className="bg-green-500 text-white py-3 px-5 text-lg font-semibold rounded-lg hover:bg-green-600"
            >
              Join
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
