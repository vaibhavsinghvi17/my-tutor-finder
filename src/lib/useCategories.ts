import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES as PRESET } from "@/lib/types";

export interface RemoteCategory {
  id: string;
  name: string;
  slug: string;
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

let cache: RemoteCategory[] | null = null;
const subscribers = new Set<(c: RemoteCategory[]) => void>();

async function loadOnce() {
  if (cache) return cache;
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("status", "approved")
    .order("name");
  if (error) {
    console.warn("categories load failed", error);
    cache = PRESET.map((n) => ({ id: n, name: n, slug: slugify(n) }));
  } else {
    cache = data ?? [];
  }
  subscribers.forEach((fn) => fn(cache!));
  return cache;
}

export function useCategories() {
  const [list, setList] = useState<RemoteCategory[]>(cache ?? []);

  useEffect(() => {
    subscribers.add(setList);
    loadOnce().then(setList);
    return () => { subscribers.delete(setList); };
  }, []);

  const addCategory = useCallback(async (name: string, byName?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const slug = slugify(trimmed);
    if (!slug) return null;
    const existing = (cache ?? []).find((c) => c.slug === slug);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("categories")
      .insert({ name: trimmed, slug, created_by_name: byName ?? null })
      .select("id, name, slug")
      .single();
    if (error) {
      console.warn("addCategory failed", error);
      return null;
    }
    cache = [...(cache ?? []), data].sort((a, b) => a.name.localeCompare(b.name));
    subscribers.forEach((fn) => fn(cache!));
    return data as RemoteCategory;
  }, []);

  const names = list.map((c) => c.name);
  return { categories: list, names, addCategory };
}
