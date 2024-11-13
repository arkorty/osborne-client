"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const Home = () => {
  const router = useRouter();
  const [newRoomCode, setNewRoomCode] = useState("");

  useEffect(() => {
    const joinRoom = () => {
      if (newRoomCode) {
        router.push(`/room?code=${newRoomCode.toUpperCase()}`);
      }
    };

    if (newRoomCode.length === 6) {
      joinRoom();
    }
  }, [newRoomCode, router]);

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
      <Card className="relative z-10 max-w-md backdrop-blur-sm shadow-lg bg-white/0 bg-opacity-0 dark:bg-gray-800/70 border border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <div className={`rounded-2xl m-8 bg-black`}>
            <Image
              src="/logo.png"
              alt="Room Logo"
              width={128}
              height={128}
              className={`m-2`}
            ></Image>
          </div>
        </div>
        <CardContent className="flex flex-col items-center space-y-4">
          <InputOTP
            value={newRoomCode}
            onChange={(value) => setNewRoomCode(value.toUpperCase())}
            maxLength={6}
            pattern="[A-Z0-9]*"
            inputMode="text"
          >
            <InputOTPGroup>
              {[...Array(6)].map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="text-primary bg-white dark:text-secondary dark:caret-white"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <span className="text-lg text-primary/70">or</span>
          <Button
            onClick={createNewRoom}
            variant="default"
            className="w-min bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700"
          >
            Create Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
