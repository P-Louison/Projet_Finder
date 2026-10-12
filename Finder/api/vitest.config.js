export default {
  test: {
    globals: true,
    environment: "node",
    coverage: {
      include: ["src/routes/**/*.js"],
      reporter: [["text", { skipFull: false }], "text-summary"],
    },
  },
};