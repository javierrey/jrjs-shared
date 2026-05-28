// server.js
// _@ts-check
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import {
  Log, toStr, isNul, isJso, isBin, urlComponents, parseQuery, getSample,
  fileSize, readFile, readStream,
} from '../sys-x.js';

/* server core: */

const log = Log({ name: 'server', level: 4 });

const config = {};
const clients = [];

const getContentType = (filename, content) => {
  content ??= ''; filename ??= '';
  const ext = filename.slice(filename.lastIndexOf('.') + 1 || filename.length);
  if (!ext) {
    return isBin(content) ? 'application/octet-stream' : isJso(getSample(content)) ? 'application/json' : 'text/html';
  }
  return /^html?$/i.test(ext) ? 'text/html'
  : /^[mc]?js$/i.test(ext) ? 'application/javascript'
  : /^css$/i.test(ext) ? 'text/css'
  : /^json5?$/i.test(ext) ? 'application/json'
  : /^md$/i.test(ext) ? 'text/markdown'
  : /^x(ht)?ml$/i.test(ext) ? 'application/xml'
  : /^svg$/i.test(ext) ? 'image/svg+xml'
  : /^jpe?g$/i.test(ext) ? 'image/jpeg'
  : /^png$/i.test(ext) ? 'image/png'
  : /^gif$/i.test(ext) ? 'image/gif'
  : /^(mp3|ogg)$/i.test(ext) ? 'audio/mp3'
  : /^(mp4|m4v|mpe?g|avi|mov)$/i.test(ext) ? 'video/mp4'
  : /^wav$/i.test(ext) ? 'audio/x-wav'
  : /^woff2?$/i.test(ext) ? 'font/woff2'
  : /^vtt$/i.test(ext) ? 'text/vtt'
  : /^dae$/i.test(ext) ? 'model/vnd.collada+xml'
  : /^csv$/i.test(ext) ? 'text/csv'
  : /^pdf$/i.test(ext) ? 'application/pdf'
  : /^bin$/i.test(ext) ? 'application/octet-stream'
  : /^(zip|tgz)$/i.test(ext) ? 'application/zip'
  : /^swf$/i.test(ext) ? 'application/x-shockwave-flash'
  : 'text/plain'
};

const logConnection = ({ request, resource, error, status, headers, body }) => {
  if (!log.level || (log.level < 3 && !error)) { return; } // @todo || status === 206:
  const bodySample = getSample(body, 300, true), payloadSample = getSample(resource.params.payload, 300, true);
  const client = resource.client, remarksLength = Object.keys(client.remarks).length;
  const logArgs = [
    `CLIENT ${client.remoteAddress} (${client.remotePort}/${client.ports.length})`,
    `clients ${clients.length}, remarks ${remarksLength}, route "${client.routeProps.topOpen ? '/...' : '.../'}"`,
    `REQUEST ${request.method} "${request.url}"`,
    `headers {${Object.keys(request.headers)}}`,
    `params ${toStr({ ...resource.params, payload: payloadSample })}`,
    `RESPONSE ${status}, ${headers['content-type']}, ${error?.message ?? error ?? 'OK'}`,
    `headers {${Object.keys(headers)}}`,
    `body ${bodySample}`,
  ];
  error ? log.error(...logArgs, `error ${error.message}`) : log.info(...logArgs);
};

const setClientRemarks = (resource) => {
  const { client, params } = resource;
  if (params.payload?.length > 10e3) { client.remarks['large-payload'] = params.payload.length; }
  if (!client.remotePort) { client.remarks['remote-port'] = client.remotePort; }
};

const resolveClient = (request) => {
  const index = clients.findIndex((client) => client.remoteAddress === request.client.remoteAddress);
  const client = {
    remoteAddress: request.client.remoteAddress,
    remotePort: request.client.remotePort,
    requestUrl: request.url,
    ports: clients[index]?.ports ?? [],
    routeProps: clients[index]?.routeProps ?? { topPath: '', topOpen: 0 },
    remarks: clients[index]?.remarks ?? {},
    updated: Date.now(),
  };
  const portIndex = client.ports.findIndex((port) => port === client.remotePort);
  portIndex < 0 && client.ports.push(client.remotePort);
  if (client.ports.length > config.clientPortsSize / 2) {
    client.remarks['many-ports'] = client.ports.length;
    if (client.ports.length > config.clientPortsSize) {
      portIndex === 0 ? client.ports.splice(1, 1) : client.ports.shift();
    }
  }
  if (index !== -1) { return Object.assign(clients[index], client); }
  client.created = client.updated; clients.push(client); clients.length > config.clientsSize && clients.shift();
  return client;
};

