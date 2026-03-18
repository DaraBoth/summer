"use client";
import { useState, type ReactNode } from "react";
import { MenuBook, MenuItem, MenuPage, PageElement } from "@/types/menu";
import DesignerCanvas from "./DesignerCanvas";

interface EditPanelProps {
  menuBook: MenuBook;
  onUpdateRestaurant: (name: string, nameKh: string, tagline: string) => void;
  onAddItemToInventory: (item: Omit<MenuItem, "id">) => void;
  onUpdateInventoryItem: (itemId: string, updates: Partial<MenuItem>) => void;
  onDeleteFromInventory: (itemId: string) => void;
  onAddElementToPage: (pageId: string, element: Omit<PageElement, "id">) => void;
  onUpdateElement: (pageId: string, elementId: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (pageId: string, elementId: string) => void;
  onAddPage: (title: string) => void;
  onDeletePage: (pageId: string) => void;
  onReorderPages: (start: number, end: number) => void;
  onResetToDefault: () => void;
  onClose: () => void;
}

type Tab = "store" | "layout" | "design";

export default function EditPanel({
  menuBook,
  onUpdateRestaurant,
  onAddItemToInventory,
  onUpdateInventoryItem,
  onDeleteFromInventory,
  onAddElementToPage,
  onUpdateElement,
  onDeleteElement,
  onAddPage,
  onDeletePage,
  onReorderPages,
  onResetToDefault,
  onClose,
}: EditPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("design");
  const [selectedPageId, setSelectedPageId] = useState(menuBook.pages[0]?.id || "");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const currentPage = menuBook.pages.find(p => p.id === selectedPageId);
  const selectedElement = currentPage?.elements.find(el => el.id === selectedElementId);

  // --- RENDERING HELPERS ---

  const renderTabButton = (id: Tab, label: string, icon: ReactNode) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-all font-body text-[10px] font-bold uppercase tracking-widest ${
        activeTab === id 
          ? "border-[var(--accent-forest)] text-[var(--accent-forest)] bg-[var(--accent-forest)]/5" 
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--accent-forest)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden border border-[var(--accent-olive)]/10">
      {/* Header */}
      <div className="p-4 bg-[var(--bg-secondary)] border-b border-[var(--accent-olive)]/5 flex items-center justify-between">
         <h2 className="font-menu-title text-sm font-bold text-[var(--accent-dark)] px-2">Menu Designer</h2>
         <button onClick={onResetToDefault} className="text-[9px] uppercase font-bold text-red-400 hover:text-red-600 transition-colors tracking-widest">
           Reset All
         </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white">
        {renderTabButton("design", "Design", <DesignerIcon />)}
        {renderTabButton("store", "Inventory", <StoreIcon />)}
        {renderTabButton("layout", "Layout", <LayoutIcon />)}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scroll-custom">
        
        {/* DESIGN TAB */}
        {activeTab === "design" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-[var(--accent-forest)]/60 tracking-wider">Target Page</label>
              <select 
                value={selectedPageId} 
                onChange={(e) => {
                  setSelectedPageId(e.target.value);
                  setSelectedElementId(null);
                }}
                className="w-full p-3 bg-[var(--bg-secondary)] rounded-xl text-sm border-none shadow-sm focus:ring-2 focus:ring-[var(--accent-forest)]"
              >
                {menuBook.pages.map(p => (
                   <option key={p.id} value={p.id}>{p.title} ({p.type})</option>
                ))}
              </select>
            </div>

            {currentPage && (
              <div className="space-y-6">
                <DesignerCanvas 
                  page={currentPage}
                  inventory={menuBook.inventory || []}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onUpdateElement={(id, updates) => onUpdateElement(selectedPageId, id, updates)}
                />

                <div className="grid grid-cols-3 gap-3">
                   <AddButton onClick={() => onAddElementToPage(selectedPageId, { type: "text", content: "New Text", position: { x: 50, y: 50, width: 80, height: 10 }, fontSize: 24 })}>
                     + Text
                   </AddButton>
                   <AddButton onClick={() => onAddElementToPage(selectedPageId, { type: "item", itemId: menuBook.inventory?.[0]?.id || "", position: { x: 50, y: 50, width: 40, height: 40 } })}>
                     + Item
                   </AddButton>
                   <AddButton onClick={() => onAddElementToPage(selectedPageId, { type: "image", imageUrl: "https://via.placeholder.com/300", position: { x: 50, y: 50, width: 40, height: 40 } })}>
                     + Image
                   </AddButton>
                </div>

                {selectedElement && (
                  <div className="bg-[var(--bg-secondary)] p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-[10px] uppercase font-black text-[var(--accent-forest)]">Element Settings</h3>
                       <button onClick={() => onDeleteElement(selectedPageId, selectedElement.id)} className="text-red-400 hover:text-red-600">
                          <TrashIcon />
                       </button>
                    </div>
                    
                    <div className="space-y-4">
                      {selectedElement.type === "text" && (
                        <textarea 
                          value={selectedElement.content}
                          onChange={(e) => onUpdateElement(selectedPageId, selectedElement.id, { content: e.target.value })}
                          className="w-full p-3 rounded-xl border-none text-sm shadow-inner min-h-[80px]"
                        />
                      )}

                      {selectedElement.type === "item" && (
                        <select 
                          value={selectedElement.itemId}
                          onChange={(e) => onUpdateElement(selectedPageId, selectedElement.id, { itemId: e.target.value })}
                          className="w-full p-3 rounded-xl border-none text-sm shadow-inner"
                        >
                          {menuBook.inventory?.map(it => (
                             <option key={it.id} value={it.id}>{it.titleEn}</option>
                          ))}
                        </select>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <PropControl label="Size" value={selectedElement.position.width || 0} onChange={(val) => onUpdateElement(selectedPageId, selectedElement.id, { position: { ...selectedElement.position, width: val, height: val } })} />
                        <PropControl label="Rotate" value={selectedElement.position.rotation || 0} onChange={(val) => onUpdateElement(selectedPageId, selectedElement.id, { position: { ...selectedElement.position, rotation: val } })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STORE TAB */}
        {activeTab === "store" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] uppercase font-black text-[var(--accent-forest)]/40">Food Inventory</h3>
               <button 
                 onClick={() => onAddItemToInventory({ titleEn: "New Item", titleKh: "ម្ហូបថ្មី", price: 5, currency: "USD" })}
                 className="bg-[var(--accent-forest)] text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform"
               >
                 + Add Food
               </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {menuBook.inventory?.map(item => (
                <div key={item.id} className="bg-[var(--bg-secondary)] p-4 rounded-2xl flex gap-4 group">
                   <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md bg-white flex-shrink-0">
                     <img src={item.image || "https://via.placeholder.com/150"} alt="food" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 space-y-2">
                     <input 
                       value={item.titleEn} 
                       onChange={(e) => onUpdateInventoryItem(item.id, { titleEn: e.target.value })}
                       className="w-full bg-transparent font-bold text-sm border-none focus:ring-0 p-0"
                     />
                     <div className="flex items-center justify-between">
                       <span className="text-[var(--accent-forest)] font-bold text-xs">${item.price}</span>
                       <button onClick={() => onDeleteFromInventory(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-500">
                          <TrashIcon />
                       </button>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LAYOUT TAB */}
        {activeTab === "layout" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-[10px] uppercase font-black text-[var(--accent-forest)]/40">Page Management</h3>
               <button 
                 onClick={() => onAddPage("New Category")}
                 className="text-[var(--accent-forest)] border border-[var(--accent-forest)] px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--accent-forest)] hover:text-white transition-all"
               >
                 + Add Page
               </button>
            </div>
            
            <div className="space-y-3">
              {menuBook.pages.map((page, idx) => (
                <div key={page.id} className="flex items-center gap-3 bg-[var(--bg-secondary)] p-3 rounded-xl group">
                   <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[var(--accent-forest)] shadow-sm">
                      {idx + 1}
                   </div>
                   <span className="flex-1 text-sm font-medium">{page.title}</span>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {page.type !== "cover" && page.type !== "back-cover" && (
                        <button onClick={() => onDeletePage(page.id)} className="text-red-300 hover:text-red-500">
                          <TrashIcon fontSize={12} />
                        </button>
                      )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PropControl({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[9px] uppercase font-bold text-[var(--accent-forest)]/60">{label}</label>
        <span className="text-[9px] font-mono text-[var(--accent-olive)]">{value}</span>
      </div>
      <input 
        type="range" 
        min="10" 
        max="150" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[var(--accent-forest)] h-1 bg-white/50 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

function AddButton({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="py-3 px-2 rounded-xl bg-white border border-[var(--accent-olive)]/10 text-[10px] font-bold text-[var(--accent-forest)] hover:border-[var(--accent-forest)] hover:shadow-md transition-all active:scale-95"
    >
      {children}
    </button>
  );
}

// --- ICONS ---

const DesignerIcon = () => (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
     <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
     <path d="M12 8v8M8 12h8" />
   </svg>
);

const StoreIcon = () => (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
     <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
     <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
   </svg>
);

const LayoutIcon = () => (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
     <path d="M3 3h7v10H3zM14 3h7v5h-7zM14 11h7v10h-7zM3 16h7v5H3z" />
   </svg>
);

const TrashIcon = ({ fontSize = 16 }: { fontSize?: number }) => (
  <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
  </svg>
);
