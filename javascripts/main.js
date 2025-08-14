const getPlayerData = function () {
  const data = {
    msg: 'Hello, World!',

    playing: false,
    storing: false,
    running: false,

    variables: {
      P: D(0),
    },
    new_variables: new Set(['P', 'a']),

    nextP: D(1),
    completed: false,
    level: 1,

    slots: new Map([
      [
        new Operator(
          OperatorType.SetVariable,
          new Slot(2, new Variable('a'), true),
          new Slot(0, new Constant(1), true)
        ),
        1,
      ],
      [new Variable('a'), 3],
      // [new Operator(OperatorType.Exponent, null, new Slot(0, new Constant(1), false)), 100]
      // [new Operator(20, new Slot(4, new Constant(3), true)),3]
    ]),
    stored: [],
    choosed_slot: null,
    choosed_store: null,

    code: [
      new Operator(
        OperatorType.AddVariable,
        new Slot(0, new Variable('P'), true)
      ),
    ],
    loops: 0,

    rewards: [],
    reroll: 5,
    choosedRewards: new Set(),

    popup: {
      enabled: false,
      msg: '',
      component: null,
      buttons: [['确定']],
    },

    mute: false,
    tutorial: true,

    tutorials: 0,

    achievements: new Array(ACHIEVEMENTS.length).fill(0),

    endless: false,
  };

  data.code[0].persist = true;

  return data;
};

player = reactive(getPlayerData());

const GameLoad = function () {
  // player.rewards = calculateRewards()

  const str = localStorage.getItem('loop-jam-save');

  if (str) {
    const loaded = JSON.parse(atob(str));

    player.tutorial = loaded.tutorial;
    player.mute = loaded.mute;
    player.achievements = loaded.achievements;

    for (let i = 0; i < ACHIEVEMENTS.length; i++) player.achievements[i] ??= 0;
  }

  buildVue();

  setTimeout(() => {
    document.getElementById('app').style.display = '';

    setInterval(save, 1000);
  }, 1);
};

function startGame() {
  player.playing = true;
  player.stored = [];
  player.storing = false;
  player.variables = {
    P: D(0),
  };
  player.new_variables = new Set(['P', 'a']);
  player.nextP = D(1);
  player.slots = new Map([
    [
      new Operator(
        OperatorType.SetVariable,
        new Slot(2, new Variable('a'), true),
        new Slot(0, new Constant(1), true)
      ),
      1,
    ],
    [new Variable('a'), 3],

    // [new Operator(OperatorType.Exponent, null, null), 1000],
    // [new Operator(OperatorType.Product, null, null), 1000],
    // [new Operator(10), 1000],
    // [new Operator(0), 1000],
    // [new Variable("P"), 1000],
    // [new Operator(20, new Slot(4, new Constant(2), false)), 1000],
    // [new Operator(20, new Slot(4, new Constant(3), false)), 1000],
    // [new Operator(20, new Slot(4, new Constant(4), false)), 1000],
    // [new Constant(1), 1000],
    // [new Constant(2), 1000],
    // [new Constant(3), 1000],
    // [new Constant(4), 1000],
    // [new Constant(9), 1000],
    // [new Constant(10), 1000],
    // [new Constant(100), 1000],
  ]);
  player.choosed_slot = null;
  player.choosed_store = null;
  player.code = [
    new Operator(
      OperatorType.AddVariable,
      new Slot(0, new Variable('P'), true)
    ),
  ];
  player.code[0].persist = true;
  player.loops = 0;
  player.level = 1;
  for (const id in ACHIEVEMENT_CONDITIONS) ACHIEVEMENT_CONDITIONS[id] = true;
  player.tutorials = +player.tutorial;
  if (player.tutorial)
    message(
      `你好，现在是教程关。首先，你要点击背包中的代码，包括语句、变量和常量。目前背包中有3个“a”变量，还有1个用于定义“a”变量的语句。`,
      2
    );
  else
    message(
      `欢迎来到游戏 2<sup>1024</sup> Loops！编写代码达到目标 P = 2<sup>1024</sup> (${format(
        Number.MAX_VALUE
      )})并完成成就。祝你好运！`,
      2
    );
  player.endless = false;
}

function save() {
  localStorage.setItem(
    'loop-jam-save',
    btoa(
      JSON.stringify({
        achievements: player.achievements,
        mute: player.mute,
        tutorial: player.tutorial,
      })
    )
  );
}

function increaseSlot(s, value) {
  for (const [k, v] of player.slots)
    if (k.equals(s)) {
      player.slots.set(k, Math.max(v + value, 0));
      return;
    }
  player.slots.set(s, value);
}

