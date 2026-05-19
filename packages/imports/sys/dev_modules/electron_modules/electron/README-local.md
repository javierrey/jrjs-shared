
## electron-lib

Place `electron` under `/local_modules/dev_modules/electron_modules` at the project's root.

Replace all `node_modules` in package for `electron_modules`.

Optionally replace `executablePath`, in `getElectronPath`, in `electron/index.js`,
to match the valid executable platform, as originally set by `electron/install.js`.
