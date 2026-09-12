import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ART, type ArtId } from './manifest';

/** Frame rate of the bible: slow enough to read a pose, fast enough to feel like a game. */
const MS_PER_FRAME = 90;

/** Grace period before the safety timer gives up on `animationend`. */
const SETTLE_MS = 150;

type SpriteStyle = CSSProperties & Record<'--sprite-end', string>;

interface SpriteAnimationProps {
  /** Key of an animation sheet in the generated manifest, e.g. `anim-medal-burst`. */
  id: ArtId;
  scale?: number;
  /** Total time for one pass. Defaults to 90 ms per frame. */
  durationMs?: number;
  /** Loop for ever (the PV pulse) instead of playing once (the bursts and the gate). */
  loop?: boolean;
  /** Called when a one-shot finishes. The element removes itself at the same time. */
  onDone?: () => void;
  /** Give a label only when the animation carries meaning the text around it does not. */
  label?: string;
  className?: string;
}

/**
 * Plays a sprite sheet by stepping `background-position` — no timers per frame, no rerenders.
 *
 * With `prefers-reduced-motion` the app-wide rule in index.css collapses the duration to
 * 0.01 ms, so a one-shot resolves (and calls `onDone`) almost immediately without any flashing,
 * and a loop settles back on frame 0 because the fill mode is `none`. That is the honest
 * reduced-motion behaviour: the information arrives, the movement does not.
 *
 * A one-shot also arms a safety timer, because `animationend` never arrives in a few real
 * situations (the element is hidden before it fires, the tab is backgrounded) nor under jsdom,
 * and an animation that can be waited on for ever is an animation that can wedge a screen.
 */
export function SpriteAnimation({
  id,
  scale = 2,
  durationMs,
  loop = false,
  onDone,
  label,
  className,
}: SpriteAnimationProps) {
  const [finished, setFinished] = useState(false);
  const settled = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const asset = ART[id];
  const duration = durationMs ?? asset.frames * MS_PER_FRAME;

  const finish = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    setFinished(true);
    onDoneRef.current?.();
  }, []);

  useEffect(() => {
    if (loop) return;
    const timer = window.setTimeout(finish, duration + SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [loop, duration, finish]);

  if (finished) return null;

  const width = asset.width * scale;
  const height = asset.height * scale;
  const style: SpriteStyle = {
    width,
    height,
    backgroundImage: `url(${asset.src})`,
    backgroundSize: `${width * asset.frames}px ${height}px`,
    animationName: 'sprite-play',
    animationDuration: `${duration}ms`,
    animationTimingFunction: `steps(${asset.frames})`,
    animationIterationCount: loop ? 'infinite' : 1,
    animationFillMode: 'none',
    '--sprite-end': `-${width * asset.frames}px`,
  };

  return (
    <span
      className={['sprite-anim', className].filter(Boolean).join(' ')}
      style={style}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      onAnimationEnd={loop ? undefined : finish}
    />
  );
}
