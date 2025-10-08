# EdgeOne Pages 閮ㄧ讲鎸囧崡

## 椤圭洰姒傝堪

鏈」鐩槸涓€涓狝I鍜ㄨ甯堝簲鐢紝閲囩敤React + TypeScript + Vite鍓嶇鏋舵瀯锛岄泦鎴怱upabase浣滀负鍚庣鏈嶅姟銆侲dgeOne Pages鏄吘璁簯鎺ㄥ嚭鐨勫叏鏍堝紑鍙戜笌閮ㄧ讲骞冲彴锛屾敮鎸侀潤鎬佺綉绔欐墭绠″拰杈圭紭Serverless鍔熻兘銆?
## 閲嶈璇存槑

鈿狅笍 **EdgeOne Pages鏄潤鎬佺綉绔欐墭绠″钩鍙?*锛屼笉鏀寔浼犵粺鐨凬ode.js鍚庣鏈嶅姟鍣ㄣ€傛湰椤圭洰鐨勫悗绔姛鑳介渶瑕侀€氳繃浠ヤ笅鏂瑰紡瀹炵幇锛?
1. **Supabase鏈嶅姟**锛氭暟鎹簱銆佽璇併€佸疄鏃跺姛鑳?2. **杈圭紭鍑芥暟**锛氬鐞嗗鏉備笟鍔￠€昏緫锛堝AI瀵硅瘽銆佽闊冲鐞嗭級
3. **绗笁鏂笰PI**锛氱洿鎺ヤ粠鍓嶇璋冪敤锛堥渶瑕丆ORS鏀寔锛?
## 閮ㄧ讲鍓嶅噯澶?
### 1. 椤圭洰鏋勫缓楠岃瘉

椤圭洰宸查€氳繃鏋勫缓娴嬭瘯锛?- 鉁?鏋勫缓鍛戒护锛歚npm run build`
- 鉁?杈撳嚭鐩綍锛歚dist/`
- 鉁?鏋勫缓浜х墿锛欻TML銆丆SS銆丣S鏂囦欢

### 2. 鐜鍙橀噺閰嶇疆

宸插垱寤?`.env.production` 鏂囦欢锛屽寘鍚獷dgeOne Pages鎵€闇€鐨勭幆澧冨彉閲忥細

```env
# Supabase Configuration (蹇呴渶)
SB_URL=https://your-project.supabase.co
SB_ANON_KEY=your-public-anon-key

# Frontend Runtime Config
VITE_API_URL=https://your-project.supabase.co/rest/v1
VITE_SOCKET_URL=wss://your-project.supabase.co/realtime/v1
```

## EdgeOne Pages 閮ㄧ讲姝ラ

### 绗竴姝ワ細鍑嗗Git浠撳簱

1. **鍒濆鍖朑it浠撳簱**锛堝鏋滃皻鏈垵濮嬪寲锛夛細
   ```bash
   git init
   git add .
   git commit -m "Initial commit for EdgeOne Pages deployment"
   ```

2. **鎺ㄩ€佸埌杩滅▼浠撳簱**锛?   - GitHub锛氭帹鑽愶紝EdgeOne Pages鍘熺敓鏀寔
   - GitLab锛氫篃鏀寔
   - 鍏朵粬Git鎵樼鏈嶅姟

