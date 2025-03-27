// 初始化地图
var map = L.map("map", {
    center: TILE_MAP.mapCenter,
    zoom: TILE_MAP.zoom,
    minZoom: TILE_MAP.minZoom,
    maxZoom: TILE_MAP.maxZoom
});

// 天地图矢量底图放在最下面
map.createPane('basePane');
map.getPane('basePane').style.zIndex = 9;
// 天地图标注层放在中间
map.createPane('labelPane');
map.getPane('labelPane').style.zIndex = 99;
// 气象图层再最上面
map.createPane('dataPane');
map.getPane('dataPane').style.zIndex = 999;

// 添加天地图矢量底图
var tiandituBase = L.tileLayer(
    TILE_MAP.tileUrlBase + TILE_MAP.tiandituKey,
    {
        subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        attribution: '&copy; <a href="https://www.tianditu.gov.cn/">天地图</a>',
        maxZoom: 18,
        pane: 'basePane'
    }
).addTo(map);

// 添加天地图标注层
var tiandituLabel = L.tileLayer(
    TILE_MAP.tileUrlLabel + TILE_MAP.tiandituKey,
    {
        subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
        maxZoom: 18,
        pane: 'labelPane'
    }
).addTo(map);

let currentRadarLayer = null;
let lastToken = null;
let currentToken = null;

// 雷达图层
function RadarLayer(imageUrl) {
    return L.imageOverlay(imageUrl, RADAR_CONFIG.bounds, {
        opacity: RADAR_CONFIG.opacity
    });
}

// 切换图层
function changeRadarLayer(imageUrl) {
    if (currentRadarLayer) {
        currentRadarLayer.setUrl(imageUrl); // 更新图像URL
    } else {
        currentRadarLayer = RadarLayer(imageUrl);
        currentRadarLayer.addTo(map);
    }
}


function changeMaps() {
    return new Promise((resolve, reject) => {
        try {
            // 查询具有 class 'card--active' 的元素
            const activeCard = document.querySelector('.card-d--active');

            // 查询对应 MENUS 的基础信息
            const activeCardIndexStr = activeCard.getAttribute('data-index');
            const menuItem_INTERVAL = MENUS[parseInt(activeCardIndexStr)]['INTERVAL'];
            const menuItem_SPANS_NUMBER = MENUS[parseInt(activeCardIndexStr)]['SPANS_NUMBER'];
            const menuItem_SPANS_ACTUAL_VALUE_NUMBER = MENUS[parseInt(activeCardIndexStr)]['SPANS_ACTUAL_VALUE_NUMBER'];

            // 查询具有 class 'span__item--active' 的元素
            const activeSpan = document.querySelector('.span__item--active');

            // 获取该元素的 token 属性值
            const tokenValue = activeCard.getAttribute('token');
            const spanValue = activeSpan.getAttribute('data-index');

            // 计算时间参数
            const timeOffset = current_spans_index - (menuItem_SPANS_ACTUAL_VALUE_NUMBER - 1);
            console.log("timeOffset:", timeOffset);
            console.log("current_spans_index:", current_spans_index);

            // 请求时间默认为 202406040800（北京时间）
            const dateStr = "202406040800";
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6) - 1; // 月份从 0 开始
            const day = dateStr.substring(6, 8);
            const hours = dateStr.substring(8, 10);
            const minutes = dateStr.substring(10, 12);

            const currentTime = new Date(year, month, day, hours, minutes);
            const requestTime = new Date(currentTime.getTime() + timeOffset * menuItem_INTERVAL * 60 * 1000);
            const formattedRequestTime = requestTime.toISOString().slice(0, 16).replace(/[-:T ]/g, '');

            currentToken = tokenValue;
            console.log('当前已点击新的菜单：', tokenValue,
                '\n时间间隔为：', menuItem_INTERVAL,
                '\n真实值滑块数量：', menuItem_SPANS_ACTUAL_VALUE_NUMBER,
                '\n滑块总数：', menuItem_SPANS_NUMBER,
                '\n播放滑块id:', spanValue,
                '\n由此计算的请求时间为：', formattedRequestTime);
            
            if(lastToken != tokenValue) {
                createLegend(tokenValue);
            }
            // 构造雷达图像路径
            const imageUrl = `./data/radar/${formattedRequestTime}.png`;
            changeRadarLayer(imageUrl);

            // **返回时间信息**
            resolve(formattedRequestTime);
        } catch (error) {
            reject(error);
        }
    });

    // 构造后端请求的 URL 和请求参数
    // let url = 'http://10.249.46.209:8080/ImageData/';
    // let requestData = {
    //     startTime: formattedRequestTime,
    //     endTime: formattedRequestTime,
    //     interval: menuItem_INTERVAL,
    //     type: 0 // 默认值
    // };

    // const typeMap = {
    //     'RADAR': 10,
    //     'SATELLITE': 8,
    //     'RAIN': 3,
    //     'WIND': 2,
    //     'TEMP': 1,
    //     'PRESSURE': 0
    // };

    // if (typeMap.hasOwnProperty(tokenValue)) {
    //     requestData.type = typeMap[tokenValue];
    // }

    // 发送 HTTP 请求获取数据
    // return new Promise((resolve, reject) => {
    //     $.ajax({
    //         url: url,
    //         type: 'POST',
    //         contentType: 'application/json',
    //         data: JSON.stringify(requestData),
    //         success: function (response) {
    //             if (response.code === 200 && response.data && response.data.length > 0) {
    //                 const responseTime = response.data[0].time;
    //                 const updateTime = response.data[0].updateTime;
    //                 const data = response.data[0].dataJson;

    //                 // 若与上一次token值相同，则只需要更新data；反之，色标和data都需要更新
    //                 if(tokenValue == lastToken) {
    //                     if (currentScalarLayer) {
    //                         currentScalarLayer.setData(data);
    //                     } else {
    //                         addScalarLayer(tokenValue, data);
    //                     }
    //                 } else {
    //                     updateLegend(tokenValue);   // 更新色标
    //                     removeScalarLayer();
    //                     addScalarLayer(tokenValue, data);
    //                 }
    //                 // 若为WIND，则需要添加风场粒子，只需要更新data；反之，移除风场粒子图层
    //                 if (tokenValue === 'WIND') {
    //                     if (currentWindLayer) {
    //                         currentWindLayer.setData(data);
    //                     } else {
    //                         addWindLayer(data);
    //                     }
    //                 } else {
    //                     removeWindLayer();
    //                 }

    //                 console.log('图层加载成功:', tokenValue);
    //                 lastToken = tokenValue;     //更新token值
    //                 const returnTime = convertUTCToBeijingTime(responseTime);   // 将UTC时间转换为北京时间并返回
    //                 resolve(returnTime);
    //             } else {
    //                 lastToken = tokenValue;
    //                 console.error('数据请求失败或数据为空:', response.message);
    //                 reject('数据为空');
    //             }
    //         },
    //         error: function (err) {
    //             lastToken = tokenValue;
    //             console.error('请求失败:', err);
    //             reject(err);
    //         }
    //     });
    // });
}

