import Image from 'next/image';

interface ProductDetailModalProps {
  name: string;
  price: number;
  imageUrl?: string | null;
  onClose: () => void;
}

export default function ProductDetailModal({
  name,
  price,
  imageUrl,
  onClose,
}: ProductDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        {imageUrl && (
          <div className="relative aspect-video w-full">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-gray-500 hover:bg-gray-100"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          <p className="mt-3 text-lg font-semibold text-amber-700">
            {price.toLocaleString('vi-VN')} đ
          </p>
        </div>
      </div>
    </div>
  );
}