### 绗簩姝ワ細璁块棶EdgeOne Pages鎺у埗鍙?
1. 璁块棶 [EdgeOne Pages鎺у埗鍙癩(https://pages.edgeone.ai/)
2. 浣跨敤鑵捐浜戣处鍙风櫥褰?3. 鐐瑰嚮"鍒涘缓椤圭洰"

### 绗笁姝ワ細杩炴帴Git浠撳簱

1. **閫夋嫨Git鎻愪緵鍟?*锛欸itHub/GitLab
2. **鎺堟潈璁块棶**锛氬厑璁窫dgeOne Pages璁块棶浣犵殑浠撳簱
3. **閫夋嫨浠撳簱**锛氶€夋嫨鍖呭惈鏈」鐩殑浠撳簱
4. **閫夋嫨鍒嗘敮**锛氶€氬父閫夋嫨 `main` 鎴?`master` 鍒嗘敮

### 绗洓姝ワ細閰嶇疆鏋勫缓璁剧疆

鍦‥dgeOne Pages鎺у埗鍙颁腑閰嶇疆浠ヤ笅鏋勫缓鍙傛暟锛?
```yaml
# 鏋勫缓閰嶇疆
鏋勫缓鍛戒护: npm run build
杈撳嚭鐩綍: dist
Node.js鐗堟湰: 18.x 鎴栨洿楂?鍖呯鐞嗗櫒: npm
```

### 绗簲姝ワ細閰嶇疆鐜鍙橀噺

鍦‥dgeOne Pages鎺у埗鍙扮殑"鐜鍙橀噺"閮ㄥ垎娣诲姞锛?
1. **SB_URL**锛氫綘鐨凷upabase椤圭洰URL
2. **SB_ANON_KEY**锛歋upabase鍖垮悕瀵嗛挜
3. **VITE_API_URL**锛氳缃负Supabase REST API鍦板潃
4. **VITE_SOCKET_URL**锛氳缃负Supabase Realtime WebSocket鍦板潃

### 绗叚姝ワ細閮ㄧ讲椤圭洰

1. 鐐瑰嚮"閮ㄧ讲"鎸夐挳
2. EdgeOne Pages灏嗚嚜鍔細
   - 鍏嬮殕浣犵殑浠撳簱
   - 瀹夎渚濊禆锛坄npm install`锛?   - 鎵ц鏋勫缓锛坄npm run build`锛?   - 閮ㄧ讲鍒板叏鐞冭竟缂樿妭鐐?
### 绗竷姝ワ細閰嶇疆鑷畾涔夊煙鍚嶏紙鍙€夛級

1. 鍦‥dgeOne Pages鎺у埗鍙颁腑娣诲姞鑷畾涔夊煙鍚?2. 閰嶇疆DNS璁板綍鎸囧悜EdgeOne Pages鎻愪緵鐨凜NAME
3. 鍚敤HTTPS锛堣嚜鍔ㄩ厤缃甋SL璇佷功锛?
## 鍔熻兘閫傞厤璇存槑

### 宸查€傞厤鍔熻兘
- 鉁?鐢ㄦ埛娉ㄥ唽/鐧诲綍锛堥€氳繃Supabase Auth锛?- 鉁?鑱婂ぉ鐣岄潰鍜屾秷鎭瓨鍌紙閫氳繃Supabase Database锛?- 鉁?瀹炴椂娑堟伅锛堥€氳繃Supabase Realtime锛?- 鉁?鏂囦欢涓婁紶锛堥€氳繃Supabase Storage锛?
### 闇€瑕佽竟缂樺嚱鏁扮殑鍔熻兘
浠ヤ笅鍔熻兘闇€瑕佸湪EdgeOne Pages涓垱寤鸿竟缂樺嚱鏁帮細

1. **AI瀵硅瘽澶勭悊**锛?   - 璋冪敤鐧剧偧API
   - 澶勭悊AI鍝嶅簲
   - 娑堟伅鏍煎紡杞崲

2. **璇煶澶勭悊**锛?   - 璇煶杞枃瀛?   - 鏂囧瓧杞闊?   - 闊抽鏂囦欢澶勭悊

### 杈圭紭鍑芥暟绀轰緥

鍦‥dgeOne Pages涓垱寤鸿竟缂樺嚱鏁板鐞咥I瀵硅瘽锛?
```javascript
// /api/chat.js
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { message, userId } = await request.json();
  
  // 璋冪敤鐧剧偧API
  const response = await fetch(process.env.BAILIAN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BAILIAN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [{ role: 'user', content: message }]
    })
  });

  const aiResponse = await response.json();
  
  return new Response(JSON.stringify({
    reply: aiResponse.choices[0].message.content
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 鐩戞帶鍜岀淮鎶?
### 閮ㄧ讲鐩戞帶
- EdgeOne Pages鎻愪緵瀹炴椂閮ㄧ讲鏃ュ織
- 鍙互鏌ョ湅鏋勫缓鐘舵€佸拰閿欒淇℃伅
- 鏀寔鍥炴粴鍒颁箣鍓嶇殑鐗堟湰

### 鎬ц兘浼樺寲
EdgeOne Pages鑷姩鎻愪緵锛?- 鍏ㄧ悆CDN鍔犻€?- 鑷姩鍘嬬缉鍜屼紭鍖?- 杈圭紭缂撳瓨
- HTTP/2鍜孒TTP/3鏀寔

### 鑷姩閮ㄧ讲
- 姣忔鎺ㄩ€佸埌鎸囧畾鍒嗘敮鏃惰嚜鍔ㄨЕ鍙戦儴缃?- 鏀寔棰勮閮ㄧ讲锛圥ull Request锛?- 鍙互閰嶇疆閮ㄧ讲閽╁瓙

## 鏁呴殰鎺掗櫎

### 甯歌闂

1. **鏋勫缓澶辫触**锛?   - 妫€鏌ode.js鐗堟湰鍏煎鎬?   - 纭鎵€鏈変緷璧栭兘鍦╬ackage.json涓?   - 鏌ョ湅鏋勫缓鏃ュ織涓殑閿欒淇℃伅

2. **鐜鍙橀噺闂**锛?   - 纭繚鎵€鏈塚ITE_鍓嶇紑鐨勫彉閲忛兘宸查厤缃?   - 妫€鏌upabase閰嶇疆鏄惁姝ｇ‘
   - 楠岃瘉API瀵嗛挜鐨勬湁鏁堟€?
3. **CORS閿欒**锛?   - 纭繚Supabase椤圭洰鍏佽浣犵殑鍩熷悕
   - 妫€鏌PI璋冪敤鐨刄RL鏄惁姝ｇ‘
   - 楠岃瘉璁よ瘉澶存槸鍚︽纭缃?
4. **瀹炴椂鍔熻兘涓嶅伐浣?*锛?   - 妫€鏌ebSocket杩炴帴閰嶇疆
   - 纭Supabase Realtime宸插惎鐢?   - 楠岃瘉鏁版嵁搴撹〃鐨凴LS绛栫暐

## 鎴愭湰璇存槑

EdgeOne Pages鎻愪緵鍏嶈垂棰濆害锛?mcreference link="https://www.zyglq.cn/posts/qcloud-eo-pages-guide.html" index="1">1</mcreference> <mcreference link="https://cloud.tencent.com/developer/article/2509013" index="2">2</mcreference>
- 鍏嶈垂闈欐€佺綉绔欐墭绠?- 鍏ㄧ悆CDN鍔犻€?- 鑷姩HTTPS璇佷功
- 鍩虹杈圭紭鍑芥暟璋冪敤

瓒呭嚭鍏嶈垂棰濆害鍚庢寜浣跨敤閲忚璐癸紝閫傚悎涓汉椤圭洰鍜屼腑灏忓瀷搴旂敤銆?
## 鎬荤粨

EdgeOne Pages涓烘湰AI鍜ㄨ甯堥」鐩彁渚涗簡鐞嗘兂鐨勯儴缃插钩鍙帮紝缁撳悎Supabase鍚庣鏈嶅姟锛屽彲浠ュ疄鐜帮細
- 蹇€熷叏鐞冮儴缃?- 鑷姩鎵╃缉瀹?- 楂樺彲鐢ㄦ€?- 鎴愭湰鏁堢泭

閫氳繃杈圭紭鍑芥暟鎵╁睍锛屽彲浠ュ鐞嗗鏉傜殑AI瀵硅瘽鍜岃闊冲鐞嗛渶姹傦紝涓虹敤鎴锋彁渚涙祦鐣呯殑浣撻獙銆