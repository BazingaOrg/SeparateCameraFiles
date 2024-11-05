import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_SOURCE_PATH, DEFAULT_FILE_TYPE } from './config/defaults';
import { processDirectory } from './utils/fileProcessor';
import logger from './utils/logger';
import { FileTypeConfig } from './types';

async function moveRawFiles(
  sourcePath: string = DEFAULT_SOURCE_PATH,
  fileTypeInput: string = DEFAULT_FILE_TYPE
): Promise<void> {
  const startTime = Date.now();

  try {
    await fs.access(sourcePath);

    const { fileTypes, singleFolder, folderName } = parseFileTypeInput(fileTypeInput);

    logger.info(`开始处理文件，源路径: ${sourcePath}`);
    const totalFilesByType: Record<string, number> = {};
    fileTypes.forEach(type => totalFilesByType[type] = 0);

    await processDirectory({
      currentPath: sourcePath,
      fileTypes,
      singleFolder,
      sourcePath,
      folderName,
      totalFilesByType
    });

    outputStats(totalFilesByType, startTime);

  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.error(`错误: 找不到指定路径 "${sourcePath}"`);
    } else {
      logger.error(`处理过程中发生错误: ${(err as Error).message}`);
    }
  }
}

function parseFileTypeInput(fileTypeInput: string): FileTypeConfig {
  let fileTypes: string[] = [];
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

function outputStats(totalFilesByType: Record<string, number>, startTime: number): void {
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

const customPath = process.argv[2];
const customFileType = process.argv[3] || DEFAULT_FILE_TYPE;
moveRawFiles(customPath, customFileType); 