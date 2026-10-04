import {
  readFileSync, copyFileSync, writeFileSync, renameSync, unlinkSync,
  chmodSync, openSync, closeSync, fsyncSync, statfsSync, constants,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function repairConfig(directory, encryptionKey) {
  if (!/^[A-Za-z0-9_-]{32,}$/.test(encryptionKey ?? '')) {
    throw new Error('A chave existente não está disponível. Preserve .env e revise a configuração.');
  }
  const path = join(directory, 'config');
  let raw;
  try { raw = readFileSync(path, 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') return { state: 'missing' };
    throw error;
  }
  let settings;
  let malformed = false;
  try { settings = JSON.parse(raw); } catch { malformed = true; }
  if (!malformed) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings) || typeof settings.encryptionKey !== 'string') {
      throw new Error('JSON legível, mas configuração inesperada. Nenhuma alteração foi feita.');
    }
    if (settings.encryptionKey !== encryptionKey) {
      throw new Error('A chave do arquivo difere da chave de .env. Nenhuma alteração foi feita.');
    }
    return { state: 'valid' };
  }
  // Se parte da chave foi gravada de forma legível, confirme que é a mesma.
  const keyMatch = raw.match(/"encryptionKey"\s*:\s*("(?:[^"\\]|\\.)*")/);
  if (keyMatch && JSON.parse(keyMatch[1]) !== encryptionKey) {
    throw new Error('O arquivo quebrado contém uma chave diferente. Nenhuma alteração foi feita.');
  }
  const space = statfsSync(directory, { bigint: true });
  if (space.bavail * space.bsize < 16n * 1024n * 1024n || (space.files > 0n && space.ffree < 10n)) {
    throw new Error('Falta espaço ou inodes para fazer a cópia e o reparo.');
  }
  const identifier = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID();
  const backup = path + '.broken-' + identifier + '.bak';
  const temporary = path + '.repair-' + identifier + '.tmp';
  copyFileSync(path, backup, constants.COPYFILE_EXCL);
  chmodSync(backup, 0o600);
  const backupDescriptor = openSync(backup, 'r');
  try { fsyncSync(backupDescriptor); } finally { closeSync(backupDescriptor); }
  const recovered = { encryptionKey };
  // Preserva marcadores opcionais se eles puderem ser lidos no JSON parcial.
  for (const field of ['tunnelSubdomain', 'fsStorageMigrated']) {
    const match = raw.match(new RegExp('"' + field + '"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|true|false|null)'));
    if (match) recovered[field] = JSON.parse(match[1]);
  }
  try {
    writeFileSync(temporary, JSON.stringify(recovered, null, '\t') + '\n', { mode: 0o600, flag: 'wx' });
    const descriptor = openSync(temporary, 'r');
    try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
    renameSync(temporary, path);
  } catch (error) {
    try { unlinkSync(temporary); } catch {}
    throw error;
  }
  return { state: 'repaired', backup };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = repairConfig('/home/node/.n8n', process.env.N8N_ENCRYPTION_KEY);
    if (result.state === 'repaired') console.log('Configuração reparada com a chave existente. Cópia privada: ' + result.backup);
    else if (result.state === 'valid') console.log('Configuração já válida; nenhuma alteração necessária.');
    else console.log('Arquivo de configuração ausente; o n8n o criará com a chave existente.');
  } catch (error) {
    console.error(error.code === 'ENOSPC' ? 'Sem espaço para o reparo. Libere espaço e tente novamente.' : error.message);
    process.exitCode = 1;
  }
}
