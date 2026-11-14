import Image from 'next/image';

interface ProductCardProps {
  name: string;
  price: number;
  imageUrl?: string | null;
  onClick: () => void;
}

export default function ProductCard({
  name,
  price,
  imageUrl,
  onClick,
}: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:shadow-md"
    >
      {imageUrl ? (
        <div className="relative aspect-square w-full">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center bg-gray-100 text-sm text-gray-400">
          Chưa có hình ảnh
        </div>
      )}

      <div className="p-3">
        <h2 className="font-semibold text-gray-900">{name}</h2>

        <p className="mt-1 font-medium text-amber-700">
          {price.toLocaleString('vi-VN')} đ
        </p>
      </div>
    </button>
  );
}