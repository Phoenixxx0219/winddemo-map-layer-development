// 存储当前选中的按钮功能
let activeButton = null;

// 处理按钮选中状态
function selectButton(button) {
    clearEntityLayers();    // 取消追踪
    disableMapQuery();      // 取消查询

    // 如果当前点击的按钮已被选中，则取消选中状态
    if (button.classList.contains("selected")) {
        button.classList.remove("selected");
        console.log(`取消选中：${button.getAttribute("data-function")}`);
        activeButton = null; // 清空选中的按钮
        return;
    }

    // 移除其他按钮的 selected 类
    document.querySelectorAll(".control-button").forEach(btn => {
        btn.classList.remove("selected");
    });

    // 给点击的按钮添加 selected 类
    button.classList.add("selected");

    // 记录当前选中的按钮功能
    activeButton = button.getAttribute("data-function");
    console.log(`当前选中的功能：${activeButton}`);

    if (activeButton == TOOLBAR_STATUS.TRACK) {
        // 手动触发一次单体追踪
        span_item_active = document.querySelector('.span__item--active');
        current_spans_index = span_item_active.getAttribute('data-index')
        drawEntityOutline(current_spans_index);
    } else if (activeButton == TOOLBAR_STATUS.QUERY) {
        enableMapQuery();
    }
}

// 启用单体追踪
function enableTrack() {
    console.log("单体追踪已启用");
    selectButton(event.currentTarget);
}

// 单点查询
function enableQuery() {
    console.log("单点查询功能启用");
    selectButton(event.currentTarget);
}

// 启用距离测量或清除标记
function enableClean() {
    console.log("清除标记功能启用");
    selectButton(event.currentTarget);
}

function getActiveButton() {
    return activeButton;
}