function splitCode(c, override = true) {
  let temp = [_.cloneDeep(c)],
    new_temp = [],
    result = [];

  const r = (o) => {
    for (let i = 0; i < o.slots.length; i++) {
      const s = o.slots[i];

      if (s.locked) {
        if (s.slot instanceof Operator) r(s.slot);
      } else if (s.slot) {
        new_temp.push(s.slot);
        s.slot = null;
      }
    }
  };

  while (temp.length) {
    new_temp = [];

    temp.forEach((t) => {
      if (t instanceof Operator) r(t);
      if (override) increaseSlot(t, 1);
      result.push(t);
    });

    temp = new_temp;
  }

  // console.log(result)

  return result;
}

(() => {
  var index,
    step,
    interval,
    spam = 0;

  function finish() {
    if (step?.length >= 100) unlockAchievement(15);
    if (player.variables.P.gte(Decimal.pow(2, Number.MAX_VALUE)))
      unlockAchievement(1, 2);
    player.running = false;

    if (player.tutorials === 5) {
      player.tutorials = 0;
      player.tutorial = false;

      createComponentPopup('tutorial1', [
        [
          '下一步',
          () =>
            createComponentPopup('tutorial2', [['好！', () => finish()]]),
        ],
      ]);
    } else if (player.variables.P.gte(player.nextP)) {
      spam = 0;

      if (player.endless || player.variables.P.lt(Number.MAX_VALUE)) {
        if (
          player.variables.P.gte(player.nextP.sqr()) &&
          player.nextP.gte(1e10)
        )
          unlockAchievement(7);

        player.completed = true;
        player.rewards = calculateRewards();
        player.reroll = 3;
        unlockAchievement(0);

        if (player.variables.P.div(player.nextP).gte(1e10))
          message(`好【大】的点数！我们越来越接近真正的极限了！`, 2);
        else message(`太棒了！继续坚持吧！`, 2);
      } else {
        unlockAchievement(1);

        if (player.loops <= 20) unlockAchievement(4);
        if (player.loops <= 10) unlockAchievement(4, 2);
        if (player.loops <= 5) unlockAchievement(4, 3);
        if (player.code.length === 1) unlockAchievement(5);
        if (ACHIEVEMENT_CONDITIONS.G5) unlockAchievement(5, 2);
        if (ACHIEVEMENT_CONDITIONS[6]) unlockAchievement(6);
        if (ACHIEVEMENT_CONDITIONS[16]) unlockAchievement(16);
        if (player.level >= 10) unlockAchievement(17, 1);
        if (player.level >= 20) unlockAchievement(17, 2);

        message(
          `恭喜到达无限！回来继续玩耍吧 :)`,
          2
        );
        createPopup(
          `<h2>游戏已完成</h2>恭喜你达到了 P = 2<sup>1024</sup> (${format(
            Number.MAX_VALUE
          )})！你可以重置游戏并重新开始，来解锁更多的成就。<br>如果你想继续游玩，你可以进入【无尽模式】，来“打破无限”，但你的目标将更加艰巨。`,
          [
            [
              '进入无尽模式',
              () => {
                player.endless = true;
                player.completed = true;
                player.rewards = calculateRewards();
                player.reroll = 3;
                message(
                  `哦，你想驾驭更大的点数？当然，你可以这么做，但你必须完成更艰巨的目标。祝你好运……`,
                  2
                );
              },
            ],
            ['重新开始', startGame],
            ['返回到主菜单', () => (player.playing = false)],
          ]
        );

        save();
      }
    } else {
      spam++;
      ACHIEVEMENT_CONDITIONS[6] = false;

      if (player.variables.P.eq(0) && player.nextP.gt(1)) {
        message(
          `为什么你P停留在零？？？你技术欠佳……`,
          4
        );
        unlockAchievement(13);
      } else if (spam >= 100) {
        message(`...`, 3);
        unlockAchievement(12);
      } else
        message(
          [
            `考虑对代码进行优化，来取得更大收益！`,
            `不要像在“Cookie Clicker”中一样反复点击“运行”按钮！`,
            `继续努力去优化！`,
          ][Math.floor(3 * Math.random())],
          0
        );
    }
  }

  window.runCode = function () {
    if (
      (player.tutorial && player.tutorials < 5) ||
      player.completed ||
      player.popup.enabled
    )
      return;

    if (player.running) {
      clearInterval(interval);

      for (let i = index; i < step.length; i++) step[i][1]?.();

      finish();

      return;
    }

    // Checking Syntax

    // var no_insert_p = true
    // const ex = new Operator(1, new Slot(0, new Variable('P'), true), null)

    const def = {
      P: true,
    };

    const check = (x) => {
      if (x instanceof Operator) {
        if (x.type < 10) {
          if (check(x.slots[1].slot)) return true;
          else if (
            !x.slots[0].slot ||
            (x.type !== OperatorType.SetVariable && !def[x.slots[0].slot.id])
          )
            return true;

          def[x.slots[0].slot.id] = true;
        } else
          for (let i = 0; i < x.slots.length; i++)
            if (check(x.slots[i].slot)) return true;
      } else if (x instanceof Variable && !def[x.id]) return true;

      return false;
    };

    for (let i = 0; i < player.code.length; i++) {
      const c = player.code[i];
      // if (no_insert_p && splitCode(c, false).some(s => s instanceof Operator && s.equals(ex))) no_insert_p = false;
      if (check(c)) {
        message(
          `在代码第 ${
            i + 1
          } 行发现错误！请修复错误，然后重新运行。`,
          1
        );
        return;
      }
    }

    message(``, 0);

    player.choosed_slot = null;
    player.choosed_store = null;
    player.storing = false;
    player.running = true;
    player.loops++;

    player.new_variables.forEach((i) => {
      if (i !== 'P') player.variables[i] = D(0);
    });

    /*
        let depth = 0;

        for (let i = 0; i < player.code.length; i++) {
            const c = player.code[i]

            if (depth === 0) c.run(i);

            if (c.type === OperatorType.Repeat) depth++;
            else if (c.type === OperatorType.EndRepeat) depth--;
        }
        */

    let depth = 0,
      repeats = [],
      saved = [];
    step = [];

    for (let i = 0; i < player.code.length; i++) {
      const c = player.code[i];

      // console.log(i, repeats[depth])

      // if (depth === 0) c.run(i);

      if (c.type === OperatorType.Repeat) {
        depth++;
        repeats[depth] = c.slots[0].calculate();
        saved[depth] = i;

        step.push([i]);
      } else if (c.type === OperatorType.EndRepeat) {
        repeats[depth]--;
        if (repeats[depth]) i = saved[depth];
        else depth--;
      } else step.push([i, () => c.run(i)]);
    }

    const lines = document.querySelector('.o-code').children,
      animation = [
        {
          transform: ['translateX(25px)', 'translate(0px)'],
        },
        {
          duration: 250,
          iteration: 1,
          easing: 'ease-out',
        },
      ],
      audio = document.getElementById('type-sound');

    index = 0;
    const f = () => {
      const [j, g] = step[index];

      g?.();
      lines[j].firstChild.animate(...animation);
      if (!player.muted) audio.play();

      index++;
      if (step.length > index)
        interval = setTimeout(f, 1000 / (2 + 0.1 * index));
      else
        interval = setTimeout(() => {
          finish();
        }, 1000);
    };

    interval = setTimeout(f, 500);

    // step.forEach(x => x[1]?.());

    /*
        if (player.variables.P >= player.nextP) {
            player.completed = true
            player.rewards = calculateRewards()
            player.reroll = 5
        }
        */

    // console.log(player.variables.P)
  };
})();

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const equalAll = (a, b) => a?.sType === b?.sType && a.equals(b);

