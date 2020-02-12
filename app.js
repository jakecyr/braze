#! /usr/bin/env node

const handlebars = require('handlebars');
const { exists } = require('fs');
const minify = require('minify');
const { resolve } = require('path');

const {
    loadFile,
    writeFile,
    sourceToDistPath,
    findFiles,
    getNameFromFilePath,
    setupOutputDirs,
    copyFile,
} = require('./helpers');

init();

/**
 * Main entry point for the braze compilation
 * @return {void}
 */
async function init() {
    const configFilePath = resolve('./braze.js');
    const config = require(configFilePath);
    const { valid, errors } = validateConfig(config);

    if (valid) {
        await generateStaticFiles(config);
        await moveSecondaryFiles(config);
        console.log('Braze Finished Compiling');
    } else {
        console.log(errors.join('\n'));
    }
}

/**
 * Move secondary (non-HTML) files to the output directory
 * @param {object} config braze.js config file
 * @return {Promise<void>}
 */
function moveSecondaryFiles(config) {
    return new Promise(async (resolve, reject) => {
        const results = await findFiles(`${config.pagesDir}/**/*`, {
            ignore: config.pagesDir + '/**/*.html',
        });

        const directories = [];
        const files = [];

        results
            .filter((file) => {
                return file
                    .slice(file.lastIndexOf('/') + 1)
                    .includes('.');
            })
            .forEach((file) => {
                const dirPath = file.slice(0, file.lastIndexOf('/'));
                const newDir = sourceToDistPath(dirPath, config.pagesDir, config.outputDir);

                directories.push(newDir);

                files.push({
                    source: file,
                    output: sourceToDistPath(file, config.pagesDir, config.outputDir),
                });
            });

        const dirPromises = directories
            .sort((a, b) => a.localeCompare(b))
            .map((directory) => setupOutputDirs(directory, false));

        await Promise.all(dirPromises);

        const filePromises = files.map((file) => copyFile(file.source, file.output));

        await Promise.all(filePromises);

        resolve();
    });
}

/**
 * Generate static files using the configuration params from the braze.js file
 * @param {object} config Parsed braze.js config file
 * @return {Promise<void>}
 */
function generateStaticFiles(config) {
    return new Promise(async (resolve, reject) => {
        const components = await loadComponents(config.componentsDir);
        const htmlFiles = await findFiles(config.pagesDir + '/**/*.html');

        const context = {
            ...(components || {}),
            ...(config.props || {}),
        };

        addHelpers(config.helpers);

        await setupOutputDirs(config.outputDir, true);

        const promises = htmlFiles.map((file) => compileFile(config, file, context));

        Promise
            .all(promises)
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Add all helpers to the handlebars object
 * @param {object} helpers Object of key / value (name / helper functions) from the config file
 * @return {void}
 */
function addHelpers(helpers) {
    if (helpers) {
        for (const key in helpers) {
            if (helpers.hasOwnProperty(key)) {
                handlebars.registerHelper(key, helpers[key]);
            }
        }
    }
}

/**
 * Compile the referenced file using the component context
 * @param {object} config Parsed braze.js config file
 * @param {string} filePath Path of the file to compile
 * @param {object} componentContext Loaded components with their contents
 * @return {void}
 */
function compileFile(config, filePath, componentContext) {
    return new Promise(async (resolve, reject) => {
        const fileContents = await (config.minifyOutput ? minify : loadFile)(filePath);
        const template = handlebars.compile(fileContents, { noEscape: true });
        const compiledHtml = template(componentContext);
        const newPath = sourceToDistPath(filePath, config.pagesDir, config.outputDir);
        const endDir = newPath.substring(0, newPath.lastIndexOf('/'));

        exists(endDir, async (exists) => {
            let promise = null;

            if (!exists) {
                promise = setupOutputDirs(endDir, false);
            } else {
                promise = Promise.resolve();
            }

            await promise;

            writeFile(newPath, compiledHtml)
                .then(resolve)
                .catch(reject);
        });
    });
}

/**
 * Load all component contents using the directory listed in the config file
 * @param {string} componentsDir The directory to look for HTML components in
 * @return {Promise<object>}
 */
function loadComponents(componentsDir) {
    return new Promise((resolve, reject) => {
        findFiles(componentsDir + '/**/*.html')
            .then((components) => {
                const loadedComponents = {};

                const promises = components.map((path) => {
                    const promise = loadFile(path);

                    promise.then((fileData) => {
                        const name = getNameFromFilePath(path);

                        loadedComponents[name] = fileData
                            .replace(/[\n]/, '')
                            .trim();
                    });

                    return promise;
                });

                Promise
                    .all(promises)
                    .then(() => resolve(loadedComponents))
                    .catch(reject);
            })
            .catch(reject);
    });
}

/**
 * Validate the configuration file is valid
 * @param {object} config The entire parsed braze.js config object
 * @return {boolean} Whether the config file is valid or not
 */
function validateConfig(config) {
    const errors = [];

    if (!config.pagesDir) {
        errors.push('Braze Error: No pagesDir property found in config');
    }

    if (!config.outputDir) {
        errors.push('Braze Error: No outputDir property found in config');
    }

    return {
        valid: errors.length == 0,
        errors,
    };
}
