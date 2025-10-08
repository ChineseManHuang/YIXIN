# AI鍜ㄨ甯堥」鐩儴缃叉寚鍗?
## 1. 閮ㄧ讲姒傝堪

鏈」鐩槸涓€涓熀浜?React + Node.js + Supabase 鐨?AI 蹇冪悊鍜ㄨ搴旂敤锛屾敮鎸佸墠鍚庣涓€浣撳寲閮ㄧ讲鍒?Vercel 骞冲彴銆?
### 1.1 鎶€鏈灦鏋?- **鍓嶇**: React 18 + Vite + TypeScript + Tailwind CSS
- **鍚庣**: Node.js + Express + TypeScript
- **鏁版嵁搴?*: Supabase (PostgreSQL)
- **閮ㄧ讲骞冲彴**: Vercel
- **璁よ瘉**: JWT + Supabase Auth

### 1.2 閮ㄧ讲鏂瑰紡
- 鍓嶅悗绔粺涓€閮ㄧ讲鍒?Vercel
- 浣跨敤 Vercel Functions 杩愯鍚庣 API
- 鍓嶇闈欐€佹枃浠舵墭绠″湪 Vercel CDN

## 2. 閮ㄧ讲鍓嶅噯澶?
### 2.1 鐜瑕佹眰
- Node.js 20+
- npm 鎴?yarn
- Git
- Vercel 璐﹀彿
- Supabase 璐﹀彿

### 2.2 椤圭洰缁撴瀯纭
```
f:\YIXIN_PROJECT\
鈹溾攢鈹€ src/           # 鍓嶇婧愮爜
鈹溾攢鈹€ api/           # 鍚庣 API
鈹溾攢鈹€ dist/          # 鏋勫缓杈撳嚭
鈹溾攢鈹€ vercel.json    # Vercel 閰嶇疆
鈹溾攢鈹€ package.json   # 渚濊禆绠＄悊
鈹斺攢鈹€ .env          # 鐜鍙橀噺
```

## 3. 鐜鍙橀噺閰嶇疆

### 3.1 鐢熶骇鐜鍙橀噺娓呭崟

鍦?Vercel 椤圭洰璁剧疆涓厤缃互涓嬬幆澧冨彉閲忥細

#### 蹇呴渶鍙橀噺
```bash
# Supabase 閰嶇疆
SB_URL=https://your-project.supabase.co
SB_ANON_KEY=your-public-anon-key
SB_SERVICE_ROLE_KEY=your-service-role-key

# JWT 閰嶇疆
JWT_SECRET=your-secure-random-jwt-secret

# 鏈嶅姟鍣ㄩ厤缃?PORT=3001
CLIENT_ORIGINS=https://your-domain.vercel.app

# 鍓嶇閰嶇疆
VITE_API_URL=/api
VITE_SOCKET_URL=https://your-domain.vercel.app
```

#### 鍙€夊彉閲?```bash
# 闃块噷浜戠櫨鐐?AI 鏈嶅姟
BAILIAN_API_KEY=your-bailian-api-key
BAILIAN_ENDPOINT=your-bailian-endpoint

# 闃块噷浜戣闊虫湇鍔?ALIBABA_VOICE_API_KEY=your-voice-api-key
ALIBABA_VOICE_API_URL=your-voice-api-url

# 閮ㄧ讲閽╁瓙锛堢敤浜庤嚜鍔ㄥ寲閮ㄧ讲锛?BACKEND_DEPLOY_HOOK_URL=your-backend-hook-url
FRONTEND_DEPLOY_HOOK_URL=your-frontend-hook-url
```

### 3.2 鑾峰彇 Supabase 閰嶇疆

1. 鐧诲綍 [Supabase Dashboard](https://supabase.com/dashboard)
2. 閫夋嫨浣犵殑椤圭洰
3. 杩涘叆 Settings 鈫?API
4. 澶嶅埗浠ヤ笅淇℃伅锛?   - Project URL 鈫?`SB_URL`
   - anon public 鈫?`SB_ANON_KEY`
   - service_role 鈫?`SB_SERVICE_ROLE_KEY`

### 3.3 鐢熸垚 JWT Secret

```bash
# 浣跨敤 Node.js 鐢熸垚瀹夊叏鐨?JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## 4. Vercel 閮ㄧ讲姝ラ

### 4.1 鏂瑰紡涓€锛氶€氳繃 Vercel CLI

1. **瀹夎 Vercel CLI**
```bash
npm i -g vercel
```

2. **鐧诲綍 Vercel**
```bash
vercel login
```

3. **鍒濆鍖栭」鐩?*
```bash
cd f:\YIXIN_PROJECT
vercel
```

