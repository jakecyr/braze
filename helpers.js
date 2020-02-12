const glob = require('glob');
const { readFile, writeFile, rmdir, copyFile } = require('fs');
const mkdirp = require('mkdirp');

/**
 * Copy source file to new location
 * @param {string} from source file to copy from
 * @param {string} to destination for source file
 * @return {Promise<void>}
 */
exports.copyFile = (from, to) => {
    return new Promise((resolve) => copyFile(from, to, resolve));
};

/**
 * Load file from the referenced file path
 * @param {string} filePath path of the file to load
 * @return {Promise<string>} promise that resolves to the file contents
 */
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

/**
 * Write a file to the referenced path with the specified contents
 * @param {string} filePath path to write the data to
 * @param {string} contents file contents to write
 * @return {Promise<void>}
 */
exports.writeFile = (filePath, contents) => {
    return new Promise((resolve) => {
        writeFile(filePath, contents, resolve);
    });
};

/**
 * Convert a source file path the output file path
 * @param {string} filePath Current path of the file (with source path)
 * @param {string} sourcePath Original file source path
 * @param {string} distPath New output path
 * @return {string} The updated file path pointing to the output directory
 */
exports.sourceToDistPath = (filePath, sourcePath, distPath) => {
    const basePath = filePath
        .replace(sourcePath, distPath)
        .split('/')
        .filter((part) => part !== '' && part !== '.')
        .join('/');

    return basePath;
};

/**
 * Find files given an expression and optional options
 * @param {string} searchExpression the search expression to find files
 * @param {object} extra optional extra options to pass the glob search function
 * @return {Promise<string[]>} array of matching files
 */
exports.findFiles = (searchExpression, extra = {}) => {
    return new Promise((resolve, reject) => {
        glob(searchExpression, extra, (err, matches) => {
            if (err) {
                reject(err);
            } else {
                resolve(matches);
            }
        });
    });
};

/**
 * Get the file name from a given path (extension also removed)
 * @param {string} filePath The path of the file
 * @return {string} File name
 */
exports.getNameFromFilePath = (filePath) => {
    return filePath
        .slice(filePath.lastIndexOf('/') + 1)
        .split('.')
        .shift();
};

/**
 * Make sure the directories are created for the given path
 * @param {string} outputDir the path to recursively add folders for
 * @param {boolean} removeFirst Whether or not to remove the directory first
 * @return {Promise<void>}
 */
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
