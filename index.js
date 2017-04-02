#!/usr/bin/env node

const Client = require('./Client');
const program = require('commander');
const semver = require('semver');
const { engines } = require('./package');

const version = engines.node;

if (!semver.satisfies(process.version, version)) {
  console.error(`Required node version ${version} not satisfied with current version ${process.version}.`);
  process.exit(1);
}

program
  .version('1.6.0')
  .option('-u, --user <email>', 'Your Packtpub registered email')
  .option('-p, --password <password>', 'Your Packtpub password')
  .option('-o, --outputDir <outputDir>', 'Output directory')
  .option('-f, --fileType [type]', 'Your desired file type for the ebook. Only pdf, epub, and mobi supported. Default is pdf. Example: pdf,mobi,epub', 'pdf');

program.parse(process.argv);

if (!program.user || !program.password) {
  throw new Error('Please specify your email and password');
}

if (!(/\S+@\S+\.\S+/).test(program.user)) {
  throw new Error('Your email is not valid!');
}

if (!program.outputDir) {
  console.warn('Please note that you\'re not specify the output. It will be downloaded to your current directory');
}

const config = {
  email: program.user,
  password: program.password,
  fileType: program.fileType.split(','),
};

const client = new Client(config);

client.downloadDealOfTheDay();
