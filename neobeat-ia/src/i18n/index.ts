// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pt from "./locales/pt-BR.json";
import en from "./locales/en-US.json";
import es from "./locales/es-ES.json";

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: pt },
    "en-US": { translation: en },
    "es-ES": { translation: es },
  },
  lng: localStorage.getItem("language") || "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
});

export default i18n;