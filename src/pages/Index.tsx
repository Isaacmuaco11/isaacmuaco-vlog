import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoFeed from "@/components/VideoFeed";
import PhotoSlider from "@/components/PhotoSlider";
import Sidebar from "@/components/Sidebar";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <main>
        {/* Video Feed - Full Screen YouTube Shorts Style */}
        <VideoFeed />
      </main>

      {/* Photo Slider - Below videos */}
      <section className="bg-zinc-900 py-8">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-white text-lg font-bold mb-4 text-center">Fotos</h2>
          <PhotoSlider />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
