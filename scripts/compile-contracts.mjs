import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export function compile(extraSources = {}) {
  const input = { language: 'Solidity', sources: {
    'ArcEscrow.sol': { content: fs.readFileSync(path.join(root, 'contracts/src/ArcEscrow.sol'), 'utf8') }, ...extraSources,
  }, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } } } };
  const result = JSON.parse(solc.compile(JSON.stringify(input), { import: name => {
    try { return { contents: fs.readFileSync(path.join(root, 'node_modules', name), 'utf8') }; }
    catch { return { error: `Cannot resolve ${name}` }; }
  } }));
  const errors = result.errors?.filter(error => error.severity === 'error') ?? [];
  if (errors.length) throw new Error(errors.map(error => error.formattedMessage).join('\n'));
  return result.contracts;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const contract = compile()['ArcEscrow.sol'].ArcEscrow;
  fs.mkdirSync(path.join(root, 'contracts/out'), { recursive: true });
  fs.writeFileSync(path.join(root, 'contracts/out/ArcEscrow.json'), JSON.stringify(contract, null, 2));
  console.log('Compiled ArcEscrow with Solidity 0.8.28 (Shanghai target).');
}
