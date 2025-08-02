// Simple browser log collector for debugging
// Usage: import logCollector and use logCollector.log(...)
// View logs with logCollector.getLogs()

const logCollector = {
  logs: [],
  log(...args) {
    this.logs.push({ type: 'log', message: args, timestamp: new Date().toISOString() });
    console.log(...args);
  },
  error(...args) {
    this.logs.push({ type: 'error', message: args, timestamp: new Date().toISOString() });
    console.error(...args);
  },
  warn(...args) {
    this.logs.push({ type: 'warn', message: args, timestamp: new Date().toISOString() });
    console.warn(...args);
  },
  getLogs() {
    return this.logs;
  },
  clear() {
    this.logs = [];
  }
};

export default logCollector;
