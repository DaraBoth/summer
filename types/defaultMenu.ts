import { MenuBook, MenuPage } from "./menu";

const FALLBACK_MENU_IMAGE_NUMBERS = Array.from({ length: 15 }, (_, i) => i + 1);

function buildPagesFromImageNumbers(imageNumbers: number[]): MenuPage[] {
  return imageNumbers.map((imageNumber, index) => ({
    id: `page-${index + 1}`,
    type: "content",
    title: `Section ${index + 1}`,
    backgroundColor: "#ffffff",
    elements: [
      {
        id: `bg-${index + 1}`,
        type: "image",
        position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
        imageUrl: `/menu/menu-${imageNumber}.png`,
      },
    ],
  }));
}

export function createDefaultMenu(imageNumbers: number[] = FALLBACK_MENU_IMAGE_NUMBERS): MenuBook {
  const normalizedImageNumbers = imageNumbers.length
    ? [...new Set(imageNumbers)].sort((a, b) => a - b)
    : FALLBACK_MENU_IMAGE_NUMBERS;

  return {
    restaurantName: "Summer Menu",
    restaurantNameKh: "ម៉ឺនុយSummer",
    tagline: "Quality Experience & Professional Service",
    pages: buildPagesFromImageNumbers(normalizedImageNumbers),
    inventory: [], // Inventory can be populated later via the designer
  };
}

export const DEFAULT_MENU: MenuBook = createDefaultMenu();
