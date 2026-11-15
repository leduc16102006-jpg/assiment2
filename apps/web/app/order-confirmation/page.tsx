"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "---";
  const urlTotal = searchParams.get("total");

  const vnpResponseCode = searchParams.get("vnp_ResponseCode") || "00";
  const isSuccess = vnpResponseCode === "00"; 

  const { clearCart } = useCart();
  const [orderTotal, setOrderTotal] = useState<number>(Number(urlTotal) || 0);
  const [isLoading, setIsLoading] = useState<boolean>(!urlTotal && orderId !== "---");

  useEffect(() => {
    if (isSuccess) {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (urlTotal || orderId === "---") return;

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setOrderTotal(data.total);
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId, urlTotal]);

  if (!isSuccess) {
    return (
      <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 text-3xl">
          ✕
        </div>
        <h1 className="mt-6 text-2xl font-black text-red-600" style={{ fontFamily: "Georgia, serif" }}>
          Giao dịch thất bại!
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">
          Bạn đã hủy thanh toán hoặc giao dịch bị lỗi (Mã lỗi: {vnpResponseCode}).
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/cart"
            className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
          >
            ← Quay lại Giỏ hàng để thử lại
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 text-3xl">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-black" style={{ fontFamily: "Georgia, serif" }}>Đặt hàng thành công!</h1>
      <p className="mt-2 text-sm text-[#8b796b]">Đơn hàng của bạn đã được thanh toán và chuyển đến quầy pha chế.</p>

      <div className="mt-6 rounded-2xl bg-[#faf7f2] p-5 text-left border border-[#eee3d7] space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#8b796b]">Mã đơn hàng</span>
          <span className="font-bold text-[#35251f]">#{orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8b796b]">Trạng thái thanh toán</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
            PAID
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8b796b]">Tổng số tiền</span>
          <span className="font-bold text-[#a16b4b]">
            {isLoading ? "Đang tải..." : `${new Intl.NumberFormat("vi-VN").format(orderTotal)}đ`}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Link href="/orders" className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]">
          Xem lịch sử đơn hàng →
        </Link>
        <Link href="/" className="block w-full rounded-2xl border border-[#e5d8ca] bg-white py-3.5 text-sm font-bold text-[#35251f] transition hover:border-[#a16b4b]">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4 text-[#35251f]">
      <Suspense fallback={<div>Đang xử lý thông tin...</div>}>
        <ConfirmationContent />
      </Suspense>
    </main>
  );
}