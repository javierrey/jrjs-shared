// sys/run.js (cluster)
// @ts-check

import cluster from 'node:cluster';
import { globalState, hydrate, log } from '../core/core.js';

/**
@typedef {import('node:cluster').Worker & { id?: number }} Worker;
@typedef {NodeJS.Process & { id?: number }} Process;
@typedef {import('../core/core.js').PlainObject} PlainObject;
@typedef {{
  name: string;
  path: string;
  primaryOnly?: boolean;
  requires?: string[];
  state?: PlainObject;
  config: PlainObject;
}} AppRunner;
@typedef {{
  workersSize: number;
  base: string;
  apps: AppRunner[];
}} PrimaryConfig;
*/

/** Unique running process worker id */
globalState.workerId ??= NaN;

const defaults = {
  workersSize: 1,
  base: '',
  apps: [],
};

/** @type {PrimaryConfig} */
const config = hydrate(globalState.primaryConfig, defaults);

/** Get config app runner. */
// const getAppRunner = (name) => config.apps.find((app) => app.name === name);

/** Get app runners for the cluster type. */
const getAppRunners = (primary = false) => config.apps.filter((app) => primary ? app.primaryOnly : !app.primaryOnly);

/** Import apps from app runners. @param {AppRunner[]} imports @returns {Promise<void>} */
const importApps = async (imports) => {
  try {
    for (const app of imports) {
      globalState[app.name + 'Config'] = app.config;
      await import(config.base + app.path);
    }
  } catch (err) { log.error(`Error in importApps`, err); }
};

/** @param {number} id @return {number} */
// const getWorkerPid = (id) => cluster.workers?.[id]?.process?.pid ?? -1;

/** @param {number} pid @return {number} */
const getWorkerId = (pid) => Object.values(cluster.workers ?? {}).find((worker) => worker?.process.pid === pid)?.id ?? -1;

/** @param {number} pid @return {Worker | undefined} */
// const getWorker = (pid) => cluster.workers?.[getWorkerId(pid)];

/** @param {Worker | Process} wrk @param {string} msg */
const postMessage = (wrk = process, msg = '') => {
  log.info(`postMessage ${process.pid}, ${wrk.id ?? ''}: ${msg}`);
  // if (cluster) {
  //   if (!cluster.isPrimary) {
  //   } else {
  //   }
  //   //process.send(msg);
  // } else {
  //   // setTimeout(parse, 0, msg);
  // }
};

/** @param {Worker | Process} wrk @param {string} msg */
const onMessage = (wrk = process, msg = '') => {
  log.info(`onMessage ${process.pid}, ${wrk.id ?? ''}: ${msg}`);
  if (msg.charAt(0) === '?') {
    const r = msg.slice(1); msg = JSON.parse(r);
    postMessage(wrk, `${r} = ${JSON.stringify(msg)}`);
    return;
  }

  // if (cluster) {
  //   if (!cluster.isPrimary) {
  //   } else {
  //   }
  // } else {
  //   // if (msg.charAt(0) == '?') {
  //   //   const r = msg.slice(1); msg = parse(r);
  //   //   if (typeof msg == 'object' && msg != null) {msg = JSON.stringify(msg);}
  //   //   wrk.postMessage(null, `${r} = "${msg}"`);
  //   // } else {wrk.output = (msg.charAt(0) == '{' || msg.charAt(0) == '[') ? JSON.parse(msg) : msg;}
  // }
};

/** Primary method to be used in the cluster script for `cluster.isPrimary`. */
const clusterPrimary = () => {
  const workersSize = /** @type {number} */ (config.workersSize);
  globalState.workerId = workersSize ? 0 : NaN;
  const imports = getAppRunners(true);
  !workersSize && imports.push(...getAppRunners(false));

  log.info(`Primary id ${globalState.workerId}, pid ${process.pid}, workersSize ${workersSize}, [${imports.map(app => app.path)}]`);

  for (let i = 0; i < workersSize; i++) { cluster.fork(); }

  // cluster.on('online', (worker) => {
  //   log.info(`worker online, id ${worker.id}, pid ${worker.process.pid}`);
  // });

  cluster.on('exit', (worker, code, signal) => {
    log.warn(`worker ${worker.id} (${worker.process.pid}, ${signal ?? code}) ${
      worker.exitedAfterDisconnect ? 'disconnected' : 'crashed, restarting...'
    }`);
    !worker.exitedAfterDisconnect && cluster.fork();
  });

  cluster.on('message', (worker, message, _handle) => {
    log.info(`worker ${getWorkerId(process.pid)} (${worker.process.pid}) message: ${message}`);
  });

  importApps(imports);
};

/** Worker method to be used in the cluster script for `cluster.isWorker`. */
const clusterWorker = () => {
  globalState.workerId = cluster.worker?.id ?? -1;
  const imports = getAppRunners(false);
  log.info(`Worker id ${globalState.workerId}, pid ${process.pid}, [${imports.map(app => app.path)}]`);

  importApps(imports);
};

/** Cluster method. */
cluster.isPrimary ? clusterPrimary() : clusterWorker();