const resolveRoute = (request, urlParts, props) => {
  let route = urlParts.path.split('/').slice(1);
  const isTop = !request.headers.referer || !props.topPath;
  if (!request.headers.referer || !props.topPath) {
    props.topPath = urlParts.path; props.topOpen = urlParts.open;
  }
  if (urlParts.path !== props.topPath) {
    const topRoute = props.topPath.split('/').slice(1); let offset = 0;
    while (route[offset] === topRoute[offset]) { offset++; }
    route = [...topRoute.slice(0, offset + props.topOpen), ...route.slice(offset)];
  }
  log.debug(
    `resolveRoute referer "${request.headers.referer}", route [${route}] (${isTop}, ${urlParts.path !== props.topPath}): `,
    urlParts,
    props,
  );
  return route;
};

const resolveEmpty = (request) => (
  (request.method === 'GET' && request.url === '/favicon.ico')
) ? { status: 204 } : null;

const resolveUpstream = (request, params) => {
  if (!params?.payload?.slice) { return null; }
  request.on('data', (data) => { params.payload += data; });
  return new Promise((resolve, reject) => request.on('end', resolve).on('error', reject));
};

const resolveDownstream = (request, file) => {
  if (!request.headers.range) { return null; }
  const boundaries = request.headers.range.replace(/bytes=/, '').split('-');
  const start = Number(boundaries[0]) || 0, end = Number(boundaries[1]) || file.size - 1, size = end - start + 1;
  const range = { start, end, size }, status = size > 0 ? 206 : 200, headers = { 'content-type': file.type };
  if (size) { // headers.range = range;
    headers['accept-ranges'] = 'bytes';
    headers['content-range'] = `bytes ${range.start}-${range.end}/${size}`;
    headers['content-length'] = size;
  }
  return { status, headers, body: file.content };
};

