import React from "react";
import GameScreen, { type GameConfig } from "../GameScreen";
import SugarRoll from "../SugarRoll";
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
      pieceImage: ANT_IMAGES.sugarBreak2,
      completedImage: ANT_IMAGES.sugar,
      thiefImage: ANT_IMAGES.antCarrySugar,
      thiefSize: 100,
      thiefAutoNavigates: false,
      snapMultiplier: 3,
    },

    // Ant game: no auto-navigate thief — player drags sugar piece back to
    // the broken sugar position. The ant just runs away during intro.
    // No renderThief needed — the piece itself is the target.

    celebrationImage: ANT_IMAGES.sugar,
    celebrationLetterKeys: ["A", "N", "T"],
  };

  return <GameScreen config={config} />;
}
