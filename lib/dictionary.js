export const materialDictionary = {
  plastic: "Plástico",
  glass: "Vidro",
  metal: "Metal",
  paper: "Papel",
  organic: "Orgânico",
  biological: "Orgânico",
  cardboard: "Papelão",
  "white-glass": "Vidro Branco",
  "white glass": "Vidro Branco",
  "green-glass": "Vidro Verde",
  "green glass": "Vidro Verde",
  "brown-glass": "Vidro Marrom",
  "brown glass": "Vidro Marrom",
  trash: "Outros",
};

export function translateMaterial(materialClass) {
  if (!materialClass) return "Desconhecido";
  return materialDictionary[materialClass] || materialClass;
}