/**
Resolves a request resource path by breaking down the request URL
and returning a resource object with computed request properties.
It builds a `route` array property based on the client's top referrer URL,
so it behaves the same for both open and closed paths (ending slash '/').
Resolves the client originating the request.
Resolves the resource file path and request parameters.
If the file is not found, it tries to find a default `index.html` or `index.json` in the route.
If found, the file static content is read and placed in the file content property.
If no static file is found, it tries to find a service file by appending
extensions `.js`, `.mjs` or `.cjs` to the route.
*/
const resolveResource = async (request) => {
  const client = resolveClient(request);
  const urlParts = urlComponents(request.url);
  const route = resolveRoute(request, urlParts, client.routeProps);
  const params = parseQuery(urlParts.query, true); params.payload = Buffer.from([]);
  const DEFAULT_FILE = 'index', STATIC_EXT = ['.html', '.json'], SERVICE_EXT = ['.js', '.mjs', '.cjs'];
  const fileRoute = ['_', ...route].filter(Boolean), filename = urlParts.slug?.replace(/^\//, '') ?? '';
  let filepath = '', filesize = -0, isService = false;
  while (filesize < 1 && fileRoute.length > 1) {
    fileRoute.shift(); let path = fileRoute.join('/');
    filepath = `/${path}/${filename}`; filesize = fileSize(filepath);
    for (let i = 0; filesize < 1 && i < STATIC_EXT.length; i++) {
      filepath = `/${path}/${DEFAULT_FILE}${STATIC_EXT[i]}`; filesize = fileSize(filepath);
    }
    for (let i = 0; filesize < 1 && i < SERVICE_EXT.length; i++) {
      filepath = `/${path}${SERVICE_EXT[i]}`; filesize = fileSize(filepath); isService = filesize > 0;
    }
  }
  const resource = { client, filepath, filesize, isService, params, ...urlParts }; setClientRemarks(resource);
  return resource;
};

/**
Resolves a file content located in the request path route and returns a file object,
with properties `url`, `type`, `size`, `content` and `error`.
If found, the file is executed with the given params, and the result is placed in the file content property,
otherwise, a file object with null content and a `not a content file` error is returned.
*/
const resolveFile = async (resource) => {
  /** @type {{ [key: string]: unknown }} */ const file = {
    url: resource.filepath, type: '', size: resource.filesize, content: null, error: null
  };
  if (resource.isService) {
    try {
      const { default: service } = await import(resource.filepath);
      file.content = service(resource.params); file.type = getContentType('', file.content); // @ts-expect-error:
      file.size = file.content?.byteLength ?? file.content?.length ?? -0; // @ts-expect-error:
      if (file.size > config.largeThreshold) { throw new Error(`service result too large: ${file.size}B`); }
    } catch (error) { file.error = error; }
  } else if (resource.filesize > 0) {
    const reader = resource.filesize > config.largeThreshold ? readStream : readFile;
    Object.assign(file, await reader(resource.filepath));
    const filename = resource.slug?.slice(1) ?? '';
    file.type = getContentType(filename, file.content);
  } else if (Object.is(resource.filesize, 0)) { file.content = Buffer.alloc(0);
  } else { file.error = { message: `not a content file "${resource.filepath}"` }; }
  return file;
};

const responder = async (response, status, headers, body) => { // @todo status === 206:
  Object.entries(headers ?? {}).forEach(([k, v]) => response.setHeader(k, v));
  response.writeHead(status ?? 0); response.end(body ?? '');
};

const resolver = async (request, response) => {
  const empty = resolveEmpty(request); if (empty) { return responder(response, empty.status); }
  const resource = await resolveResource(request);
  await resolveUpstream(request, resource.params);
  // const stream = resolveDownstream(request, file);
  // if (stream) { return responder(response, stream.status, stream.headers, stream.body); }
  const file = await resolveFile(resource);
  const error = file.error ?? isNul(file.content) ? { message: 'no content' } : null;
  const status = !error ? 200 : error.message.includes('found') || error.code === 'ENOENT' ? 404 : 500; // @ts-expect-error:
  const body = error?.message ?? (file.content?.slice ? file.content : toStr(file.content));
  const headers = { 'content-type': file.type };
  responder(response, status, headers, body);
  logConnection({ request, resource, error, status, headers, body });
};

/**
Creates and runs an `http` or `https` nodejs server, `http` or `https`.
Accepts a server listener and a server options object.
The listener can also be an express-like server application.
Arguments are optional: `runServer()` will start a server on `http://localhost:3000`.
*/
export const runServer = (listener, options) => {
  options ??= {};
  if (!(listener instanceof Function)) { Object.assign(options, listener); listener = resolver;
  } else { Object.assign(options, listener.options); }
  Object.entries(options.logConfig ?? {}).forEach(([k, v]) => log.config[k] = v);
  options.isSSL ??= Boolean(options.cert && options.key);
  options.protocol ??= options.isSSL ? 'https' : 'http';
  options.host ??= '0.0.0.0'; options.port ??= 3000;
  options.timeout ??= 50e3; options.clientsSize ??= 1e3; options.clientPortsSize ??= 16;
  options.largeThreshold ??= 2e6; options.uploadLimit ??= 8e6;
  Object.assign(config, options);
  const httpModule = options.isSSL ? https : http; // @ts-expect-error:
  const server = httpModule.createServer(options, listener); server.timeout = options.timeout;
  server.listen(options.port, options.host, () => {
    log.info(`Server listening on ${options.protocol}://${options.host}:${options.port}`);
  });
  return server;
};

/* utilities: */

export const isPortInUse = (port) => new Promise((resolve) => {
  if (port == null || isNaN(port) || port < 0 || port > 65535) { return resolve(null); }
  const s = net.createServer(), r = (b) => { s.close(); resolve(b); };
  s.once('error', () => r(true));
  s.once('listening', () => r(false));
  s.listen(port);
});

/* * */
