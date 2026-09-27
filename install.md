# install.md — CloudPanel에 Biogram MINI 키오스크 배포하기

> 대상: CloudPanel v2 + Node.js 사이트. 마지막 검증: 2026-09-27.
> 공식 문서 근거: CloudPanel v2 `Add Site`(Node.js 사이트 생성),
> `Node.js deployment with pm2`(PM2 실행·저장·재부팅 cron).
> 이 앱: Next.js 16 standalone, 포트 3100(변경 가능), SQLite(Prisma), PM2 상주 실행.

---

## 0. 전체 그림 (5분 이해)

```
브라우저(https) → CloudPanel nginx(443, TLS 종료·리버스 프록시)
  → 127.0.0.1:<App Port> → PM2 → bun .next/standalone/server.js
  → SQLite 파일(db) + 업로드 이미지 디스크
```

* CloudPanel이 도메인·TLS·리버스 프록시를 맡습니다. **이 프로젝트의 `Caddyfile`은 CloudPanel 배포에서는 사용하지 않습니다.**
* CloudPanel nginx가 TLS를 종료하므로 앱은 평문 HTTP로 떠도 됩니다.
  앱이 `x-forwarded-proto: https`를 보고 세션 쿠키에 `Secure`를 자동 적용합니다.
* DB와 업로드 파일은 **코드 디렉터리 밖에** 두어 재배포·재빌드 때 날아가지 않게 합니다.

---

## 1. 사전 준비

| 항목 | 값/조건 |
|---|---|
| 서버 | CloudPanel v2 설치된 VPS (Ubuntu 22.04/24.04 권장) |
| 도메인 | 예: `kiosk.example.com`, 서버 IP로 A 레코드 지정 후 전파 확인 (`nslookup kiosk.example.com`) |
| Node.js | **20.9 이상, 22 LTS 권장** (Next.js 16 요구사항) |
| 포트 | 기본 **3100** 사용. CloudPanel 사이트 생성 시 App Port에 동일하게 입력 |
| 디스크 | 최소 2GB 여유 (빌드 산출물 + 이미지) |

---

## 2. CloudPanel에 Node.js 사이트 생성

1. CloudPanel 관리画面 → **Sites** → **Add Site** → **Create a Node.js Site**.
2. 입력값:
   * **Domain Name**: `kiosk.example.com` (www 입력 시 www↔non-www 리다이렉트 자동 생성)
   * **Node.js Version**: 22 (nvm으로 관리됨, 20 이상이면 됨)
   * **App Port**: `3100`
3. **Create** 클릭. 생성된 **Site User**(예: `kiosk-user`)와 홈 디렉터리(`/home/kiosk-user`)를 메모.
   앱 파일은 `/home/kiosk-user/htdocs/kiosk.example.com/` 아래에 들어갑니다.
4. CloudPanel이 자동으로 처리해주는 것: nginx 리버스 프록시(`127.0.0.1:3100`으로 전달),
   HTTP→HTTPS 리다이렉트, Let's Encrypt TLS 인증서.

---

## 3. SSH 접속 + 실행 환경 설치 (Site User로)

```bash
# 1) Site User로 접속 (CloudPanel이 만든 SSH 계정)
ssh kiosk-user@<서버IP>

# 2) Node 버전 확인 (20.9+ / 22 권장)
node -v
# 버전이 낮거나 없으면 관리자에게 Node 22 추가 요청 (CloudPanel은 nvm으로 버전 관리)

# 3) bun 설치 (이 프로젝트는 bun.lock + bun 스크립트 사용)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version   # 1.x 확인

# 4) PM2 설치 (프로세스 관리자: 죽으면 자동 재시작)
npm install pm2@latest -g
pm2 --version

# 5) 영속 데이터 디렉터리 생성 (재배포 때 지워지면 안 되는 것들)
mkdir -p ~/data ~/uploads
chmod 700 ~/data
```

---

## 4. 코드 배포

