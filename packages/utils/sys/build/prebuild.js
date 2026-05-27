// _@ts-check // prebuild.js

import { log, getNamedArgumentValue, copyDir, symlinkDir } from '../../../lib/sys/sys.js';

const argv = process.argv.slice(2);

const origBase = './node_modules/jrjs-shared/packages';
const destBase = './packages';

const method = argv[0] === 'symlink' ? symlinkDir : copyDir; // copy, symlink

const importsCore = getNamedArgumentValue('imports-core')?.split(',') ?? [];
const importsView = getNamedArgumentValue('imports-view')?.split(',') ?? [];

method(origBase + '/lib/core', destBase + '/view/lib/core');
method(origBase + '/lib/view', destBase + '/view/lib/view');
method(origBase + '/utils/core', destBase + '/view/utils/core');
method(origBase + '/utils/view', destBase + '/view/utils/view');

importsCore.forEach((folder) => {
  method(origBase + '/imports/core/' + folder, destBase + '/view/imports/core/' + folder);
});

importsView.forEach((folder) => {
  method(origBase + '/imports/view/' + folder, destBase + '/view/imports/view/' + folder);
});
