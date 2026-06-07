// sys/index.js
// @ts-check

// import globalConfig from './index.json' with { type: 'json' };
// globalThis.globalConfig = globalConfig;

globalThis.globalConfig = {
  processConfig: {
    workersSize: 1, // 0, 1, 2, ... os.cpus().length
    primaryApps: [],
    workerApps: ['./lib/sys/server/run.js'],
    ...JSON.parse(process.argv.slice(2).at(-1) || '{}'),
  },
  serverConfig: {
    baseDir: '',
    publicDir: '../view',
    privateDir: '../../_ignore/store',

    protocol: 'http',
    host: '0.0.0.0', // '0.0.0.0', '127.0.0.1', 'localhost',
    port: 3000,

    sslCert: '/data/secret/cert.pem',
    sslKey: '/data/secret/key.pem',

    timeout: 50e3,
    clientsSize: 1e3,
    clientPortsSize: 16,
    largeThreshold: 2e6,
    uploadLimit: 8e6,

    // logConfig: { name: 'app', level: 3 },
  },
};

import('./lib/sys/run.js');
