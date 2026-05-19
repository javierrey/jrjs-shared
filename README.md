# S3V-JS, System, server, storage, client - JS

A very simple NodeJS monorepo with no dependencies and three projects: `system`, `server`, `store` and `client`.

**Installation:**

Having `git`, `node`, `npm` installed globally.
Having `github` remote origin for `s3v-js`.

```sh
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/javierrey/s3v-js.git
git push -u origin main
```

```sh
npm i
```
No initial dependencies in the repo.

**Build:**

```sh
npm run build
```
Echoes `No build defined`, as projects are static.

**Start:**

```sh
npm start
```
The root package `start` will run the `system` package, (i.e. `npm -w packages/system start`), which imports and runs other packages (mainly `server`).

**Test:**

```sh
npm t
```
Run all defined tests.

# Packages

## system

Bootstrap script for running the repo.

General libraries and utilities imported by other packages.

Also contains a test suite.

## server

Simple nodejs server, imported and run by `system`.

## client

Client application renderer, used by `server`.

Server and client side rendering.

View in browser while `server` is running:
```
http://localhost:3000
http://localhost:3000/json
```
# Packages

## Framework `jrjs`

Library with general core and application-specific functionality.

# References

`http://localhost:3000`
