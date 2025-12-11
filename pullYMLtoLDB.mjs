import {compilePack} from '@foundryvtt/foundryvtt-cli';
import {promises as fs} from 'fs';

const PACKAGE_ID = process.cwd();
const yaml = true;
const folders = true;

const packs = await fs.readdir('./packs');
for (const pack of packs) {
  if (pack.startsWith('.')) continue;
  console.log('Packing ' + pack);
  await compilePack(
    `./packs/${pack}`,
    `./src/assets/packs/${pack}`,
    {yaml, recursive: folders}
  );
}
