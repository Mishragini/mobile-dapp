// global.d.ts
declare global {
    var Buffer: typeof import('buffer').Buffer;
    var assert: typeof import('assert');
}

export { };