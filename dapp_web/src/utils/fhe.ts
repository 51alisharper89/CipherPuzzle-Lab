/**
 * ✅ FHE SDK正确集成方式：
 * 1. 在index.html中通过<script>标签加载 relayer-sdk-js.umd.cjs
 * 2. 这会创建全局对象 window.relayerSDK
 * 3. bundle.js 从 window.relayerSDK 导出函数
 */
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { getAddress, hexlify } from 'ethers';

let fheInstance: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Initialize FHE SDK instance with Promise caching to prevent race conditions
 * Must be called before any encryption operations
 */
export async function initializeFHE(): Promise<any> {
  if (fheInstance) return fheInstance;
  if (initPromise) return initPromise; // Prevent duplicate initialization

  initPromise = (async () => {
    // ✅ 按照 FHE 文档：initSDK() 不接受参数
    // WASM 文件必须和 UMD 脚本在同一目录
    await initSDK();

    // ✅ 使用 SepoliaConfig 创建实例
    fheInstance = await createInstance(SepoliaConfig);
    return fheInstance;
  })();

  return await initPromise;
}

/**
 * Encrypt uint64 value for contract
 */
export async function encryptUint64(
  value: bigint,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  const fhe = await initializeFHE();
  const input = await fhe.createEncryptedInput(
    getAddress(contractAddress),
    getAddress(userAddress)
  );

  input.add64(value);
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof)
  };
}

/**
 * Encrypt uint32 value for contract
 */
export async function encryptUint32(
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> {
  const fhe = await initializeFHE();
  const input = await fhe.createEncryptedInput(
    getAddress(contractAddress),
    getAddress(userAddress)
  );

  input.add32(value);
  const { handles, inputProof } = await input.encrypt();

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(inputProof)
  };
}

/**
 * Encrypt puzzle data (solution + difficultyScore) with shared proof
 * This is the correct FHE pattern - encrypt all parameters at once
 */
export async function encryptPuzzleData(
  solution: bigint,
  difficultyScore: number,
  contractAddress: string,
  userAddress: string
): Promise<{
  handles: [string, string];
  inputProof: string;
}> {
  const fhe = await initializeFHE();
  const input = await fhe.createEncryptedInput(
    getAddress(contractAddress),
    getAddress(userAddress)
  );

  // Add in contract parameter order (important!)
  input.add64(solution);           // handles[0]
  input.add32(difficultyScore);    // handles[1]

  // One encryption, generates one proof to verify all values
  const { handles, inputProof } = await input.encrypt();

  return {
    handles: [hexlify(handles[0]), hexlify(handles[1])],
    inputProof: hexlify(inputProof)
  };
}

/**
 * Encrypt attempt data (answer + timeTaken) with shared proof
 */
export async function encryptAttemptData(
  answer: bigint,
  timeTakenInSeconds: number,
  contractAddress: string,
  userAddress: string
): Promise<{
  handles: [string, string];
  inputProof: string;
}> {
  const fhe = await initializeFHE();
  const input = await fhe.createEncryptedInput(
    getAddress(contractAddress),
    getAddress(userAddress)
  );

  // Add in contract parameter order
  input.add64(answer);             // handles[0]
  input.add32(timeTakenInSeconds); // handles[1]

  const { handles, inputProof } = await input.encrypt();

  return {
    handles: [hexlify(handles[0]), hexlify(handles[1])],
    inputProof: hexlify(inputProof)
  };
}

/**
 * Decrypt encrypted value from contract
 */
export async function decryptValue(
  handle: Uint8Array,
  contractAddress: string,
  userAddress: string
): Promise<bigint> {
  const fhe = await initializeFHE();
  return await fhe.decrypt(contractAddress, handle);
}
