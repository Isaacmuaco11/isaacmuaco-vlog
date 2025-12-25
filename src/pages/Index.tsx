import { useState } from "react";
import VideoFeed from "@/components/VideoFeed";
import Sidebar from "@/components/Sidebar";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Menu Button - Facebook Style */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <main>
        {/* Video Feed - Facebook Reels Style */}
        <VideoFeed />
      </main>
    </div>
  );
};

export default Index;