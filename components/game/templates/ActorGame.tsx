import React from "react";
import AppleGame from "./AppleGame";
import { ACTOR_LETTERS } from "../../../utils/gameConfig";
import { type VocabItem } from "../../../utils/vocabConfig";

// ใช้ template เดียวกับ AppleGame เปลี่ยนแค่ตัวอักษร APPLE → ACTOR
// (รูปภาพ/เสียง/พื้นหลัง ใช้ของ apple ไปก่อน)
export default function ActorGame({ vocab }: { vocab: VocabItem }) {
  return (
    <AppleGame
      vocab={vocab}
      letters={ACTOR_LETTERS}
      celebrationLetterKeys={["A", "C", "T", "O", "R"]}
    />
  );
}
