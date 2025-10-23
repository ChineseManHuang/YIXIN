# 意心AI - 快速参考卡片

## 🔑 关键信息

### 服务器信息
- **IP地址**: 8.148.73.181
- **管理员用户名**: Administrator
- **项目位置**: F:\www\yixin
- **后端端口**: 3000

### 网址
- **前端**: https://yixinaipsy.com
- **后端API**: https://api.yixinaipsy.com/api （服务器本地可用 http://localhost:3000/api）
- **健康检查**: https://api.yixinaipsy.com/api/health

---

## 🚀 常用命令（在服务器PowerShell中使用）

### 查看服务状态
```powershell
pm2 status
```

### 查看日志
```powershell
# 实时日志
pm2 logs YixinBackend

# 最近50行
pm2 logs YixinBackend --lines 50

# 只看错误
pm2 logs YixinBackend --err
```

### 重启服务
```powershell
pm2 restart YixinBackend
```

### 停止服务
```powershell
pm2 stop YixinBackend
```

### 启动服务
```powershell
pm2 start YixinBackend
```

### 更新代码
```powershell
cd F:\www\yixin
git pull origin main
npm install
pm2 restart YixinBackend
```

### 查看环境变量
```powershell
Get-Content F:\www\yixin\.env
```

### 编辑环境变量
```powershell
notepad F:\www\yixin\.env
# 修改后记得：pm2 restart YixinBackend
```

---

## 📝 部署流程速记

1. **连接服务器**: `mstsc` → 输入 `8.148.73.181`
2. **打开PowerShell**: 右键开始菜单 → 终端(管理员)
3. **下载代码**:
   ```powershell
   cd F:\www
   git clone https://github.com/ChineseManHuang/YIXIN.git yixin
   cd yixin
   ```
4. **配置环境**: `.\setup-env.ps1`
5. **部署**: `.\deploy-windows.ps1`
6. **开放端口**: 阿里云控制台 → 安全组 → 添加规则 → 端口3000
7. **测试**: 访问 `https://api.yixinaipsy.com/api/health`（如需排查可直接访问 `http://8.148.73.181:3000/api/health`）

---

## ❌ 常见错误速查

### 错误: "无法连接到服务器"
**检查**:
- [ ] 服务是否在运行: `pm2 status`
- [ ] 端口3000是否开放: 阿里云安全组
- [ ] Windows防火墙: `Get-NetFirewallRule -DisplayName "YixinBackend*"`

### 错误: "CORS跨域错误"
**检查**:
- [ ] `.env` 中的 `CLIENT_ORIGINS` 包含 `https://yixinaipsy.com`、`https://www.yixinaipsy.com`（如需测试环境，还要包含 `https://yinxintest99.edgeone.app`）
- [ ] 重启服务: `pm2 restart YixinBackend`

### 错误: "数据库连接失败"
**检查**:
- [ ] Supabase配置是否正确: `Get-Content F:\www\yixin\.env | Select-String "SB_"`
- [ ] 网络是否正常: `ping supabase.com`

### 错误: "PM2 command not found"
**解决**:
```powershell
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

---

## 🔧 紧急重启流程

如果服务完全崩溃了：

```powershell
# 1. 停止所有PM2进程
pm2 kill

# 2. 重新启动
cd F:\www\yixin
pm2 start npm --name YixinBackend -- run start

# 3. 保存配置
pm2 save
```

---

## 📞 需要帮助时

**收集信息**:
```powershell
# 查看PM2状态
pm2 status

# 查看最近日志
pm2 logs YixinBackend --lines 100 --nostream > logs.txt

# 查看环境变量（隐藏敏感信息）
Get-Content F:\www\yixin\.env | Select-String -Pattern "PORT|NODE_ENV|CLIENT_ORIGINS"
```

把以上信息发给技术支持，能更快解决问题！

---

## 🎯 维护建议

### 每周一次
- [ ] 查看日志是否有异常: `pm2 logs YixinBackend --lines 100`
- [ ] 检查磁盘空间: `Get-PSDrive F`

### 每月一次
- [ ] 更新依赖: `cd F:\www\yixin && npm update`
- [ ] 清理日志: `pm2 flush`
- [ ] 备份 .env 文件

### 更新代码后
- [ ] 拉取最新代码: `git pull`
- [ ] 安装新依赖: `npm install`
- [ ] 重启服务: `pm2 restart YixinBackend`
- [ ] 查看日志确认: `pm2 logs YixinBackend`

---

**记住这个文件！** 遇到问题先来这里找答案！
