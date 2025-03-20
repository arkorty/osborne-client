"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ThemeProvider } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="relative min-h-screen flex items-center justify-center bg-[#fbf1c7] dark:bg-[#282828]">
      <Card className="relative z-10 max-w-md backdrop-blur-sm shadow-lg bg-[#ebdbb2]/0 bg-opacity-0 dark:bg-[#282828]/70 border border-[#665c54] dark:border-[#665c54] rounded-2xl p-6 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <div className={`rounded-2xl m-8 bg-black`}>
            <Image
              src="/logo.png"
              alt="Room Logo"
              width={128}
              height={128}
              className="rounded-2xl"
            ></Image>
          </div>
        </div>
        <CardContent className="flex flex-col items-center space-y-4 font-jetbrains-mono">
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
                  className="text-[#3c3836] bg-[#fbf1c7] dark:text-[#ebdbb2] dark:bg-[#3c3836] dark:caret-[#ebdbb2]"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <span className="text-lg text-[#3c3836]/70 dark:text-[#ebdbb2]/70">
            or
          </span>
          <Button
            onClick={createNewRoom}
            variant="default"
            className="w-min bg-[#458588] text-[#fbf1c7] text-lg font-semibold rounded-lg hover:bg-[#83a598]"
          >
            Create Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const SkeletonHome = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#fbf1c7] dark:bg-[#282828]">
      <div className="relative z-10 max-w-md backdrop-blur-sm shadow-lg bg-[#ebdbb2]/0 bg-opacity-0 dark:bg-[#282828]/70 border border-[#665c54] dark:border-[#665c54] rounded-2xl p-6 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <Skeleton className="w-[128px] h-[128px] rounded-2xl bg-black m-8" />
        </div>
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-full h-12 rounded-md bg-[#fbf1c7] dark:bg-[#3c3836]" />
          <span className="text-lg text-[#3c3836]/70 dark:text-[#ebdbb2]/70">
            or
          </span>
          <Skeleton className="w-32 h-12 rounded-lg bg-[#458588]" />
        </div>
      </div>
    </div>
  );
};

const HomeWrapper = () => (
  <ThemeProvider attribute="class" defaultTheme="dark">
    <Suspense fallback={<SkeletonHome />}>
      <Home />
    </Suspense>
  </ThemeProvider>
);

export default HomeWrapper;
