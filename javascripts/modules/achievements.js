const ACHIEVEMENTS = [
    {
        type: 0,
        title: `感谢你来编程！`,
        description: [
            `第一次运行代码。`,
        ],
    },{
        type: 0,
        title: `冲向无限，超越极限`,
        description: [
            `第一次通关游戏。`,
            `到达 P = 2<sup>2<sup>1024</sup></sup> (${format(Decimal.pow(2,Number.MAX_VALUE), true)}).`,
        ],
    },{
        type: 0,
        title: `史诗奖励！`,
        description: [
            `获得一次史诗或传奇的奖励。`,
        ],
    },{
        type: 0,
        title: `无限变量`,
        description: [
            `拥有6种不同的变量、`,
        ],
    },{
        type: 0,
        title: `快如闪电`,
        description: [
            `在 20 次 loop 以内通关游戏。`,
            `在 10 次 loop 以内通关游戏。`,
            `在 5 次 loop 以内通关游戏。`,
        ],
    },{
        type: 0,
        title: `代码高尔夫`,
        description: [
            `到达无限的同时只用一行代码。`,
            `整句游戏完全不插入任何一行代码。`,
        ],
    },{
        type: 0,
        title: `超额完成！`,
        description: [
            `在游戏通关过程中，每次 loop 都能【超额】完成目标。`,
        ],
    },{
        type: 0,
        title: `指数级膨胀`,
        description: [
            `使当前点数超过目标点数的平方（需要目标点数至少为 ${format(1e10)}）。`,
        ],
    },

    {
        type: 1,
        title: `自由之我`,
        description: [
            `赋予我自由。`,
            `点击此成就。`
        ],
    },{
        type: 1,
        title: `自由之我+`,
        description: [
            `先忽略他。`,
            `点击上一个成就100次。`
        ],
    },{
        type: 1,
        title: `似曾相识`,
        description: [
            `你意识到递归的存在了吗？`,
            `在一行代码中嵌套大量语句。`
        ],
    },{
        type: 1,
        title: `不想都读全`,
        description: [
            `别再瞎折腾了！`,
            `在代码中插入尽可能多的行。`
        ],
    },{
        type: 1,
        title: `异样的Cookie`,
        description: [
            `很喜欢 Cookie Clicker 吗？`,
            `运行100次仍未达到目标。`
        ],
    },{
        type: 1,
        title: `技术欠佳`,
        description: [
            `是在闹着玩吧？`,
            `编写使点数归零的代码。`
        ],
    },{
        type: 1,
        title: `刀锋边缘`,
        description: [
            `真想退出游戏吗？`,
            `在即将通关时，先点击【放弃？】，再点击【否】。`
        ],
    },{
        type: 1,
        title: `漫长协约`,
        description: [
            `已经87年了啊……`,
            `单行代码触发至少100行效果（该代码本身不包含100行）。`
        ],
    },

    {
        type: 0,
        title: `拒绝重掷`,
        description: [
            `不重掷奖励的情况下通关游戏。`,
        ],
    },{
        type: 0,
        title: `务必谨慎……`,
        description: [
            `达到至少10个目标后通关。`,
            `达到至少20个目标后通关。`,
        ],
    },
]

const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.reduce((a,b) => a + (b.description.length - b.type), 0)
const ACH_ORDER = [0,1,2,3,4,5,6,7,16,17,8,9,10,11,12,13,14,15]

const ACHIEVEMENT_CONDITIONS = {
    G5: true,
    6: true,
    16: true,
}

function unlockAchievement(i,j=1) {
    if (j > player.achievements[i]) {
        player.achievements[i] = j;

        const a = document.getElementById('achievement-popups'), A = ACHIEVEMENTS[i];

        const p = document.createElement('div')
        p.className = `o-achievement-div ` + ['','unlocked','golden','platinum'][j]
        p.innerHTML = `
        <img src="textures/achievement${i}.png">
        <div class="o-achievement-title">${i > 7 ? "隐藏" : ["","黄金","铂金"][j-1] }成就已解锁：${A.title}</div>
        <div class="o-achievement-description">${A.description[j-1+A.type]}</div>
        `

        a.appendChild(p)
        p.animate({ height: ['0px','100px'] }, { duration: 500, easing: "ease-out" })

        setTimeout(() => {
            p.animate({ height: ['100px','0px'] }, { duration: 500, easing: "ease-out" })

            setTimeout(() => p.remove(), 500)
        }, 3000);

        save()
    }
}

var testtest = 0
function test(i) {
    if (i === 8) {
        testtest++
        if (testtest >= 1) unlockAchievement(8);
        if (testtest >= 100) unlockAchievement(9);
    }
}