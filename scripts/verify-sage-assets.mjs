import fs from 'node:fs';
import path from 'node:path';

const directory = path.resolve('public/models/sages');
const expected = ['maria-theresa','caim','lobelia','alanaan','haaselia','borghan','catzelia','fraux','nier','estarriola'];
for (const id of expected) {
  const file = path.join(directory, `${id}.glb`);
  if (!fs.existsSync(file)) throw new Error(`賢者っちAssetがありません: ${file}`);
  const data = fs.readFileSync(file);
  if (data.toString('ascii', 0, 4) !== 'glTF') throw new Error(`GLB形式ではありません: ${file}`);
  let offset = 12, json;
  while (offset < data.length) {
    const length = data.readUInt32LE(offset), type = data.toString('ascii', offset + 4, offset + 8);
    if (type === 'JSON') json = JSON.parse(data.subarray(offset + 8, offset + 8 + length).toString('utf8').replace(/\0+$/, ''));
    offset += 8 + length;
  }
  if (!json?.meshes?.length || !json?.animations?.length || !json?.skins?.length) throw new Error(`Mesh / Skin / Animationが不足しています: ${file}`);
  process.stdout.write(`${id}: ${json.meshes.length} mesh / ${json.skins.length} skin / ${json.animations.length} animations\n`);
}
