/* Office War Arcade — hub screen. Builds game cabinets + pixel thumbnails. */
(function () {
  "use strict";
  const R = window.Retro;

  // Each thumbnail is drawn on a 120x90 pixel canvas then scaled up crisp.
  const TW = 120;
  const TH = 90;

  function bg(c, top, bottom) {
    const g = c.createLinearGradient(0, 0, 0, TH);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, TW, TH);
  }

  const GAMES = [
    {
      name: "서류 대소동",
      nameEn: "PAPER PANIC",
      en: "PUZZLE",
      tag: "PUZZLE",
      desc: "서류철 분류 · 틀린 그림 찾기 · 오피스 넌센스 퀴즈. 두뇌 풀가동!",
      descEn: "Sort the files, spot the difference, ace the office nonsense quiz. Brains on!",
      path: "games/puzzle/index.html",
      draw(c) {
        bg(c, "#12324a", "#071722");
        // three colored folders
        const cols = ["#ff5db1", "#ffb638", "#43d9e6"];
        cols.forEach((col, i) => {
          const x = 12 + i * 34;
          R.px(c, x, 44, 28, 30, col);
          R.px(c, x, 40, 16, 6, col);
          R.px(c, x + 3, 50, 22, 3, "#00000055");
        });
        R.pixelText(c, "FILES", 34, 12, 12, "#e7ecff");
      },
    },
    {
      name: "오피스 워: 슈팅",
      nameEn: "OFFICE WAR: SHMUP",
      en: "SHOOTER",
      tag: "SHMUP",
      desc: "09:00 출근부터 야근까지, 쏟아지는 업무를 격추하는 종스크롤 슈팅.",
      descEn: "From 9 AM clock-in to overtime — shoot down the flood of tasks in this vertical shmup.",
      path: "officewar/index.html",
      draw(c) {
        bg(c, "#0b1030", "#03040f");
        for (let i = 0; i < 24; i++) R.px(c, R.randInt(0, TW), R.randInt(0, TH), 1, 1, "#ffffff55");
        // player ship
        R.px(c, 54, 60, 12, 8, "#43d9e6");
        R.px(c, 58, 55, 4, 6, "#e7ecff");
        // bullets
        R.px(c, 59, 44, 2, 6, "#ffb638");
        R.px(c, 59, 34, 2, 6, "#ffb638");
        // enemy docs
        R.px(c, 30, 20, 10, 12, "#f1f5f9");
        R.px(c, 80, 24, 10, 12, "#f1f5f9");
      },
    },
    {
      name: "오피스 던전",
      nameEn: "OFFICE DUNGEON",
      en: "ACTION RPG",
      tag: "RPG",
      desc: "던전 앤 드래곤 스타일 오피스 액션 RPG. 몬스터가 된 업무를 처치하라.",
      descEn: "A D&D-style office action RPG. Slay the tasks that turned into monsters.",
      path: "games/rpg/index.html",
      img: "games/rpg/img/rpg_dungeon_room.png",
      draw(c) {
        bg(c, "#241a10", "#0a0704");
        // dungeon floor tiles
        for (let y = 0; y < 6; y++)
          for (let x = 0; x < 8; x++) {
            R.px(c, x * 15, 40 + y * 9, 14, 8, (x + y) % 2 ? "#3a2a18" : "#2a1e10");
          }
        // hero
        R.px(c, 20, 44, 8, 10, "#46e07a");
        R.px(c, 22, 40, 4, 5, "#f0d0a0");
        // slime enemy
        R.px(c, 82, 50, 12, 8, "#ff5db1");
        R.pixelText(c, "LV.1", 6, 8, 10, "#ffb638");
      },
    },
    {
      name: "야근: 13층",
      nameEn: "OVERTIME: 13F",
      en: "HORROR",
      tag: "HORROR",
      desc: "텅 빈 사무실, 사라지지 않는 결재. 김부장이 마주하는 초현실 공포.",
      descEn: "An empty office, approvals that never end. Manager Kim's surreal nightmare.",
      path: "games/horror/index.html",
      img: "games/horror/img/horror_corridor.png",
      draw(c) {
        bg(c, "#0a0d12", "#000");
        // flickering monitor
        R.px(c, 44, 34, 32, 22, "#0e2a2a");
        R.px(c, 48, 38, 24, 14, "#123c3c");
        R.px(c, 56, 60, 8, 8, "#1b2430");
        // red eyes in the dark
        R.px(c, 20, 20, 3, 3, "#ff2222");
        R.px(c, 28, 20, 3, 3, "#ff2222");
        R.px(c, 96, 26, 3, 3, "#ff2222");
        R.pixelText(c, "13F", 8, 70, 10, "#8a1111");
      },
    },
    {
      name: "신입사원 이야기",
      nameEn: "ROOKIE'S STORY",
      en: "DATING SIM",
      tag: "STORY",
      desc: "오피스 러브 & 성장 스토리. 남/여 주인공 선택, 선택지로 엔딩이 갈린다.",
      descEn: "An office love & growth story. Pick a male/female lead; your choices decide the ending.",
      path: "games/dating/index.html",
      img: "games/dating/img/dating_love_f.png",
      draw(c) {
        bg(c, "#3a1030", "#160414");
        // two portraits + heart
        R.px(c, 24, 36, 20, 28, "#ffd0b0");
        R.px(c, 24, 30, 20, 8, "#5a3a2a");
        R.px(c, 76, 36, 20, 28, "#ffd0b0");
        R.px(c, 76, 30, 20, 8, "#2a2a3a");
        // heart
        R.px(c, 56, 40, 3, 3, "#ff5db1");
        R.px(c, 61, 40, 3, 3, "#ff5db1");
        R.px(c, 54, 43, 12, 3, "#ff5db1");
        R.px(c, 56, 46, 8, 3, "#ff5db1");
        R.px(c, 58, 49, 4, 3, "#ff5db1");
      },
    },
    {
      name: "직장인 대전",
      nameEn: "OFFICE FIGHTER",
      en: "VS FIGHTING",
      tag: "FIGHT",
      desc: "10인 격투! 김부장의 서류철 사자후부터 필살기까지. 1:1 대결.",
      descEn: "10-fighter brawl! From Manager Kim's paperwork roar to ultimate moves. 1-on-1.",
      path: "games/fighting/index.html",
      img: "games/fighting/img/fighter_boss.png",
      draw(c) {
        bg(c, "#301018", "#0c0406");
        // arena floor
        R.px(c, 0, 66, TW, 24, "#221016");
        // fighter 1 (bald boss)
        R.px(c, 26, 40, 12, 20, "#3a5fa0");
        R.px(c, 27, 33, 10, 8, "#f0c8a0");
        // fighter 2
        R.px(c, 82, 40, 12, 20, "#a03a3a");
        R.px(c, 83, 33, 10, 8, "#f0c8a0");
        // clash spark
        R.px(c, 58, 46, 4, 4, "#ffb638");
        R.px(c, 62, 42, 3, 3, "#fff");
        R.pixelText(c, "VS", 50, 12, 12, "#ff4d4d");
      },
    },
  ];

  const grid = document.getElementById("grid");

  GAMES.forEach((g) => {
    const a = document.createElement("a");
    a.className = "cab";
    a.href = g.path;

    const cv = document.createElement("canvas");
    cv.width = TW;
    cv.height = TH;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    g.draw(c); // procedural fallback shown immediately
    if (g.img) {
      const im = new Image();
      im.onload = () => {
        // cover-fit the generated art into the thumbnail
        const s = Math.max(TW / im.width, TH / im.height);
        const dw = im.width * s,
          dh = im.height * s;
        c.imageSmoothingEnabled = false;
        c.drawImage(im, (TW - dw) / 2, (TH - dh) / 2, dw, dh);
      };
      im.src = g.img;
    }

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = g.tag;

    const T = window.I18N;
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = T ? T.t(g.name, g.nameEn || g.name) : g.name;

    const en = document.createElement("div");
    en.className = "en";
    en.textContent = g.en;

    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = T ? T.t(g.desc, g.descEn || g.desc) : g.desc;

    a.append(cv, tag, name, en, desc);
    a.addEventListener("click", () => R?.sfx.confirm());
    a.addEventListener("mouseenter", () => R?.sfx.select());
    grid.appendChild(a);
  });
})();
