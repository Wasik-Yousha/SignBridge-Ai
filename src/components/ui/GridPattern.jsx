import { motion, useMotionValue, useMotionTemplate, useAnimationFrame } from 'framer-motion';

/**
 * GridPattern - Animated infinite-scrolling grid pattern with mouse-reveal effect.
 */

const Grid = ({ offsetX, offsetY, id = 'grid-pattern' }) => (
  <svg className="w-full h-full">
    <defs>
      <MotionPattern
        id={id}
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
        x={offsetX}
        y={offsetY}
      >
        <path
          d="M 40 0 L 0 0 0 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-400"
        />
      </MotionPattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>
);

const MotionPattern = motion.pattern;
const MotionDiv = motion.div;

const GridPattern = ({ children }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.5) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.5) % 40);
  });

  const handleMouseMove = (e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div onMouseMove={handleMouseMove} className="relative w-full min-h-screen overflow-hidden bg-[#F0EFEA]">
      {/* Background grid — subtle */}
      <div className="absolute inset-0 z-0 opacity-[0.06]">
        <Grid offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-bg" />
      </div>

      {/* Mouse-reveal grid — brighter */}
      <MotionDiv
        className="absolute inset-0 z-0 opacity-40"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <Grid offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-reveal" />
      </MotionDiv>

      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-[#2a7e75]/25 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-[#236b63]/20 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-[#2a7e75]/20 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GridPattern;
