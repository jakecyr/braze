const glob = require('glob');
const { readFile, writeFile, rmdir } = require('fs');
const mkdirp = require('mkdirp');

exports.loadFile = (filePath) => {
    return new Promise((resolve, reject) => {
        readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString());
            }
        });
    });
};

exports.writeFile = (filePath, contents) => {
    return new Promise((resolve) => {
        writeFile(filePath, contents, resolve);
    });
};

/**
 * 
 * @param {string} filePath
 * @param {string} sourcePath
 * @param {string} distPath
 */
exports.sourceToDistPath = (filePath, sourcePath, distPath) => {
    const basePath = filePath
        .replace(sourcePath, distPath)
        .split('/')
        .filter(part => part !== '' && part !== '.')
        .join('/');

    return basePath;
};

exports.findFiles = (searchExpression) => {
    return new Promise((resolve, reject) => {
        glob(searchExpression, (err, matches) => {
            if (err) {
                reject(err);
            } else {
                resolve(matches);
            }
        });
    });
};

/**
 * 
 * @param {string} filePath 
 */
exports.getNameFromFilePath = (filePath) => {
    return filePath
        .slice(filePath.lastIndexOf('/') + 1)
        .split('.')
        .shift();
};

exports.setupOutputDirs = (outputDir, removeFirst = true) => {
    return new Promise((resolve, reject) => {
        if (removeFirst) {
            rmdir(outputDir, () => {
                mkdirp(outputDir)
                    .then(resolve)
                    .catch(reject);
            });
        } else {
            mkdirp(outputDir)
                .then(resolve)
                .catch(reject);
        }
    });
};
