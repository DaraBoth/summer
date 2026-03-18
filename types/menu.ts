export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scale?: number;
  zIndex?: number;
}

export type ElementType = "text" | "image" | "item" | "ornament";

export interface PageElement {
  id: string;
  type: ElementType;
  position: Position;
  // For 'text'
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: number | string;
  textAlign?: "left" | "center" | "right";
  // For 'image' or 'item'
  itemId?: string; // Reference to a global inventory of menu items
  imageUrl?: string;
  // For 'ornament'
  ornamentType?: string;
}

export interface MenuItem {
  id: string;
  titleEn: string;
  titleKh: string;
  descriptionEn?: string;
  descriptionKh?: string;
  price: number;
  currency: "USD";
  image?: string;
  isSignature?: boolean;
  isNew?: boolean;
}

export interface MenuPage {
  id: string;
  type: "cover" | "content" | "back-cover"; // Simplified types
  title?: string; // Metadata
  titleKh?: string;
  subtitle?: string;
  elements: PageElement[];
  items?: MenuItem[]; // Legacy support for ItemsPage
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface MenuBook {
  restaurantName: string;
  restaurantNameKh: string;
  tagline?: string;
  pages: MenuPage[];
  inventory: MenuItem[]; // Global list of food items
}

export type AnimationDirection = "forward" | "backward" | "none";

export interface PageFlipState {
  currentPage: number; // 0-indexed single page
  isAnimating: boolean;
  direction: AnimationDirection;
  totalPages: number;
}
