var current_spans_index = 0; // 当前默认被唤醒的方块，默认是0;在initMap、initSpans中被重新赋初始值
var is_playing = false; //默认播放状态，在播放的一系列案件中
var span_items, span_item_active; //span对象，在initSpans被重新赋初始值

/*******************************
 * function:    initLeftMenu
 * info:        初始化左侧按钮：
 *              ① 清空左侧菜单div(id:left-menu)所有子元素
 *              ② 根据 菜单(MENUS) 循环创建 菜单项(CardItems)
 *              ③ 绑定 菜单项(CardItems) 点击的动画效果，且点击时触发函数 initSubMenu()
 *              ④ 主动执行一次initSubMenu()，这是因为初始化左侧菜单之后一定要初始化子项
 * invoked:     主动执行
 *******************************/
function initLeftMenu() {
    // console.log("initLeftMenu");
    let leftMenu = document.getElementById('x-data-menu')

    // ① 清空菜单(MENUS)所有子元素
    while (leftMenu.firstChild) {
        leftMenu.removeChild(leftMenu.firstChild);
    }

    // ② 根据菜单(MENUS)循环创建菜单项(CardItems)
    // 示例样式如下
    // <a class="card card--active" style="background-image: url('img/meteorology/雷达.jpg');">
    //     <div class="card-content">
    //         <img class="icon" src="img/icon/雷达.svg">
    //         <div class="text">雷达外推</div>
    //     </div>
    // </a>
    for (let i = 0; i < MENUS.length; i++) {
        let aTag = document.createElement('a');
        aTag.href = '#';
        aTag.className = 'card-d';
        // 每个方块设定其编号，保存在data-index中，方便获取
        aTag.setAttribute('data-index', i);
        aTag.setAttribute('token', MENUS[i]['TOKEN']);
        aTag.style.background = "url('" + MENUS[i]['IMAGE_URL'] + "')";
        let divTag = document.createElement('div');
        divTag.className = 'card-d-content';
        let imgTag = document.createElement('img');
        imgTag.className = 'icon';
        imgTag.src = MENUS[i]['ICON_URL'];
        let textTag = document.createElement('div');
        textTag.className = 'text';
        textTag.innerText = MENUS[i]['NAME'];
        // 对于第0个，初始化时就是唤醒状态（active）
        if (i === 0) {
            aTag.className = 'card-d card-d--active';
        }
        aTag.appendChild(divTag);
        divTag.appendChild(imgTag);
        divTag.appendChild(textTag);
        leftMenu.appendChild(aTag);
    }

    // ③ 绑定菜单项(CardItems)点击的动画效果，且点击时触发函数initSpans()
    let CardItems = document.querySelectorAll('.card-d');
    let CardItemActive = document.querySelector('.card-d--active');
    for (var i = 0; i < CardItems.length; i++) {
        CardItems[i].addEventListener('click', function () {
            if (!this.classList.contains('card-d--active')) {
                document.body.style.backgroundColor = `#${this.getAttribute('data-background')}`;
                CardItemActive.classList.remove('card-d--active');
                this.classList.add('card-d--active');
                CardItemActive.classList.add('card-d--animate');
                this.classList.add('card-d--animate');
                CardItemActive = this;
                initSpans();// 点击的时候sub-menu要刷新
            }
        });
    }
    // 先主动触发一次
    initSpans();
}


/*******************************
 * function:    initSpans
 * const:       current_spans_index 每次执行此函数赋初值 0
 *              span_items 最开始为空值，每次执行此函数赋初值 document.querySelectorAll('.span__item');
 * info:        根据SPANS_NUMBER数量，初始化spans，并为每个span_item绑定点击事件
 * invoked:     每次点击模型ModelItem的时候都会执行
 *******************************/
