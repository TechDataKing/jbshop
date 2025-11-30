export const getIcon = (name: string) => {
  const n = name.toLowerCase();

  if (n.includes("sugar")) return "cube-outline";
  if (n.includes("salt")) return "bowl-mix-outline";
  if (n.includes("tea")) return "tea";
  if (n.includes("milk")) return "bottle-soda-outline";
  if (n.includes("rice")) return "sack";
  if (n.includes("flour") || n.includes("unga") || n.includes("maize")) return "baguette";
  if (n.includes("bread")) return "bread-slice";
  if (n.includes("water")) return "cup-water";
  if (n.includes("oil") || n.includes("fat")) return "oil-outline";
  if (n.includes("beans") || n.includes("peas")) return "grain";
  if (n.includes("soap") || n.includes("omo") || n.includes("detergent")) return "soap";
  if (n.includes("battery")) return "battery";
  if (n.includes("tooth")) return "toothbrush";
  if (n.includes("cream")) return "bottle-tonic";
  if (n.includes("match")) return "fire";
  if (n.includes("soda")) return "bottle-soda";
  if (n.includes("juice")) return "cup";
  if (n.includes("biscuit") || n.includes("snack")) return "cookie";
  if (n.includes("candle")) return "candle";
  if (n.includes("spice")) return "spice";
  if (n.includes("phone") || n.includes("airtime")) return "cellphone";

  return "shopping-outline";
};
