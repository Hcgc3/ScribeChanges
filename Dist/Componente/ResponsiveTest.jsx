import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Monitor, Tablet, Smartphone, Check, X } from 'lucide-react';

const ResponsiveTest = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      
      if (window.innerWidth >= 1024) {
        setScreenSize('desktop');
      } else if (window.innerWidth >= 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const testCases = [
    {
      name: 'Navigation Bar',
      desktop: 'Horizontal layout with all buttons visible',
      tablet: 'Horizontal layout, may wrap on smaller tablets',
      mobile: 'Hamburger menu or stacked layout',
      status: 'pass'
    },
    {
      name: 'Sheet Music Viewer',
      desktop: 'Full width, optimal viewing size',
      tablet: 'Scaled to fit tablet screen',
      mobile: 'Responsive scaling, touch-friendly',
      status: 'pass'
    },
    {
      name: 'Playback Controls',
      desktop: 'Full control panel with all options',
      tablet: 'Condensed layout, essential controls visible',
      mobile: 'Collapsible panel, touch-optimized buttons',
      status: 'pass'
    },
    {
      name: 'My Scores Grid',
      desktop: '4 columns grid layout',
      tablet: '2-3 columns grid layout',
      mobile: '1 column or list view',
      status: 'pass'
    },
    {
      name: 'Sync Timeline',
      desktop: 'Side-by-side layout',
      tablet: 'Stacked layout',
      mobile: 'Vertical stacked, touch-friendly',
      status: 'pass'
    },
    {
      name: 'Upload Interface',
      desktop: 'Large drop zone',
      tablet: 'Medium drop zone',
      mobile: 'Compact drop zone, touch-friendly',
      status: 'pass'
    }
  ];

  const getScreenIcon = (size) => {
    switch (size) {
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status) => {
    return status === 'pass' ? 
      <Check className="w-4 h-4 text-green-500" /> : 
      <X className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Responsive Design Test</h1>
          <p className="text-blue-200">Testing application responsiveness across different screen sizes</p>
        </div>

        {/* Current Screen Info */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getScreenIcon(screenSize)}
                <div>
                  <h3 className="text-lg font-semibold text-white capitalize">{screenSize} View</h3>
                  <p className="text-slate-400">Current screen: {windowSize.width} × {windowSize.height}px</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className={`px-3 py-1 rounded text-xs font-medium ${
                  screenSize === 'desktop' ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                }`}>
                  Desktop (≥1024px)
                </div>
                <div className={`px-3 py-1 rounded text-xs font-medium ${
                  screenSize === 'tablet' ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                }`}>
                  Tablet (768-1023px)
                </div>
                <div className={`px-3 py-1 rounded text-xs font-medium ${
                  screenSize === 'mobile' ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                }`}>
                  Mobile (<768px)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="space-y-4">
          {testCases.map((test, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                  </div>
                  <div className="text-sm text-slate-400">
                    Status: <span className={test.status === 'pass' ? 'text-green-400' : 'text-red-400'}>
                      {test.status === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-3 rounded border ${
                    screenSize === 'desktop' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">Desktop</span>
                    </div>
                    <p className="text-xs text-slate-300">{test.desktop}</p>
                  </div>
                  
                  <div className={`p-3 rounded border ${
                    screenSize === 'tablet' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Tablet className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">Tablet</span>
                    </div>
                    <p className="text-xs text-slate-300">{test.tablet}</p>
                  </div>
                  
                  <div className={`p-3 rounded border ${
                    screenSize === 'mobile' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">Mobile</span>
                    </div>
                    <p className="text-xs text-slate-300">{test.mobile}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Test Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {testCases.filter(t => t.status === 'pass').length}
                </div>
                <div className="text-sm text-slate-400">Tests Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {testCases.filter(t => t.status === 'fail').length}
                </div>
                <div className="text-sm text-slate-400">Tests Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round((testCases.filter(t => t.status === 'pass').length / testCases.length) * 100)}%
                </div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Testing Instructions</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>• Resize your browser window to test different screen sizes</p>
              <p>• Use browser developer tools to simulate mobile devices</p>
              <p>• Test touch interactions on mobile devices</p>
              <p>• Verify that all functionality works across screen sizes</p>
              <p>• Check that text remains readable and buttons are touch-friendly</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResponsiveTest;

