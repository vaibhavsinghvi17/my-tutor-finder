import { Link } from "react-router-dom";
import { Apple, Play } from "lucide-react";

const PLAY_STORE_URL = "#";
const APP_STORE_URL = "#";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-8">
      <div className="container py-8 flex flex-col items-center gap-5">
        <div className="hidden lg:block text-center">
          <h3 className="text-lg font-semibold">Scholarr on the go 🎓</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Take your classes anywhere — download the app for the best experience.
          </p>
        </div>
        <div className="hidden lg:flex flex-col sm:flex-row items-center gap-3">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-foreground text-background px-5 py-2.5 hover:opacity-90 transition"
          >
            <Play className="h-6 w-6 fill-current" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[10px] uppercase opacity-80">Get it on</span>
              <span className="text-sm font-semibold">Google Play</span>
            </div>
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-foreground text-background px-5 py-2.5 hover:opacity-90 transition"
          >
            <Apple className="h-6 w-6 fill-current" />
            <div className="flex flex-col leading-tight text-left">
              <span className="text-[10px] uppercase opacity-80">Download on the</span>
              <span className="text-sm font-semibold">App Store</span>
            </div>
          </a>
        </div>
        <div className="w-full pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Scholarr. All rights reserved.</div>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/discover" className="hover:text-foreground">Discover</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
