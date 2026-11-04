import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);
const storageKey = "quickbite-cart";

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const update = (next) => {
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    add(food) {
      const existing = items.find((item) => item.id === food.id);
      update(existing
        ? items.map((item) => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...food, quantity: 1 }]);
    },
    changeQuantity(id, amount) {
      update(items
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
        .filter((item) => item.quantity > 0));
    },
    clear() {
      update([]);
    },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
