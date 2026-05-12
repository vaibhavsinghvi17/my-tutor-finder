import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-8">
      <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} LearnLocal. All rights reserved.</div>
        <nav className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/discover" className="hover:text-foreground">Discover</Link>
        </nav>
      </div>
    </footer>
  );
}
