const fs = require('fs').promises;
const path = require('path');
const { DEFAULT_SOURCE_PATH, DEFAULT_FILE_TYPE } = require('./config/defaults');
const { processDirectory } = require('./utils/fileProcessor');
const logger = require('./utils/logger');

/**
 * 移动文件主函数
 * @param {string} sourcePath - 源文件夹路径
 * @param {string} fileTypeInput - 文件类型输入字符串
 */
async function moveRawFiles(sourcePath = DEFAULT_SOURCE_PATH, fileTypeInput = DEFAULT_FILE_TYPE) {
    const startTime = Date.now();

    try {
        // 验证源路径
        await fs.access(sourcePath);

        // 解析文件类型输入
        const { fileTypes, singleFolder, folderName } = parseFileTypeInput(fileTypeInput);

        logger.info(`开始处理文件，源路径: ${sourcePath}`);
        const totalFilesByType = {};
        fileTypes.forEach(type => totalFilesByType[type] = 0);

        // 处理文件
        await processDirectory({
            currentPath: sourcePath,
            fileTypes,
            singleFolder,
            sourcePath,
            folderName,
            totalFilesByType
        });

        // 输出统计信息
        outputStats(totalFilesByType, startTime);

    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.error(`错误: 找不到指定路径 "${sourcePath}"`);
        } else {
            logger.error(`处理过程中发生错误: ${err.message}`);
        }
    }
}

/**
 * 解析文件类型输入
 * @param {string} fileTypeInput - 文件类型输入字符串
 * @returns {Object} 解析结果
 */
function parseFileTypeInput(fileTypeInput) {
    let fileTypes = [];
    let singleFolder = false;
    let folderName = '';

    if (fileTypeInput.startsWith('[') && fileTypeInput.endsWith(']')) {
        singleFolder = true;
        fileTypes = fileTypeInput.slice(1, -1).split(',').map(type => type.trim());
        folderName = fileTypes.join('+');
    } else {
        fileTypes = fileTypeInput.split(',').map(type => type.trim());
    }

    return { fileTypes, singleFolder, folderName };
}

/**
 * 输出统计信息
 * @param {Object} totalFilesByType - 文件统计对象
 * @param {number} startTime - 开始时间
 */
function outputStats(totalFilesByType, startTime) {
    const totalFiles = Object.values(totalFilesByType).reduce((a, b) => a + b, 0);
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);

    if (totalFiles === 0) {
        logger.info('未找到任何指定类型的文件');
    } else {
        logger.stats('\n处理完成！');
        Object.entries(totalFilesByType).forEach(([type, count]) => {
            if (count > 0) {
                logger.stats(`处理了 ${count} 个 ${type} 文件`);
            }
        });
        logger.stats(`总耗时: ${minutes}分${seconds}秒`);
    }
}

// 从命令行参数获取路径和文件类型
const customPath = process.argv[2];
const customFileType = process.argv[3] || DEFAULT_FILE_TYPE;
moveRawFiles(customPath, customFileType); 