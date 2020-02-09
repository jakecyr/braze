#! /usr/bin/env node

const { compile } = require('handlebars');
const { exists } = require('fs');

const {
    loadFile,
    writeFile,
    sourceToDistPath,
    findFiles,
    getNameFromFilePath,
    setupOutputDirs,
} = require('./helpers');

init();

///////////////

/**
 * Main entry point for the braze compilation
 */
async function init() {
    const config = await loadConfig();
    const { valid, errors } = validateConfig(config);

    if (valid) {
        await generateStaticFiles(config);
        console.log('Braze Finished Compiling')
    } else {
        console.log(errors.join('\n'));
    }
}

/**
 * Generate static files using the configuration params from the braze.json file
 * @param {object} config Parsed braze.json config file
 */
function generateStaticFiles(config) {
    return new Promise(async (resolve, reject) => {
        const components = await loadComponents(config.componentsDir);
        const htmlFiles = await findFiles(config.pagesDir + '/**/*.html');

        const context = {
            ...(components || {}),
            ...(config.props || {}),
        };

        await setupOutputDirs(config.outputDir, true);

        const promises = htmlFiles.map((file) => compileFile(config, file, context));

        Promise
            .all(promises)
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Compile the referenced file using the component context
 * @param {object} config Parsed braze.json config file
 * @param {string} filePath Path of the file to compile
 * @param {object} componentContext Loaded components with their contents
 */
function compileFile(config, filePath, componentContext) {
    return new Promise(async (resolve, reject) => {
        loadFile(filePath)
            .then((fileContents) => {
                const template = compile(fileContents, { noEscape: true });
                const compiledHtml = template(componentContext);
                const newPath = sourceToDistPath(filePath, config.componentsDir, config.outputDir);
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
                })
            })
            .catch(reject);
    });
}

/**
 * Load all component contents using the directory listed in the config file
 * @param {string} componentsDir The directory to look for HTML components in
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
 * @param {object} config The entire parsed braze.json config object
 * @returns {boolean} Whether the config file is valid or not
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

/**
 * Load the braze.json configuration file contents
 * @returns {Promise<object>} Resolves to the parsed braze.json file contents
 */
function loadConfig() {
    return new Promise((resolve, reject) => {
        loadFile('./braze.json')
            .then(fileData => {
                try {
                    const json = JSON.parse(fileData.toString());
                    resolve(json);
                } catch (e) {
                    reject('Braze Error: Error parsing file, invalid braze.json');
                }
            })
            .catch(() => reject('Braze Error: Error loading braze.json file'));
    });
}
