export default {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // keep viewBox — required for correct scaling in <img> tags
          removeViewBox: false,
        },
      },
    },
  ],
}
