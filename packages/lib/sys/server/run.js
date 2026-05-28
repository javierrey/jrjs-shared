// server/run.js
// @ts-check

import fs from 'node:fs';
import { log, resolvePath, getEnvironment } from '../../core/core.js';
import { runServer } from './server.js';

// import globalConfig from '../../../index.jso.js' with { type: 'json' };

// const fsP = fs.promises;

const globalConfig = globalThis.globalConfig ?? {};
const config = globalConfig?.serverConfig ?? globalConfig;

config.baseDir ??= '';

config.publicDir ??= './view';
config.privateDir ??= '../../_ignore/store';

config.protocol ??= 'http';
config.host ??= '0.0.0.0'; // '0.0.0.0', '127.0.0.1', 'localhost',
config.port ??= 3000;

config.sslCert ??= '/data/secret/cert.pem';
config.sslKey ??= '/data/secret/key.pem';

config.timeout ??= 50e3;
config.clientsSize ??= 1e3;
config.clientPortsSize ??= 16;
config.largeThreshold ??= 2e6;
config.uploadLimit ??= 8e6;

// config.logConfig ??= { name: 'app', level: 3 };

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
