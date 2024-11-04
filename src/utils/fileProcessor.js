const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * 处理单个文件夹中的文件
 * @param {Object} options - 处理选项
 * @param {string} options.currentPath - 当前处理的文件夹路径
 * @param {string} options.relativePath - 相对路径
 * @param {string[]} options.fileTypes - 要处理的文件类型数组
 * @param {boolean} options.singleFolder - 是否将所有文件放在同一个文件夹
 * @param {string} options.sourcePath - 源文件夹路径
 * @param {string} options.folderName - 目标文件夹名称
 * @param {Object} options.totalFilesByType - 文件统计对象
 * @returns {Promise<void>}
 */
async function processDirectory(options) {
    const {
        currentPath,
        relativePath = '',
        fileTypes,
        singleFolder,
        sourcePath,
        folderName,
        totalFilesByType
    } = options;

    let entries;
    try {
        entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (err) {
        logger.error(`无法读取文件夹 "${currentPath}": ${err.message}`);
        return;
    }

    logger.info(`正在处理文件夹: ${currentPath}`);

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        try {
            if (entry.isDirectory()) {
                await processDirectory({
                    ...options,
                    currentPath: fullPath,
                    relativePath: path.join(relativePath, entry.name)
                });
            } else if (entry.isFile()) {
                await processFile({
                    entry,
                    fullPath,
                    relativePath,
                    ...options
                });
            }
        } catch (err) {
            logger.error(`处理 "${fullPath}" 时出错: ${err.message}`);
        }
    }
}

/**
 * 处理单个文件
 * @param {Object} options - 处理选项
 */
async function processFile(options) {
    const {
        entry,
        fullPath,
        relativePath,
        fileTypes,
        singleFolder,
        sourcePath,
        folderName,
        totalFilesByType
    } = options;

    const fileExt = path.extname(entry.name).replace('.', '').toUpperCase();
    
    if (fileTypes.includes(fileExt)) {
        const targetBaseDir = singleFolder
            ? path.join(path.dirname(sourcePath), folderName)
            : path.join(path.dirname(sourcePath), fileExt);

        try {
            await fs.mkdir(targetBaseDir, { recursive: true });
            const targetPath = path.join(targetBaseDir, relativePath);
            await fs.mkdir(targetPath, { recursive: true });

            const targetFile = path.join(targetPath, entry.name);
            await fs.rename(fullPath, targetFile);
            
            totalFilesByType[fileExt] = (totalFilesByType[fileExt] || 0) + 1;
            logger.success(`已移动文件: ${entry.name} 到 ${targetFile}`);
        } catch (err) {
            logger.error(`处理文件 "${fullPath}" 时出错: ${err.message}`);
        }
    }
}

module.exports = {
    processDirectory
}; 