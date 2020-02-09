module.exports = {
    pagesDir: "./pages",
    outputDir: "./dist",
    componentsDir: "./components",
    props: {
        "people": ["John", "Sam", "Alex"],
    },
    minifyOutput: true,
    helpers: {
        ucase: (string) => string.toUpperCase(),
    }
};