4. **閰嶇疆椤圭洰璁剧疆**
- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

5. **璁剧疆鐜鍙橀噺**
```bash
vercel env add SB_URL
vercel env add SB_ANON_KEY
vercel env add SB_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
# ... 娣诲姞鍏朵粬蹇呴渶鍙橀噺
```

6. **閮ㄧ讲**
```bash
vercel --prod
```

### 4.2 鏂瑰紡浜岋細閫氳繃 GitHub 闆嗘垚

1. **鎺ㄩ€佷唬鐮佸埌 GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **杩炴帴 Vercel**
- 璁块棶 [Vercel Dashboard](https://vercel.com/dashboard)
- 鐐瑰嚮 "New Project"
- 閫夋嫨 GitHub 浠撳簱
- 瀵煎叆椤圭洰

3. **閰嶇疆鏋勫缓璁剧疆**
- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm ci`

4. **娣诲姞鐜鍙橀噺**
- 鍦ㄩ」鐩缃腑娣诲姞鎵€鏈夊繀闇€鐨勭幆澧冨彉閲?- 纭繚鎵€鏈夊彉閲忛兘璁剧疆涓?Production 鐜

5. **瑙﹀彂閮ㄧ讲**
- 鐐瑰嚮 "Deploy" 鎸夐挳
- 绛夊緟鏋勫缓瀹屾垚

## 5. 鏁版嵁搴撹縼绉?
### 5.1 Supabase 鏁版嵁搴撹缃?
1. **杩愯杩佺Щ鑴氭湰**
```sql
-- 鍦?Supabase SQL Editor 涓緷娆℃墽琛岋細
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_update_schema.sql  
-- 3. supabase/migrations/003_voice_logs_table.sql
```

2. **閰嶇疆 RLS 绛栫暐**
- 纭繚鎵€鏈夎〃閮藉惎鐢ㄤ簡 Row Level Security
- 楠岃瘉鐢ㄦ埛鏉冮檺绛栫暐姝ｇ‘閰嶇疆

3. **璁剧疆瀛樺偍妗讹紙濡傞渶瑕侊級**
- 鍒涘缓鐢ㄤ簬澶村儚鍜屾枃浠朵笂浼犵殑瀛樺偍妗?- 閰嶇疆閫傚綋鐨勮闂瓥鐣?
## 6. 閮ㄧ讲楠岃瘉

### 6.1 鍔熻兘娴嬭瘯娓呭崟

閮ㄧ讲瀹屾垚鍚庯紝璇烽獙璇佷互涓嬪姛鑳斤細

- [ ] 棣栭〉姝ｅ父鍔犺浇
- [ ] 鐢ㄦ埛娉ㄥ唽鍔熻兘
- [ ] 鐢ㄦ埛鐧诲綍鍔熻兘
- [ ] 浼氳瘽鍒涘缓鍜岀鐞?- [ ] 娑堟伅鍙戦€佸拰鎺ユ敹
- [ ] 璇煶鍔熻兘锛堝宸查厤缃級
- [ ] 鐢ㄦ埛璧勬枡绠＄悊
- [ ] 鍝嶅簲寮忚璁?
### 6.2 鎬ц兘妫€鏌?
- [ ] 椤甸潰鍔犺浇閫熷害 < 3绉?- [ ] API 鍝嶅簲鏃堕棿 < 1绉?- [ ] 绉诲姩绔€傞厤姝ｅ父
- [ ] HTTPS 璇佷功鏈夋晥

### 6.3 閿欒鐩戞帶

1. **鏌ョ湅 Vercel 鍑芥暟鏃ュ織**
```bash
vercel logs
```

2. **鐩戞帶 Supabase 鏃ュ織**
- 鍦?Supabase Dashboard 鏌ョ湅 API 璋冪敤鏃ュ織
- 妫€鏌ユ暟鎹簱杩炴帴鐘舵€?
## 7. 鍩熷悕閰嶇疆

### 7.1 鑷畾涔夊煙鍚?
1. **鍦?Vercel 椤圭洰璁剧疆涓坊鍔犲煙鍚?*
2. **閰嶇疆 DNS 璁板綍**
```
Type: CNAME
Name: your-subdomain (鎴?@)
Value: cname.vercel-dns.com
```

3. **鏇存柊鐜鍙橀噺**
```bash
CLIENT_ORIGINS=https://your-custom-domain.com
VITE_SOCKET_URL=https://your-custom-domain.com
```

### 7.2 SSL 璇佷功

Vercel 浼氳嚜鍔ㄤ负鑷畾涔夊煙鍚嶆彁渚?SSL 璇佷功锛岄€氬父鍦ㄥ煙鍚嶆坊鍔犲悗鍑犲垎閽熷唴鐢熸晥銆?
## 8. 鎸佺画閮ㄧ讲

### 8.1 鑷姩閮ㄧ讲

椤圭洰宸查厤缃?GitHub 闆嗘垚锛屾瘡娆℃帹閫佸埌 main 鍒嗘敮閮戒細鑷姩瑙﹀彂閮ㄧ讲銆?
### 8.2 閮ㄧ讲閽╁瓙

浣跨敤椤圭洰鍐呯疆鐨勯儴缃茶剼鏈細

```bash
# 閮ㄧ讲鍓嶇鍜屽悗绔?npm run deploy

# 浠呴儴缃插悗绔?npm run deploy:backend

# 浠呴儴缃插墠绔? 
npm run deploy:frontend
```

### 8.3 鍥炴粴绛栫暐

濡傛灉閮ㄧ讲鍑虹幇闂锛?
1. **閫氳繃 Vercel Dashboard 鍥炴粴**
   - 杩涘叆椤圭洰鐨?Deployments 椤甸潰
   - 閫夋嫨涔嬪墠鐨勭ǔ瀹氱増鏈?   - 鐐瑰嚮 "Promote to Production"

2. **閫氳繃 Git 鍥炴粴**
```bash
git revert HEAD
git push origin main
```

## 9. 鐩戞帶鍜岀淮鎶?
### 9.1 鎬ц兘鐩戞帶

- 浣跨敤 Vercel Analytics 鐩戞帶璁块棶閲忓拰鎬ц兘
- 閰嶇疆 Supabase 鐩戞帶鍛婅
- 瀹氭湡妫€鏌?API 鍝嶅簲鏃堕棿

### 9.2 瀹夊叏缁存姢

- 瀹氭湡鏇存柊渚濊禆鍖?- 鐩戞帶 Supabase 瀹夊叏鏃ュ織
- 瀹氭湡杞崲 API 瀵嗛挜

### 9.3 澶囦唤绛栫暐

- Supabase 鑷姩澶囦唤鏁版嵁搴?- 瀹氭湡瀵煎嚭閲嶈閰嶇疆
- 淇濇寔浠ｇ爜浠撳簱鍚屾

## 10. 鏁呴殰鎺掗櫎

### 10.1 甯歌闂

**闂锛氶儴缃插悗 API 璇锋眰澶辫触**
- 妫€鏌ョ幆澧冨彉閲忔槸鍚︽纭厤缃?- 楠岃瘉 Supabase 杩炴帴閰嶇疆
- 鏌ョ湅 Vercel 鍑芥暟鏃ュ織

**闂锛氬墠绔〉闈㈢┖鐧?*
- 妫€鏌ユ瀯寤烘棩蹇楁槸鍚︽湁閿欒
- 楠岃瘉 `dist` 鐩綍鏄惁姝ｇ‘鐢熸垚
- 妫€鏌?`vercel.json` 璺敱閰嶇疆

**闂锛氭暟鎹簱杩炴帴澶辫触**
- 楠岃瘉 Supabase URL 鍜屽瘑閽?- 妫€鏌ユ暟鎹簱杩佺Щ鏄惁瀹屾垚
- 纭 RLS 绛栫暐閰嶇疆姝ｇ‘

### 10.2 璋冭瘯宸ュ叿

```bash
# 鏌ョ湅閮ㄧ讲鏃ュ織
vercel logs --follow

# 鏈湴娴嬭瘯鐢熶骇鏋勫缓
npm run build
npm run preview

# 妫€鏌ョ幆澧冨彉閲?vercel env ls
```

## 11. 鎴愭湰浼樺寲

### 11.1 Vercel 鐢ㄩ噺浼樺寲

- 鍚堢悊璁剧疆鍑芥暟瓒呮椂鏃堕棿
- 浼樺寲闈欐€佽祫婧愬ぇ灏?- 浣跨敤 CDN 缂撳瓨绛栫暐

### 11.2 Supabase 鐢ㄩ噺浼樺寲

- 鍚堢悊璁捐鏁版嵁搴撴煡璇?- 浣跨敤杩炴帴姹?- 瀹氭湡娓呯悊杩囨湡鏁版嵁

---

**閮ㄧ讲瀹屾垚鍚庯紝浣犵殑 AI 鍜ㄨ甯堝簲鐢ㄥ皢鍦?`https://your-project.vercel.app` 涓婄嚎杩愯锛?*

濡傛湁闂锛岃妫€鏌?Vercel 閮ㄧ讲鏃ュ織鍜?Supabase 鐩戞帶闈㈡澘銆