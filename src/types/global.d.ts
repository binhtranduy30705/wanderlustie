declare module "../../i18n.config" {
  const i18n: {
    __(key: string, options?: Record<string, any>): string;
  };
  export default i18n;
}
