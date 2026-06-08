// server/run.js
// @ts-check

/**
@typedef {{
  baseDir: string;
  publicDir: string;
  privateDir: string;
  protocol: string;
  host: string;
  port: number;
  sslCert: string;
  sslKey: string;
  timeout: number;
  clientsSize: number;
  clientPortsSize: number;
  largeThreshold: number;
  uploadLimit: number;
}} ServerConfig;
*/

import fs from 'node:fs';
import { log, resolvePath, getEnvironment, hydrate } from '../../core/core.js';
import { getAppLoader } from '../run.js';
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

const env = getEnvironment();
const baseFolder = appConfig.baseDir || env.root + env.path;

const privateFolder = resolvePath(baseFolder, appConfig.privateDir);
const publicFolder = resolvePath(baseFolder, appConfig.publicDir);

const isSSL = appConfig.protocol === 'https';

const options = {
  ...appConfig,
  baseFolder,
  privateFolder,
  publicFolder,
  isSSL,
  cert: isSSL ? fs.readFileSync(privateFolder + appConfig.sslCert) : null,
  key: isSSL ? fs.readFileSync(privateFolder + appConfig.sslKey) : null,
};

// http://localhost:3000/Users/reyj/home/projects/apps/js/jrjs-template/packages/view
// http://localhost:3000/Users/reyj/home/projects/apps/js/node-lab/www/plot-line-curve-svg/mathfun-svg/mathfun-svg.html
const server = runServer(options);

log.info(`${!server ? 'KO' : 'OK'}: [${Object.keys(options)}]`);
