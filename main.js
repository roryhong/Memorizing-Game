const GAME_STATE = {
    FirstCardAwaits: 'FirstCardAwaits',
    SecondCardAwaits: 'SecondCardAwaits',
    CardsMatchFailed: 'CardsMatchFailed',
    CardsMatched: 'CardsMatched',
    GameFinished: 'GameFinished'
}


const Symbols = [
    'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
    'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
    'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
    'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

/*視覺顯示*/
/*當物件屬性與變數or函式名稱相同時可省略不寫*/
const view = {
    /* 卡片的外層*/
    getCardElement(index) {
        return `
      <div class="card back" data-index="${index}"></div>`
    },

    //產生牌面
    getCardContent(index) {
        //運算數字
        const number = this.transformNumber((index % 13) + 1)
        //運算花色
        const symbol = Symbols[Math.floor(index / 13)]
        return `
            <div class="card">
                <p>${number}</p>
                <img src="${symbol}" />
                <p>${number}</p>
            </div>`
    },


    //需要特殊顯示的牌
    transformNumber(number) {
        //switch:比對是否有符合case的條件，有的話執行，剩下的則不更動
        switch (number) {
            case 1:
                return 'A'
            case 11:
                return 'J'
            case 12:
                return 'Q'
            case 13:
                return 'K'
            default:
                return number
        }
    },

    /*將卡片內容顯示在cards */
    displayCards(indexes) {
        const rootElement = document.querySelector('#cards')
        //Array.from(Array(52).keys()) -> 產生0~51的陣列
        //Array.from():從類陣列或可迭代的物件建立新的Array
        //array(52).keys():拿出一個0~51的迭代器
        //map():透過函式的回傳值組合成一個新陣列，不會改變原陣列
        //join():將陣列合成字串
        //已經打亂的牌駔-> 產生卡片，並形成新陣列(一開始顯示花色那面) -> 將新陣列變成字串放進#cards
        rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
    },

    //翻牌
    //... :在陣列中的值展開為個別值稱為展開運算子;將值收集形成陣列且不確定數量的稱為其餘參數
    flipCards(...cards) {
        cards.map(card => {
            if (card.classList.contains('back')) {
                //回傳正面
                card.classList.remove('back')
                card.innerHTML = this.getCardContent(Number(card.dataset.index))
                return
            }
            //回傳背面
            card.classList.add('back')
            card.innerHTML = null
        })
    },

    //配對成功的牌，map產生新陣列將陣列值加入class='paired'
    pairCards(...cards) {
        cards.map(card => {
            card.classList.add("paired")
        })
    },

    //分數
    renderScore(score) {
        document.querySelector('.score').innerHTML = `Score: ${score}`;
    },

    //回合數
    renderTriedTimes(times) {
        document.querySelector('.tried').innerHTML = `You've tried: ${times} times`
    },

    //配對錯誤動畫
    appendWrongAnimation(...cards) {
        cards.map(card => {
            card.classList.add('wrong')
            //動態加入監聽器
            card.addEventListener('animationend', event => {
                event.target.classList.remove('wrong'), {
                    //執行完一次動畫就卸除這個監聽器
                    once: true
                }
            })
        })
    },

    //遊戲結束顯示畫面
    showGameFinished() {
        const div = document.createElement('div')
        div.classList.add('completed')
        div.innerHTML = `
            <p>Complete!</p>
            <p>Score: ${model.score}</p>
            <p>You've tried: ${model.triedTimes} times</p>
        `
        const header = document.querySelector('#header')
        header.before(div)
    }
}

//資料
const model = {
    //分數與回合數
    score: 0,
    triedTimes: 0,
    //暫存被翻的排
    revealedCards: [],
    //判斷在陣列中的牌，數字是否相等
    isRevealedCardsMatched() {
        return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
    }
}

//依照遊戲狀態分配動作
const controller = {
    //還沒翻牌的初始狀態
    currentState: GAME_STATE.FirstCardAwaits,
    generateCards() {
        //在html顯示已經打亂順序的牌組
        view.displayCards(utility.getRandomNumberArray(52))
    },

    //翻牌的狀態進程
    dispatchCardAction(card) {
        if (!card.classList.contains('back')) {
            return
        }
        switch (this.currentState) {
            //翻第一張牌
            case GAME_STATE.FirstCardAwaits:
                //翻牌
                view.flipCards(card)
                //暫存在陣列
                model.revealedCards.push(card)
                //狀態:準備翻第二張牌
                this.currentState = GAME_STATE.SecondCardAwaits
                break
            case GAME_STATE.SecondCardAwaits:
                //增加回合數
                view.renderTriedTimes(++model.triedTimes)
                view.flipCards(card)
                model.revealedCards.push(card)
                //判斷是否配對成功
                if (model.isRevealedCardsMatched()) {
                    //配對成功
                    //每成功配對一次加十分
                    view.renderScore(model.score += 10)
                    //狀態:配對成功
                    this.currentState = GAME_STATE.CardsMatched
                    //將陣列中的值加上class='paired'
                    view.pairCards(...model.revealedCards)
                    //清空陣列
                    model.revealedCards = []
                    //滿分
                    if(model.score === 260) {
                        console.log('showGameFinished')
                        this.currentState = GAME_STATE.GameFinished
                        view.showGameFinished()
                        return
                    }
                    this.currentState = GAME_STATE.FirstCardAwaits
                } else {
                    //配對失敗將牌翻回花色那面
                    this.currentState = GAME_STATE.CardsMatchFailed
                    //配對錯誤的動畫
                    view.appendWrongAnimation(...model.revealedCards)
                    setTimeout(this.resetCards, 1000)
                }
                break
        }
        console.log('this.currentState', this.currentState)
        console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
    },

    //配對失敗後將牌重新覆蓋，並重新翻第一張牌
    resetCards() {
        view.flipCards(...model.revealedCards)
        model.revealedCards = []
        controller.currentState = GAME_STATE.FirstCardAwaits
    }
}

//使用Fisher-Yates Shuffle演算法洗牌
const utility = {
    getRandomNumberArray(count) {
        //產生一個0~count-1的陣列
        const number = Array.from(Array(count).keys())
        //let index = number.length - 1: 取出最後一項
        for (let index = number.length - 1; index > 0; index--) {
            //找到一個隨機項目
            let randomIndex = Math.floor(Math.random() * (index + 1));
            //結構賦值，交換陣列元素
            [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
        }
        return number
    }
}

controller.generateCards()

//抓出所有.card並監聽
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', event => {
        controller.dispatchCardAction(card)
    })
})