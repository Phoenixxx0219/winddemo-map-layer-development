// 存储当前选中的按钮功能
let activeButton = null;

// 处理按钮选中状态
function selectButton(button) {
    // 移除所有按钮的 selected 类
    document.querySelectorAll(".control-button").forEach(btn => {
        btn.classList.remove("selected");
    });

    // 给点击的按钮添加 selected 类
    button.classList.add("selected");

    // ✅ 记录当前选中的按钮功能
    activeButton = button.getAttribute("data-function"); // 例如 'track', 'measure', 'clean'
    console.log(`当前选中的功能：${activeButton}`);
}

// 启用单体追踪
function enableTrack() {
    console.log("单体追踪已启用");
    selectButton(event.currentTarget);
}

// 启用测量方向和速度
function enableMeasure() {
    console.log("测量方向和速度功能启用");
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