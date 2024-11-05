type LogLevel = 'info' | 'success' | 'error' | 'stats';

interface Logger {
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  stats: (message: string) => void;
}

const logger: Logger = {
  info: (message) => console.log(message),
  success: (message) => console.log('\x1b[32m%s\x1b[0m', message),
  error: (message) => console.error('\x1b[31m%s\x1b[0m', message),
  stats: (message) => console.log('\x1b[36m%s\x1b[0m', message)
};

export default logger; 