import React from "react";
import GameScreen, { type GameConfig } from "../GameScreen";
import SugarRoll from "../SugarRoll";
import AntCharacter from "../AntCharacter";
import { ANT_IMAGES, ANT_LETTERS } from "../../../utils/antConfig";
import { GAME_IMAGES } from "../../../utils/gameConfig";
import { type VocabItem } from "../../../utils/vocabConfig";

export default function AntGame({ vocab }: { vocab: VocabItem }) {
  const config: GameConfig = {
    id: vocab.id,
    word: vocab.word,
    letters: ANT_LETTERS,
    bgImage: GAME_IMAGES.bg,

    renderIntro: (props) => (
      <SugarRoll
        sw={props.sw}
        sh={props.sh}
        scatterPositions={props.scatterPositions}
        onIntroComplete={props.onIntroComplete}
        onAntPosition={props.onThiefPosition}
        onSugarRotation={props.onPieceRotation}
      />
    ),

    returnPiece: {
      pieceImage: ANT_IMAGES.sugarBreak1,
      completedImage: ANT_IMAGES.sugar,
      thiefImage: ANT_IMAGES.sugarBreak2,
      thiefSize: 100,
      thiefAutoNavigates: true,
    },

    renderThief: (props) => (
      <AntCharacter
        key={props.retryKey}
        sw={props.sw}
        sh={props.sh}
        initialX={props.initialX}
        initialY={props.initialY}
        sugarTargetX={props.pieceTargetX}
        sugarTargetY={props.pieceTargetY}
        sugarSize={props.pieceSize}
        onReturnSugar={props.onReturnPiece}
        isActive={props.isActive}
      />
    ),

    celebrationImage: ANT_IMAGES.sugar,
    celebrationLetterKeys: ["A", "N", "T"],
  };

  return <GameScreen config={config} />;
}
