import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface SocialButtonProps {
  icon: any;
  label: string;
  username?: string;
  href: string;
  color?: string;
  delay?: number;
}

const SocialButton = memo(({ icon: Icon, label, username, href, color = "bg-white", delay = 0 }: SocialButtonProps) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const { playClick, playHover } = useSoundEffects();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playClick();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples([...ripples, { x, y, id }]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1000);
  };

  // Extract the color name (e.g., "emerald-500") from "bg-emerald-500" to use for other utilities if needed
  // For simplicity, we'll use the passed bg class for backgrounds and assume we can use it for borders/text via group-hover
  
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      onMouseEnter={playHover}
      whileHover={{ 
        scale: 1.02, 
        rotateX: 2, 
        rotateY: -2,
        z: 20
      }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative group flex items-center p-4 mb-4
        border border-cyan-500/30
        shadow-[0_0_20px_rgba(0,0,0,0.8)]
        hover:border-cyan-400
        hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]
        transition-all duration-200 ease-out
        w-full max-w-md mx-auto
        overflow-hidden
        bg-slate-950/90
        glitch-hover
      `}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
        clipPath: "polygon(0 0, 100% 0, 100% 70%, 95% 100%, 0 100%)", // Tech-cut corner
      }}
    >
      {/* Scanning Line Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-1/2 w-full -translate-y-full group-hover:translate-y-[200%] transition-transform duration-1000 ease-in-out" />

      {/* Side Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 group-hover:bg-cyan-400 transition-colors" />

      {/* Floating Content Wrapper */}
      <div className="flex items-center w-full relative z-10">
        {/* Icon Container - "Module" */}
        <div className={`
          flex-shrink-0 w-14 h-14 flex items-center justify-center
          ${color} bg-opacity-10
          text-white
          mr-5
          group-hover:scale-105 transition-all duration-300
          relative
          border border-white/10
          clip-path-polygon-[0%_0%,100%_0%,100%_100%,20%_100%,0%_80%]
        `}
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 25% 100%, 0 75%)"
        }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <Icon size={28} strokeWidth={1.5} className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        </div>

        {/* Text Content */}
        <div className="flex-grow text-left">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-bold text-lg text-white tracking-[0.2em] uppercase group-hover:text-cyan-300 transition-colors">
              {label}
            </h3>
            <span className="font-mono text-[8px] text-cyan-500/50 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
              [ ACCESS_GRANTED ]
            </span>
          </div>
          {username && (
            <p className="font-mono text-[11px] text-slate-400 group-hover:text-cyan-200 transition-colors tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-500/40 rounded-full animate-pulse" />
              {username}
            </p>
          )}
        </div>
      </div>

      {/* Decorative HUD Corners (Inside Button) */}
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Ripple Effect */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </AnimatePresence>
    </motion.a>
  );
});

export default SocialButton;
