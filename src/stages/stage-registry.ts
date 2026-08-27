import { SUMMER_GARDEN_STAGE } from './garden-stage';
import { JAPANESE_ROOM_STAGE } from './japanese-room-stage';
import { KIDS_ROOM_STAGE } from './kids-room-stage';
import type { StageConfig, StageId } from './stage-types';

export const STAGES: Record<StageId, StageConfig> = {
  'summer-garden': SUMMER_GARDEN_STAGE,
  'kids-room': KIDS_ROOM_STAGE,
  'japanese-room': JAPANESE_ROOM_STAGE,
};
