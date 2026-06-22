import { useEffect, useState } from "react";
import i18n from "../i18n/index";

export const useI18n = () => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  return (key: string) => i18n.t(key);
};