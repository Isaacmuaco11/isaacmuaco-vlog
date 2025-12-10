import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface HeartAnimationProps {
  onComplete: () => void;
}

const HeartAnimation = ({ onComplete }: HeartAnimationProps) => {
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

  useEffect(() => {
    // Create multiple hearts
    const newHearts = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30, // Random horizontal offset
    }));
    setHearts(newHearts);

    // Remove after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart, index) => (
        <div
          key={heart.id}
          className="absolute left-1/2 bottom-1/2 animate-float-up"
          style={{
            transform: `translateX(${heart.x}px)`,
            animationDelay: `${index * 0.1}s`,
          }}
        >
          <Heart className="w-12 h-12 text-red-500 fill-red-500" />
        </div>
      ))}
    </div>
  );
};

export default HeartAnimation;
