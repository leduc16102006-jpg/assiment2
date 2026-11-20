"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ApiError,
  type BackendCart,
  addCartItemApi,
  clearCartApi,
  clearStoredTokens,
  fetchCartApi,
  fetchProducts,
  getStoredToken,
  removeCartItemApi,
  updateCartItemApi,
} from "@/lib/api";

export type CartItem = {
  id: string;
  productId: number;
  name: string;
  price: number;
  size: string;
  toppings: string[];
  qty: number;
  image?: string;
};

type CartContextType = {
  items: CartItem[];
  loading: boolean;
  addToCart: (item: Omit<CartItem, "id" | "qty">) => Promise<void>;
  updateQty: (id: string, delta: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  syncGuestCartOnLogin: () => Promise<void>;
  resetLocalCartState: () => void;
  totalQty: number;
  totalPrice: number;
};

const GUEST_CART_KEY = "brewlite_guest_cart";
const CartContext = createContext<CartContextType | undefined>(undefined);

function parseToppingsString(toppingText?: string | null): string[] {
  if (!toppingText?.trim()) return [];
  return toppingText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw =
    localStorage.getItem(GUEST_CART_KEY) || localStorage.getItem("brewlite_cart");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  localStorage.removeItem("brewlite_cart");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const productImageMapRef = useRef<Record<number, string>>({});

  const ensureProductImages = useCallback(async () => {
    if (Object.keys(productImageMapRef.current).length > 0) {
      return productImageMapRef.current;
    }
    try {
      const products = await fetchProducts();
      const map: Record<number, string> = {};
      for (const product of products) {
        if (product.imageUrl) {
          map[product.id] = product.imageUrl;
        }
      }
      productImageMapRef.current = map;
    } catch {
      // Fallback image will be used if menu fails to load
    }
    return productImageMapRef.current;
  }, []);

  const mapBackendCart = useCallback(
    (cart: BackendCart, imageMap: Record<number, string>): CartItem[] => {
      return cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.productName,
        price: item.unitPrice,
        size: item.size,
        toppings: parseToppingsString(item.topping),
        qty: item.quantity,
        image: imageMap[item.productId] || "/images/latte.jpg",
      }));
    },
    [],
  );

  const refreshCart = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setItems(readGuestCart());
      return;
    }

    setLoading(true);
    try {
      const [cart, imageMap] = await Promise.all([
        fetchCartApi(),
        ensureProductImages(),
      ]);
      setItems(mapBackendCart(cart, imageMap));
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredTokens();
        setItems(readGuestCart());
      } else {
        console.error("Lỗi đồng bộ giỏ hàng từ server:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [ensureProductImages, mapBackendCart]);

  // Nạp giỏ hàng lần đầu theo đúng chuẩn bất đồng bộ + dọn dẹp khi unmount
  useEffect(() => {
    let cancelled = false;

    const loadInitialCart = async (): Promise<CartItem[]> => {
      const token = getStoredToken();
      if (!token) {
        return readGuestCart();
      }

      const [cart, imageMap] = await Promise.all([
        fetchCartApi(),
        ensureProductImages(),
      ]);
      return mapBackendCart(cart, imageMap);
    };

    loadInitialCart()
      .then((loadedItems) => {
        if (!cancelled) {
          setItems(loadedItems);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredTokens();
          setItems(readGuestCart());
        } else {
          console.error("Lỗi đồng bộ giỏ hàng từ server:", err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ensureProductImages, mapBackendCart]);

  const syncGuestCartOnLogin = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;

    const guestItems = readGuestCart();
    if (guestItems.length > 0) {
      for (const item of guestItems) {
        try {
          await addCartItemApi({
            productId: item.productId,
            size: item.size,
            toppings: item.toppings,
            quantity: item.qty,
          });
        } catch (err) {
          console.error("Không thể đồng bộ một món từ giỏ tạm:", err);
        }
      }
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem("brewlite_cart");
    }

    await refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (newItem: Omit<CartItem, "id" | "qty">) => {
      const token = getStoredToken();

      if (!token) {
        setItems((prev) => {
          const normalizedKey = JSON.stringify([...newItem.toppings].sort());
          const existing = prev.find(
            (it) =>
              it.productId === newItem.productId &&
              it.size === newItem.size &&
              JSON.stringify([...it.toppings].sort()) === normalizedKey,
          );

          const next = existing
            ? prev.map((it) =>
                it.id === existing.id ? { ...it, qty: it.qty + 1 } : it,
              )
            : [
                ...prev,
                {
                  ...newItem,
                  id: `${newItem.productId}-${newItem.size}-${Date.now()}`,
                  qty: 1,
                },
              ];

          writeGuestCart(next);
          return next;
        });
        return;
      }

      const [cart, imageMap] = await Promise.all([
        addCartItemApi({
          productId: newItem.productId,
          size: newItem.size,
          toppings: newItem.toppings,
          quantity: 1,
        }),
        ensureProductImages(),
      ]);

      if (newItem.image && !imageMap[newItem.productId]) {
        imageMap[newItem.productId] = newItem.image;
      }
      setItems(mapBackendCart(cart, imageMap));
    },
    [ensureProductImages, mapBackendCart],
  );

  const updateQty = useCallback(
    async (id: string, delta: number) => {
      const target = items.find((it) => it.id === id);
      if (!target) return;

      const nextQty = target.qty + delta;
      const token = getStoredToken();

      if (!token) {
        setItems((prev) => {
          const next = prev
            .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
            .filter((it) => it.qty > 0);
          writeGuestCart(next);
          return next;
        });
        return;
      }

      const [cart, imageMap] = await Promise.all([
        nextQty <= 0
          ? removeCartItemApi(id)
          : updateCartItemApi(id, nextQty),
        ensureProductImages(),
      ]);
      setItems(mapBackendCart(cart, imageMap));
    },
    [items, ensureProductImages, mapBackendCart],
  );

  const removeFromCart = useCallback(
    async (id: string) => {
      const token = getStoredToken();

      if (!token) {
        setItems((prev) => {
          const next = prev.filter((it) => it.id !== id);
          writeGuestCart(next);
          return next;
        });
        return;
      }

      const [cart, imageMap] = await Promise.all([
        removeCartItemApi(id),
        ensureProductImages(),
      ]);
      setItems(mapBackendCart(cart, imageMap));
    },
    [ensureProductImages, mapBackendCart],
  );

  const clearCart = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem("brewlite_cart");
      return;
    }

    await clearCartApi();
    setItems([]);
  }, []);

  // Chỉ xóa state hiển thị trên trình duyệt khi Đăng xuất, giữ nguyên giỏ trong DB
  const resetLocalCartState = useCallback(() => {
    setItems([]);
  }, []);

  const totalQty = items.reduce((acc, it) => acc + it.qty, 0);
  const totalPrice = items.reduce((acc, it) => acc + it.price * it.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        refreshCart,
        syncGuestCartOnLogin,
        resetLocalCartState,
        totalQty,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}