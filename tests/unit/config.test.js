// Unit test for config.js
import config from '../../src/converter/config.js';

describe('conversionConfig', () => {
  it('should have quantization, voices, output, and logging sections', () => {
    expect(config).toHaveProperty('quantization');
    expect(config).toHaveProperty('voices');
    expect(config).toHaveProperty('output');
    expect(config).toHaveProperty('logging');
  });
  it('should have default quantization divisions of 480', () => {
    expect(config.quantization.divisions).toBe(480);
  });
  it('should allow changing config values', () => {
    config.quantization.divisions = 960;
    expect(config.quantization.divisions).toBe(960);
    // Reset for other tests
    config.quantization.divisions = 480;
  });
});
