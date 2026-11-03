const { spawn } = require('child_process');
const { loadRunConfig, getSuiteGrep, getProjectNames } = require('./load-config');

function parseArgs(argv) {
  const result = {
    extra: [],
    headed: false,
    debug: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') {
      result.extra.push(...argv.slice(i + 1));
      break;
    }
    if (arg === '--env') {
      result.env = argv[i + 1];
      i += 1;
    } else if (arg === '--suite') {
      result.suite = argv[i + 1];
      i += 1;
    } else if (arg === '--type') {
      result.type = argv[i + 1];
      i += 1;
    } else if (arg === '--headed') {
      result.headed = true;
    } else if (arg === '--debug') {
      result.debug = true;
    } else {
      result.extra.push(arg);
    }
  }

  return result;
}

const args = parseArgs(process.argv.slice(2));
const config = loadRunConfig({
  env: args.env,
  suite: args.suite,
  type: args.type,
  headed: args.headed,
});

const grep = getSuiteGrep(config.suite);
const projects = getProjectNames(config, config.type);

const playwrightCli = require.resolve('@playwright/test/cli');
const pwArgs = ['test'];
for (const project of projects) {
  pwArgs.push('--project', project);
}
if (grep) {
  pwArgs.push('--grep', grep);
}
if (args.headed) {
  pwArgs.push('--headed');
}
if (args.debug) {
  pwArgs.push('--debug');
}
pwArgs.push(...args.extra);

const child = spawn(process.execPath, [playwrightCli, ...pwArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    TEST_CONFIG_JSON: JSON.stringify(config),
    TEST_ENV: config.env,
    TEST_SUITE: config.suite,
    TEST_TYPE: config.type,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
