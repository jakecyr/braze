module.exports = {
    pagesDir: './pages',
    outputDir: './dist',
    componentsDir: './components',
    props: {
        people: ['John', 'Sam', 'Alex'],
        currentYear: (new Date()).getFullYear(),
    },
    minifyOutput: true,
    helpers: {
        ucase: (string) => string.toUpperCase(),
    }
};