// 获取图例父容器
const legendWrapper = document.getElementById('color-legend');
// 获取图例容器
const legendContainer = document.getElementById('legend-bg');

// 生成图例
function createLegend(token) {
    // 清空之前的图例内容，防止多次生成
    legendContainer.innerHTML = '';

    // 检查并移除之前的图例标题
    const oldTitle = document.querySelector('.legend-title');
    if (oldTitle) {
        legendWrapper.removeChild(oldTitle);
    }

    // 创建图例标题（单位）
    const legendTitle = document.createElement('div');
    legendTitle.className = 'legend-title';
    legendTitle.innerText = LEGEND_UNIT[token] ? `${LEGEND_UNIT[token]}` : ''; // 根据 token 设置单位
    if (legendTitle.innerText) {
        legendWrapper.insertBefore(legendTitle, legendContainer); // 将标题插入到图例顶部
    }
    
    // 创建颜色块和文字
    const colorCol = document.createElement('div');
    colorCol.className = 'legend-colors';
    const labelCol = document.createElement('div');
    labelCol.className = 'legend-labels';

    LEGEND[token].forEach((item, index) => {
        const colorBox = document.createElement('span');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = item.color;
        colorCol.appendChild(colorBox);

        const label = document.createElement('span');
        label.className = `label-text ${index === LEGEND[token].length - 1 ? 'last' : ''}`;
        label.innerText = item.text;
        labelCol.appendChild(label);
    });

    // 组合两个列
    legendContainer.appendChild(colorCol);
    legendContainer.appendChild(labelCol);
}


// 存储单体轮廓图层
let entityLayers = [];

// 绘制单体轮廓
function drawEntityOutline(current_spans_index) {
    if(currentToken == "RADAR" ) {
        // 加载 JSON 文件
        fetch("./data/test.json") // JSON 文件路径
            .then(response => response.json())
            .then(data => {
                // 清除之前的图层
                clearEntityLayers();

                // 查询当前滑块的索引
                const activeSpan = document.querySelector(".span__item--active");
                if (!activeSpan) {
                    console.warn("未找到滑块，无法绘制轮廓");
                    return;
                }
                const currentIndex = parseInt(activeSpan.getAttribute("data-index"));

                // 遍历所有单体，绘制符合条件的轮廓
                data.entities.forEach(entity => {
                    entity.spanData.forEach(span => {
                        if (span.index === currentIndex + 1 && span.outline.length > 0) {
                            drawOutline(span.outline, entity.id);
                        }
                    });
                });
            })
            .catch(error => console.error("加载 JSON 文件失败:", error));
    }
    else {
        // 清除之前的图层
        clearEntityLayers();
    }
}

// 清除之前绘制的轮廓图层
function clearEntityLayers() {
    entityLayers.forEach(layer => map.removeLayer(layer));
    entityLayers = []; // 清空数组
}

// 绘制单体轮廓
function drawOutline(outline, entityId) {
    // 将 outline 转换为 Leaflet 坐标
    const latLngs = outline.map(coord => [coord[0], coord[1]]);
    const polygon = L.polygon(latLngs, {
        color: "#ff0000",
        weight: 2,
        fillOpacity: 0,
        dashArray: "5, 5"
    }).addTo(map);

    // 绑定弹窗信息
    polygon.bindPopup(`单体 ID: ${entityId}`);
    entityLayers.push(polygon);
}


// // UTC时间转换为北京时间
// function convertUTCToBeijingTime(utcTimeString) {
//     const utcDate = new Date(utcTimeString);
//     const beijingTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
//     const year = beijingTime.getFullYear();
//     const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
//     const day = String(beijingTime.getDate()).padStart(2, '0');
//     const hours = String(beijingTime.getHours()).padStart(2, '0');
//     const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}`;
// }