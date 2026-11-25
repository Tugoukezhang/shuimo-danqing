# 别让猫进厨房 · 房间防守重建版加密备份

本分支存放加密工程包。个人文件库中单独保存了恢复文件 kitchen-room-rebuild-recovery-20261125.key。请自行另存到密码管理器的加密附件或安全的离线位置。

在装有 Python 3 与 GnuPG 2 的环境，检出此提交后运行以下命令。

`python3 restore.py --key /private/path/kitchen-room-rebuild-recovery-20261125.key --out restored.zip`

解压 restored.zip，在解压目录中运行 `node --test test.js qa/verify-entry.js` 及 `node qa/test-matrix.js`。浏览器打开 index.html，微信开发者工具导入 wechat。