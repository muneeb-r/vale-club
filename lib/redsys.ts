import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS } from "redsys-easy";

export { randomTransactionId, isResponseCodeOk } from "redsys-easy";

let _redsys: ReturnType<typeof createRedsysAPI> | null = null;

export function getRedsys() {
  if (!_redsys) {
    const secretKey = process.env.REDSYS_SECRET_KEY;
    if (!secretKey) throw new Error("REDSYS_SECRET_KEY is not set");
    _redsys = createRedsysAPI({
      secretKey,
      urls: process.env.REDSYS_ENV === "production" ? PRODUCTION_URLS : SANDBOX_URLS,
    });
  }
  return _redsys;
}

// Backwards-compat alias used by existing routes
export const redsys = new Proxy({} as ReturnType<typeof createRedsysAPI>, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getRedsys() as any)[prop];
  },
});
