# CipherPuzzle-Lab 游戏设计

## 概述
CipherPuzzle-Lab 提供一系列逻辑谜题，玩家提交答案时保持谜题与答案保密，确保竞赛公平。

## FHE 机制
- 谜题答案以 `euint64` 加密存储，使用 `FHE.eq` 判断玩家提交是否正确。
- 提供提示时调用 `FHE.select`，只在玩家积分达到阈值后解锁。
- 所有排行榜采用加密累加，结果由 Gateway 在赛季结束后解密。

## 模块划分
1. `puzzle-builder`：关卡编辑器，输出加密句柄。
2. `contracts/PuzzleJudge`：负责校验答案、发放积分。
3. `player-hub`：前端界面，集成 SDK Hook。

## 后续步骤
- 加入合作模式，利用批量处理同步队伍积分。
- 设置反作弊 attestation，验证玩家设备环境。
