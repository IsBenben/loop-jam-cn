(function () {
  'use strict';

  const { watch, nextTick } = Vue;

  const dir = 'isbenben-ext';
  try {
    player[dir] = JSON.parse(atob(localStorage.getItem(dir)));
  } catch {}
  player[dir] = {
    deprecatedAlgorithm: false,
    styleFixes: true,
    infinityReroll: false,
    infinityBlocks: false,
    sortInventory: true,
    ...player[dir],
  };

  function toInt(a) {
    // console.log(a.sType);
    if (a.sType === SlotType.Constant) {
      return a.value;
    }
    const varStart = 1000;
    const varToInt = {
      a: 0,
      b: 1,
      c: 2,
      d: 3,
      e: 4,
      f: 5,
      P: 9,
    };
    const opStart = 2000;
    if (a.sType === SlotType.Operator) {
      if (a.slots.length === 2) {
        if (a.slots[0].allowed === SlotType.Variable) {
          if (a.slots[0].locked) {
            return varStart + varToInt[a.slots[0].slot.id] * 100 + a.type + 1;
          } else {
            if (a.slots[1].type === SlotType.Constant) {
              return opStart + a.type * 10 + a.slots[1].slot.value;
            } else {
              return opStart + a.type * 10;
            }
          }
        } else {
          if (a.slots[1].type === SlotType.Constant) {
            return opStart + a.type * 10 + a.slots[1].slot.value;
          } else if (a.slots[1].type === 0) {
            // empty slot
            return opStart + a.type * 10 + 9;
          } else {
            if (a.slots[1].slot.slots[0].type === SlotType.Variable) {
              return opStart + a.type * 10 + 9;
            } else {
              return opStart + a.type * 10 + 8;
            }
          }
        }
      }
      if (a.type === OperatorType.Logarithm) {
        if (a.slots[0].type === SlotType.Variable) {
          return varStart + varToInt[a.slots[0].slot.id] * 100;
        } else {
          return 9999;
        }
      }
      if (a.type === OperatorType.Repeat) {
        return opStart + a.type * 10 + a.slots[0].slot.value;
      }
    }
    if (a.sType === SlotType.Variable) {
      return varStart + varToInt[a.id] * 100 + 9;
    }
    return -1;
  }
  setInterval(() => {
    if (player[dir].infinityBlocks) {
      for (let r of calculateRewards(100)) {
        increaseSlot(...r);
        r = r[0];
        if (r instanceof Variable && !player.new_variables.has(r.id)) {
          player.new_variables.add(r.id);
          increaseSlot(new Operator(0, new Slot(2, new Variable(r.id), true)), 1);
          increaseSlot(new Constant(randInt(1, 10)), 1);
        }
      }
    }
    if (player[dir].sortInventory) {
      player.slots = new Map(
        [...player.slots].toSorted((a, b) => {
          if (equalAll(a[0], b[0])) {
            return 0;
          }
          // console.log(a, toInt(a));
          if (toInt(a[0]) < toInt(b[0])) {
            return -1;
          }
          return 1;
        })
      );
    }

    if (player[dir].infinityReroll) {
      player.reroll = '无限';
    }
  }, 100);

  const oldSave = window.save;
  window.save = function () {
    localStorage.setItem(dir, btoa(JSON.stringify(player[dir])));
    oldSave();
  };

  const oldCalculateRewards = window.calculateRewards;
  window.calculateRewards = function (count = 6) {
    if (!player.deprecatedAlgorithm) {
      return oldCalculateRewards(count);
    }
    const rewards = [];
    for (let i = 0; i < count; i++) {
      const chance = Math.random();
      for (let j = 0; j < REWARD_CHANCES.length - 1; j++) {
        var c =
          j === 2
            ? 1 / Math.max(200, 1000 / player.nextP.add(9).log10().cbrt())
            : REWARD_CHANCES[j + 1];
        if (chance < c && j < 4) continue;
        if (j >= 3) unlockAchievement(2);

        const R = REWARDS[j];

        rewards.push(R[Math.floor(R.length * Math.random())]().concat(j));

        break;
      }
    }
    return rewards;
  };

  const oldBuildVue = window.buildVue;
  window.buildVue = function () {
    const app = document.querySelector('#app');
    app.innerHTML += `
      <link href="${dir}/index.css" rel="stylesheet">
      <div v-if="player['${dir}'].styleFixes">
        <link rel="stylesheet" href="${dir}/fixes.css">
        <div class="ben-modal"></div>
      </div>
      <div class="ben-information">已启用插件功能：
        {{ player['${dir}'].deprecatedAlgorithm ? "使用弃用的奖励算法 " : "" }}
        {{ player['${dir}'].styleFixes ? "现代化样式" : "" }}
        {{ player['${dir}'].infinityReroll ? "无限重掷" : "" }}
        {{ player['${dir}'].infinityBlocks ? "获得无限块" : "" }}
        {{ player['${dir}'].sortInventory ? "排序物品栏" : "" }}
      </div>
    `;
    const buttons = document.querySelector('.o-main-menu');
    buttons.innerHTML += `
        <button class="o-tutorial-button ben-settings-button" style="background-image: url(&quot;${dir}/settings.svg&quot;);" onclick="createComponentPopup('${dir}-settings');">插件设置</button>
    `;
    const popups = document.querySelector(
      '.o-popups > :nth-child(2) > :nth-child(1)'
    );
    popups.innerHTML += `
        <div v-if="player.popup.component === '${dir}-settings'" class="ben-settings">
            <h2>插件设置</h2>
            <div class="ben-left">
              <label><input type="checkbox" v-model="player['${dir}'].deprecatedAlgorithm">使用弃用的奖励算法</label><br>
              <label><input type="checkbox" v-model="player['${dir}'].styleFixes">现代化样式</label><br>
              <label><input type="checkbox" v-model="player['${dir}'].infinityReroll">无限重掷</label><br>
              <label><input type="checkbox" v-model="player['${dir}'].infinityBlocks">获得无限块</label><br>
              <label><input type="checkbox" v-model="player['${dir}'].sortInventory">排序物品栏</label><br>
            </div>
        </div>
    `;
    oldBuildVue();
  };
})();
