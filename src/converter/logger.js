// Logger util para o conversor
export async function log(message, level = 'info', config = {}) {
  if (!config.logging?.enabled) return;
  const levels = ['debug', 'info', 'warn', 'error'];
  if (levels.indexOf(level) < levels.indexOf(config.logging.level || 'info')) return;
  const out = `[${new Date().toISOString()}] [${level}] ${message}`;
  // Só loga em arquivo se estiver no Node.js
  if (config.logging.logFile && typeof window === 'undefined') {
    const fs = await import('fs');
    fs.appendFileSync(config.logging.logFile, out + '\n');
  }
  if (typeof window === 'undefined' ? process.env.NODE_ENV !== 'test' : true) {
    console.log(out);
  }
}
