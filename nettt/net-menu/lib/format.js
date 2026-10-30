const DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function price(n, lang) {
  const s = n.toLocaleString("en-US");
  if (lang === "en") return s;
  return s.replace(/\d/g, (d) => DIGITS[d]).replace(/,/g, "٬");
}

export function imgPath(path) {
  const p = String(path || "").trim().replace(/\\/g, "/");
  return p ? encodeURI(p) : "";
}
