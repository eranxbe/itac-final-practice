const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');

function readYaml(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Config not found: ${relPath}`);
  }
  return yaml.load(fs.readFileSync(full, 'utf8')) || {};
}

function deepMerge(base, overlay) {
  const out = { ...base };
  for (const [key, value] of Object.entries(overlay || {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function loadSuites() {
  return readYaml('config/suites.yaml').suites || {};
}

function loadRunConfig(overrides = {}) {
  if (process.env.TEST_CONFIG_JSON) {
    return JSON.parse(process.env.TEST_CONFIG_JSON);
  }

  let config = readYaml('config/default.yaml');
  const env = overrides.env || process.env.TEST_ENV || config.env || 'local';
  const envRelPath = path.join('config', 'env', `${env}.yaml`);
  if (!fs.existsSync(path.join(ROOT, envRelPath))) {
    throw new Error(`Unknown env: ${env}`);
  }
  config = deepMerge(config, readYaml(envRelPath));

  const headed = overrides.headed;
  config = deepMerge(config, {
    env,
    suite: overrides.suite ?? process.env.TEST_SUITE ?? config.suite,
    type: overrides.type ?? process.env.TEST_TYPE ?? config.type,
    headed: typeof headed === 'boolean' ? headed : config.headed,
  });

  return config;
}

function getSuiteGrep(suiteName) {
  const suites = loadSuites();
  const suite = suites[suiteName];
  if (!suite) {
    const known = Object.keys(suites).join(', ');
    throw new Error(`Unknown suite: ${suiteName}. Known: ${known}`);
  }
  const tags = suite.tags || [];
  if (!tags.length) {
    return undefined;
  }
  return tags.join('|');
}

function getProjectNames(config, type) {
  const selectedType = type || config.type || 'all';
  const browsers = config.browsers || ['chromium'];
  const uiProjects = browsers.map((browser) => `ui-${browser}`);

  if (selectedType === 'ui') {
    return uiProjects;
  }
  if (selectedType === 'api') {
    return ['api'];
  }
  if (selectedType === 'all') {
    return [...uiProjects, 'api'];
  }
  throw new Error(`Unknown type: ${selectedType}. Use ui, api, or all.`);
}

module.exports = {
  ROOT,
  loadRunConfig,
  loadSuites,
  getSuiteGrep,
  getProjectNames,
};
