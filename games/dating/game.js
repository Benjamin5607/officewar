/* 신입사원 이야기 — office raising / dating sim (M & F routes), bilingual KO/EN */
(function () {
  "use strict";
  const R = window.Retro;
  const T = window.I18N;
  const L = (ko, en) => (T ? T.t(ko, en) : ko);
  const $ = (id) => document.getElementById(id);

  const TOTAL_WEEKS = 12;
  let S = null;

  const CHAR = {
    m: {
      me: { name: "김민수", nameEn: "Minsu", img: "img/dating_hero_m.png" },
      love: { name: "유미 대리", nameEn: "Yumi", img: "img/dating_love_f.png" },
    },
    f: {
      me: { name: "이지연", nameEn: "Jiyeon", img: "img/dating_hero_f.png" },
      love: { name: "강준호 대리", nameEn: "Junho", img: "img/dating_love_m.png" },
    },
  };
  const meName = () => L(CHAR[S.gender].me.name, CHAR[S.gender].me.nameEn);
  const loveNm = () => L(CHAR[S.gender].love.name, CHAR[S.gender].love.nameEn);

  const STAT_DEF = [
    { key: "work", label: "업무", labelEn: "Work", cls: "" },
    { key: "charm", label: "매력", labelEn: "Charm", cls: "" },
    { key: "energy", label: "체력", labelEn: "Energy", cls: "hp" },
    { key: "knowledge", label: "지식", labelEn: "Know", cls: "" },
    { key: "network", label: "인맥", labelEn: "Network", cls: "" },
    { key: "affection", label: "호감도", labelEn: "Affection", cls: "aff" },
  ];

  function newState(gender) {
    return {
      gender,
      week: 1,
      work: 20,
      charm: 25,
      energy: 80,
      knowledge: 20,
      network: 15,
      affection: 10,
      rival: 0,
      metLove: false,
      confessed: false,
      tookBlame: false,
      phase: "event",
      over: false,
    };
  }

  function clampStats() {
    for (const s of STAT_DEF) S[s.key] = R.clamp(S[s.key], 0, 100);
  }

  /* ------------------------- scene / UI helpers ------------------------- */
  function setScene(kind) {
    const scene = $("scene");
    const badge = $("scene-badge");
    if (kind === "me" || kind === "love") {
      const ch = CHAR[S.gender][kind];
      const nm = L(ch.name, ch.nameEn);
      scene.style.backgroundImage = `url("${ch.img}")`;
      badge.textContent = kind === "love" ? "♥ " + nm : L("신입사원 ", "Rookie ") + nm;
    } else {
      scene.style.backgroundImage = "linear-gradient(160deg,#2a1030,#0a0410)";
      badge.textContent = L("대우기획 사무실", "Daewoo Planning Office");
    }
  }

  function renderStats() {
    const el = $("stats");
    el.replaceChildren();
    for (const s of STAT_DEF) {
      const wrap = document.createElement("div");
      wrap.className = "st";
      const name = document.createElement("span");
      name.textContent = L(s.label, s.labelEn);
      const meter = document.createElement("div");
      meter.className = "meter " + s.cls;
      const i = document.createElement("i");
      i.style.width = S[s.key] + "%";
      meter.appendChild(i);
      const num = document.createElement("span");
      num.style.minWidth = "26px";
      num.style.textAlign = "right";
      num.textContent = Math.round(S[s.key]);
      wrap.append(name, meter, num);
      el.appendChild(wrap);
    }
  }

  function present(who, line, choices) {
    $("who").textContent = who;
    $("line").innerHTML = line;
    const box = $("choices");
    box.replaceChildren();
    choices.forEach((ch) => {
      const b = document.createElement("button");
      b.className = "pixel-btn";
      b.textContent = ch.label;
      b.addEventListener("click", () => {
        R.sfx.select();
        ch.go();
      });
      box.appendChild(b);
    });
    $("week-label").textContent = L(`${S.week}주차 / ${TOTAL_WEEKS}`, `Week ${S.week} / ${TOTAL_WEEKS}`);
    renderStats();
  }

  function apply(deltas, note) {
    for (const k in deltas) S[k] = (S[k] || 0) + deltas[k];
    clampStats();
    if (deltas.affection > 0) R.sfx.coin();
    if (S.energy <= 0 && !S.over) return burnout();
    return note;
  }

  /* ------------------------------ weekly events ------------------------------ */
  // Each returns {scene, who, line, choices}. A choice may carry:
  //   d(deltas) · meet(true) · set(fn for flags) · react(follow-up narration)
  const EVENTS = [
    // 1 — first day, busywork bomb
    (love) => ({
      scene: "me",
      who: L("김부장", "Manager Kim"),
      line: L(
        "\"신입! 이 서류 오늘까지 정리해와. 참고만 하고.\"<br>첫 주부터 잡무 폭탄이다.",
        "\"Rookie! Sort these files by today. Just for reference.\"<br>A busywork bomb from week one."
      ),
      choices: [
        {
          label: L("군말 없이 야근한다 (업무+8, 체력-10)", "Work overtime without complaint (Work+8, Energy-10)"),
          d: { work: 8, energy: -10 },
          react: L(
            "새벽까지 남아 서류를 끝냈다. 김부장이 흘긋 보더니 한마디. \"음, 쓸 만하네.\" 작은 인정이 묘하게 뿌듯하다.",
            "You stayed till dawn and finished. Kim glanced over: \"Hm, not bad.\" A tiny bit of praise, oddly satisfying."
          ),
        },
        {
          label: L("동기에게 도움을 요청한다 (인맥+8, 업무+3)", "Ask a peer for help (Network+8, Work+3)"),
          d: { network: 8, work: 3 },
          react: L(
            "옆자리 동기가 웃으며 노하우를 알려줬다. \"우리끼리는 도와야지.\" 든든한 아군이 생겼다.",
            "The peer beside you shared their know-how with a smile. \"We rookies gotta help each other.\" A reliable ally."
          ),
        },
        {
          label: L("요령껏 정시 퇴근 (체력+6, 업무-2)", "Clock out on time, smartly (Energy+6, Work-2)"),
          d: { energy: 6, work: -2 },
          react: L(
            "완벽하진 않지만 정시에 나왔다. 저녁 하늘이 이렇게 예뻤나. …다만 김부장의 눈빛이 살짝 서늘했다.",
            "Not perfect, but you left on time. Was the evening sky always this pretty? …though Kim's glare was a bit cold."
          ),
        },
      ],
    }),
    // 2 — meet the love interest
    (love) => ({
      scene: "love",
      who: love,
      line: L(
        `엘리베이터에서 ${love}를 마주쳤다.<br>"신입이지? 잘 부탁해. 커피 한 잔 할래?"`,
        `You run into ${love} in the elevator.<br>"You're the rookie, right? Nice to meet you. Coffee?"`
      ),
      choices: [
        {
          label: L("\"네! 좋아요\" 밝게 대답 (호감+10, 매력+3)", "\"Yes! I'd love to\" (Affection+10, Charm+3)"),
          d: { affection: 10, charm: 3 },
          meet: true,
          react: L(`${love}가 환하게 웃었다. "밝아서 좋다. 신입은 그래야지." 심장이 조금, 빨라진다.`, `${love} beamed. "I like the energy. That's how a rookie should be." Your heart beats a little faster.`),
        },
        {
          label: L("\"바쁘지 않으세요?\" 배려 (호감+6, 인맥+4)", "\"Aren't you busy?\" — considerate (Affection+6, Network+4)"),
          d: { affection: 6, network: 4 },
          meet: true,
          react: L(`"배려심 있네." ${love}가 커피를 건네며 회사 생활 팁을 술술 알려줬다.`, `"Thoughtful." ${love} handed you a coffee and freely shared office survival tips.`),
        },
        {
          label: L("긴장해서 말을 더듬는다 (호감+2)", "Get nervous and stammer (Affection+2)"),
          d: { affection: 2 },
          meet: true,
          react: L("\"긴장했구나, 귀엽네.\" 놀리듯 웃는 얼굴에 귀까지 빨개졌다.", "\"Nervous, huh? Cute.\" Their teasing smile turned your ears bright red."),
        },
      ],
    }),
    // 3 — presentation chance
    () => ({
      scene: "office",
      who: L("사수", "Your mentor"),
      line: L(
        "\"이번 프로젝트 발표, 네가 해볼래?\"<br>큰 기회지만 부담도 크다.",
        "\"Want to present this project?\"<br>A big chance — and big pressure."
      ),
      choices: [
        {
          label: L("밤새 준비해 발표 (업무+12, 지식+6, 체력-14)", "Prep all night & present (Work+12, Know+6, Energy-14)"),
          d: { work: 12, knowledge: 6, energy: -14 },
          react: L("떨리는 목소리로 시작했지만, 끝날 무렵 회의실엔 박수가 터졌다. \"신입 맞아?\" 이름 석 자를 각인시켰다.", "You started shaky, but ended to applause. \"That's a rookie?\" You made your name known."),
        },
        {
          label: L("무난하게 준비 (업무+5, 지식+3)", "Prepare modestly (Work+5, Know+3)"),
          d: { work: 5, knowledge: 3 },
          react: L("큰 실수 없이 마쳤다. 튀지도, 묻히지도 않은 딱 중간. 안전한 선택.", "You finished without slip-ups. Neither shining nor sinking — a safe middle."),
        },
        {
          label: L("동료에게 넘긴다 (인맥-4, 체력+4)", "Pass it to a colleague (Network-4, Energy+4)"),
          d: { network: -4, energy: 4 },
          react: L("부담은 피했지만, 넘겨받은 동료의 표정이 좋지 않았다. \"…알겠어.\"", "You dodged the pressure, but the colleague's face soured. \"…Fine.\""),
        },
      ],
    }),
    // 4 — love: late-night dinner
    (love) => ({
      scene: "love",
      who: love,
      line: L(
        `야근 중 ${love}가 다가온다.<br>"아직도 안 갔어? …같이 저녁이라도 먹을래?"`,
        `While you work late, ${love} comes over.<br>"Still here? …Want to grab dinner together?"`
      ),
      choices: [
        {
          label: L("\"네, 배고팠어요\" (호감+12, 체력+6)", "\"Yes, I'm starving\" (Affection+12, Energy+6)"),
          d: { affection: 12, energy: 6 },
          react: L("편의점 컵라면이었지만, 텅 빈 사무실에서 둘이 먹는 밤은 이상하게 따뜻했다.", "Just convenience-store noodles, but eating together in the empty office felt strangely warm."),
        },
        {
          label: L("\"일 마저 하고요\" 성실 (호감+5, 업무+6)", "\"Let me finish first\" — diligent (Affection+5, Work+6)"),
          d: { affection: 5, work: 6 },
          react: L(`${love}가 옆에 앉아 조용히 일을 도와줬다. "혼자 두면 밤샐 것 같아서."`, `${love} sat beside you and quietly helped. "Figured you'd pull an all-nighter alone."`),
        },
        {
          label: L("\"부담스러워요\" 정중히 거절 (호감-3)", "\"That's a bit much\" — politely decline (Affection-3)"),
          d: { affection: -3 },
          react: L("\"아… 그래, 미안.\" 어색하게 돌아서는 뒷모습에 괜히 마음이 쓰였다.", "\"Oh… okay, sorry.\" Their awkward retreat nagged at you."),
        },
      ],
    }),
    // 5 — company dinner
    () => ({
      scene: "office",
      who: L("회식 자리", "Company dinner"),
      line: L(
        "부서 회식. 김부장이 폭탄주를 돌린다.<br>\"자율이야, 자율~ (사실상 강제)\"",
        "Team dinner. Kim passes around bomb shots.<br>\"It's voluntary~ (basically mandatory)\""
      ),
      choices: [
        {
          label: L("분위기 메이커로 활약 (인맥+12, 매력+6, 체력-12)", "Be the life of the party (Network+12, Charm+6, Energy-12)"),
          d: { network: 12, charm: 6, energy: -12 },
          react: L("건배사부터 장기자랑까지 완벽하게 소화했다. 부서의 마스코트로 등극!", "From the toast to the talent show, you nailed it all. Crowned the team mascot!"),
        },
        {
          label: L("적당히 어울리다 귀가 (인맥+5, 체력-4)", "Mingle a bit, then head home (Network+5, Energy-4)"),
          d: { network: 5, energy: -4 },
          react: L("무리하지 않고 1차만. 딱 적당한 사회생활.", "Just the first round, no overdoing it. A perfectly balanced social life."),
        },
        {
          label: L("몸이 안 좋다며 빠진다 (체력+8, 인맥-6)", "Beg off, feeling unwell (Energy+8, Network-6)"),
          d: { energy: 8, network: -6 },
          react: L("일찍 들어와 푹 쉬었다. 다음 날 \"어제 어디 갔었어?\"라는 눈총이 조금 따가웠다.", "You went home early and rested well. Next day, the \"where'd you go?\" stares stung a little."),
        },
      ],
    }),
    // 6 — RIVAL appears
    (love) => ({
      scene: "office",
      who: L("동기 한지훈/서예린", "A peer — Jihoon/Yerin"),
      line: L(
        `잘나가는 동기가 ${love} 옆에 딱 붙었다.<br>"선배, 제가 도와드릴게요~" 라이벌의 등장이다.`,
        `A high-flying peer glued themselves to ${love}.<br>"Let me help you, senior~" A rival has appeared.`
      ),
      choices: [
        {
          label: L("질투는 접고 실력으로 승부 (업무+8, 지식+4)", "Skip the jealousy, prove your skills (Work+8, Know+4)"),
          d: { work: 8, knowledge: 4 },
          set: () => (S.rival += 12),
          react: L("묵묵히 성과로 증명하기로 했다. 라이벌은 앞서가지만, 승부는 이제부터다.", "You decide to let results speak. The rival leads for now, but the game's just begun."),
        },
        {
          label: L(`${love}에게 먼저 다가간다 (호감+10, 체력-4)`, `Reach out to ${love} first (Affection+10, Energy-4)`),
          d: { affection: 10, energy: -4 },
          set: () => (S.rival += 6),
          react: L(`"요즘 자주 보네?" ${love}가 반가워했다. 라이벌의 표정이 굳는다.`, `"Seeing you a lot lately." ${love} looked pleased. The rival's face stiffened.`),
        },
        {
          label: L("신경 끄고 내 할 일만 (체력+6)", "Ignore it, mind your own work (Energy+6)"),
          d: { energy: 6 },
          set: () => (S.rival += 20),
          react: L("무심한 사이, 둘은 부쩍 가까워졌다. …이래도 괜찮은 걸까?", "While you weren't looking, those two grew close. …Is this really okay?"),
        },
      ],
    }),
    // 7 — love: weekend movie
    (love) => ({
      scene: "love",
      who: love,
      line: L(
        `${love}가 주말 영화표 두 장을 내민다.<br>"…혹시, 시간 괜찮으면. 둘이서."`,
        `${love} holds out two weekend movie tickets.<br>"…If you're free. Just the two of us."`
      ),
      choices: [
        {
          label: L("설레며 수락 (호감+16, 매력+5, 체력-6)", "Accept, heart fluttering (Affection+16, Charm+5, Energy-6)"),
          d: { affection: 16, charm: 5, energy: -6 },
          set: () => (S.rival = Math.max(0, S.rival - 8)),
          react: L("영화는 하나도 기억 안 났다. 어깨가 닿을 듯 말 듯한 두 시간이 전부였으니까.", "You don't remember the movie at all. Two hours of almost-touching shoulders was everything."),
        },
        {
          label: L("\"셋이 갈까요?\" 라이벌도 부른다 (호감+3)", "\"Make it three?\" invite the rival too (Affection+3)"),
          d: { affection: 3, network: 3 },
          set: () => (S.rival += 10),
          react: L(`어색한 삼각 데이트. ${love}가 한숨을 쉬었다. "…넌 참, 눈치가 없다."`, `An awkward triangle date. ${love} sighed. "…You are so oblivious."`),
        },
        {
          label: L("약속이 있다며 거절 (호감-6, 체력+4)", "Decline, citing plans (Affection-6, Energy+4)"),
          d: { affection: -6, energy: 4 },
          set: () => (S.rival += 14),
          react: L(`"그래, 알겠어." 표를 거둬가는 손이 쓸쓸했다. 다음 날, 그 표는 라이벌과 썼다는 소문이 돌았다.`, `"Sure, got it." Their hand withdrew the tickets sadly. Next day, rumor said they used them with the rival.`),
        },
      ],
    }),
    // 8 — CRISIS: blamed for a project accident
    (love) => ({
      scene: "office",
      who: L("김부장", "Manager Kim"),
      line: L(
        "납품 사고 발생! 김부장이 너를 지목한다.<br>\"이거 네가 검토한 거 아냐?!\" (사실은 김부장 실수다)",
        "A delivery disaster! Kim points at you.<br>\"You reviewed this, didn't you?!\" (It was actually Kim's mistake.)"
      ),
      choices: [
        {
          label: L("억울해도 책임지고 수습 (업무+14, 체력-16)", "Take the blame and fix it (Work+14, Energy-16)"),
          d: { work: 14, energy: -16 },
          set: () => (S.tookBlame = true),
          react: L(`밤을 새워 사고를 덮었다. 아무도 몰랐지만, ${love}만은 조용히 커피를 놓고 갔다. "네 잘못 아닌 거, 나는 알아."`, `You pulled an all-nighter to clean it up. No one noticed — except ${love}, who quietly left a coffee. "I know it wasn't your fault."`),
        },
        {
          label: L("증거로 진실을 밝힌다 (지식+10, 인맥-8)", "Reveal the truth with proof (Know+10, Network-8)"),
          d: { knowledge: 10, network: -8 },
          react: L("로그를 들이밀자 김부장의 얼굴이 붉으락푸르락. 정의는 세웠지만, 미운털이 단단히 박혔다.", "You slapped down the logs; Kim went red and pale. Justice served — and a target painted on your back."),
        },
        {
          label: L("라이벌에게 떠넘긴다 (인맥-14, 호감-10)", "Pin it on the rival (Network-14, Affection-10)"),
          d: { network: -14, affection: -10 },
          set: () => (S.rival += 10),
          react: L(`비겁했다. 지켜보던 ${love}의 눈빛이 싸늘하게 식었다.`, `It was cowardly. Watching it all, ${love}'s eyes went cold.`),
        },
      ],
    }),
    // 9 — love: misunderstanding
    (love) => ({
      scene: "love",
      who: love,
      line: L(
        `${love}가 차갑다.<br>"너, 라이벌이랑 사귄다며? 소문 다 났어."`,
        `${love} is cold.<br>"So you're dating the rival? It's all over the office."`
      ),
      choices: [
        {
          label: L("\"오해예요, 제 맘은 하나예요\" 진심 (호감+15, 매력+4)", "\"It's a misunderstanding, my heart is set\" (Affection+15, Charm+4)"),
          d: { affection: 15, charm: 4 },
          set: () => (S.rival = Math.max(0, S.rival - 12)),
          react: L(`잠시 정적. 이내 ${love}가 피식 웃었다. "…확인하고 싶었어. 미안." 오해가 눈 녹듯 풀렸다.`, `A pause. Then ${love} broke into a smile. "…I just wanted to be sure. Sorry." The misunderstanding melted away.`),
        },
        {
          label: L("\"소문일 뿐이에요\" 담담히 (호감+5)", "\"It's just a rumor\" — calmly (Affection+5)"),
          d: { affection: 5 },
          react: L("\"그래…\" 완전히 풀리진 않은 표정. 애매한 거리감이 남았다.", "\"Right…\" Not fully convinced. A vague distance lingered."),
        },
        {
          label: L("\"믿든 말든\" 자존심 (호감-12)", "\"Believe what you want\" — pride (Affection-12)"),
          d: { affection: -12 },
          set: () => (S.rival += 12),
          react: L(`말이 헛나왔다. ${love}가 등을 돌렸다. "…실망이야."`, `The words came out wrong. ${love} turned away. "…I'm disappointed."`),
        },
      ],
    }),
    // 10 — probation evaluation
    () => ({
      scene: "office",
      who: L("인사팀", "HR"),
      line: L(
        "\"정규직 전환 최종 평가입니다.\"<br>그동안의 모든 성과가 반영된다.",
        "\"Final review for full-time conversion.\"<br>Everything you've done so far counts."
      ),
      choices: [
        {
          label: L("밤샘 마무리 학습 (지식+12, 업무+6, 체력-12)", "All-night final study (Know+12, Work+6, Energy-12)"),
          d: { knowledge: 12, work: 6, energy: -12 },
          react: L("면접관의 날카로운 질문에도 막힘이 없었다. \"준비를 많이 했군요.\"", "You answered every sharp question smoothly. \"You've prepared a lot.\""),
        },
        {
          label: L("인맥으로 정보 수집 (인맥+10, 업무+4)", "Gather intel via network (Network+10, Work+4)"),
          d: { network: 10, work: 4 },
          react: L("선배들의 기출 정보 덕에 여유롭게 통과. 사람이 재산이다.", "Thanks to seniors' inside tips, you passed with ease. People are wealth."),
        },
        {
          label: L("컨디션 관리에 집중 (체력+16, 매력+3)", "Focus on staying fresh (Energy+16, Charm+3)"),
          d: { energy: 16, charm: 3 },
          react: L("맑은 정신과 밝은 표정. 실력보단 인상으로 승부했다.", "Clear mind, bright face. You won on impression more than skill."),
        },
      ],
    }),
    // 11 — the decisive moment: love interest is leaving
    (love) => ({
      scene: "love",
      who: love,
      line: L(
        `${love}가 어렵게 입을 뗀다.<br>"나… 해외 지사로 발령났어. 다음 달에 떠나."`,
        `${love} speaks, hesitant.<br>"I… got transferred overseas. I leave next month."`
      ),
      choices: [
        {
          label: L("\"가지 말아요\" 붙잡는다 (호감+18, 체력-8)", "\"Don't go\" — hold them back (Affection+18, Energy-8)"),
          d: { affection: 18, energy: -8 },
          react: L(`${love}의 눈이 흔들렸다. "…네가 그렇게 말해주길, 기다렸어."`, `${love}'s eyes wavered. "…I was waiting for you to say that."`),
        },
        {
          label: L("\"응원할게요\" 놓아준다 (호감+6, 매력+6)", "\"I'll cheer you on\" — let go (Affection+6, Charm+6)"),
          d: { affection: 6, charm: 6 },
          react: L("성숙한 배웅. 하지만 그 밤, 둘 다 잠들지 못했다.", "A mature farewell. But that night, neither of you could sleep."),
        },
        {
          label: L("\"잘됐네요, 축하해요\" 담담 (호감-8)", "\"That's great, congrats\" — detached (Affection-8)"),
          d: { affection: -8 },
          set: () => (S.rival += 10),
          react: L(`속마음을 숨긴 대답. ${love}는 씁쓸하게 미소지었다. "…그래."`, `An answer that hid your true heart. ${love} smiled bitterly. "…Right."`),
        },
      ],
    }),
    // 12 — FINALE: the confession
    (love) => ({
      scene: "love",
      who: love,
      line: L(
        `수습 마지막 날, 옥상. ${love}가 마주 선다.<br>"이제 진짜 마지막이야. …할 말, 없어?"`,
        `Last day of probation, on the roof. ${love} stands before you.<br>"This is really the last time. …Nothing to say?"`
      ),
      choices: [
        {
          label: L("\"좋아합니다. 처음부터.\" 고백 (호감+22, 매력+5)", "\"I like you. From the start.\" — confess (Affection+22, Charm+5)"),
          d: { affection: 22, charm: 5 },
          set: () => (S.confessed = true),
          react: L(`말이 끝나기도 전에 ${love}가 다가왔다. 노을이 두 사람을 붉게 물들였다. 심장이 터질 것 같다.`, `Before you even finished, ${love} stepped close. The sunset dyed you both red. Your heart could burst.`),
        },
        {
          label: L("\"일로 먼저 인정받고 싶어요\" (업무+12, 호감+5)", "\"I want to prove myself at work first\" (Work+12, Affection+5)"),
          d: { work: 12, affection: 5 },
          react: L(`"…너답다." ${love}가 옅게 웃었다. "그럼, 성공해서 다시 찾아와."`, `"…So like you." ${love} smiled faintly. "Then succeed, and come find me again."`),
        },
        {
          label: L("\"우린 동료로 남아요\" (호감-4, 체력+6)", "\"Let's stay colleagues\" (Affection-4, Energy+6)"),
          d: { affection: -4, energy: 6 },
          react: L("\"그게, 네 대답이구나.\" 담담한 목소리 끝이 살짝 떨렸다.", "\"So that's your answer.\" The calm voice trembled at its edge."),
        },
      ],
    }),
  ];

  const ACTIONS = [
    { label: L("🌙 야근하기 (업무+9, 지식+3, 체력-8)", "🌙 Work overtime (Work+9, Know+3, Energy-8)"), d: { work: 9, knowledge: 3, energy: -8 } },
    { label: L("💪 헬스장 (체력+12, 매력+5)", "💪 Gym (Energy+12, Charm+5)"), d: { energy: 12, charm: 5 } },
    { label: L("📚 자기계발 스터디 (지식+10, 업무+3, 체력-4)", "📚 Self-study (Know+10, Work+3, Energy-4)"), d: { knowledge: 10, work: 3, energy: -4 } },
    { label: L("🤝 사내 네트워킹 (인맥+10, 매력+3, 체력-5)", "🤝 Office networking (Network+10, Charm+3, Energy-5)"), d: { network: 10, charm: 3, energy: -5 } },
    { label: L("☕ 휴식 & 자기관리 (체력+16, 매력+2)", "☕ Rest & self-care (Energy+16, Charm+2)"), d: { energy: 16, charm: 2 } },
  ];

  /* ------------------------------ flow ------------------------------ */
  function startWeek() {
    if (S.week > TOTAL_WEEKS) return ending();
    S.phase = "event";
    const ev = EVENTS[S.week - 1](loveNm());
    setScene(ev.scene);
    present(
      ev.who,
      ev.line,
      ev.choices.map((ch) => ({
        label: ch.label,
        go() {
          apply(ch.d);
          if (ch.meet) S.metLove = true;
          if (ch.set) ch.set();
          if (S.over) return;
          if (ch.react) {
            present(ev.who, `<span style="color:var(--ink-dim)">${ch.react}</span>`, [
              { label: L("계속 ▶", "Continue ▶"), go() { if (!S.over) actionPhase(); } },
            ]);
          } else {
            actionPhase();
          }
        },
      }))
    );
  }

  function actionPhase() {
    S.phase = "action";
    setScene("me");
    present(meName(), L("이번 주 남은 시간, 무엇에 투자할까?", "How will you spend the rest of the week?"), [
      ...ACTIONS.map((a) => ({
        label: a.label,
        go() {
          apply(a.d);
          if (S.over) return;
          S.week++;
          startWeek();
        },
      })),
    ]);
  }

  function burnout() {
    S.over = true;
    R.sfx.lose();
    setScene("office");
    present(
      L("번아웃…", "Burnout…"),
      L(
        "체력이 완전히 바닥났다.<br>결국 병가를 내고 자리를 비우게 되었다.<br><br><b>[번아웃 엔딩]</b> 건강이 최고입니다…",
        "Your energy hit rock bottom.<br>You ended up on sick leave, desk empty.<br><br><b>[Burnout Ending]</b> Health comes first…"
      ),
      [{ label: L("다시 시작", "Restart"), go: () => showStart() }]
    );
  }

  function ending() {
    S.over = true;
    const love = loveNm();
    const romance = S.metLove && S.affection >= 70;
    const trueLove = romance && S.confessed && S.affection >= 92;
    const career = S.work >= 70 && (S.knowledge >= 58 || S.network >= 58);
    const rivalWin = S.metLove && S.rival >= 34 && S.affection < 70;
    let title, body, scene;
    if (rivalWin) {
      scene = "office";
      title = L("💔 실연 엔딩", "💔 Heartbreak Ending");
      body = L(
        `망설이는 사이, ${love}는 라이벌의 손을 잡았다.<br>결혼식 청첩장을 건네받던 날, 처음으로 야근이 서럽지 않았다. 그냥… 울고 싶었다.<br><br><span style="color:var(--ink-dim)">사랑도 타이밍이라던 선배 말이, 이제야 사무친다.</span>`,
        `While you hesitated, ${love} took the rival's hand.<br>The day you received the wedding invitation, overtime wasn't the sad part for once. You just… wanted to cry.<br><br><span style="color:var(--ink-dim)">"Love is timing," a senior once said. Now it stings.</span>`
      );
      R.sfx.lose();
    } else if (trueLove && career) {
      scene = "love";
      title = L("★ 진(眞) 엔딩: 그리고, 함께 ★", "★ TRUE ENDING: And, Together ★");
      body = L(
        `${love}는 발령을 미뤘고, 너는 최연소 정직원이 되었다.<br>몇 해 뒤 같은 옥상에서 프러포즈. "그때 그 노을, 아직 기억해?"<br><br>일도 사랑도, 무엇 하나 놓지 않은 사람. 그게 바로 너다.`,
        `${love} postponed the transfer, and you became the youngest full-time hire.<br>Years later, a proposal on that same rooftop. "Remember that sunset?"<br><br>Career and love — you let go of neither. That's you.`
      );
      R.sfx.win();
    } else if (romance && career) {
      scene = "love";
      title = L("🏅 완벽 엔딩: 사내커플 & 정직원", "🏅 Perfect Ending: Office Couple & Full-Time");
      body = L(
        `수습을 최고 성적으로 통과했고, ${love}와도 정식으로 사귀게 되었다.<br>일도 사랑도 잡은 전설의 신입!`,
        `You passed probation top of the class and officially started dating ${love}.<br>The legendary rookie who caught both work and love!`
      );
      R.sfx.win();
    } else if (trueLove) {
      scene = "love";
      title = L("💗 순애 엔딩", "💗 Pure-Love Ending");
      body = L(
        `${love}가 발령을 포기하고 네 곁에 남았다.<br>"승진이야 천천히 하면 되지. 너를 놓치는 게 더 무서웠어."`,
        `${love} gave up the transfer to stay by your side.<br>"Promotion can wait. Losing you scared me more."`
      );
      R.sfx.win();
    } else if (romance) {
      scene = "love";
      title = L("♥ 러브 엔딩", "♥ Love Ending");
      body = L(
        `${love}와 마음이 통했다!<br>퇴근길, 두 손을 꼭 잡고 걷는다. 업무는… 차차 늘리면 되지.`,
        `You and ${love} connected!<br>On the way home, hand in hand. Work skills… can grow in time.`
      );
      R.sfx.win();
    } else if (career) {
      scene = "me";
      title = L("🏆 커리어 엔딩: 초고속 정직원", "🏆 Career Ending: Fast-Track Hire");
      body = L(
        `능력을 인정받아 최연소 프로젝트 리더로 발탁!${S.tookBlame ? "<br>그날의 억울한 야근이, 지금의 신뢰가 되었다." : ""}<br>사랑은 다음 분기 목표로 미뤄둔다.`,
        `Recognized for your skill, promoted to youngest project lead!${S.tookBlame ? "<br>That unfair all-nighter became today's trust." : ""}<br>Love is filed under next quarter's goals.`
      );
      R.sfx.win();
    } else {
      scene = "office";
      title = L("🙂 평범한 직장인 엔딩", "🙂 Ordinary Worker Ending");
      body = L(
        "무난하게 수습을 통과했다.<br>특별할 건 없지만, 오늘도 정시 퇴근. 그것도 나쁘지 않다.",
        "You passed probation uneventfully.<br>Nothing special, but you clock out on time. Not bad at all."
      );
      R.sfx.confirm();
    }
    setScene(scene);
    const stat = L(
      `업무 ${Math.round(S.work)} · 호감도 ${Math.round(S.affection)} · 라이벌 ${Math.round(S.rival)} · 체력 ${Math.round(S.energy)}`,
      `Work ${Math.round(S.work)} · Affection ${Math.round(S.affection)} · Rival ${Math.round(S.rival)} · Energy ${Math.round(S.energy)}`
    );
    present(title, body + `<br><br><small style="color:var(--ink-dim)">${stat}</small>`, [
      { label: L("다시 플레이", "Play again"), go: () => showStart() },
    ]);
  }

  /* ------------------------------ boot ------------------------------ */
  function showStart() {
    $("screen-start").classList.remove("hidden");
    $("screen-play").classList.add("hidden");
  }
  function begin(gender) {
    S = newState(gender);
    $("screen-start").classList.add("hidden");
    $("screen-play").classList.remove("hidden");
    startWeek();
  }

  document.querySelectorAll("[data-gender]").forEach((card) =>
    card.addEventListener("click", () => {
      R.sfx.confirm();
      begin(card.dataset.gender);
    })
  );
})();
