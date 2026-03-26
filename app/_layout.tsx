import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { preloadBubblePop } from "../utils/playBubblePop";

export default function RootLayout() {
  // โหลดเสียงคลิกไว้ล่วงหน้าตอนเปิดแอป
  useEffect(() => {
    preloadBubblePop();
  }, []);

  return (
    <>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#87CEEB" },
        }}
      />
    </>
  );
}