const logBase = (a, b) => Math.log(a) / Math.log(b);

const chooseReward = (i) => {
  if (player.choosedRewards.size < 3 || player.choosedRewards.has(i))
    player.choosedRewards.has(i)
      ? player.choosedRewards.delete(i)
      : player.choosedRewards.add(i);
};

function message(text, id = 0) {
  player.msg = text;
  document
    .getElementById('face')
    .setAttribute(
      'src',
      id === 4 ? `textures/face${id}.gif` : `textures/face${id}.png`
    );
}

function createPopup(text, buttons = [['确定']]) {
  player.popup.enabled = true;
  player.popup.msg = text;
  player.popup.buttons = buttons;
}
function createComponentPopup(component, buttons = [['确定']]) {
  player.popup.enabled = true;
  player.popup.component = component;
  player.popup.buttons = buttons;
}
function actionPopup(i) {
  player.popup.enabled = false;
  player.popup.component = null;
  player.popup.buttons[i][1]?.();
}

function giveUp() {
  if (player.running || player.completed || player.popup.enabled) return;
  createPopup(
    `你是感到不幸运或者出错，要放弃吗？<i>这会清空所有数据，不可撤回。</i>`,
    [
      [
        `是`,
        () => {
          player.playing = false;
        },
      ],
      [
        `否`,
        () => {
          if (!player.endless && player.variables.P >= Number.MAX_VALUE ** 0.75)
            unlockAchievement(14);
        },
      ],
    ]
  );
}
