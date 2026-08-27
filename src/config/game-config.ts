export const GAME_CONFIG = Object.freeze({
  renderer: { pixelRatioCap: 1.5, antialias: true, clearColor: 0xb8dca8 },
  timing: { maxDeltaSeconds: 0.05 },
  camera: {
    fov: 40, near: 0.01, far: 60,
    overviewOffset: [0, 2.65, 8.15] as const,
    closeOffset: [0, 1.9, 5.7] as const,
    overviewFollowFactor: 0.35,
    lookAtHeight: 0.85, yawLimit: 0.55, pitchLimit: 0.22,
    swipeSensitivityX: 0.0055, swipeSensitivityY: 0.0035,
    returnDelaySeconds: 2.6, returnDamping: 0.7, followDamping: 4.5,
    modeTransitionDamping: 2.2,
  },
  movement: {
    halfWidth: 2.35, halfDepth: 1.45, speed: 0.38, arrivalDistance: 0.08,
    turnSpeed: 1.25, idleMinSeconds: 4.5, idleMaxSeconds: 9.5,
    resumeAfterInteractionSeconds: 2.5,
  },
  floating: {
    targetHeight: 1.6, baseAltitude: 0.78, amplitude: 0.08,
    frequencyMin: 0.72, frequencyMax: 0.95, swayAmplitude: 0.025,
    swayFrequency: 0.43, rotationSpeed: 0.035,
  },
  pulse: { minInterval: 5.5, maxInterval: 10.5, duration: 1.4, amount: 0.035 },
  glow: { minInterval: 7, maxInterval: 14, duration: 1.2, maxIntensity: 0.38 },
  spin: {
    minInterval: 6, maxInterval: 12,
    durationMin: 0.68, durationMax: 0.9,
    verticalChance: 0.5,
  },
  reaction: { tapDuration: 1.15, petDuration: 1.35, pickupReleaseDuration: 0.8, bounceHeight: 0.16 },
  gesture: {
    tapMaxDistancePx: 12, petStartDistancePx: 18, pickupHoldMs: 430,
    pickupDragStartDistancePx: 8, cameraStartDistancePx: 8,
  },
  care: {
    statusPerMinute: { hunger: 4.2, sleepiness: 2.8, boredom: 4.8, mood: -1.2, stress: 0.45, health: -0.15 },
    requestMinSeconds: 18, requestMaxSeconds: 32, requestNeedThreshold: 48,
    saveIntervalSeconds: 5,
  },
  evolution: {
    stage2CareCount: 3, durationSeconds: 3.2, scale: 1.08,
    calmWeights: { calm: 1, affection: 0.8, healthy: 0.5, playBook: 0.5, careSuccess: 0.1 },
    activeWeights: { active: 1, playBall: 0.5, playRattle: 0.25, careDelay: 1.2, stress: 0.5, meat: 0.25 },
  },
  save: { key: 'sagechi.phase12.save', schemaVersion: 4 },
  debug: { enabledByDefault: false },
});
export type GameConfig = typeof GAME_CONFIG;
