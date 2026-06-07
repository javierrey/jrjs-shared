// server/run.js
// @ts-check

import fs from 'node:fs';
import { globalState, log, resolvePath, getEnvironment, hydrate } from '../../core/core.js';
import { runServer } from './server.js';

// const fsP = fs.promises;

/**
@typedef {import('node:cluster').Worker & { id?: number }} Worker;
@typedef {NodeJS.Process & { id?: number }} Process;
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

/** @type {ServerConfig} */
const config = hydrate(globalState.serverConfig, defaults);

const env = getEnvironment();
const baseFolder = config.baseDir || env.root + env.path;

const privateFolder = resolvePath(baseFolder, config.privateDir);
const publicFolder = resolvePath(baseFolder, config.publicDir);

const isSSL = config.protocol === 'https';

const options = {
  ...config,
  baseFolder,
  privateFolder,
  publicFolder,
  isSSL,
  cert: isSSL ? fs.readFileSync(privateFolder + config.sslCert) : null,
  key: isSSL ? fs.readFileSync(privateFolder + config.sslKey) : null,
};

// http://localhost:3000/Users/reyj/home/projects/apps/js/jrjs-template/packages/view
// http://localhost:3000/Users/reyj/home/projects/apps/js/node-lab/www/plot-line-curve-svg/mathfun-svg/mathfun-svg.html
const server = runServer(options);

log.info(`${!server ? 'KO' : 'OK'}: [${Object.keys(options)}]`);
