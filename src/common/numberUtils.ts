import _Decimal from "decimal.js";

export const removeNumberTrailingZeros = (num: string): string => {
  return num.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
};

export const Decimal = _Decimal.clone({
  precision: 21,
  rounding: _Decimal.ROUND_DOWN,
});
