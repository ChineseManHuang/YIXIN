# ��Ŀ˵��

����Ŀ���� React + Vite ǰ���� Express + Socket.io ��ˡ�ǰ��ͨ�� REST API ����ͨ�ţ�ͬʱʹ�� Socket.io ʵ��ʵʱ�Ի�������

## ��������

���Ƹ�Ŀ¼�µ� `.env.example` Ϊ `.env`������дʵ�ʵ���Կ��

```bash
cp .env.example .env
```

��Ҫ���õĹؼ�������

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`��Supabase ��Ŀ��ַ�� Service Role Key��
- `JWT_SECRET`���������ɵĸ�ǿ������ַ�����
- `CLIENT_ORIGINS`��������ʺ�˵�ǰ�˵�ַ�б�
- `BAILIAN_API_KEY`��`ALIBABA_VOICE_API_KEY` ��Ϊ��ѡ�ⲿ����ƾ�ݣ����ڼ����������ʱ���á�

> `.env` �ļ��ѱ����� `.gitignore`��������ʵ��Կ�ύ���汾�⡣

## ���ؿ���

```bash
npm install
npm run dev:socket   # ͬʱ����ǰ���� Socket �汾��ˣ��Ƽ���
# ��
npm run dev          # ǰ�� + nodemon �ȸ��� REST ���
```

Ĭ������£�
- ǰ�������� `http://localhost:5173`��
- REST API �� Socket ���������� `http://localhost:3001`��

## ��������

```bash
npm run build    # ����ǰ�˲�ִ�� TypeScript ���
npm run lint     # ��ѡ������ ESLint
```

## ����ű�

`scripts/deploy.ts` ���ȡ `.env` �е� `BACKEND_DEPLOY_HOOK_URL` �� `FRONTEND_DEPLOY_HOOK_URL` ������Զ�˲��� Hook��

```bash
npm run deploy               # ͬʱ����ǰ���
npm run deploy -- -t backend # ��������
npm run deploy -- -t frontend# ������ǰ��
```

��δ������Ӧ Hook�����Զ�������

## ����ʱ����

- `VITE_API_URL`��ǰ�˷��� REST API �ĵ�ַ������ `https://api.example.com/api`����
- `VITE_SOCKET_URL`��ǰ������ Socket.io �ĵ�ַ������ `https://api.example.com`����

δ����ʱ��ǰ�˻�Ĭ��ʹ�ú������������
