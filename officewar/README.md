# Office War · 오피스 워

**EN:** A lightweight browser shoot-’em-up about surviving a day at the office—from **9:00 commute to 9:00 crunch**—with **12 themed stages**, Korean/English UI, and raster sprite art.

**KO:** **09:00 출근부터 21:00 야근까지**, 직장 일상을 소재로 한 **12 스테이지** 브라우저 슈팅 게임입니다. **한국어·영어** 인터페이스와 PNG 스프라이트를 사용합니다.

---

## English

### About

- Progressive **12-stage** run with different enemy mixes and difficulty.
- Pick **language** (Korean / English) and **player** (two character options) before starting.
- Uses the HTML5 **Canvas** (720×960 internal resolution), optional **touch controls** on phones and tablets.

### How to run

1. Clone or download this repository.
2. Serve the folder as static files **or** open `index.html` from a local HTTP server (recommended so assets load reliably).
   - Example: `npx serve .` from the project root, then open the URL shown.
3. Deploy to **GitHub Pages** or any static host by uploading the same files (no build step).

### Controls

| PC (keyboard) | Action |
|---------------|--------|
| Arrow keys / **W A S D** | Move |
| **Z** / **Space** | Fire (hold for faster shots) |
| **X** | Bomb |
| **Shift** | Slow movement |
| **ESC** | Pause |

| Mobile | Action |
|--------|--------|
| Left **virtual stick** | Move |
| **Fire** / **Bomb** buttons | Shoot / use bomb |

On narrow viewports or coarse pointers, the stage uses the full screen and the canvas scales with **object-fit: cover** so the play area fills the device.

### Project layout (high level)

| Path | Role |
|------|------|
| `index.html` | Page shell, canvas, HUD, touch layer |
| `css/main.css` | Layout and responsive / mobile rules |
| `js/main.js` | Boot, menu, input, localization hooks |
| `js/game.js` | Game logic, rendering, stages |
| `js/assets.js` | Spritesheets / raster URLs, scaling helpers |
| `js/i18n.js` | String tables |
| `img/` | Backgrounds and PNG characters / enemies |

---

## 한국어

### 소개

- 하루를 **스테이지**로 나누어 진행하는 **슈팅** 게임입니다.
- 시작 전에 **언어**(한국어·영어)와 **직원 캐릭터**를 선택합니다.
- 스마트폰에서는 가상 조이스틱과 발사/봄 버튼이 나타납니다.

### 실행 방법

1. 저장소를 클론하거나 ZIP으로 받습니다.
2. **정적 파일 서버**로 폴더를 열거나(권장), 로컬에서 `index.html`을 제공하는 방식으로 실행합니다.
   - 예: 프로젝트 루트에서 `npx serve .` 후 안내되는 주소로 접속
3. **GitHub Pages** 등 정적 호스팅에 그대로 올리면 됩니다(별도 빌드 없음).

### 조작법

**PC**

- **방향키 / WASD** — 이동  
- **Z / 스페이스** — 발사(길게 눌러 연사)  
- **X** — 봄  
- **Shift** — 저속 이동  
- **ESC** — 일시정지  

**모바일**

- 왼쪽 **스틱** — 이동  
- **발사** / **봄** — 각각 공격·봄  

모바일·좁은 화면에서는 스테이지가 화면에 맞게 **꽉 차도록** 표시되고, 게임 영역 비율은 유지된 채 잘림이 있을 수 있습니다.

### 디렉터리 요약

| 경로 | 설명 |
|------|------|
| `index.html` | 페이지, 캔버스, HUD, 터치 UI |
| `css/main.css` | 스타일·반응형 |
| `js/main.js` | 시작 흐름, 입력 연결 |
| `js/game.js` | 게임 본체·스테이지 |
| `js/assets.js` | 이미지/스케일 |
| `js/i18n.js` | 번역 문자열 |
| `img/` | 배경·PNG 스프라이트 |

---

## Contributing & license

Issues and pull requests are welcome.

This repository does not include a bundled open-source license file; clarify usage with the author if you plan to reuse assets or code.
