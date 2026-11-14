'use client';

import { useCallback, useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import { fetchProducts, type Product } from '@/lib/api';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 sm:px-8">
      <header className="mx-auto mb-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-amber-900">
          BrewLite
        </h1>
        <p className="mt-2 text-gray-600">
          Khám phá menu đồ uống của chúng tôi
        </p>
      </header>

      <section className="mx-auto max-w-6xl">
        <h2 className="mb-5 text-2xl font-semibold text-gray-900">
          Menu đồ uống
        </h2>

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
        ) : products.length === 0 ? (
          <p className="py-12 text-center text-gray-600">
            Hiện chưa có sản phẩm nào
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
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
          name={selectedProduct.name}
          price={selectedProduct.price}
          imageUrl={selectedProduct.imageUrl}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}