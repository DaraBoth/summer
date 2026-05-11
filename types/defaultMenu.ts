import { MenuBook, MenuPage } from "./menu";

export const DEFAULT_MENU: MenuBook = {
  restaurantName: "Summer Menu",
  restaurantNameKh: "ម៉ឺនុយSummer",
  tagline: "Quality Experience & Professional Service",
  pages: Array.from({ length: 12 }, (_, i) => ({
    id: `page-${i + 1}`,
    type: "content",
    title: `Section ${i + 1}`,
    backgroundColor: "#ffffff",
    elements: [
      {
        id: `bg-${i + 1}`,
        type: "image",
        position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
        imageUrl: `/menu/menu-${i + 1}.png`,
      },
    ],
  })),
  inventory: [], // Inventory can be populated later via the designer
};
