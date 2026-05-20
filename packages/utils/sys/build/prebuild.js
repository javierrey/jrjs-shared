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
  method(origBase + '/imports/core/' + folder, destBase + '/view/imports/core/' + folder);
}
for (const folder of importsView) {
  method(origBase + '/imports/view/' + folder, destBase + '/view/imports/view/' + folder);
}
