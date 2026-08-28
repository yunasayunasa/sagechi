import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
export async function renameGlbAnimations(inputPath, outputPath, mappingPath) {
  const source = await readFile(inputPath);
  if (source.readUInt32LE(0) !== GLB_MAGIC || source.readUInt32LE(4) !== 2) {
    throw new Error(`${inputPath} is not a GLB 2.0 file.`);
  }

  const mapping = JSON.parse(await readFile(mappingPath, 'utf8'));
  const chunks = [];
  let offset = 12;
  let renamed = 0;

  while (offset < source.length) {
  const length = source.readUInt32LE(offset);
  const type = source.readUInt32LE(offset + 4);
  const data = source.subarray(offset + 8, offset + 8 + length);

  if (type === JSON_CHUNK) {
    const gltf = JSON.parse(data.toString('utf8').trimEnd());
    for (const animation of gltf.animations ?? []) {
      const semanticName = mapping[animation.name];
      if (!semanticName) {
        throw new Error(`No semantic name supplied for animation "${animation.name}".`);
      }
      animation.name = semanticName;
      renamed += 1;
    }
    const json = Buffer.from(JSON.stringify(gltf), 'utf8');
    const padding = (4 - (json.length % 4)) % 4;
    chunks.push({ type, data: Buffer.concat([json, Buffer.alloc(padding, 0x20)]) });
  } else {
    chunks.push({ type, data: Buffer.from(data) });
  }
    offset += 8 + length;
  }

  if (renamed !== Object.keys(mapping).length) {
    throw new Error(`Renamed ${renamed} animations, but mapping contains ${Object.keys(mapping).length}.`);
  }

  const totalLength = 12 + chunks.reduce((sum, chunk) => sum + 8 + chunk.data.length, 0);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const output = [header];
  for (const chunk of chunks) {
  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(chunk.data.length, 0);
  chunkHeader.writeUInt32LE(chunk.type, 4);
    output.push(chunkHeader, chunk.data);
  }

  await writeFile(outputPath, Buffer.concat(output));
  process.stdout.write(`Renamed ${renamed} animations in ${outputPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , inputPath, outputPath, mappingPath] = process.argv;
  if (!inputPath || !outputPath || !mappingPath) {
    throw new Error('Usage: node scripts/rename-glb-animations.mjs <input.glb> <output.glb> <mapping.json>');
  }
  await renameGlbAnimations(inputPath, outputPath, mappingPath);
}
