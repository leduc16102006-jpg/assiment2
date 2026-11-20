'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/api';

type Size = 'S' | 'M' | 'L';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAdded?: () => void;
}

const SIZE_OPTIONS: { size: Size; extraPrice: number }[] = [
  { size: 'S', extraPrice: 0 },
  { size: 'M', extraPrice: 5000 },
  { size: 'L', extraPrice: 10000 },
];

const TOPPING_OPTIONS = [
  { name: 'Trân châu', price: 7000 },
  { name: 'Extra shot', price: 10000 },
  { name: 'Kem cheese', price: 10000 },
];

export default function ProductDetailModal({
  product,
  onClose,
  onAdded,
}: ProductDetailModalProps) {
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<Size>('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const availableQty =
    product.availableBySize?.[selectedSize] ?? product.stock;

  const sizeExtra =
    SIZE_OPTIONS.find((option) => option.size === selectedSize)?.extraPrice ?? 0;

  const toppingExtra = TOPPING_OPTIONS
    .filter((topping) => selectedToppings.includes(topping.name))
    .reduce((total, topping) => total + topping.price, 0);

  const totalPrice = product.price + sizeExtra + toppingExtra;

  const toggleTopping = (name: string) => {
    setSelectedToppings((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
  };

  const handleAddToCart = async () => {
    if (availableQty <= 0 || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: totalPrice,
        size: selectedSize,
        toppings: selectedToppings,
        image: product.imageUrl ?? undefined,
      });

      onAdded?.();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể thêm sản phẩm vào giỏ hàng',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        {product.imageUrl && (
          <div className="relative aspect-video w-full">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="product-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              {product.name}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-gray-500 hover:bg-gray-100"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <p className="mt-2 text-lg font-semibold text-amber-700">
            {product.price.toLocaleString('vi-VN')} đ
          </p>

          {/* Chọn kích thước */}
          <section className="mt-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              Kích thước
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {SIZE_OPTIONS.map(({ size, extraPrice }) => {
                const quantity =
                  product.availableBySize?.[size] ?? product.stock;
                const soldOut = quantity === 0;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={soldOut}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-xl border p-3 transition ${
                      selectedSize === size
                        ? 'border-amber-700 bg-amber-50 text-amber-900'
                        : 'border-gray-200 text-gray-700'
                    } ${
                      soldOut
                        ? 'cursor-not-allowed opacity-40'
                        : 'hover:border-amber-500'
                    }`}
                  >
                    <span className="block font-semibold">
                      Size {size}
                    </span>
                    <span className="mt-1 block text-sm">
                      {extraPrice === 0
                        ? 'Giá gốc'
                        : `+${extraPrice.toLocaleString('vi-VN')}đ`}
                    </span>
                    <span className="mt-1 block text-xs">
                      {soldOut ? 'Hết hàng' : `Còn ${quantity}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Chọn topping */}
          <section className="mt-6">
            <h3 className="mb-3 font-semibold text-gray-900">
              Topping
            </h3>

            <div className="space-y-3">
              {TOPPING_OPTIONS.map((topping) => (
                <label
                  key={topping.name}
                  className="flex cursor-pointer items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-3 text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedToppings.includes(topping.name)}
                      onChange={() => toggleTopping(topping.name)}
                      className="h-4 w-4 accent-amber-700"
                    />
                    {topping.name}
                  </span>

                  <span className="text-sm text-gray-600">
                    +{topping.price.toLocaleString('vi-VN')}đ
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Tổng tiền */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <span className="font-semibold text-gray-800">
              Tạm tính
            </span>
            <span className="text-xl font-bold text-amber-800">
              {totalPrice.toLocaleString('vi-VN')} đ
            </span>
          </div>

          {errorMsg && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {errorMsg}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={availableQty <= 0 || submitting}
            className="mt-5 w-full rounded-xl bg-amber-800 px-5 py-3 font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? 'Đang thêm...'
              : availableQty <= 0
                ? 'Hết hàng'
                : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}