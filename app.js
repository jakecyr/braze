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
function generateStaticFiles(config) {
    return new Promise(async (resolve, reject) => {
        const components = await loadComponents(config.componentsDir);
        const htmlFiles = await findFiles(config.pagesDir + '/**/*.html');

        await setupOutputDirs(config.outputDir);

        const promises = htmlFiles.map((file) => {
            return new Promise(async (resolve, reject) => {
                loadFile(file)
                    .then((data) => {
                        const template = compile(data, { noEscape: true });
                        const compiledHtml = template(components);
                        const newPath = sourceToDistPath(file, config.componentsDir, config.outputDir);
                        const endDir = newPath.substring(0, newPath.lastIndexOf('/'));

                        exists(endDir, async (exists) => {
                            if (!exists) {
                                await setupOutputDirs(endDir);
                            }

                            writeFile(newPath, compiledHtml)
                                .then(resolve)
                                .catch(reject);
                        })
                    })
                    .catch(reject);
            });
        });

        Promise
            .all(promises)
            .then(resolve)
            .catch(reject);
    });
}
function loadComponents(componentsDir) {
    return new Promise((resolve, reject) => {
        findFiles(componentsDir + '/**/*.html')
            .then((components) => {
                const loadedComponents = {};

                const promises = components.map((path) => {
                    const promise = loadFile(path);

                    promise.then(fileData => {

                        const name = getNameFromFilePath(path);

                        console.log(name);

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
function validateConfig(config) {
    const errors = [];

    if (!config.pagesDir) {
        errors.push('Braze Error: No pagesDir property found in config');
    }

    if (!config.outputDir) {
        errors.push('Braze Error: No outputDir property found in config');
    }

    if (config.components) {
        for (let component of config.components) {
            if (!component.name || !component.path) {
                errors.push('Braze Error: Component missing name or path property');
            }
        }
    }

    return {
        valid: errors.length == 0,
        errors,
    };
}
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
