# BÁO CÁO KIẾN TRÚC & NGHIỆM THU CHẤT LƯỢNG LUỒNG ĐẶT HÀNG (TASKGO MVP)
> **Thời gian xuất báo cáo:** 2026-05-27T18:04:17.733Z
> **Trạng thái tổng thể bộ test:** 🟢 PASSED ALL SUITES

## SƠ ĐỒ CÂY THUỘC TÍNH CHẤT LƯỢNG & KẾT QUẢ ĐO ĐẠC (UTILITY TREE MATRIX)

* 🌐 **TaskGo MVP Utility Tree**
  │
  ├── 🚀 **1. Performance (Hiệu năng)**
  │   ├── 🔹 *API Response Time (Luồng cốt lõi)*
  │   │   └── Kịch bản (ASR): API GET (Dịch vụ) < 500ms | API POST/PUT (Đặt/Cập nhật đơn) < 1.5s (Single-node).
  │   │       📌 **Độ ưu tiên:** (H, L) 
  │   │       ⏱️ **Thời gian Test thực tế:**
  │   │           - GET API: `1.8ms`
  │   │           - POST/PUT API: `2ms`
  │   │       ✅ **Trạng thái:** [PASSED]
  │   │
  │   └── 🔹 *Real-time notification latency*
  │       └── Kịch bản (ASR): Khách đặt đơn -> Socket.IO đẩy `new_order` tới Tasker trong bán kính 10km < 1s (≤ 5 thiết bị).
  │           📌 **Độ ưu tiên:** (H, M)
  │           ⏱️ **Thời gian Test thực tế:** `1.9ms`
  │           ✅ **Trạng thái:** [PASSED]
  │
  ├── 🔒 **2. Security (Bảo mật)**
  │   ├── 🔹 *Authentication & Authorization*
  │   │   └── Kịch bản (ASR): JWT tập trung tại Router. Sai/thiếu token từ chối HTTP 401 < 100ms.
  │   │       📌 **Độ ưu tiên:** (H, L)
  │   │       ⏱️ **Thời gian Test thực tế:** `8.7ms`
  │   │       ✅ **Trạng thái:** [PASSED]
  │   │
  │   ├── 🔹 *Pricing Data Integrity*
  │   │   └── Kịch bản (ASR): Backend tự tính giá dựa trên loại dịch vụ, chặn hoàn toàn việc tin tưởng `payload.price` từ Client.
  │   │       📌 **Độ ưu tiên:** (H, M)
  │   │       ⏱️ **Kết quả thực tế:** Hệ thống tự động xóa payload giả, tính lại đúng giá chuẩn từ DB (subtotal 49 USD, total 59 USD).
  │   │       ✅ **Trạng thái:** [PASSED]
  │   │
  │   └── 🔹 *Data Integrity under Concurrency*
  │       └── Kịch bản (ASR): Race Condition (2 Tasker cùng nhận 1 đơn) -> 1 người thắng (200), 1 người nhận xung đột (409).
  │           📌 **Độ ưu tiên:** (H, L)
  │           ⏱️ **Kết quả thực tế:** Thử nghiệm bắn đồng thời 2 request. Kết quả: [1 Request đạt 200 | 1 Request đạt 409].
  │           ✅ **Trạng thái:** [PASSED]
  │
  ├── 🎨 **3. Usability (Trải nghiệm UI Mobile)**
  │   └── 🔹 *Feedback & System Status (Chặn Double-click)*
  │       └── Kịch bản (ASR): Tasker bấm "Nhận đơn" -> Nút chuyển disabled + loading < 200ms qua biến `useRef`, chặn trùng request.
  │           📌 **Độ ưu tiên:** (M, L)
  │           ⏱️ **Kết quả Test component:** Biến `useRef` khóa đồng bộ ngay lập tức (< 10ms), nút bị vô hiệu hóa trước lần chạm thứ 2.
  │           ✅ **Trạng thái:** [PASSED]
  │
  ├── ⚡ **4. Availability (Độ sẵn sàng)**
  │   ├── 🔹 *Graceful Degradation (Xử lý lỗi cổng thanh toán)*
  │   │   └── Kịch bản (ASR): Gọi PayOS lỗi/treo > 5s -> Tự động chuyển đơn sang `pending_payment` thông qua timeout wrapper.
  │   │       📌 **Độ ưu tiên:** (M, M)
  │   │       ⏱️ **Thời gian ngắt thực tế:** Kích hoạt ngắt dòng code sau `5000ms`, bảo toàn dữ liệu đơn hàng.
  │   │       ✅ **Trạng thái:** [PASSED]
  │   │
  │   └── 🔹 *Socket Reconnection Recovery*
  │       └── Kịch bản (ASR): Mất mạng < 10s -> Tự động kết nối lại không cần user tương tác, UI hiển thị banner "Reconnecting...".
  │           📌 **Độ ưu tiên:** (M, L)
  │           ⏱️ **Kết quả thực tế:** Socket client bật flag `reconnection: true`. Màn hình render banner chính xác khi ngắt mạng giả lập (`ConnectionBanner`).
  │           ✅ **Trạng thái:** [PASSED]
  │
  └── 🛠️ **5. Maintainability (Khả năng bảo trì)**
      └── 🔹 *Modifiability (Cô lập thay đổi)*
          └── Kịch bản (ASR): Chiết khấu hoa hồng cô lập trong module `EarningTasker`. Đổi tỷ lệ không ảnh hưởng logic `Order`.
              📌 **Độ ưu tiên:** (M, L)
              ⏱️ **Kết quả rà soát cấu trúc:** Khớp 100%. Module `Order` gọi `earningService.recordEarningForCompletedOrder`, logic tính toán nằm trọn vẹn trong `EarningTasker`.
              ✅ **Trạng thái:** [PASSED]

---
*Báo cáo được sinh tự động từ `tests/results/asr-metrics.jsonl` — chạy `npm test` hoặc `node tests/scripts/generate-asr-report.cjs` để cập nhật.*
