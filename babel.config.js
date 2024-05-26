module.exports = api => {
  const isTest = api.env('test');

  return {
    "presets": [
      "@babel/preset-env",
    [
    "@babel/preset-react",
    {
      "runtime": "automatic",
      development: process.env.NODE_ENV === 'development'
    }
  ],
      "@babel/preset-typescript"
    ],
    "plugins": [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-object-rest-spread"
    ]
  }
}
