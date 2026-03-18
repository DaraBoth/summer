"use client";
import { useState, useEffect, useCallback } from "react";
import { MenuBook, MenuItem, MenuPage, PageElement } from "@/types/menu";
import { DEFAULT_MENU } from "@/types/defaultMenu";
import { v4 as uuidv4 } from "uuid";
import localforage from "localforage";

const STORAGE_KEY = "food-menu-v3"; // Increment version for new schema
const LEGACY_STORAGE_KEY = "food-menu-v2";

const menuStorage = localforage.createInstance({
  name: "summer-menu-storage",
  storeName: "menu_book",
});

function migrateLegacyPageBackgrounds(book: MenuBook): MenuBook {
  return {
    ...book,
    pages: (book.pages || []).map((page, pageIndex) => ({
      ...page,
      elements: (page.elements || []).map((el) => {
        const oldUrl = el.imageUrl || "";
        const isLegacyBackground =
          el.type === "image" &&
          /^bg-\d+$/.test(el.id) &&
          /^\/pages\/page-\d+\.png$/i.test(oldUrl);

        if (!isLegacyBackground) {
          return el;
        }

        return {
          ...el,
          imageUrl: `/splited/Summer202026-${pageIndex + 1}.pdf`,
        };
      }),
    })),
  };
}

export function useMenuStore() {
  const [menuBook, setMenuBook] = useState<MenuBook>(DEFAULT_MENU);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStoredBook = async () => {
      try {
        const saved = await menuStorage.getItem<MenuBook>(STORAGE_KEY);
        if (saved) {
          setMenuBook(migrateLegacyPageBackgrounds(saved));
          return;
        }

        const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved) as MenuBook;
          const migrated = migrateLegacyPageBackgrounds(parsed);
          setMenuBook(migrated);
          await menuStorage.setItem(STORAGE_KEY, migrated);
        }
      } catch (e) {
        console.error("Failed to load menu", e);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadStoredBook();
  }, []);

  const save = useCallback((book: MenuBook) => {
    setMenuBook(book);
    void menuStorage.setItem(STORAGE_KEY, book).catch((e) => {
      console.error("Failed to save menu", e);
    });
  }, []);

  const importPdfPagesAsMenu = useCallback(
    (imageDataUrls: string[], sourcePdfName: string) => {
      const timestamp = Date.now();
      const pages: MenuPage[] = imageDataUrls.map((imageUrl, index) => ({
        id: `pdf-page-${timestamp}-${index + 1}`,
        type: "content",
        title: `Page ${index + 1}`,
        titleKh: "",
        elements: [
          {
            id: `bg-${timestamp}-${index + 1}`,
            type: "image",
            position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
            imageUrl,
          },
        ],
      }));

      save({
        ...menuBook,
        pages,
        sourcePdf: {
          name: sourcePdfName,
          importedAt: new Date().toISOString(),
          pageCount: imageDataUrls.length,
        },
      });
    },
    [menuBook, save]
  );

  // --- RESTAURANT INFO ---
  const updateRestaurantInfo = useCallback(
    (name: string, nameKh: string, tagline: string) => {
      save({
        ...menuBook,
        restaurantName: name,
        restaurantNameKh: nameKh,
        tagline,
      });
    },
    [menuBook, save]
  );

  // --- INVENTORY MANAGEMENT ---
  const addItemToInventory = useCallback(
    (item: Omit<MenuItem, "id">) => {
      const newItem: MenuItem = { ...item, id: uuidv4() };
      save({
        ...menuBook,
        inventory: [...(menuBook.inventory || []), newItem],
      });
      return newItem.id;
    },
    [menuBook, save]
  );

  const updateInventoryItem = useCallback(
    (itemId: string, updates: Partial<MenuItem>) => {
      save({
        ...menuBook,
        inventory: (menuBook.inventory || []).map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      });
    },
    [menuBook, save]
  );

  const deleteFromInventory = useCallback(
    (itemId: string) => {
      save({
        ...menuBook,
        inventory: (menuBook.inventory || []).filter((item) => item.id !== itemId),
        // Also remove any elements referencing this item
        pages: menuBook.pages.map(page => ({
          ...page,
          elements: page.elements.filter(el => el.itemId !== itemId)
        }))
      });
    },
    [menuBook, save]
  );

  // --- PAGE ELEMENT MANAGEMENT ---
  const addElementToPage = useCallback(
    (pageId: string, element: Omit<PageElement, "id">) => {
      const newEl: PageElement = { ...element, id: uuidv4() };
      save({
        ...menuBook,
        pages: menuBook.pages.map((page) =>
          page.id === pageId
            ? { ...page, elements: [...page.elements, newEl] }
            : page
        ),
      });
      return newEl.id;
    },
    [menuBook, save]
  );

  const updateElement = useCallback(
    (pageId: string, elementId: string, updates: Partial<PageElement>) => {
      save({
        ...menuBook,
        pages: menuBook.pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                elements: page.elements.map((el) =>
                  el.id === elementId ? { ...el, ...updates, position: { ...el.position, ...updates.position } } : el
                ),
              }
            : page
        ),
      });
    },
    [menuBook, save]
  );

  const deleteElement = useCallback(
    (pageId: string, elementId: string) => {
      save({
        ...menuBook,
        pages: menuBook.pages.map((page) =>
          page.id === pageId
            ? { ...page, elements: page.elements.filter((el) => el.id !== elementId) }
            : page
        ),
      });
    },
    [menuBook, save]
  );

  // --- PAGE MANAGEMENT ---
  const addPage = useCallback(
    (title: string, titleKh?: string) => {
      const newPage: MenuPage = {
        id: uuidv4(),
        type: "content",
        title,
        titleKh,
        elements: [],
      };
      // Insert before back-cover if exists
      const backIdx = menuBook.pages.findIndex((p) => p.type === "back-cover");
      const newPages = [...menuBook.pages];
      if (backIdx >= 0) {
        newPages.splice(backIdx, 0, newPage);
      } else {
        newPages.push(newPage);
      }
      save({ ...menuBook, pages: newPages });
    },
    [menuBook, save]
  );

  const deletePage = useCallback(
    (pageId: string) => {
      save({
        ...menuBook,
        pages: menuBook.pages.filter((p) => p.id !== pageId),
      });
    },
    [menuBook, save]
  );

  const reorderPages = useCallback(
    (startIndex: number, endIndex: number) => {
      const result = Array.from(menuBook.pages);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      save({ ...menuBook, pages: result });
    },
    [menuBook, save]
  );

  const resetToDefault = useCallback(() => {
    save(DEFAULT_MENU);
  }, [save]);

  return {
    menuBook,
    isLoaded,
    updateRestaurantInfo,
    addItemToInventory,
    updateInventoryItem,
    deleteFromInventory,
    addElementToPage,
    updateElement,
    deleteElement,
    addPage,
    deletePage,
    reorderPages,
    resetToDefault,
    importPdfPagesAsMenu,
  };
}
