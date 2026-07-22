export const materialDictionary = {
  plastic: "Plástico",
  glass: "Vidro",
  metal: "Metal",
  paper: "Papel",
  organic: "Orgânico",
  cardboard: "Papelão",
  "white-glass": "Vidro Branco",
  "green-glass": "Vidro Verde",
  "brown-glass": "Vidro Marrom",
  trash: "Outros",
};

export function translateMaterial(materialClass) {
  if (!materialClass) return "Desconhecido";
  return materialDictionary[materialClass] || materialClass;
}
