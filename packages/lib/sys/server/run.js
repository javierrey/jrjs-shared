// server/run.js
// @ts-check

/**
@typedef {import('./server.js').ServerConfig} ServerConfig;
@typedef {import('./server.js').ResolvedServerConfig} ResolvedServerConfig;
*/

import { log, hydrate } from '../../core/core.js';
import { getAppLoader } from '../cluster.js';
import { runServer } from './server.js';

// const fsP = fs.promises;

/** @type {ServerConfig} */
const defaults = {
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
};

const appName = 'server';
const appConfig = /** @type {ServerConfig} */ (getAppLoader(appName).config);

hydrate(appConfig, defaults);

const server = runServer(appConfig);

log.info(`server/run ${!server ? 'KO' : 'OK'}: [${Object.keys(appConfig)}]`);