function initSpans() {
    // console.log("initSpans");
    // 找到当前哪个leftMenu被点击，从而确定span数量
    const activeCard = document.querySelector('.card-d--active');
    const activeCardIndexStr = activeCard.getAttribute('data-index');
    var spanNumber = MENUS[parseInt(activeCardIndexStr)]["SPANS_NUMBER"]
    var spanActualNumber = MENUS[parseInt(activeCardIndexStr)]["SPANS_ACTUAL_VALUE_NUMBER"]
    current_spans_index = 0;
    // 获取容器元素
    let span_menu = document.getElementById('spans');
    //先清空所有元素
    while (span_menu.firstChild) {
        span_menu.removeChild(span_menu.firstChild);
    }
    // 循环创建SpansNumber个a标签
    for (let i = 0; i < spanNumber; i++) {
        let aTag = document.createElement('a');
        aTag.href = '#';
        aTag.className = 'span__item';
        // 每个方块设定其编号，保存在data-index中，方便获取
        aTag.setAttribute('data-index', i);

        // 对于前SPANS_ACTUAL_VALUE_NUMBER个方块，由于其代表的是真实值，所以方块的颜色是rgb(4, 103, 154)，否则默认颜色是rgb(200, 0, 0)
        if (i < spanActualNumber) {
            aTag.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--default-rgba');
        }

        let pTag = document.createElement('p');
        pTag.className = 'p_item';

        // 对于第0个方块，初始化时就是唤醒状态（active）
        if (i === 0) {
            aTag.className = 'span__item span__item--active';
            pTag.innerHTML = '演示文字';
            pTag.classList.add('p-text-show')
        }
        aTag.appendChild(pTag);
        span_menu.appendChild(aTag);
    }

    span_items = document.querySelectorAll('.span__item'); //所有方块元素
    span_item_active = document.querySelector('.span__item--active'); //被唤醒的方块

    // 方块对象，点击事件绑定
    span_items.forEach(function (span_item) {
        span_item.addEventListener('click', function () {
            // 点击唤醒方块

            document.body.style.backgroundColor = `#${this.getAttribute('data-background')}`;
            //清空之前被点击的span_item所有属性
            span_item_active.querySelector("p").innerHTML = ''
            span_item_active.querySelector("p").classList.remove('p-text-show')
            span_item_active.classList.remove('span__item--active');
            //被点击的span_ite增加active属性
            this.classList.add('span__item--active');
            span_item_active.classList.add('span__item--animate');
            this.classList.add('span__item--animate');
            span_item_active = this;
            var childParagraph = this.querySelector("p"); // 使用querySelector获取第一个p标签
            current_spans_index = span_item_active.getAttribute('data-index')
            // 执行图层切换，并更换SPAN文字
            changeMaps()
                .then(formattedRequestTime => {
                    // 解析 UTC 时间为 Date 对象
                    const year = parseInt(formattedRequestTime.slice(0, 4));
                    const month = parseInt(formattedRequestTime.slice(4, 6)) - 1; // 月份从 0 开始
                    const day = parseInt(formattedRequestTime.slice(6, 8));
                    const hour = parseInt(formattedRequestTime.slice(8, 10));
                    const minute = parseInt(formattedRequestTime.slice(10, 12));

                    let utcDate = new Date(Date.UTC(year, month, day, hour, minute)); // 解析 UTC 时间

                    // 获取北京时间的 月、日、时、分
                    const bjMonth = String(utcDate.getMonth() + 1).padStart(2, '0'); // 补零
                    const bjDay = String(utcDate.getDate()).padStart(2, '0'); // 补零
                    const bjHour = String(utcDate.getHours()).padStart(2, '0'); // 补零
                    const bjMinute = String(utcDate.getMinutes()).padStart(2, '0'); // 补零

                    // **格式化输出：06月04日 08:00**
                    const formattedTime = `${bjMonth}.${bjDay} ${bjHour}:${bjMinute}`;

                    // 更新 childParagraph 显示格式化时间
                    childParagraph.innerHTML = formattedTime;
                })
                .catch(err => {
                    console.error('请求失败或处理出错:', err);
                });
            childParagraph.classList.add('p-text-show')

        });
    });

    // 点击最后一个真实值，因为是当前值
    current_spans_index = spanActualNumber-1;
    span_items[current_spans_index].click();

}

