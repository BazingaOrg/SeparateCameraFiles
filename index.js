const fs = require('fs').promises;
const path = require('path');

// 默认源路径
const DEFAULT_SOURCE_PATH = '/Volumes/Bazinga 12TB/Photos/JPG';

// 默认文件类型（不带点号）
const DEFAULT_FILE_TYPE = 'RW2';

async function moveRawFiles(sourcePath = DEFAULT_SOURCE_PATH, fileTypeInput = DEFAULT_FILE_TYPE) {
    const startTime = Date.now();
    let isRawDirCreated = false;
    
    try {
        // 验证源路径是否存在
        try {
            await fs.access(sourcePath);
        } catch (err) {
            console.error(`错误: 找不到指定路径 "${sourcePath}"`);
            return;
        }
        
        // 解析文件类型输入
        let fileTypes = [];
        let singleFolder = false;
        let folderName = '';
        
        if (fileTypeInput.startsWith('[') && fileTypeInput.endsWith(']')) {
            // 格式 [RW2,MP4] - 所有文件放在同一个文件夹
            singleFolder = true;
            fileTypes = fileTypeInput.slice(1, -1).split(',').map(type => type.trim());
            // 使用所有文件类型组合作为文件夹名称
            folderName = fileTypes.join('+');
        } else {
            // 格式 RW2,MP4 - 分别创建文件夹
            fileTypes = fileTypeInput.split(',').map(type => type.trim());
        }
        
        console.log(`开始处理文件，源路径: ${sourcePath}`);
        let totalFilesByType = {};
        fileTypes.forEach(type => totalFilesByType[type] = 0);
        
        async function processDirectory(currentPath, relativePath = '') {
            let entries;
            try {
                entries = await fs.readdir(currentPath, { withFileTypes: true });
            } catch (err) {
                console.error(`无法读取文件夹 "${currentPath}": ${err.message}`);
                return;
            }
            
            console.log(`正在处理文件夹: ${currentPath}`);
            
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                
                try {
                    if (entry.isDirectory()) {
                        await processDirectory(fullPath, path.join(relativePath, entry.name));
                    } else if (entry.isFile()) {
                        // 获取文件扩展名（去掉点号并转为大写）
                        const fileExt = path.extname(entry.name).replace('.', '').toUpperCase();
                        
                        // 调试输出
                        console.log(`检查文件: ${entry.name}, 扩展名: ${fileExt}`);
                        console.log(`可用的文件类型: ${fileTypes.join(', ')}`);
                        
                        if (fileTypes.includes(fileExt)) {
                            let targetBaseDir;
                            if (singleFolder) {
                                targetBaseDir = path.join(path.dirname(sourcePath), folderName);
                            } else {
                                targetBaseDir = path.join(path.dirname(sourcePath), fileExt);
                            }
                            
                            // 创建目标文件夹（如果不存在）
                            try {
                                if (!isRawDirCreated) {
                                    await fs.mkdir(targetBaseDir).catch(err => {
                                        if (err.code !== 'EEXIST') throw err;
                                    });
                                    isRawDirCreated = true;
                                }
                                
                                const targetPath = path.join(targetBaseDir, relativePath);
                                await fs.mkdir(targetPath, { recursive: true });
                                
                                const targetFile = path.join(targetPath, entry.name);
                                await fs.rename(fullPath, targetFile);
                                totalFilesByType[fileExt] = (totalFilesByType[fileExt] || 0) + 1;
                                console.log(`已移动文件: ${entry.name} 到 ${targetFile}`);
                            } catch (err) {
                                console.error(`处理文件 "${fullPath}" 时出错: ${err.message}`);
                                continue;
                            }
                        }
                    }
                } catch (err) {
                    console.error(`处理 "${fullPath}" 时出错: ${err.message}`);
                    continue;
                }
            }
        }
        
        // 开始处理
        await processDirectory(sourcePath);
        
        // 计算处理时间
        const endTime = Date.now();
        const duration = endTime - startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = ((duration % 60000) / 1000).toFixed(0);
        
        if (Object.keys(totalFilesByType).length === 0) {
            console.log(`未找到任何${fileTypeInput}文件，无需创建目标文件夹。`);
        } else {
            console.log(`\n处理完成！`);
            console.log(`共处理 ${Object.values(totalFilesByType).reduce((a, b) => a + b, 0)} 个${fileTypeInput}文件`);
            console.log(`总耗时: ${minutes}分${seconds}秒`);
        }
        
    } catch (err) {
        console.error(`处理过程中发生错误:`, err);
    }
}

// 从命令行参数获取路径和文件类型
const customPath = process.argv[2];
const customFileType = process.argv[3] || DEFAULT_FILE_TYPE;
moveRawFiles(customPath, customFileType); 