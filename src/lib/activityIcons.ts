/*
  Expliciete icoonlijst voor namen die uit de databank komen.

  Niet vervangen door `import * as LucideIcons from 'lucide-react'`: een
  namespace-import schakelt tree-shaking uit, waardoor alle ~4500 exports van
  lucide-react in de bundel belanden (707 kB) in plaats van de ~90 iconen die
  we echt aanbieden. De lookup is daardoor ook gesloten: een onbekende naam
  geeft null en de aanroeper toont zijn eigen fallback, in plaats van stil niets.

  Nieuw icoon nodig? Voeg het hier toe én aan de keuzelijst die het aanbiedt
  (TEMPLATE_ICONS in HoekenTemplateBuilder, COMMON_ICONS in RoutinesManager).
*/
import type { LucideIcon } from 'lucide-react';
import {
  Activity, Apple, Backpack, Baby, Bell, Bike, Blocks, Book, BookOpen, Brain,
  Brush, Bug, Building, Building2, Calculator, Calendar, Camera, Cherry, Circle,
  Clock, Cloud, CloudRain, Compass, Dices, Drama, Dumbbell, Feather, Fish,
  FlaskConical, Flower2, Gamepad2, Globe, Grid3x3, Hammer, Handshake, Hash,
  Heart, Home, Image, Laptop, Layers, LayoutGrid, Leaf, Lightbulb, Map, MapPin,
  Medal, MessageCircle, MessageSquare, Microscope, Mic, Moon, Music, PaintBucket,
  Paintbrush, Palette, Pencil, Puzzle, Rabbit, Rainbow, Ruler, Scissors, Shapes,
  Shield, Shirt, Smile, Sparkles, Star, Sun, Sunset, Theater, Trees, TreePine,
  Trophy, Users, Utensils, Wrench,
} from 'lucide-react';

export const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  Activity, Apple, Backpack, Baby, Bell, Bike, Blocks, Book, BookOpen, Brain,
  Brush, Bug, Building, Building2, Calculator, Calendar, Camera, Cherry, Circle,
  Clock, Cloud, CloudRain, Compass, Dices, Drama, Dumbbell, Feather, Fish,
  FlaskConical, Flower2, Gamepad2, Globe, Grid3x3, Hammer, Handshake, Hash,
  Heart, Home, Image, Laptop, Layers, LayoutGrid, Leaf, Lightbulb, Map, MapPin,
  Medal, MessageCircle, MessageSquare, Microscope, Mic, Moon, Music, PaintBucket,
  Paintbrush, Palette, Pencil, Puzzle, Rabbit, Rainbow, Ruler, Scissors, Shapes,
  Shield, Shirt, Smile, Sparkles, Star, Sun, Sunset, Theater, Trees, TreePine,
  Trophy, Users, Utensils, Wrench,
};

/*
  Accepteert zowel 'BookOpen' (activity_options, presets, templates) als
  'book-open' (routines). Emoji en vrije tekst leveren null op; de aanroeper
  toont die dan zelf.
*/
export function getActivityIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  const direct = ACTIVITY_ICONS[name];
  if (direct) return direct;
  if (name.includes('-') || /^[a-z]/.test(name)) {
    const pascal = name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    return ACTIVITY_ICONS[pascal] ?? null;
  }
  return null;
}
