import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Clock, 
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    audioLatency: 0,
    midiProcessingTime: 0
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceLog, setPerformanceLog] = useState([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const monitoringIntervalRef = useRef(null);

  // Start performance monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // FPS monitoring
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        setMetrics(prev => ({ ...prev, fps }));
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      if (isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
    
    // Memory and other metrics monitoring
    monitoringIntervalRef.current = setInterval(() => {
      // Memory usage (if available)
      if (performance.memory) {
        const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
      
      // Measure render time
      const renderStart = performance.now();
      // Simulate some work
      setTimeout(() => {
        const renderTime = performance.now() - renderStart;
        setMetrics(prev => ({ ...prev, renderTime: Math.round(renderTime) }));
      }, 0);
      
      // Log performance snapshot
      const timestamp = new Date().toLocaleTimeString();
      setPerformanceLog(prev => [
        ...prev.slice(-19), // Keep last 20 entries
        {
          timestamp,
          fps: metrics.fps,
          memory: metrics.memoryUsage,
          renderTime: metrics.renderTime
        }
      ]);
    }, 1000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
  };

  // Measure page load time
  useEffect(() => {
    const loadTime = performance.timing ? 
      performance.timing.loadEventEnd - performance.timing.navigationStart : 0;
    setMetrics(prev => ({ ...prev, loadTime: Math.round(loadTime) }));
  }, []);

  // Performance assessment
  const getPerformanceStatus = (metric, value) => {
    const thresholds = {
      fps: { good: 55, warning: 30 },
      memoryUsage: { good: 50, warning: 100 },
      loadTime: { good: 2000, warning: 5000 },
      renderTime: { good: 16, warning: 33 }
    };
    
    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.warning) return 'warning';
    return 'poor';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // Performance recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.fps < 30) {
      recommendations.push('Low FPS detected. Consider reducing visual effects or optimizing animations.');
    }
    
    if (metrics.memoryUsage > 100) {
      recommendations.push('High memory usage. Check for memory leaks in MIDI processing or audio components.');
    }
    
    if (metrics.loadTime > 5000) {
      recommendations.push('Slow load time. Consider code splitting or lazy loading of components.');
    }
    
    if (metrics.renderTime > 33) {
      recommendations.push('Slow render time. Optimize component re-renders and use React.memo where appropriate.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! All metrics are within acceptable ranges.');
    }
    
    return recommendations;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Performance Monitor</h1>
            <p className="text-green-200">Real-time application performance metrics</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={isMonitoring ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">FPS</span>
                </div>
                {getStatusIcon(getPerformanceStatus('fps', metrics.fps))}
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus('fps', metrics.fps))}`}>
                {metrics.fps}
              </div>
              <div className="text-xs text-slate-400">Frames per second</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Memory</span>
                </div>
                {getStatusIcon(getPerformanceStatus('memoryUsage', metrics.memoryUsage))}
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus('memoryUsage', metrics.memoryUsage))}`}>
                {metrics.memoryUsage}MB
              </div>
              <div className="text-xs text-slate-400">Heap usage</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-white">Load Time</span>
                </div>
                {getStatusIcon(getPerformanceStatus('loadTime', metrics.loadTime))}
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus('loadTime', metrics.loadTime))}`}>
                {(metrics.loadTime / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-slate-400">Initial load</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Render</span>
                </div>
                {getStatusIcon(getPerformanceStatus('renderTime', metrics.renderTime))}
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(getPerformanceStatus('renderTime', metrics.renderTime))}`}>
                {metrics.renderTime}ms
              </div>
              <div className="text-xs text-slate-400">Render time</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Log */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Log</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {performanceLog.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  Start monitoring to see performance data
                </p>
              ) : (
                performanceLog.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-slate-700/30 rounded px-3 py-2">
                    <span className="text-slate-300">{entry.timestamp}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-blue-400">{entry.fps} FPS</span>
                      <span className="text-purple-400">{entry.memory}MB</span>
                      <span className="text-green-400">{entry.renderTime}ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Recommendations</h3>
            <div className="space-y-3">
              {getRecommendations().map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded">
                  <Activity className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-300 text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-white mb-2">Browser Information</h4>
                <div className="space-y-1 text-slate-300">
                  <p>User Agent: {navigator.userAgent.split(' ')[0]}</p>
                  <p>Platform: {navigator.platform}</p>
                  <p>Language: {navigator.language}</p>
                  <p>Online: {navigator.onLine ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Performance API</h4>
                <div className="space-y-1 text-slate-300">
                  <p>Memory API: {performance.memory ? 'Available' : 'Not available'}</p>
                  <p>Navigation Timing: {performance.timing ? 'Available' : 'Not available'}</p>
                  <p>Resource Timing: {performance.getEntriesByType ? 'Available' : 'Not available'}</p>
                  <p>High Resolution Time: {performance.now ? 'Available' : 'Not available'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMonitor;