```bash
cd ~/htdocs/kiosk.example.com/

# 방법 A) git으로 받기 (권장)
git clone <저장소URL> .
# 방법 B) 파일 업로드: 프로젝트 전체를 이 디렉터리에 복사 (node_modules 제외)

# Site User 소유 확인 (권한 문제의 1순위 원인)
# (Site User로 작업했으면 이미 본인 소유. root로 복사했다면 아래 실행)
# sudo chown -R kiosk-user:kiosk-user ~/htdocs/kiosk.example.com/
```

---

## 5. 환경변수 설정 (.env)

프로젝트 루트에 `.env` 파일을 만듭니다. **`.env`는 git에 커밋하지 마세요.**

```bash
cd ~/htdocs/kiosk.example.com/
cat > .env << 'EOF'
# --- 필수 ---
# 앱이 실제로 Listen할 포트 (= CloudPanel App Port와 동일)
PORT=3100
NODE_ENV=production

# SQLite 파일: 코드 디렉터리 밖 영속 경로 (절대경로, file: 접두어)
DATABASE_URL=file:/home/kiosk-user/data/custom.db

# 세션 서명 키: 최소 32자, 절대 유출 금지 (아래 명령으로 생성)
JWT_SECRET=<여기에_생성한_값>

# 업로드 이미지 저장소: 코드 디렉터리 밖 영속 경로
UPLOAD_DIR=/home/kiosk-user/uploads

# --- 최초 1회 시드용 (관리자 계정 생성 후에는 삭제하거나 비워두기) ---
SEED_ADMIN_EMAIL=admin@biogram.co.kr
SEED_ADMIN_PASSWORD=<12자이상_대소문자숫자특수문자_포함>
SEED_ADMIN_NAME=최관리
EOF
chmod 600 .env
```

| 변수 | 설명 |
|---|---|
| `PORT` | 리슨 포트. CloudPanel App Port와 **반드시 일치** |
| `DATABASE_URL` | `file:` + 절대경로. `~/data`처럼 재배포 때 안 지워지는 곳 |
| `JWT_SECRET` | `openssl rand -base64 48` 로 생성. 바꾸면 전원 로그아웃됨 |
| `UPLOAD_DIR` | 업로드 이미지 영속 경로. 미설정 시 프로젝트 내 `public/admin-uploads` 사용(재배포 시 유실 가능) |
| `SEED_ADMIN_*` | 최초 관리자 생성용. 생성 후 제거 권장 |
| `NODE_ENV` | `production` 고정 |

> 참고: `Caddyfile`의 `:81` 설정은 CloudPanel 배포와 무관합니다. 무시하세요.

---

## 6. 설치 · 빌드 · DB 초기화 · 시드

```bash
cd ~/htdocs/kiosk.example.com/

# 1) 의존성 설치
bun install

# 2) Prisma 클라이언트 생성 + SQLite 파일/테이블 생성
bunx prisma generate
bun run db:push        # = prisma db push (SQLite 초기 테이블 생성)

# 3) 초기 데이터 시드 (관리자 계정 + 측정항목 + 13개 화면 콘텐츠)
bun run db:seed
# 출력에 "시드 완료!" 확인. 비밀번호는 로그에 출력되지 않습니다.

# 4) 프로덕션 빌드
bun run build
# 끝부분에 ○/ƒ 라우트 목록이 나오면 성공
```

`db:push`는 SQLite 초기 생성용입니다. 이미 운영 중인 DB에 다시 실행해도
기존 데이터는 유지됩니다(단, 파괴적 `--accept-data-loss` 플래그는 절대 붙이지 마세요).

---

## 7. PM2로 상주 실행

