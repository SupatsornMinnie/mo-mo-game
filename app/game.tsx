import React from "react";
import { useLocalSearchParams } from "expo-router";
import GameScreen, { type GameConfig } from "../components/game/GameScreen";
import AppleDrop from "../components/game/AppleDrop";
import WormCharacter from "../components/game/WormCharacter";
import { APPLE_LETTERS, GAME_IMAGES } from "../utils/gameConfig";

export default function AppleGameScreen() {
  const { word, id } = useLocalSearchParams<{ word: string; id: string }>();

  const config: GameConfig = {
    id: id ? parseInt(id, 10) : 1,
    word: word || "Apple",
    letters: APPLE_LETTERS,
    bgImage: GAME_IMAGES.bg,

    renderIntro: (props) => (
      <AppleDrop
        sw={props.sw}
        sh={props.sh}
        scatterPositions={props.scatterPositions}
        onIntroComplete={props.onIntroComplete}
        onWormPosition={props.onThiefPosition}
        onAppleRotation={props.onPieceRotation}
      />
    ),

    returnPiece: {
      pieceImage: GAME_IMAGES.appleBitten,
      completedImage: GAME_IMAGES.apple,
      thiefImage: GAME_IMAGES.worm,
      thiefSize: 80,
      thiefAutoNavigates: true,
    },

    renderThief: (props) => (
      <WormCharacter
        key={props.retryKey}
        sw={props.sw}
        sh={props.sh}
        initialX={props.initialX}
        initialY={props.initialY}
        appleTargetX={props.pieceTargetX}
        appleTargetY={props.pieceTargetY}
        appleSize={props.pieceSize}
        appleRotation={props.pieceRotation}
        onReturnApple={props.onReturnPiece}
        isActive={props.isActive}
      />
    ),

    celebrationImage: GAME_IMAGES.apple,
    celebrationLetterKeys: ["A", "P", "P2", "L", "E"],
  };

  return <GameScreen config={config} />;
}
