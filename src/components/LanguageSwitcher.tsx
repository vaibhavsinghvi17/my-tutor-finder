import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Subset of widely-used Google Translate supported languages.
// (Google Translate supports 130+ languages; this covers the most common ones.)
const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { code: "as", label: "অসমীয়া (Assamese)" },
  { code: "ne", label: "नेपाली (Nepali)" },
  { code: "si", label: "සිංහල (Sinhala)" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "fa", label: "فارسی (Persian)" },
  { code: "tr", label: "Türkçe (Turkish)" },
  { code: "ru", label: "Русский (Russian)" },
  { code: "uk", label: "Українська (Ukrainian)" },
  { code: "fr", label: "Français (French)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "nl", label: "Nederlands (Dutch)" },
  { code: "pl", label: "Polski (Polish)" },
  { code: "sv", label: "Svenska (Swedish)" },
  { code: "no", label: "Norsk (Norwegian)" },
  { code: "da", label: "Dansk (Danish)" },
  { code: "fi", label: "Suomi (Finnish)" },
  { code: "el", label: "Ελληνικά (Greek)" },
  { code: "he", label: "עברית (Hebrew)" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)" },
  { code: "th", label: "ไทย (Thai)" },
  { code: "km", label: "ខ្មែរ (Khmer)" },
  { code: "my", label: "မြန်မာ (Burmese)" },
  { code: "zh-CN", label: "简体中文 (Chinese Simplified)" },
  { code: "zh-TW", label: "繁體中文 (Chinese Traditional)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "sw", label: "Kiswahili (Swahili)" },
  { code: "am", label: "አማርኛ (Amharic)" },
  { code: "yo", label: "Yorùbá" },
  { code: "zu", label: "isiZulu" },
  { code: "af", label: "Afrikaans" },
  { code: "ro", label: "Română (Romanian)" },
  { code: "hu", label: "Magyar (Hungarian)" },
  { code: "cs", label: "Čeština (Czech)" },
  { code: "sk", label: "Slovenčina (Slovak)" },
  { code: "bg", label: "Български (Bulgarian)" },
  { code: "sr", label: "Српски (Serbian)" },
  { code: "hr", label: "Hrvatski (Croatian)" },
  { code: "lt", label: "Lietuvių (Lithuanian)" },
  { code: "lv", label: "Latviešu (Latvian)" },
  { code: "et", label: "Eesti (Estonian)" },
  { code: "az", label: "Azərbaycan (Azerbaijani)" },
  { code: "ka", label: "ქართული (Georgian)" },
  { code: "hy", label: "Հայերեն (Armenian)" },
  { code: "uz", label: "Oʻzbek (Uzbek)" },
  { code: "kk", label: "Қазақ (Kazakh)" },
  { code: "mn", label: "Монгол (Mongolian)" },
];

const COOKIE_NAME = "googtrans";

function setCookie(value: string) {
  // Set on current host and parent domain so it survives the iframe round-trip.
  const host = window.location.hostname;
  document.cookie = `${COOKIE_NAME}=${value};path=/`;
  document.cookie = `${COOKIE_NAME}=${value};path=/;domain=${host}`;
  const parts = host.split(".");
  if (parts.length > 1) {
    const parent = "." + parts.slice(-2).join(".");
    document.cookie = `${COOKIE_NAME}=${value};path=/;domain=${parent}`;
  }
}

function getCurrentLang(): string {
  const m = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/);
  return m ? m[1] : "en";
}

let scriptLoaded = false;
function loadGoogleTranslate() {
  if (scriptLoaded) return;
  scriptLoaded = true;

  // Hidden host element for the widget.
  if (!document.getElementById("google_translate_element")) {
    const div = document.createElement("div");
    div.id = "google_translate_element";
    div.style.display = "none";
    document.body.appendChild(div);
  }

  // Hide the Google bar and prevent body offset.
  const style = document.createElement("style");
  style.innerHTML = `
    .goog-te-banner-frame, .skiptranslate iframe { display: none !important; }
    body { top: 0 !important; }
    .goog-tooltip, .goog-tooltip:hover { display: none !important; }
    .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
  `;
  document.head.appendChild(style);

  (window as any).googleTranslateElementInit = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (g?.translate?.TranslateElement) {
      new g.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    }
  };

  const s = document.createElement("script");
  s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.body.appendChild(s);
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    loadGoogleTranslate();
    setLang(getCurrentLang());
  }, []);

  function handleChange(code: string) {
    setLang(code);
    if (code === "en") {
      // Clear cookie to restore original.
      setCookie("/en/en");
    } else {
      setCookie(`/en/${code}`);
    }
    // Reload so the widget picks up the new cookie cleanly.
    window.location.reload();
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-1.5"}>
      {!compact && (
        <Label className="flex items-center gap-1.5 text-xs">
          <Globe className="h-3.5 w-3.5" /> App language
        </Label>
      )}
      {compact && <Globe className="h-4 w-4 text-muted-foreground shrink-0" />}
      <Select value={lang} onValueChange={handleChange}>
        <SelectTrigger className={compact ? "h-8 text-xs w-[160px]" : "h-9 text-sm"}>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code} className="text-sm">
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <p className="text-[10px] text-muted-foreground">
          Powered by Google Translate. Switching reloads the page.
        </p>
      )}
    </div>
  );
}