```bash
cd ~/htdocs/kiosk.example.com/

# 1) .env 값을 읽어 PM2 ecosystem 파일 생성 (최초 1회)
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'biogram-kiosk',
    script: './node_modules/.bin/next',
    args: 'start -p 3100',
    cwd: __dirname,
    instances: 1,          // SQLite는 단일 프로세스 필수 (절대 늘리지 마세요)
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT: '3100',
      DATABASE_URL: 'file:/home/kiosk-user/data/custom.db',
      JWT_SECRET: '<.env와_동일한_값>',
      UPLOAD_DIR: '/home/kiosk-user/uploads',
    },
  }],
};
EOF
# ↑ JWT_SECRET을 실제 값으로 교체하세요. 경로는 Site User에 맞게 수정.

# 2) 또는 bun standalone으로 직접 실행 (위 파일 대신, 둘 중 하나만)
# pm2 start --name biogram-kiosk bun -- ./.next/standalone/server.js
# (이 경우에도 아래 env는 동일하게 필요 → ecosystem 파일 방식 권장)

# 3) 실행 + 저장
pm2 start ecosystem.config.js
pm2 save
pm2 status   # biogram-kiosk 가 online 이어야 함

# 4) 재부팅 후 자동 복구 (공식 절차)
echo $PATH   # 출력 복사
crontab -e
# 아래 2줄 추가 (PATH는 1)에서 복사한 값으로 교체)
# PATH=/home/kiosk-user/.nvm/...:/usr/local/sbin:... (복사값)
# @reboot pm2 resurrect &> /dev/null
```

> 주의: `package.json`의 `npm start`는 내부에서 `bun`을 호출하므로
> PM2가 `npm start`로 실행해도 Site User의 PATH에 bun이 있어야 합니다.
> 위 ecosystem 방식(`next start`)이면 bun 없이 Node만으로 동작합니다.

---

## 8. 접속 확인 + 관리자 로그인

```bash
# 서버 안에서 직접 확인 (3100 응답 + CSP 헤더)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/
curl -s http://127.0.0.1:3100/api/content | head -c 120; echo
```

1. 브라우저에서 `https://kiosk.example.com/` 접속 → 대기 화면이 나오면 성공.
2. `https://kiosk.example.com/admin/login` → 시드 계정으로 로그인.
3. **즉시 할 일**: 관리자 username 클릭 → 비밀번호를 안전한 값으로 변경,
   `.env`의 `SEED_ADMIN_PASSWORD` 줄 삭제(또는 값 비우기).
4. 콘텐츠 수정 테스트: 콘텐츠 관리 → `standby(대기)` 행 → 배경색 저장 →
   키오스크 화면에 **5초 이내** 반영되는지 확인(새로고침 불필요).

---

## 9. 운영 (업데이트 · 백업)

```bash
# --- 업데이트 절차 (무중단 유사: 빌드 후 재시작, 수 초 끊김) ---
cd ~/htdocs/kiosk.example.com/
pm2 stop biogram-kiosk
git pull            # 또는 파일 교체
bun install
bun run build       # DB 파일은 ~/data에 있어 안전
pm2 restart biogram-kiosk
pm2 status

# --- 백업 (주 1회 + 업데이트 전, cron 권장) ---
cp /home/kiosk-user/data/custom.db /home/kiosk-user/data/custom.db.$(date +%F).bak
tar -czf ~/uploads-$(date +%F).tar.gz -C /home/kiosk-user uploads
# 백업 파일은 서버 외부(로컬 PC/스토리지)에도 보관하세요
```

---

## 10. 트러블슈팅

