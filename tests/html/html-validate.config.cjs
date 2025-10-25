module.exports = {
  extends: [
    "html-validate:recommended",
    "html-validate:document",
    "html-validate:standard"
  ],
  root: true,
  rules: {
    "prefer-native-element": "error",
    "wcag/h32": "error",
    "wcag/h36": "error",
    "wcag/h37": "error",
    "no-implicit-button-type": "error",
    "require-sri": "off",
    "doctype-style": "off",
    "no-redundant-role": "off"
  }
};
