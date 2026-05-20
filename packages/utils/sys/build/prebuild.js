// _@ts-check // prebuild.js

import { log, getNamedArg, copyDir, symlinkDir } from '../../../lib/sys/sys.js';

const argv = process.argv.slice(2);

const origBase = './node_modules/jrjs-shared/packages';
const destBase = './packages';

const method = argv[0] === 'symlink' ? symlinkDir : copyDir; // copy, symlink

const importsCore = getNamedArg('imports-core')?.split(',') ?? [];
const importsView = getNamedArg('imports-view')?.split(',') ?? [];

method(origBase + '/lib/core', destBase + '/view/lib/core');
method(origBase + '/lib/view', destBase + '/view/lib/view');
method(origBase + '/utils/core', destBase + '/view/utils/core');
method(origBase + '/utils/view', destBase + '/view/utils/view');

for (const folder of importsCore) {
  try { method(origBase + '/lib/core/' + folder, destBase + '/view/lib/core/' + folder); }
  catch (_) { log.error(`prebuild error linking imports-core "${folder}":`); }
}
for (const folder of importsView) {
  try { method(origBase + '/lib/view/' + folder, destBase + '/view/lib/view/' + folder); }
  catch (_) { log.error(`prebuild error linking imports-view "${folder}":`); }
}
