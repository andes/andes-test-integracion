import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    API_SERVER: 'http://localhost:3002',
  },
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    configFile: 'config-report.json',
  },
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  projectId: 'xr7gft',
  viewportWidth: 1280,
  viewportHeight: 720,
  requestTimeout: 10000,
  responseTimeout: 100000,
  retries: 3,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    experimentalSessionAndOrigin: true,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
