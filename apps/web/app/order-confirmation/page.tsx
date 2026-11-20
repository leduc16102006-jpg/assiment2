"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  ApiError,
  type BackendOrderDetail,
  clearStoredTokens,
  fetchOrderById,
  getStoredToken,
} from "@/lib/api";

const MAX_POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 2500;

function formatPrice(val: number) {
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get("orderId");
  const parsedOrderId = rawOrderId ? Number(rawOrderId) : NaN;
  const hasValidOrderId =
    Number.isInteger(parsedOrderId) && parsedOrderId >= 1;
  const displayOrderId = hasValidOrderId ? String(parsedOrderId) : "---";

  const vnpResponseCode = searchParams.get("vnp_ResponseCode") || "00";
  const isClientSuccessSignal = vnpResponseCode === "00";

  const { refreshCart, resetLocalCartState } = useCart();

  const [order, setOrder] = useState<BackendOrderDetail | null>(null);
  const [isInitialLoading, setIsInitialLoading] =
    useState<boolean>(hasValidOrderId);
  const [fetchError, setFetchError] = useState<string>("");
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [pollAttempt, setPollAttempt] = useState<number>(0);
  const [recheckNonce, setRecheckNonce] = useState<number>(0);

  useEffect(() => {
    if (!hasValidOrderId) return;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const verifyOrderFromBackend = async (): Promise<BackendOrderDetail> => {
      const token = getStoredToken();
      if (!token) {
        throw new ApiError(
          "Vui lòng đăng nhập để hệ thống xác minh trạng thái đơn hàng từ máy chủ.",
          401,
        );
      }
      return fetchOrderById(parsedOrderId);
    };

    verifyOrderFromBackend()
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setFetchError("");
        setAuthRequired(false);
        setIsInitialLoading(false);

        if (data.status === "PAID") {
          void refreshCart();
          return;
        }

        // AC-06.7: Nếu Return URL báo 00 nhưng IPN chưa kịp cập nhật DB -> poll chờ Backend xác nhận
        if (
          isClientSuccessSignal &&
          data.status === "PENDING" &&
          pollAttempt < MAX_POLL_ATTEMPTS
        ) {
          timerId = setTimeout(() => {
            if (!cancelled) {
              setPollAttempt((prev) => prev + 1);
            }
          }, POLL_INTERVAL_MS);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredTokens();
          resetLocalCartState();
          setAuthRequired(true);
          setFetchError(
            "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập để xem trạng thái đơn hàng chính xác từ hệ thống.",
          );
        } else {
          setFetchError(
            err instanceof Error
              ? err.message
              : "Không thể xác minh trạng thái đơn hàng từ máy chủ.",
          );
        }
        setIsInitialLoading(false);
      });

    return () => {
      cancelled = true;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [
    hasValidOrderId,
    parsedOrderId,
    isClientSuccessSignal,
    pollAttempt,
    recheckNonce,
    refreshCart,
    resetLocalCartState,
  ]);

  const handleManualRecheck = () => {
    if (!hasValidOrderId) return;
    setIsInitialLoading(true);
    setFetchError("");
    setAuthRequired(false);
    setPollAttempt(0);
    setRecheckNonce((prev) => prev + 1);
  };

  // 1. Đang hỏi trạng thái thật từ Backend
  if (isInitialLoading) {
    return (
      <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          ⏳
        </div>
        <h1
          className="mt-6 text-2xl font-black"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Đang xác minh đơn hàng...
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">
          Hệ thống đang kiểm tra trạng thái thanh toán thực tế của đơn #
          {displayOrderId} từ máy chủ.
        </p>
      </div>
    );
  }

  // 2. Cần đăng nhập hoặc lỗi kết nối khi xác minh trạng thái (không báo PAID giả)
  if (authRequired || (!order && fetchError)) {
    const redirectTarget = hasValidOrderId
      ? `/order-confirmation?orderId=${displayOrderId}&vnp_ResponseCode=${encodeURIComponent(vnpResponseCode)}`
      : "/orders";

    return (
      <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          !
        </div>
        <h1
          className="mt-6 text-2xl font-black text-[#35251f]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Chưa thể xác minh trạng thái
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">{fetchError}</p>

        <div className="mt-8 space-y-3">
          {authRequired ? (
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
              className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
            >
              Đăng nhập để kiểm tra đơn #{displayOrderId}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleManualRecheck}
              className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
            >
              Kiểm tra lại trạng thái
            </button>
          )}
          <Link
            href="/orders"
            className="block w-full rounded-2xl border border-[#e5d8ca] bg-white py-3.5 text-sm font-bold text-[#35251f] transition hover:border-[#a16b4b]"
          >
            Xem lịch sử đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // 3. AC-06.7: CHỈ công bố PAID khi Backend đã xác nhận và lưu trạng thái PAID
  if (order && order.status === "PAID") {
    return (
      <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>
        <h1
          className="mt-6 text-2xl font-black"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">
          Đơn hàng của bạn đã được hệ thống xác nhận thanh toán và chuyển đến
          quầy pha chế.
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-[#eee3d7] bg-[#faf7f2] p-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-[#8b796b]">Mã đơn hàng</span>
            <span className="font-bold text-[#35251f]">#{order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8b796b]">Trạng thái xác nhận</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
              PAID
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8b796b]">Tổng số tiền</span>
            <span className="font-bold text-[#a16b4b]">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/orders"
            className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
          >
            Xem lịch sử đơn hàng →
          </Link>
          <Link
            href="/"
            className="block w-full rounded-2xl border border-[#e5d8ca] bg-white py-3.5 text-sm font-bold text-[#35251f] transition hover:border-[#a16b4b]"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // 4. Đơn hàng đã bị hủy (quá 15 phút)
  if (order && order.status === "CANCELLED") {
    return (
      <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
          ✕
        </div>
        <h1
          className="mt-6 text-2xl font-black text-red-600"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Đơn hàng #{order.id} đã bị hủy
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">
          {order.note ||
            "Đơn hàng đã quá thời gian chờ thanh toán và được hoàn trả nguyên liệu."}
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="/"
            className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
          >
            Đặt đơn hàng mới
          </Link>
          <Link
            href="/orders"
            className="block w-full rounded-2xl border border-[#e5d8ca] bg-white py-3.5 text-sm font-bold text-[#35251f] transition hover:border-[#a16b4b]"
          >
            Xem lịch sử đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // 5. Return URL báo 00 nhưng Backend vẫn là PENDING (đang chờ IPN về hoặc chưa thanh toán xong)
  if (order && order.status === "PENDING" && isClientSuccessSignal) {
    const isStillPolling = pollAttempt < MAX_POLL_ATTEMPTS;

    return (
      <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          ⏳
        </div>
        <h1
          className="mt-6 text-2xl font-black text-amber-800"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {isStillPolling
            ? "Đang chờ xác nhận thanh toán..."
            : "Đơn hàng đang chờ xác nhận"}
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">
          {isStillPolling
            ? "Hệ thống đang đợi tín hiệu xác nhận IPN từ cổng thanh toán để chốt trạng thái đơn hàng."
            : "Máy chủ hiện vẫn ghi nhận đơn hàng ở trạng thái PENDING (chưa nhận xác nhận IPN hoàn tất)."}
        </p>

        <div className="mt-6 space-y-3 rounded-2xl border border-[#eee3d7] bg-[#faf7f2] p-5 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-[#8b796b]">Mã đơn hàng</span>
            <span className="font-bold text-[#35251f]">#{order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8b796b]">Trạng thái máy chủ</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              PENDING
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8b796b]">Tổng số tiền</span>
            <span className="font-bold text-[#a16b4b]">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleManualRecheck}
            className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
          >
            Kiểm tra lại trạng thái ngay
          </button>
          <Link
            href={`/cart?retryOrderId=${order.id}`}
            className="block w-full rounded-2xl border border-[#e5d8ca] bg-white py-3.5 text-sm font-bold text-[#35251f] transition hover:border-[#a16b4b]"
          >
            Quay lại thanh toán lại đơn #{order.id}
          </Link>
          <Link
            href="/orders"
            className="block w-full py-2 text-xs font-semibold text-[#8b796b] hover:underline"
          >
            Xem lịch sử đơn hàng →
          </Link>
        </div>
      </div>
    );
  }

  // 6. Giao dịch thất bại / người dùng bấm Hủy trên VNPay / chữ ký không hợp lệ
  return (
    <div className="w-full max-w-md rounded-[2.5rem] border border-[#eee3d7] bg-white p-8 text-center shadow-xl sm:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
        ✕
      </div>
      <h1
        className="mt-6 text-2xl font-black text-red-600"
        style={{ fontFamily: "Georgia, serif" }}
      >
        Giao dịch thất bại!
      </h1>
      <p className="mt-2 text-sm text-[#8b796b]">
        {!isClientSuccessSignal
          ? `Bạn đã hủy thanh toán hoặc giao dịch bị từ chối (Mã phản hồi: ${vnpResponseCode}).`
          : `Đơn hàng #${displayOrderId} chưa được thanh toán thành công (Trạng thái: ${order?.status || "PAYMENT_FAILED"}).`}
      </p>
      <div className="mt-8 space-y-3">
        <Link
          href={hasValidOrderId ? `/cart?retryOrderId=${displayOrderId}` : "/cart"}
          className="block w-full rounded-2xl bg-[#35251f] py-3.5 text-sm font-bold text-white transition hover:bg-[#634536]"
        >
          {hasValidOrderId
            ? `← Quay lại Giỏ hàng thanh toán lại đơn #${displayOrderId}`
            : "← Quay lại Giỏ hàng để thử lại"}
        </Link>
        <Link
          href="/orders"
          className="block w-full rounded-2xl border border-[#e5d8ca] bg-white py-3.5 text-sm font-bold text-[#35251f] transition hover:border-[#a16b4b]"
        >
          Xem lịch sử đơn hàng
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