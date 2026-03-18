import { MenuBook } from "@/types/menu";

export const defaultMenuBook: MenuBook = {
  restaurantName: "Le Jardin d'Or",
  restaurantNameKh: "សួនច្បារមាស",
  tagline: "Fine Dining · Since 2026",
  inventory: [
    {
      id: "item-1",
      titleEn: "Fried Rice with Seafood",
      titleKh: "បាយឆាគ្រឿងសមុទ្រ",
      price: 4.5,
      currency: "USD",
      isSignature: true,
    },
    {
      id: "item-2",
      titleEn: "Fried Rice Yangzhou",
      titleKh: "បាយឆាយ៉ាងចូវ",
      price: 4.5,
      currency: "USD",
    },
    {
       id: "item-3",
       titleEn: "Spicy Snail Salad",
       titleKh: "ញាំខ្យងហិរ",
       price: 4.90,
       currency: "USD",
       image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"
    },
    {
       id: "item-4",
       titleEn: "Wagyu Beef",
       titleKh: "សាច់គោវ៉ាក្យូ",
       price: 5.50,
       currency: "USD",
       image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=60"
    }
  ],
  pages: [
    {
      id: "page-cover",
      type: "cover",
      title: "Cover",
      elements: [
        {
          id: "el-1",
          type: "text",
          content: "Le Jardin d'Or",
          position: { x: 50, y: 40, width: 80, height: 10, rotation: 0, scale: 1 },
          fontSize: 48,
          fontWeight: "bold",
          textAlign: "center"
        },
        {
          id: "el-2",
          type: "text",
          content: "សួនច្បារមាស",
          position: { x: 50, y: 52, width: 80, height: 8, rotation: 0, scale: 1 },
          fontSize: 32,
          fontFamily: "var(--font-khmer)",
          textAlign: "center"
        }
      ]
    },
    {
      id: "page-1",
      type: "content",
      title: "Spicy lips",
      elements: [
        {
          id: "el-3",
          type: "text",
          content: "Spicy lips",
          position: { x: 30, y: 10, width: 50, height: 10 },
          fontSize: 56,
          fontWeight: "black",
          color: "var(--accent-dark)"
        },
        {
          id: "el-4",
          type: "item",
          itemId: "item-3",
          position: { x: 25, y: 35, width: 45, height: 45 },
        },
        {
          id: "el-5",
          type: "item",
          itemId: "item-4",
          position: { x: 75, y: 25, width: 35, height: 35 },
        },
        {
           id: "el-6",
           type: "text",
           content: "Order Now",
           position: { x: 80, y: 92, width: 30, height: 5 },
           fontSize: 24,
           fontWeight: "bold",
           color: "var(--accent-forest)"
        }
      ]
    },
    {
      id: "page-back",
      type: "back-cover",
      title: "Back Cover",
      elements: [
        {
          id: "el-7",
          type: "text",
          content: "Thank You",
          position: { x: 50, y: 50, width: 80, height: 10 },
          fontSize: 24,
          textAlign: "center"
        }
      ]
    }
  ]
};
