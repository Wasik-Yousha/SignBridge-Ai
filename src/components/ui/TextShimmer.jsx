import { useMemo } from 'react';
import { motion } from 'framer-motion';

const MOTION_TAGS = {
  p: motion.p,
  span: motion.span,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
};

/**
 * TextShimmer – renders text with a repeating shimmer/gradient sweep.
 *
 * @param {string}  children   – the text to display
 * @param {string}  as         – wrapper element type (default "p")
 * @param {string}  className  – extra Tailwind / CSS classes
 * @param {number}  duration   – animation cycle length in seconds (default 2)
 * @param {number}  spread     – shimmer width multiplier (default 2)
 */
export function TextShimmer({
  children,
  as: Component = 'p',
  className = '',
  duration = 2,
  spread = 2,
}) {
  const MotionComponent = MOTION_TAGS[Component] || motion.p;

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={[
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text',
        'text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]',
        '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
      style={{
        '--spread': `${dynamicSpread}px`,
        backgroundImage:
          'var(--bg), linear-gradient(var(--base-color), var(--base-color))',
      }}
    >
      {children}
    </MotionComponent>
  );
}

export default TextShimmer;
