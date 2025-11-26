import VideoFeed from "@/components/video-feed";
import Header from "@/components/header";
import FloatingSidebar from "@/components/floating-sidebar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors">
      {/* Header */}
      <Header />

      {/* Main Dashboard - Full Screen Video Feed */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-black transition-colors">
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl">
            <VideoFeed />
          </div>
        </div>
      </main>

      {/* Floating Sidebar with Controls */}
      <FloatingSidebar />
    </div>
  );
}
