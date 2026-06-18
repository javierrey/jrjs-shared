// sys/cluster.js
// @ts-check

/**
@typedef {import('node:cluster').Worker & { id?: number }} Worker;
@typedef {NodeJS.Process & { id?: number }} Process;
@typedef {import('../core/core.js').PlainObject} PlainObject;
@typedef {{
  name: string;
  path: string;
  primary?: boolean;
  requires?: string[];
  state?: PlainObject;
  config: PlainObject;
}} AppLoader;
@typedef {{
  clusterSize: number;
  base: string;
  apps: AppLoader[];
}} ClusterConfig;
*/

import cluster from 'node:cluster';
import { globalContext, log, sysConfig } from './sys.js';

/* Apps functionality: */

const config = /** @type {ClusterConfig} */ (sysConfig);

/** Get sysConfig app runner. @param {string} name @return {AppLoader} */
export const getAppLoader = (name) =>
  config.apps.find((app) => app.name === name) ?? { name, path: '', config: {} };

/** Get app runners for the cluster type. @param {boolean} primary @return {AppLoader[]} */
const getAppLoaders = (primary = false) => config.apps.filter((app) => primary ? app.primary : !app.primary);

/** Import apps from app runners. @param {AppLoader[]} imports @returns {Promise<void>} */
const importApps = async (imports) => {
  try {
    for (const app of imports) {
      if (app.path) { await import(config.base + app.path); }
    }
  } catch (err) { log.error(`Error in importApps`, err); }
};

/* Cluster functionality: */

/** @param {number} id @return {void} */
const updateWorkerId = (id) => { globalContext.workerId = id; };
updateWorkerId(globalContext.workerId ?? NaN);

/** @param {number} id @return {void} */
const updateLatestWorkerId = (id) => { globalContext.latestWorkerId = id; };
updateLatestWorkerId(globalContext.latestWorkerId ?? NaN);

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
  //   // process.send(msg);
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
  const clusterSize = /** @type {number} */ (config.clusterSize);
  updateWorkerId(clusterSize ? 0 : NaN);
  const imports = getAppLoaders(true);
  !clusterSize && imports.push(...getAppLoaders(false));

  log.info(`Primary id ${globalContext.workerId}, pid ${process.pid}, clusterSize ${clusterSize}, [${imports.map(app => app.name)}]`);

  for (let i = 0; i < clusterSize; i++) { cluster.fork(); }

  cluster.on('online', (worker) => {
    updateLatestWorkerId(worker.id); // log.info(`worker online, id ${worker.id}, pid ${worker.process.pid}`);
  });

  cluster.on('exit', (worker, code, signal) => {
    log.warn(`worker ${worker.id} (${worker.process.pid}, ${signal ?? code}) ${
      worker.exitedAfterDisconnect ? 'disconnected' : 'crashed, restarting...'
    }`);
    !worker.exitedAfterDisconnect && cluster.fork();
  });

  cluster.on('message', (worker, message, _handle) => {
    log.info(`message ${getWorkerId(process.pid)}, worker ${worker.id} (${worker.process.pid}): ${message}`);
  });

  importApps(imports);
};

/** Worker method to be used in the cluster script for `cluster.isWorker`. */
const clusterWorker = () => {
  updateWorkerId(cluster.worker?.id ?? -1);
  const imports = getAppLoaders(false);
  log.info(`Worker id ${globalContext.workerId}, pid ${process.pid}, [${imports.map(app => app.name)}]`);

  importApps(imports);
};

/** Cluster method. */
export const runCluster = () => cluster.isPrimary ? clusterPrimary() : clusterWorker();
