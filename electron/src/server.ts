import express from 'express';
import fkill from 'fkill';
import { call } from '@deep-foundation/deeplinks/imports/engine';

import { promisify } from 'util';
import { exec } from 'child_process';

const execP = promisify(exec);

process.env['MIGRATIONS_HASURA_PATH'] = 'localhost:8080';
process.env['MIGRATIONS_HASURA_SSL'] = '0';
process.env['MIGRATIONS_HASURA_SECRET'] = 'myadminsecretkey';
process.env['DEBUG'] = 'deeplinks:container-controller:*';

const {
  MIGRATIONS_HASURA_PATH,
  MIGRATIONS_HASURA_SSL,
  MIGRATIONS_HASURA_SECRET,
} = process.env;

const envsObj = {
  MIGRATIONS_HASURA_PATH,
  MIGRATIONS_HASURA_SSL,
  MIGRATIONS_HASURA_SECRET,
};

(async () => {
  const app = express();
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.post('/api/deeplinks', async (req, res) => {
    res.json(await call({ ...req.body, envs: { ...envsObj, ...req?.body?.envs } }));
  });
  app.post('/test', async (req, res) => {
    res.json(await execP(`${req.body.exec}`));
  });
  app.post('/eval', async (req, res) => {
    res.json({ eval: eval(req.body.eval) });
  });
  app.listen(3007, () => {
    console.log(`Example app listening at http://localhost:3007`)
  });
})().catch(console.error);