initLeftMenu();

/*******************************
 * info:        所有与播放、暂停、向前划看、向后划看、定时播放的逻辑，必须放在init组件之后执行，保证span_items不为空
 *******************************/
{
    // var timer = setInterval(SwitchSpanForward, TIME_INTERVAL);

    // 播放暂停按钮，点击事件绑定
    document.getElementById("play_stop_button").addEventListener("click", function () {
        if (is_playing) {
            to_stop();
        } else {
            to_play();
        }
    });

    // 向后手动切换按钮，点击事件绑定
    document.getElementById("forward_button").addEventListener("click", function () {
        //当执行手动切换时，为了用户体验，无论当前是否处于播放状态，都变为暂停状态
        to_stop();
        SwitchSpanForward();
    });

    // 向前手动切换按钮，点击事件绑定
    document.getElementById("back_button").addEventListener("click", function () {
        //当执行手动切换时，为了用户体验，无论当前是否处于播放状态，都变为暂停状态
        to_stop();
        SwitchSpanBackward();
    });

    // 按顺序切换方块(执行函数，触发点击)
    function SwitchSpanForward() {
        // console.log("顺序播放");
        if (current_spans_index < span_items.length - 1) {
            current_spans_index++;
        } else {
            current_spans_index = 0; // 重置索引，开始新一轮的循环
        }
        span_items[current_spans_index].click();

    }

    // 按顺序反方向切换方块(执行函数，触发点击)
    function SwitchSpanBackward() {
        // console.log("反顺序播放");
        if (current_spans_index > 0) {
            current_spans_index--;
        } else {
            current_spans_index = span_items.length - 1;
        }
        span_items[current_spans_index].click();
    }

    // 想要播放
    function to_play() {
        // console.log("to_play");
        if (!is_playing) {
            is_playing = true;
            console.log('点击按钮，开始动画')
            timer = setInterval(SwitchSpanForward, TIME_INTERVAL);
            let imageElement = document.getElementById("play_stop_button_img");
            let playStopButton = document.getElementById("play_stop_button");
            playStopButton.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--default-rgba');
            imageElement.src = './static/img/icon/stop.svg';
        }
    }

    // 想要暂停
    function to_stop() {
        // console.log("to_stop");
        if (is_playing) {
            is_playing = false;
            console.log('点击按钮，停止动画')
            clearInterval(timer); // 停止打印
            let imageElement = document.getElementById("play_stop_button_img");
            let playStopButton = document.getElementById("play_stop_button");
            playStopButton.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgba');
            imageElement.src = './static/img/icon/run.svg';
        }
    }
}

/*******************************
 * info:        左侧菜单的隐藏与显示事件
 *******************************/
let isFullScreen = false;

document.getElementById('full-screen-button').addEventListener('click', function () {
    var leftMenu = document.getElementById('left-menu');
    var fullScreenButton = document.getElementById('full-screen-button');
    var fullScreenButtonImg = document.getElementById('full-screen-button_img');
    var cards = document.querySelectorAll('.card-d');
    leftMenu.classList.toggle('hidden'); // 切换hidden类
    fullScreenButton.classList.toggle('hidden');
    fullScreenButtonImg.classList.toggle('hidden');
    // 切换isFullScreen状态
    isFullScreen = !isFullScreen;
    // 根据状态更改图片src
    if (isFullScreen) {
        fullScreenButtonImg.src = './static/img/icon/unfullscreen.svg';
    } else {
        fullScreenButtonImg.src = './static/img/icon/fullscreen.svg';
    }
    cards.forEach(function (card) {
        card.classList.toggle('hidden');
    });
});