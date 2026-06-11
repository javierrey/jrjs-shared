// sys/run.js (cluster)
// @ts-check

/**
@typedef {import('./cluster.js').ClusterConfig} ClusterConfig;
*/

import { hydrate, log, sysConfig } from './sys.js';
import { runCluster } from './cluster.js';

/** @type {ClusterConfig} */
const defaults = {
  clusterSize: 0,
  base: '',
  apps: [],
};

const clusterConfig = /** @type {ClusterConfig} */ (hydrate(sysConfig, defaults));

runCluster();

log.info(`sys/run ${clusterConfig.clusterSize} workers [${clusterConfig.apps.map((app) => app.name)}]`);
