// Doppler injects env at process spawn time. No additional setup.
// JSDOM-specific setup happens via @vitest-environment directive
// at the top of UI test files.

// Auto-cleanup @testing-library/react renders after each test.
// This prevents DOM state from leaking between test files when
// running in singleFork mode.
import "@testing-library/react/pure";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
