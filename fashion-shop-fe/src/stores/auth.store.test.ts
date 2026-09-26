import { describe, expect, it } from "vitest";
import { useAuthStore } from "./auth.store";

describe("auth store hydration", () => {
  it("marks the persisted session as ready after hydration", async () => {
    useAuthStore.setState({ hasHydrated: false });

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });
});
