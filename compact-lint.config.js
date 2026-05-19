export default {
  // "env": {
  //   "browser": true,
  //   "es2022": true,
  //   "node": true
  // },
  // "extends": [
  //   "eslint:recommended"
  // ],
  // "languageOptions": {
  //   "parserOptions": {
  //     "ecmaVersion": "latest",
  //     "sourceType": "module"
  //   }
  // },
  // "files": ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
  "rules": {
    "indent": ["error", 2, { "SwitchCase": 1, "ignoredNodes": ["ConditionalExpression"] }],
    "linebreak-style": ["error", "unix"],
    "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }],
    "semi": ["error", "always"],
    "no-var": "error",
    "prefer-const": "error",
    "eqeqeq": ["error", "always", { "null": "ignore" }],
    "no-multi-spaces": "error",
    "no-trailing-spaces": "error",
    "space-before-function-paren": ["error", {
      "anonymous": "always",
      "asyncArrow": "always",
      "named": "never"
    }],
    "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_",
      "destructuredArrayIgnorePattern": "^_"
    }],
    "no-console": "error",
    "no-empty": "off",
    "no-extra-boolean-cast": "off",
    "curly": ["error", "multi-line"],
    "arrow-spacing": ["error", { "before": true, "after": true }],
    "no-param-reassign": "off",
    "no-underscore-dangle": "off",
    "consistent-return": "error",
    "complexity": ["warn", 50],
    "comma-dangle": [
      "error",
      {
        "arrays": "only-multiline",
        "objects": "only-multiline",
        "imports": "only-multiline",
        "exports": "only-multiline",
        "functions": "only-multiline",
      }
    ],
    "max-len": [
      "warn",
      {
        "code": 120,
        "ignoreComments": true,
        "ignoreUrls": true,
        "ignoreStrings": true,
        "ignoreTemplateLiterals": true,
        "ignoreRegExpLiterals": true
      }
    ],
    "func-style": "off",
    "default-case": "error",
    "no-duplicate-imports": "error",
    "dot-notation": "error",
    "block-spacing": "error",
    "comma-spacing": ["error", { "before": false, "after": true }],
    "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1, "maxBOF": 0 }],
    "no-constant-condition": "warn",
    "no-constant-binary-expression": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-unused-expressions": "off",
    "@typescript-eslint/no-unused-vars": "off",
  }
}
