import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoFeed from "@/components/VideoFeed";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="px-5 md:px-20 pt-12 md:pt-20 pb-8 md:pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-[100px] font-extrabold uppercase text-center mb-6 leading-[0.9] tracking-[-2px]">
              ISAAC MUACO
            </h1>
            <p className="text-2xl md:text-3xl font-serif italic text-foreground/80 mb-8">
              Vlog
            </p>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/70 max-w-2xl mx-auto">
              Deslize para ver os meus vídeos
            </p>
          </div>
        </section>

        {/* Video Feed */}
        <section className="px-5 md:px-20 pb-8 md:pb-12">
          <div className="max-w-2xl mx-auto">
            <VideoFeed />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
