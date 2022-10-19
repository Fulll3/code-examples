import * as nconf from 'nconf';
import * as path from 'path';

export const config = createConfig(__dirname);

function createConfig(workingDir: string) {
  const slash = path.sep;
  let envFile = null;

  if (process.env.NODE_ENV === 'prod') {
    envFile = path.join(workingDir, `..${slash}configuration${slash}config.prod.json`); // for test and prd environment
  } else {
    envFile = path.join(workingDir, `..${slash}configuration${slash}config.dev.json`); // for local environment only
  }

  const config = nconf.env().file({ file: envFile });
  return config;
}