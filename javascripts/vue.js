const { createApp, reactive } = Vue

function buildVue() {
    createApp({
        setup() {
            return {
                player,
                REWARD_RARITIES,
                ACHIEVEMENTS,
                TOTAL_ACHIEVEMENTS,
                ACH_ORDER,
                Operator,
                chooseInventorySlot,
                chooseStoredSlot,
                equalAll,
                chooseReward,
                format,
                actionPopup,
                test,
            }
        },
    })
    
    .component('o-slot',{
        props: {
            data: {
                type: Object,
                default: () => ({ slot: {} })
            },
            depth: {
                type: Number,
                default: 0,
            },
        },
        computed: {
            objClass() {
                const d = this.data;
                const choosed = player.choosed_slot ?? player.stored[player.choosed_store]?.node ?? null
                return {
                    choosed: !d.locked && (player.storing && d.slot || choosed !== null && !(choosed instanceof Operator && choosed.type === 20)) && (player.storing || d.allowed === 0 || d.allowed & choosed.sType)
                }
            },
            objStyle() {
                return {
                    '--primary-color': ['#888','#fff'][this.getDepth%2]
                }
            },
            getDepth() {
                if (this.depth >= 16) unlockAchievement(10);
                return this.depth
            },
        },
        methods: {
            action(event) {
                if (event) event.stopPropagation();

                const d = this.data;

                if (player.tutorials === 2 || player.tutorials === 4 && d.slot || player.tutorials === 5) return;

                const choosed = player.choosed_slot ?? player.stored[player.choosed_store]?.node ?? null

                const condition = !d.locked && (d.allowed === 0 || d.allowed & choosed.sType)

                if (player.storing && !(d.slot instanceof Variable || d.slot instanceof Constant) && !(d.slot instanceof Operator && d.slot.isEmpty())) {
                    if (d.slot && condition) {
                        storeNode(_.cloneDeep(d.slot))
                        d.slot = null;

                        player.storing = false;
                    }
                } else if (choosed === null) {
                    if (d.slot && !d.locked) {
                        splitCode(d.slot);
                        d.slot = null;
                    }
                } else if ((player.slots.get(choosed) > 0 || player.choosed_store !== null) && condition && !(choosed instanceof Operator && choosed.type === 20)) {
                    if (player.choosed_store !== null) {
                        player.stored.splice(player.choosed_store, 1);
                        player.choosed_store = null
                    } else increaseSlot(choosed,-1)

                    if (d.slot) splitCode(d.slot);

                    d.slot = _.cloneDeep(choosed);

                    if (player.slots.get(player.choosed_slot) === 0) player.choosed_slot = null;
                }

                if (player.tutorials === 4) {
                    player.choosed_slot = null
                    message(`完美！你可以运行这个代码（所谓的 loop），也就是点击【运行】按钮。`,2)
                    player.tutorials++
                }
            },
        },
        template: `<div class='o-slot' :class="objClass" :style="objStyle" @click="action">
            <component v-if="data.slot && data.slot.component" :is="data.slot.component" :data="data.slot" :depth="depth+1" />
        </div>`,
    })
    .component('variable',{
        props: ['data'],
        template: `<div>{{ data.id }}</div>`,
    })
    .component('constant',{
        props: ['data'],
        template: `<div>{{ data.value }}</div>`,
    })
    .component('operator',{
        inject: ['OperatorHTMLs'],
        props: {
            data: Object,
            index: {
                type: Number,
                default: -1,
            },
            depth: {
                type: Number,
                default: 0,
            },
        },
        computed: {
            objectStyle() {
                const i = this.index;
                if (i < 0) return {};
                let depth = 0
                for (let j = 1; j <= i; j++) {
                    if (player.code[j-1].type === 20) depth++;
                    if (player.code[j].type === 21) depth--
                }
                return {
                    'margin-left': 25 * depth + "px",
                }
            },
        },
        template: `<div class='o-operator' :style="objectStyle">
            <div v-if="data.slots.length === 0 && OperatorHTMLs[data.type][0]" v-html="OperatorHTMLs[data.type][0]"></div>
            <div v-for="x in data.slots.length">
                <div v-if="OperatorHTMLs[data.type][x-1]" v-html="OperatorHTMLs[data.type][x-1]"></div>
                <o-slot :data="data.slots[x-1]" :depth="depth" />
                <div v-if="x === data.slots.length && OperatorHTMLs[data.type][x]" v-html="OperatorHTMLs[data.type][x]"></div>
            </div>
        </div>`,
    })

    .provide('player',player)

    .provide('OperatorHTMLs',OperatorHTMLs)
    .provide('Operator',Operator)
    .provide('Variable',Variable)
    .provide('Constant',Constant)
    
    .mount('#app')
}