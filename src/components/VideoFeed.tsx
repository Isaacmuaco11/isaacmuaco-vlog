import { useRef, useEffect, useState } from "react";

const videos = [
  "/videos/video1.mp4",
  "/videos/video2.mp4",
  "/videos/video3.mp4",
  "/videos/video4.mp4",
  "/videos/video5.mp4",
  "/videos/video6.mp4",
];

const VideoFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play();
            const index = videoRefs.current.indexOf(video);
            if (index !== -1) setCurrentIndex(index);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="snap-y snap-mandatory h-[80vh] overflow-y-scroll scrollbar-hide"
      >
        {videos.map((src, index) => (
          <div
            key={index}
            className="snap-start h-[80vh] flex items-center justify-center bg-black"
          >
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={src}
              className="w-full h-full object-contain"
              loop
              muted
              playsInline
              controls
            />
          </div>
        ))}
      </div>
      
      {/* Video indicator */}
      <div className="flex justify-center gap-2 py-4">
        {videos.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-primary" : "bg-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoFeed;
