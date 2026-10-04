import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repairConfig } from '../scripts/repair-config.mjs';

const key = 'a'.repeat(64);
function fixture(raw) {
  const directory = mkdtempSync(join(tmpdir(), 'garimpo-repair-'));
  if (raw !== undefined) writeFileSync(join(directory, 'config'), raw);
  return directory;
}
test('JSON interrompido ganha cópia fiel e mantém a chave e banco existentes', () => {
  const raw = '{ "encryptionKey": "' + key + '", "fsStorageMigrated": true,';
  const directory = fixture(raw);
  try {
    writeFileSync(join(directory, 'database.sqlite'), 'banco-de-teste');
    const result = repairConfig(directory, key);
    assert.equal(result.state, 'repaired');
    assert.equal(readFileSync(result.backup, 'utf8'), raw);
    assert.deepEqual(JSON.parse(readFileSync(join(directory, 'config'), 'utf8')), { encryptionKey: key, fsStorageMigrated: true });
    assert.equal(readFileSync(join(directory, 'database.sqlite'), 'utf8'), 'banco-de-teste');
    assert.equal(statSync(join(directory, 'config')).mode & 0o777, 0o600);
    assert.equal(statSync(result.backup).mode & 0o777, 0o600);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('arquivo vazio é recuperado com a chave de ambiente existente', () => {
  const directory = fixture('');
  try {
    assert.equal(repairConfig(directory, key).state, 'repaired');
    assert.equal(JSON.parse(readFileSync(join(directory, 'config'), 'utf8')).encryptionKey, key);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('arquivo válido fica intacto e reparo repetido não cria outra cópia', () => {
  const directory = fixture(JSON.stringify({ encryptionKey: key, tunnelSubdomain: 'teste' }));
  try {
    const before = readFileSync(join(directory, 'config'), 'utf8');
    assert.equal(repairConfig(directory, key).state, 'valid');
    assert.equal(repairConfig(directory, key).state, 'valid');
    assert.equal(readFileSync(join(directory, 'config'), 'utf8'), before);
    assert.deepEqual(readdirSync(directory), ['config']);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('chave ausente ou divergente bloqueia alterações, inclusive em JSON parcial', () => {
  for (const raw of [JSON.stringify({ encryptionKey: 'b'.repeat(64) }), '{"encryptionKey":"' + 'b'.repeat(64) + '",']) {
    const directory = fixture(raw);
    try {
      assert.throws(() => repairConfig(directory, key), /chave/);
      assert.throws(() => repairConfig(directory, undefined), /chave/);
      assert.equal(readFileSync(join(directory, 'config'), 'utf8'), raw);
      assert.deepEqual(readdirSync(directory), ['config']);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});
test('JSON inesperado bloqueia e arquivo ausente é deixado para o n8n criar', () => {
  for (const raw of ['null', '{}', undefined]) {
    const directory = fixture(raw);
    try {
      if (raw === undefined) assert.equal(repairConfig(directory, key).state, 'missing');
      else assert.throws(() => repairConfig(directory, key), /inesperada/);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});
