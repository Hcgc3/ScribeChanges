// Jest configuration for the project
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  verbose: true
};
