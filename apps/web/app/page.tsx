'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import { useCart } from '@/context/CartContext';
import { fetchProducts, type Product } from '@/lib/api';

const PRODUCT_CATEGORIES: Record<number, string> = {
  1: 'Cà phê đen',
  2: 'Cà phê sữa',
  3: 'Cà phê sữa',
  4: 'Cà phê sữa',
  5: 'Cà phê đen',
  6: 'Cà phê sữa',
  7: 'Cà phê đen',
  8: 'Cà phê sữa',
  9: 'Khác',
  10: 'Khác',
};

const CATEGORIES = [
  'Tất cả',
  'Cà phê đen',
  'Cà phê sữa',
  'Khác',
];

export default function HomePage() {
  const { totalQty, resetLocalCartState } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [toast, setToast] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
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
  }, []);

  // Read authentication state after the component mounts.
  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(
        Boolean(
          localStorage.getItem('accessToken') ||
          localStorage.getItem('token'),
        ),
      );
    };

    checkLogin();
    window.addEventListener('storage', checkLogin);

    return () => {
      window.removeEventListener('storage', checkLogin);
    };
  }, []);

  // Automatically hide the add-to-cart notification.
  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast('');
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesKeyword = product.name.toLowerCase().includes(keyword);

      const category = PRODUCT_CATEGORIES[product.id];
      const matchesCategory =
        selectedCategory === 'Tất cả' ||
        category === selectedCategory;

      return matchesKeyword && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    resetLocalCartState()
    setIsLoggedIn(false);
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 sm:px-8">
      <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-3xl font-bold text-amber-900">
            BrewLite
          </Link>
          <p className="mt-2 text-gray-600">
            Khám phá menu đồ uống của chúng tôi
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/cart"
            className="rounded-lg bg-amber-800 px-4 py-2 text-white hover:bg-amber-900"
          >
            Giỏ hàng ({totalQty})
          </Link>

          <Link
            href="/orders"
            className="rounded-lg border border-amber-800 px-4 py-2 text-amber-900 hover:bg-amber-50"
          >
            Lịch sử đơn hàng
          </Link>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Đăng xuất
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-6xl">
        <h2 className="mb-5 text-2xl font-semibold text-gray-900">
          Menu đồ uống
        </h2>

        {/* Search products */}
        <div className="mb-5">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm đồ uống..."
            aria-label="Tìm kiếm đồ uống"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-amber-800 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse overflow-hidden rounded-2xl bg-white"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="space-y-3 p-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-gray-700">
              Không thể tải menu, vui lòng thử lại
            </p>
            <button
              type="button"
              onClick={loadProducts}
              className="mt-4 rounded-lg bg-amber-800 px-5 py-2 text-white hover:bg-amber-900"
            >
              Thử lại
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="py-12 text-center text-gray-600">
            Không tìm thấy sản phẩm phù hợp
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.imageUrl}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdded={() => setToast('Đã thêm sản phẩm vào giỏ hàng!')}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </main>
  );
}