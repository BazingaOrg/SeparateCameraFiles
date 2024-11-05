import { promises as fs } from 'fs';
import path from 'path';
import logger from './logger';
import { ProcessOptions } from '../types';
import { Dirent } from 'fs';

async function processDirectory(options: ProcessOptions): Promise<void> {
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
    logger.error(`无法读取文件夹 "${currentPath}": ${(err as Error).message}`);
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
       logger.error(`处理 "${fullPath}" 时出错: ${(err as Error).message}`);
    }
  }
}

interface ProcessFileOptions extends ProcessOptions {
  entry: Dirent;
  fullPath: string;
  relativePath: string;
}

async function processFile(options: ProcessFileOptions): Promise<void> {
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
      logger.error(`处理文件 "${fullPath}" 时出错: ${(err as Error).message}`);
    }
  }
}

export { processDirectory }; 