| 증상 | 원인 → 조치 |
|---|---|
| 도메인 접속 시 502 | 앱이 안 떠 있음. `pm2 status` → `pm2 logs biogram-kiosk --lines 50`. App Port(3100)와 `PORT` env 불일치 확인 |
| 로그인 성공 토스트 후 로그인 화면으로 돌아옴 | 평문 HTTP로 직접 접속했을 때 발생. 반드시 `https://` 도메인으로 접속 (쿠키 `Secure`는 HTTPS에서만 전송됨) |
| `JWT_SECRET is not configured` 로 앱 크래시 | env 누락. `JWT_SECRET` 32자 이상 설정 후 `pm2 restart` |
| Prisma `P1001`/테이블 없음 | `DATABASE_URL` 경로 오타, 또는 `bun run db:push` + `db:seed` 미실행 |
| 업로드 이미지 404 | `UPLOAD_DIR` 디렉터리 없음/권한 없음. `mkdir -p` + Site User 소유 확인. 구 URL도 `/admin-uploads/...` 라우트로 서빙됨 |
| 키오스크에 수정이 바로 안 보임 | 5초 폴링이므로 최대 5초 대기. 그래도 안 되면 브라우저 강력 새로고침(구 SW/번들 잔류). 그래도 안 되면 편집한 행의 섹션 키(`standby` 등)가 맞는지 확인 |
| 동시 접속多 → 쿼리 타임아웃 | SQLite 특성. 앱에 WAL+busy_timeout 내장됨. 지속되면 MySQL/PostgreSQL 이관 검토 |
| `sharp` 설치 오류 | 보통 x64 prebuilt로 해결. 실패 시 `apt install -y build-essential python3` 후 재설치 |
| 권한 오류 (EACCES) | 파일 소유자가 root로 되어 있을 때. `sudo chown -R kiosk-user:kiosk-user ~/htdocs/... ~/data ~/uploads` |

로그 위치: `pm2 logs biogram-kiosk` (또는 프로젝트 `server.log`).
CloudPanel 방화벽에서 외부 포트(3100)를 열 필요는 없습니다 (nginx가 내부 전달).

---

## 부록: 환경변수 전체표

| 변수 | 필수 | 예시 |
|---|---|---|
| `PORT` | 예 | `3100` |
| `NODE_ENV` | 예 | `production` |
| `DATABASE_URL` | 예 | `postgresql://biogram:PW@db:5432/biogram?schema=public` |
| `JWT_SECRET` | 예 | `openssl rand -base64 48` 출력값 |
| `UPLOAD_DIR` | 권장 | `/data/uploads` (Docker) 또는 `/home/kiosk-user/uploads` |
| `SEED_ADMIN_EMAIL` | 최초 1회 | `admin@biogram.co.kr` |
| `SEED_ADMIN_PASSWORD` | 최초 1회 | 12자+ 복잡도 충족 |
| `SEED_ADMIN_NAME` | 선택 | `최관리` |
| `SEED_ON_START` | 선택 | `true`면 부팅 시 시드 실행 (Docker entrypoint) |
| `ASSETLINKS_JSON` | TWA 시 | Play Console assetlinks 배열 JSON 문자열 |
| `KIOSK_LOG_RETENTION_DAYS` | 선택 | `90` (기본값, `db:retention`용) |
| `AUDIT_LOG_RETENTION_DAYS` | 선택 | `365` (기본값) |

## 부록: 보안·운영 메모 (2026-09-27 이후)

* **최초 로그인 강제 변경**: 시드/초기화 계정은 `mustChangePassword` 상태에서
  로그인되며, 변경 전까지 모든 관리 API가 403입니다.
* **2FA(TOTP)**: 관리자 **보안 설정**에서 QR 등록 → 로그인 2단계로 전환.
  기기 분실 시 최고관리자가 사용자 관리에서 초기화(`users:role` 필요).
* **세션**: 활동 시 8시간 슬라이딩 연장(최대 24시간), 계정당 5세션 상한.
* **유출 비번 차단**: 설정/변경 시 HaveIBeenPwned 조회 (오프라인이면 경고 후 통과).
* **보관 정책**: `bun run db:retention` (KioskLog 90일·AuditLog 365일, 배치 삭제).
  cron 예: `0 3 * * * cd <프로젝트> && bun run db:retention`.
* **PG 백업**: `docker exec biogram-db pg_dump -U biogram biogram > backup.sql`
  (복구: `psql` 로 restore). 주 1회 + 업데이트 전.
* **TWA**: `ASSETLINKS_JSON`에 Play 지문 배열을 넣으면
  `/.well-known/assetlinks.json` 서빙. 매니페스트는 `/api/pwa/manifest`(동적).
* **CI**: `.github/workflows/ci.yml` (install→generate→tsc→eslint→build).
