// 存储当前选中的按钮功能
let trackActive = false;
let queryActive = false;

// 处理按钮选中状态
function selectButton(button) {
    const btnFunc = button.getAttribute("data-function");

    if (btnFunc === TOOLBAR_STATUS.CLEAN) {
        // 点击 Clean 时，取消 Track 和 Query 的选中状态，并调用清除操作
        document.querySelectorAll(`.control-button[data-function="${TOOLBAR_STATUS.TRACK}"],
                                    .control-button[data-function="${TOOLBAR_STATUS.QUERY}"]`)
            .forEach(btn => {
                btn.classList.remove("selected");
            });
        // 重置状态
        trackActive = false;
        queryActive = false;
        console.log("Clean按钮点击：取消 Track 和 Query 选中状态");
        clearEntityLayers();
        disableMapQuery();
        return;
    }

    if (btnFunc === TOOLBAR_STATUS.TRACK) {
        // 对 Track 按钮进行切换
        if (button.classList.contains("selected")) {
            button.classList.remove("selected");
            trackActive = false;
            clearEntityLayers();
            console.log("Track取消选中");
        } else {
            button.classList.add("selected");
            trackActive = true;
            console.log("Track选中");
            // 手动触发一次单体追踪
            const span_item_active = document.querySelector('.span__item--active');
            if (span_item_active) {
                const current_spans_index = span_item_active.getAttribute('data-index');
                drawEntityOutline(current_spans_index);
            }
        }
    } else if (btnFunc === TOOLBAR_STATUS.QUERY) {
        // 对 Query 按钮进行切换
        if (button.classList.contains("selected")) {
            button.classList.remove("selected");
            queryActive = false;
            disableMapQuery();
            console.log("Query取消选中");
        } else {
            button.classList.add("selected");
            queryActive = true;
            console.log("Query选中");
            enableMapQuery();
        }
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

// getActiveButton() 实际上返回 trackActive 的状态
function getTrackActive() {
    return trackActive;
}