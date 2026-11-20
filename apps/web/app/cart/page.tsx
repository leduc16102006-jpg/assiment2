"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import {
  ApiError,
  type BackendOrderDetail,
  type PromotionRule,
  clearStoredTokens,
  createOrderFromCart,
  createVnpayPayment,
  fetchOrderById,
  fetchPromotionApi,
  getStoredToken,
  processPayment,
  updateOrderStatus,
} from "@/lib/api";

function formatPrice(val: number) {
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
}

function CartAndCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryOrderIdParam = searchParams.get("retryOrderId");

  const {
    items,
    loading: cartLoading,
    updateQty,
    removeFromCart,
    clearCart,
    refreshCart,
    resetLocalCartState,
    totalQty,
    totalPrice,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CARD" | "VNPAY">("WALLET");
  const [simulateStockError, setSimulateStockError] = useState(false);
  const [simulatePaymentError, setSimulatePaymentError] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromotionRule | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingRetryOrder, setLoadingRetryOrder] = useState(false);
  const [errorType, setErrorType] = useState<
    "NONE" | "STOCK_ERROR" | "PAYMENT_ERROR" | "GENERAL"
  >("NONE");
  const [errorMsg, setErrorMsg] = useState("");

  // Đơn hàng đang ở chế độ chờ thanh toán / thanh toán lại (từ ?retryOrderId= hoặc vừa tạo từ giỏ)
  const [activeOrder, setActiveOrder] = useState<BackendOrderDetail | null>(null);

  function handleRemoveCoupon() {
    setCouponInput("");
    setAppliedPromo(null);
  }

  // Nạp đơn hàng khi quay về từ VNPay Hủy hoặc bấm "Thanh toán lại" từ /orders
  useEffect(() => {
    const parsedId = Number(retryOrderIdParam);
    if (!retryOrderIdParam || !Number.isInteger(parsedId) || parsedId < 1) {
      return;
    }

    let cancelled = false;

    async function loadRetryOrder() {
      const token = getStoredToken();
      if (!token) {
        router.push(`/login?redirect=${encodeURIComponent(`/cart?retryOrderId=${parsedId}`)}`);
        return;
      }

      setLoadingRetryOrder(true);
      setErrorType("NONE");
      setErrorMsg("");

      try {
        const order = await fetchOrderById(parsedId);
        if (cancelled) return;

        if (order.status === "PAID") {
          router.replace(`/order-confirmation?orderId=${order.id}&vnp_ResponseCode=00`);
          return;
        }

        setActiveOrder(order);

        if (order.status === "CANCELLED") {
          setErrorType("GENERAL");
          setErrorMsg(
            order.note ||
              `Đơn hàng #${order.id} đã bị hủy tự động do quá 15 phút chưa thanh toán.`,
          );
        }
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearStoredTokens();
          resetLocalCartState();
          router.push(`/login?redirect=${encodeURIComponent(`/cart?retryOrderId=${parsedId}`)}`);
          return;
        }
        setErrorType("GENERAL");
        setErrorMsg(
          err instanceof Error ? err.message : "Không thể tải thông tin đơn hàng cần thanh toán lại.",
        );
      } finally {
        if (!cancelled) {
          setLoadingRetryOrder(false);
        }
      }
    }

    void loadRetryOrder();

    return () => {
      cancelled = true;
    };
  }, [retryOrderIdParam, router, resetLocalCartState]);

  // Tính giảm giá bằng Math.floor cho khớp 100% với orders.service.ts ở Backend
  const discountAmount = useMemo(() => {
    if (activeOrder) return activeOrder.discountAmount;
    if (!appliedPromo) return 0;

    let discount =
      appliedPromo.type === "PERCENT"
        ? Math.floor((totalPrice * appliedPromo.value) / 100)
        : appliedPromo.value;

    if (appliedPromo.maxDiscount && discount > appliedPromo.maxDiscount) {
      discount = appliedPromo.maxDiscount;
    }
    return Math.min(discount, totalPrice);
  }, [activeOrder, totalPrice, appliedPromo]);

  useEffect(() => {
    if (!activeOrder && appliedPromo && totalPrice < appliedPromo.minOrderAmount) {
      const timer = setTimeout(() => {
        setErrorType("GENERAL");
        setErrorMsg(
          `Đơn hàng chưa đạt mức tối thiểu ${formatPrice(appliedPromo.minOrderAmount)} để duy trì mã ${appliedPromo.code}.`,
        );
        handleRemoveCoupon();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeOrder, totalPrice, appliedPromo]);

  useEffect(() => {
    if (!activeOrder && items.length === 0) {
      const timer = setTimeout(() => handleRemoveCoupon(), 0);
      return () => clearTimeout(timer);
    }
  }, [activeOrder, items.length]);

  const handleApplyCoupon = async () => {
    const rawCode = couponInput.trim().toUpperCase();
    if (!rawCode) return;

    setLoading(true);
    try {
      const promo = await fetchPromotionApi(rawCode);

      if (totalPrice < promo.minOrderAmount) {
        throw new Error(
          `Mã ${promo.code} chỉ áp dụng cho đơn hàng từ ${formatPrice(promo.minOrderAmount)} trở lên.`,
        );
      }

      setAppliedPromo(promo);
      setErrorType("NONE");
      setErrorMsg("");
    } catch (err: unknown) {
      setErrorType("GENERAL");
      setErrorMsg(
        err instanceof Error ? err.message : "Lỗi không xác định khi áp dụng mã.",
      );
      handleRemoveCoupon();
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearCart();
      handleRemoveCoupon();
      setErrorType("NONE");
      setErrorMsg("");
      setActiveOrder(null);
    } catch (err: unknown) {
      setErrorType("GENERAL");
      setErrorMsg(err instanceof Error ? err.message : "Không thể xóa giỏ hàng.");
    }
  };

  const handleUpdateQty = async (id: string, delta: number) => {
    try {
      await updateQty(id, delta);
    } catch (err: unknown) {
      setErrorType("GENERAL");
      setErrorMsg(err instanceof Error ? err.message : "Không thể cập nhật số lượng.");
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeFromCart(id);
    } catch (err: unknown) {
      setErrorType("GENERAL");
      setErrorMsg(err instanceof Error ? err.message : "Không thể xóa món khỏi giỏ.");
    }
  };

  const displaySubtotal = activeOrder ? activeOrder.subtotal : totalPrice;
  const finalTotal = activeOrder
    ? activeOrder.total
    : Math.max(0, totalPrice - discountAmount);
  const loyaltyPoints = Math.floor(finalTotal / 10000);

  const handleCheckout = async (options?: { ignoreSimulatedPaymentError?: boolean }) => {
    const shouldSimulatePaymentError =
      options?.ignoreSimulatedPaymentError ? false : simulatePaymentError;

    if (!activeOrder && items.length === 0) return;

    setLoading(true);
    setErrorMsg("");
    setErrorType("NONE");

    try {
      const token = getStoredToken();
      if (!token) {
        router.push("/login?redirect=/cart");
        return;
      }

      if (simulateStockError) {
        throw new Error(
          "STOCK_ERROR|⚠️ Lỗi tồn kho (Task 10.3): Sản phẩm hiện không đủ số lượng để khóa tồn kho.",
        );
      }

      let workingOrder = activeOrder;

      // 1. Nếu chưa có đơn -> tạo đơn trực tiếp từ Giỏ hàng DB (POST /orders/from-cart)
      if (!workingOrder) {
        try {
          workingOrder = await createOrderFromCart(
            appliedPromo ? appliedPromo.code : undefined,
          );
          setActiveOrder(workingOrder);
          // Đồng bộ lại trạng thái giỏ hàng (đã tự xóa trong transaction trên DB)
          await refreshCart();
        } catch (orderErr: unknown) {
          if (orderErr instanceof ApiError && orderErr.status === 401) {
            clearStoredTokens();
            resetLocalCartState();
            router.push("/login?redirect=/cart");
            return;
          }
          const msg = orderErr instanceof Error ? orderErr.message : "Lỗi tạo đơn";
          if (
            msg.toLowerCase().includes("stock") ||
            msg.toLowerCase().includes("kho") ||
            msg.toLowerCase().includes("nguyên liệu")
          ) {
            throw new Error(`STOCK_ERROR|⚠️ Cảnh báo kho (Task 10.3): ${msg}`);
          }
          throw new Error(`GENERAL|${msg}`);
        }
      } else {
        // 2. Nếu đang thanh toán lại đơn đã có -> đọc lại trạng thái thật từ DB trước
        workingOrder = await fetchOrderById(workingOrder.id);
        setActiveOrder(workingOrder);

        if (workingOrder.status === "PAID") {
          router.push(`/order-confirmation?orderId=${workingOrder.id}&vnp_ResponseCode=00`);
          return;
        }

        if (workingOrder.status === "CANCELLED") {
          throw new Error(
            `GENERAL|${workingOrder.note || `Đơn hàng #${workingOrder.id} đã tự động hủy sau 15 phút. Vui lòng tạo đơn mới từ menu.`}`,
          );
        }

        // Chỉ chuyển PAYMENT_FAILED -> PENDING để giữ lại nguyên liệu (không gọi PATCH nếu đang PENDING)
        if (workingOrder.status === "PAYMENT_FAILED") {
          try {
            workingOrder = await updateOrderStatus(workingOrder.id, "PENDING");
            setActiveOrder(workingOrder);
          } catch (resetErr: unknown) {
            const msg =
              resetErr instanceof Error
                ? resetErr.message
                : "Không thể giữ lại nguyên liệu để thanh toán. Kho có thể đã hết.";
            throw new Error(`STOCK_ERROR|${msg}`);
          }
        }
      }

      // 3. Kịch bản giả lập lỗi thanh toán (Task 8 DOD)
      if (shouldSimulatePaymentError) {
        try {
          workingOrder = await updateOrderStatus(workingOrder.id, "PAYMENT_FAILED");
          setActiveOrder(workingOrder);
        } catch {
          // Bỏ qua nếu đã ở trạng thái khác
        }
        throw new Error(
          `PAYMENT_ERROR|⏱ Thanh toán thất bại (Task 8): Cổng giao dịch ${paymentMethod} từ chối đơn hàng #${workingOrder.id}.`,
        );
      }

      // 4. Thực hiện thanh toán theo phương thức đã chọn
      if (paymentMethod === "VNPAY") {
        try {
          const paymentUrl = await createVnpayPayment(workingOrder.id);
          window.location.href = paymentUrl;
          return;
        } catch (vnpErr: unknown) {
          const msg =
            vnpErr instanceof Error
              ? vnpErr.message
              : "Không thể tạo cổng thanh toán VNPay";
          throw new Error(`PAYMENT_ERROR|${msg}`);
        }
      }

      const paymentResult = await processPayment(workingOrder.id, paymentMethod);
      if (paymentResult.status === "PAYMENT_FAILED") {
        const latest = await fetchOrderById(workingOrder.id);
        setActiveOrder(latest);
        throw new Error(
          `PAYMENT_ERROR|Giao dịch ${paymentMethod} cho đơn #${workingOrder.id} bị từ chối. Bạn có thể thử lại trong vòng 15 phút.`,
        );
      }

      router.push(
        `/order-confirmation?orderId=${workingOrder.id}&total=${workingOrder.total}&vnp_ResponseCode=00`,
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearStoredTokens();
        resetLocalCartState();
        router.push("/login?redirect=/cart");
        return;
      }

      const msg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      if (msg.startsWith("STOCK_ERROR|")) {
        setErrorType("STOCK_ERROR");
        setErrorMsg(msg.split("|")[1]);
      } else if (msg.startsWith("PAYMENT_ERROR|")) {
        setErrorType("PAYMENT_ERROR");
        setErrorMsg(msg.split("|")[1]);
      } else if (msg.startsWith("GENERAL|")) {
        setErrorType("GENERAL");
        setErrorMsg(msg.split("|")[1]);
      } else {
        setErrorType("GENERAL");
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isRetryCancelled = activeOrder?.status === "CANCELLED";
  const showEmptyState = !loadingRetryOrder && !cartLoading && !activeOrder && items.length === 0;

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#35251f]">
      <header className="border-b border-[#e9dfd4] bg-[#faf7f2]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight">
            BREW<span className="text-[#a16b4b]">LITE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="rounded-full border border-[#e5d8ca] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[#a16b4b]"
            >
              Lịch sử đơn
            </Link>
            <Link
              href="/"
              className="rounded-full bg-[#35251f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#634536]"
            >
              ← Tiếp tục chọn món
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <h1
          className="text-3xl font-black sm:text-4xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {activeOrder
            ? `Thanh toán đơn hàng #${activeOrder.id}`
            : "Giỏ hàng & Thanh toán"}
        </h1>
        <p className="mt-2 text-sm text-[#8b796b]">
          {activeOrder
            ? "Đơn hàng đã được tạo và giữ nguyên liệu. Vui lòng hoàn tất thanh toán trong vòng 15 phút."
            : "Kiểm tra danh sách thức uống, áp dụng ưu đãi và thanh toán"}
        </p>

        {activeOrder && !isRetryCancelled && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
            <div>
              <strong>Đơn hàng #{activeOrder.id}</strong> đang ở trạng thái{" "}
              <span className="rounded-full bg-amber-200 px-2 py-0.5 font-bold">
                {activeOrder.status}
              </span>
              . Nếu chưa thanh toán quá 15 phút, hệ thống sẽ tự hủy và hoàn trả nguyên liệu.
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveOrder(null);
                setErrorType("NONE");
                setErrorMsg("");
                router.replace("/cart");
              }}
              className="shrink-0 font-bold text-[#a16b4b] hover:underline"
            >
              Xem giỏ hàng mới
            </button>
          </div>
        )}

        {errorType === "STOCK_ERROR" && (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h4 className="text-sm font-bold">Sự cố tồn kho (Task 10.3 - Stock Lock)</h4>
                <p className="mt-1 text-xs">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {errorType === "PAYMENT_ERROR" && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h4 className="text-sm font-bold">Giao dịch bị từ chối (Task 8 - PAYMENT_FAILED)</h4>
                <p className="mt-1 text-xs">{errorMsg}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatePaymentError(false);
                      void handleCheckout({ ignoreSimulatedPaymentError: true });
                    }}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Thử lại thanh toán ngay
                  </button>
                  <span className="text-xs text-red-600">
                    Hoặc chọn đổi phương thức thanh toán khác bên dưới.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorType === "GENERAL" && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
            ⚠ {errorMsg}
          </div>
        )}

        {(loadingRetryOrder || cartLoading) && !activeOrder && items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[#eee3d7] bg-white p-16 text-center text-sm text-[#8b796b]">
            Đang tải dữ liệu giỏ hàng...
          </div>
        ) : showEmptyState ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[#ddcbbb] bg-white p-16 text-center">
            <div className="text-4xl">☕</div>
            <h2 className="mt-4 text-xl font-black">Giỏ hàng của bạn đang trống</h2>
            <p className="mt-2 text-sm text-[#8b796b]">
              Hãy khám phá menu để chọn những món yêu thích nhé.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-[#35251f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#634536]"
            >
              Xem thực đơn ngay
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {activeOrder ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#eee3d7] pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8b796b]">
                      Chi tiết đơn hàng #{activeOrder.id} ({activeOrder.items.length} dòng)
                    </span>
                    <Link
                      href="/orders"
                      className="text-xs font-semibold text-[#a16b4b] hover:underline"
                    >
                      Xem trong lịch sử đơn
                    </Link>
                  </div>

                  {activeOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-[#eee3d7] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.product?.imageUrl || "/images/latte.jpg"}
                          alt={item.product?.name || "BrewLite"}
                          width={56}
                          height={56}
                          className="rounded-xl bg-[#f3e8db] object-cover"
                        />
                        <div>
                          <h3 className="font-bold">{item.product?.name}</h3>
                          {item.size && (
                            <p className="text-xs text-[#8b796b]">Size: {item.size}</p>
                          )}
                          <p className="text-xs font-semibold text-[#8b796b]">
                            Số lượng: x{item.qty}
                          </p>
                        </div>
                      </div>
                      <p className="min-w-20 text-right font-black text-[#a16b4b]">
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-[#eee3d7] pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8b796b]">
                      Món đã chọn ({totalQty} món)
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleClearAll()}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-[#eee3d7] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={item.image || "/images/latte.jpg"}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="rounded-xl bg-[#f3e8db] object-cover"
                        />
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="text-xs text-[#8b796b]">
                            Size: {item.size}{" "}
                            {item.toppings &&
                              item.toppings.length > 0 &&
                              `· ${item.toppings.join(", ")}`}
                          </p>
                          <p className="text-xs font-bold text-[#a16b4b]">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-xl border border-[#e5d8ca] bg-[#faf7f2]">
                          <button
                            type="button"
                            onClick={() => void handleUpdateQty(item.id, -1)}
                            className="rounded-l-xl px-2.5 py-1 text-sm font-bold text-[#634536] hover:bg-[#eee3d7]"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleUpdateQty(item.id, 1)}
                            className="rounded-r-xl px-2.5 py-1 text-sm font-bold text-[#634536] hover:bg-[#eee3d7]"
                          >
                            +
                          </button>
                        </div>
                        <p className="min-w-20 text-right font-black text-[#a16b4b]">
                          {formatPrice(item.price * item.qty)}
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleRemoveItem(item.id)}
                          className="text-lg font-bold text-stone-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-3xl border border-[#eee3d7] bg-white p-6 shadow-md">
                <h2
                  className="text-lg font-black"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Phương thức thanh toán
                </h2>
                <div className="mt-4 space-y-3">
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                      paymentMethod === "WALLET"
                        ? "border-[#a16b4b] bg-[#faf7f2]"
                        : "border-[#e5d8ca]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="WALLET"
                        checked={paymentMethod === "WALLET"}
                        onChange={() => setPaymentMethod("WALLET")}
                        className="accent-[#a16b4b]"
                      />
                      <div>
                        <p className="text-sm font-bold">WALLET (Ví điện tử BrewPay)</p>
                        <p className="text-xs text-[#8b796b]">Thanh toán qua số dư ví số</p>
                      </div>
                    </div>
                    <span className="text-xl">💳</span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                      paymentMethod === "CARD"
                        ? "border-[#a16b4b] bg-[#faf7f2]"
                        : "border-[#e5d8ca]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="CARD"
                        checked={paymentMethod === "CARD"}
                        onChange={() => setPaymentMethod("CARD")}
                        className="accent-[#a16b4b]"
                      />
                      <div>
                        <p className="text-sm font-bold">CARD (Thẻ Ngân hàng / ATM)</p>
                        <p className="text-xs text-[#8b796b]">Cổng thanh toán thẻ nội địa</p>
                      </div>
                    </div>
                    <span className="text-xl">🦁</span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                      paymentMethod === "VNPAY"
                        ? "border-blue-500 bg-blue-50"
                        : "border-[#e5d8ca]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        value="VNPAY"
                        checked={paymentMethod === "VNPAY"}
                        onChange={() => setPaymentMethod("VNPAY")}
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
                          CỔNG VNPAY
                          <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                            QR / ATM
                          </span>
                        </p>
                        <p className="text-xs text-blue-700">
                          Quét mã QR qua App hoặc thẻ nội địa
                        </p>
                      </div>
                    </div>
                    <span className="text-xl">🇻🇳</span>
                  </label>
                </div>

                {!activeOrder && (
                  <div className="mt-5 border-t border-[#eee3d7] pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#8b796b]">
                        Mã ưu đãi (Task 10.4) Ví dụ: WELCOME5
                      </label>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã ưu đãi..."
                        value={appliedPromo ? appliedPromo.code : couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        disabled={!!appliedPromo}
                        className="w-full rounded-xl border border-[#e5d8ca] px-3 py-2 text-xs font-semibold uppercase outline-none transition focus:border-[#a16b4b] disabled:bg-stone-100"
                      />
                      {appliedPromo ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="shrink-0 rounded-xl bg-red-100 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-200"
                        >
                          Gỡ mã
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleApplyCoupon()}
                          className="shrink-0 rounded-xl bg-[#35251f] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#634536]"
                        >
                          Áp dụng
                        </button>
                      )}
                    </div>
                    {appliedPromo && (
                      <p className="mt-1.5 text-xs font-semibold text-green-600">
                        ✓ Đã áp dụng mã <strong>{appliedPromo.code}</strong>: Giảm{" "}
                        {appliedPromo.type === "PERCENT"
                          ? `${appliedPromo.value}%`
                          : formatPrice(appliedPromo.value)}{" "}
                        (Tiết kiệm {formatPrice(discountAmount)})
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-5 space-y-2 rounded-2xl border border-stone-200 bg-[#faf7f2] p-3.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#8b796b]">
                    Công cụ giả lập kiểm thử DOD
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-900">
                    <input
                      type="checkbox"
                      checked={simulateStockError}
                      onChange={(e) => {
                        setSimulateStockError(e.target.checked);
                        if (e.target.checked) setSimulatePaymentError(false);
                      }}
                      className="accent-amber-600"
                    />
                    <span>Mô phỏng hết hàng trong kho (Task 10.3 Stock Lock)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-red-900">
                    <input
                      type="checkbox"
                      checked={simulatePaymentError}
                      onChange={(e) => {
                        setSimulatePaymentError(e.target.checked);
                        if (e.target.checked) setSimulateStockError(false);
                      }}
                      className="accent-red-600"
                    />
                    <span>Mô phỏng lỗi thanh toán (Task 8 PAYMENT_FAILED)</span>
                  </label>
                </div>

                <div className="mt-5 space-y-2 border-t border-[#eee3d7] pt-4">
                  <div className="flex justify-between text-sm text-[#8b796b]">
                    <span>Tạm tính</span>
                    <span>{formatPrice(displaySubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm font-semibold text-green-600">
                      <span>
                        Giảm giá khuyến mãi{appliedPromo ? ` (${appliedPromo.code})` : ""}
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#eee3d7] pt-3 text-lg font-black text-[#35251f]">
                    <span>Tổng thanh toán ({paymentMethod})</span>
                    <span className="text-[#a16b4b]">{formatPrice(finalTotal)}</span>
                  </div>
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-center text-xs text-amber-900">
                    ⭐ Đơn hàng tích lũy{" "}
                    <strong className="text-[#a16b4b]">+{loyaltyPoints} điểm</strong>{" "}
                    thành viên (Task 10.4)
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading || isRetryCancelled}
                  onClick={() => void handleCheckout()}
                  className="mt-6 w-full rounded-2xl bg-[#35251f] py-4 text-sm font-bold text-white transition hover:bg-[#634536] disabled:opacity-50"
                >
                  {loading
                    ? "Đang xử lý giao dịch..."
                    : isRetryCancelled
                      ? "Đơn hàng đã bị hủy"
                      : activeOrder
                        ? `Thanh toán lại đơn #${activeOrder.id} (${paymentMethod}) · ${formatPrice(finalTotal)}`
                        : `Xác nhận & Thanh toán (${paymentMethod}) · ${formatPrice(finalTotal)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CartAndCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] text-sm text-[#8b796b]">
          Đang tải trang giỏ hàng...
        </main>
      }
    >
      <CartAndCheckoutContent />
    </Suspense>
  );
}