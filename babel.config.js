
module.exports = {
  "presets": [
      "@babel/preset-env",
    [
    "@babel/preset-react",
    {
      "runtime": "automatic",
      "development": process.env.WEBPACK_SERVE === 'true',
    }
  ],
      "@babel/preset-typescript"
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread"
  ]
}
