module.exports = {
  mongodbMemoryServer: {
    version: 'latest'
  },
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
      ip: '127.0.0.1'
    },
    binary: {
      version: '6.0.9',
      skipMD5: true
    },
    autoStart: false
  }
}
