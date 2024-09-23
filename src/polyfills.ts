import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import { Buffer } from "buffer";
import assert from "assert";  // Polyfill for 'assert'

global.Buffer = Buffer;
global.assert = assert;

// getRandomValues polyfill
class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new Crypto();

(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();
