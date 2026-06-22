import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as React from "react";
import pt from "./locales/pt-BR.json";
import en from "./locales/en-US.json";
import es from "./locales/es-ES.json";

// Garante que o i18next usa o mesmo React
(i18n as any).__reactInstance = React;

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: pt },
    "en-US": { translation: en },
    "es-ES": { translation: es },
  },
  lng: localStorage.getItem("language") ?? "pt-BR",
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
});

export default i18n;