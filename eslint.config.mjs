import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["iweos-lovable/**", "template/**", "websiteTemplate/**"],
  },
  ...nextVitals,
];

export default config;
