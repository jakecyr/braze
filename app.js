#! /usr/bin/env node

const handlebars = require('handlebars');
const glob = require('glob');
const fs = require('fs');

init();

///////////////

async function init() {
    const config = await loadConfig();
    const { valid, errors } = validateConfig(config);

    if (valid) {
        await compile(config);
        console.log('Braze Finished Compiling')
    } else {
        console.log(errors.join('\n'));
    }
}
function compile(config) {
    return new Promise(async (resolve, reject) => {
        const components = await loadComponents(config.components);
        const htmlFiles = await findFiles(config.pagesDir + '/**/*.html');

        await setupOutputDirs(config.outputDir);

        const promises = htmlFiles.map((file) => {
            return new Promise(async (resolve, reject) => {
                loadFile(file)
                    .then((data) => {
                        const template = handlebars.compile(data);
                        const compiledHtml = template(components);
                        const newPath = sourceToDistPath(file, config.outputDir);

                        const endDir = newPath.substring(0, newPath.lastIndexOf('/'));

                        fs.exists(endDir, async (exists) => {
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
function loadComponents(components) {
    return new Promise((resolve, reject) => {
        const loadedComponents = {};

        const promises = components.map(({ name, path }) => {
            const promise = loadFile(path);
            promise.then(fileData => {
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
function loadFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    })
}
function writeFile(filePath, contents) {
    return new Promise((resolve) => {
        fs.writeFile(filePath, contents, resolve);
    });
}
function sourceToDistPath(filePath, distPath) {
    const basePath = filePath
        .split('/')
        .filter(part => part !== '' && part !== '.')
        .slice(1)
        .join('/');

    return distPath + '/' + basePath;
}
function findFiles(searchExpression) {
    return new Promise((resolve, reject) => {
        glob(searchExpression, (err, matches) => {
            if (err) {
                reject(err);
            } else {
                resolve(matches);
            }
        });
    });
}
function setupOutputDirs(outputDir) {
    return new Promise((resolve) => {
        fs.rmdir(outputDir, () => {
            fs.mkdir(outputDir, () => {
                resolve();
            });
        });
    });
}
