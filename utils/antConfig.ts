import { LetterData } from './gameConfig';

export const ANT_LETTERS: LetterData[] = [
  { char: 'A', index: 0 },
  { char: 'N', index: 1 },
  { char: 'T', index: 2 },
];

export const ANT_IMAGES = {
  ant:            require('../assets/vocabulary/2ant/ant_1.webp'),
  antCarrySugar:  require('../assets/vocabulary/2ant/ant_carry_sugar.webp'),
  sugar:          require('../assets/vocabulary/2ant/sugar.webp'),
  sugarBreak1:    require('../assets/vocabulary/2ant/sugar_break1.webp'),
  sugarBreak2:    require('../assets/vocabulary/2ant/sugar_break2.webp'),
  // sprite frames for sugar cracking animation
  sprite1:        require('../assets/vocabulary/2ant/sprite_ant1.webp'),
  sprite2:        require('../assets/vocabulary/2ant/sprite_ant2.webp'),
  sprite3:        require('../assets/vocabulary/2ant/sprite_ant3.webp'),
  sprite4:        require('../assets/vocabulary/2ant/sprite_ant4.webp'),
  bg:             require('../assets/vocabulary/2ant/bg_ant.jpg'),
};
