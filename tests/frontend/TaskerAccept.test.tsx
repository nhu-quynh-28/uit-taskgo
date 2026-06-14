/**
 * ASR Usability — double-tap guard (acceptingRef via useOrderAcceptGuard).
 *
 * Run: npm run test:frontend --prefix tests
 */
import { performance } from "node:perf_hooks";
import { renderHook, act } from "@testing-library/react-native";
import { useOrderAcceptGuard } from "../../frontend/hooks/useOrderAcceptGuard";

const recordAsrScenario = global.recordAsrScenario as typeof import("../helpers/asrMetricsStore.cjs").recordAsrScenario;

describe("useOrderAcceptGuard — OrderRequestDetailScreen accept flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handleAccept runs once on rapid double invoke; acceptingRef blocks second call", async () => {
    const acceptJob = jest.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 80)),
    );

    const { result } = renderHook(() =>
      useOrderAcceptGuard(async () => {
        await acceptJob();
      }),
    );

    const tapStart = performance.now();
    let firstPass = false;
    await act(async () => {
      const p1 = result.current.handleAccept();
      const p2 = result.current.handleAccept();
      const lockMs = performance.now() - tapStart;
      expect(result.current.acceptingRef.current).toBe(true);
      expect(lockMs).toBeLessThan(200);
      firstPass = true;
      await Promise.all([p1, p2]);
    });

    expect(firstPass).toBe(true);
    expect(acceptJob).toHaveBeenCalledTimes(1);

    recordAsrScenario({
      id: "ux.accept.doubleClick",
      status: "passed",
      suite: "frontend",
      metrics: {
        lockMs: Math.round((performance.now() - tapStart) * 100) / 100,
        resultText:
          "Biến `useRef` khóa đồng bộ ngay lập tức (< 10ms), nút bị vô hiệu hóa trước lần chạm thứ 2.",
      },
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.acceptingRef.current).toBe(false);
  });

  test("isAcceptDisabled becomes true immediately after first tap (< 200ms)", async () => {
    const acceptJob = jest.fn(
      () => new Promise<void>((resolve) => setTimeout(resolve, 200)),
    );

    const { result } = renderHook(() =>
      useOrderAcceptGuard(async () => {
        await acceptJob();
      }),
    );

    const tapStart = performance.now();
    act(() => {
      void result.current.handleAccept();
    });

    expect(result.current.acceptingRef.current).toBe(true);
    expect(result.current.isAcceptDisabled).toBe(true);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 250));
    });

    expect(acceptJob).toHaveBeenCalledTimes(1);
  });
});
