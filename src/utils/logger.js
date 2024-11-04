/**
 * 日志工具
 */
const logger = {
    info: (message) => console.log(message),
    success: (message) => console.log('\x1b[32m%s\x1b[0m', message), // 绿色
    error: (message) => console.error('\x1b[31m%s\x1b[0m', message), // 红色
    stats: (message) => console.log('\x1b[36m%s\x1b[0m', message)    // 青色
};

module.exports = logger; 