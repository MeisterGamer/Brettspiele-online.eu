import confetti from 'canvas-confetti';

/**
 * High-compatibility Confetti launcher.
 * Explicitly disables background blob Web Workers (useWorker: false).
 * This completely avoids Content-Security-Policy violations on "script-src 'self'"
 * while rendering fluid, gorgeous particle confetti on the primary canvas.
 */
let customConfettiInstance: ((options?: confetti.Options) => Promise<null> | null) | null = null;

try {
  customConfettiInstance = confetti.create(undefined, {
    resize: true,
    useWorker: false, // Prevents "Creating a worker from 'blob:...' violates CSP"
    disableForReducedMotion: true,
  });
} catch (err) {
  console.warn('[Confetti] Falling back to default canvas confetti:', err);
}

export const triggerConfetti = (options?: confetti.Options): void => {
  try {
    if (customConfettiInstance) {
      customConfettiInstance(options);
    } else {
      confetti({
        ...options,
        disableForReducedMotion: true,
      });
    }
  } catch (err) {
    console.debug('[Confetti] Particle trigger suppressed safely:', err);
  }
};

export default triggerConfetti;
