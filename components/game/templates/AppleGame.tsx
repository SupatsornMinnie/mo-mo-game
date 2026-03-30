import React from "react";
import GameScreen, { type GameConfig } from "../GameScreen";
import AppleDrop from "../AppleDrop";
import WormCharacter from "../WormCharacter";
import { APPLE_LETTERS, GAME_IMAGES } from "../../../utils/gameConfig";
import { type VocabItem } from "../../../utils/vocabConfig";

export default function AppleGame({ vocab }: { vocab: VocabItem }) {
  const config: GameConfig = {
    id: vocab.id,
    word: vocab.word,
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
