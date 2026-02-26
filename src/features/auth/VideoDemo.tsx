import { Monitor, Play } from "lucide-react";
import bannerVideo from "../../assets/banner-video.mov";

/**
 * Right-side video demo panel for the auth layout.
 * Shows the banner video inside a browser-like frame.
 * Hidden on mobile (< lg).
 */
export default function VideoDemo() {
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center p-8 xl:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-linear-to-br from-teal-50 via-emerald-50/50 to-cyan-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-teal-200/30 rounded-full blur-3xl dark:bg-teal-900/20" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-emerald-200/30 rounded-full blur-3xl dark:bg-emerald-900/20" />

      {/* Video container */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Browser-like frame */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 px-4 py-1 bg-white dark:bg-gray-700 rounded-md text-xs text-slate-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600">
                <Monitor className="w-3 h-3" />
                The Gathering — Demo
              </div>
            </div>
          </div>

          {/* Video */}
          <div className="relative aspect-video bg-gray-900">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              src={bannerVideo}
            />
          </div>
        </div>

        {/* Caption */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500 dark:text-gray-400">
          <Play className="w-4 h-4 text-teal-500" />
          <span>
            Không gian làm việc ảo —{" "}
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              kết nối đội nhóm từ xa
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
