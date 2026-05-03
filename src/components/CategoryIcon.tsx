import { Category } from "@/lib/types";
import {
  Brush, Code2, Dumbbell, GraduationCap, Languages, Music, Sparkles, Flower2, PartyPopper,
} from "lucide-react";

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const map: Record<Category, React.ComponentType<{ className?: string }>> = {
    Academics: GraduationCap,
    Music,
    Dance: PartyPopper,
    Sports: Dumbbell,
    Art: Brush,
    Coding: Code2,
    Yoga: Flower2,
    Languages,
    Other: Sparkles,
  };
  const Icon = map[category] ?? Sparkles;
  return <Icon className={className} />;
}

export function categoryGradient(category: Category): string {
  switch (category) {
    case "Music": return "bg-gradient-warm";
    case "Dance": return "bg-gradient-warm";
    case "Coding": return "bg-gradient-cool";
    case "Languages": return "bg-gradient-cool";
    case "Sports": return "bg-gradient-cool";
    case "Yoga": return "bg-gradient-primary";
    case "Art": return "bg-gradient-warm";
    case "Academics": return "bg-gradient-primary";
    default: return "bg-gradient-primary";
  }
}
