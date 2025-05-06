// ----------------- 地图初始化相关逻辑 -----------------

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


// ----------------- 雷达卫星图层相关逻辑 -----------------

let lastToken = null;
let currentToken = null;
let currentRadarLayer = null;
let currentSatelliteLayer = null;

// 雷达图层
function RadarLayer(imageUrl) {
    return L.imageOverlay(imageUrl, RADAR_CONFIG.bounds, {
        opacity: RADAR_CONFIG.opacity
    });
}

// 切换雷达图层
function changeRadarLayer(imageUrl) {
    if (currentRadarLayer) {
        currentRadarLayer.setUrl(imageUrl); // 更新图像URL
    } else {
        currentRadarLayer = RadarLayer(imageUrl);
        currentRadarLayer.addTo(map);
    }
}

// 卫星图层
function SatelliteLayer(imageUrl) {
    return L.imageOverlay(imageUrl, SATELLITE_CONFIG.bounds, {
        opacity: SATELLITE_CONFIG.opacity
    });
}

// 切换卫星图层
function changeSatelliteLayer(imageUrl) {
    if (currentSatelliteLayer) {
        currentSatelliteLayer.setUrl(imageUrl); // 更新图像URL
    } else {
        currentSatelliteLayer = RadarLayer(imageUrl);
        currentSatelliteLayer.addTo(map);
    }
}

// 请求时间默认为 202411201200（北京时间）
let selectTimeStr = null;
let utcRealTime = null;

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

            currentToken = tokenValue;
            if(lastToken != tokenValue) {
                createLegend(tokenValue);
            }

            // 计算时间参数
            const timeOffset = current_spans_index - (menuItem_SPANS_ACTUAL_VALUE_NUMBER - 1);
            console.log("timeOffset:", timeOffset);
            console.log("current_spans_index:", current_spans_index);

            if(!selectTimeStr) {
                console.log("selectTimeStr is null");
                return;
            }
            const year = parseInt(selectTimeStr.substring(0, 4));
            const month = parseInt(selectTimeStr.substring(4, 6));
            const day = parseInt(selectTimeStr.substring(6, 8));
            const hours = parseInt(selectTimeStr.substring(8, 10));
            const minutes = parseInt(selectTimeStr.substring(10, 12));
            const selectBeijingTime = new Date(year, month - 1, day, hours, minutes);
            const selectUtcTimeStr = formatDateToUTCString(selectBeijingTime);
            utcRealTime = formatToUTCDateTimeString(selectBeijingTime);
            console.log("selectBeijingTime:", selectBeijingTime,
                 '\nselectUtcTimeStr:', selectUtcTimeStr, 
                 '\nutcRealTime:', utcRealTime);
            // 真实请求时间
            const realTime = new Date(selectBeijingTime.getTime() + timeOffset * menuItem_INTERVAL * 60 * 1000);
            const realTimeStr = realTime.toISOString().slice(0, 16).replace(/[-:T ]/g, '');
            // 请求api参数计算
            let datePart = null;
            let timePart = null;
            if(spanValue < menuItem_SPANS_ACTUAL_VALUE_NUMBER) {
                datePart = realTimeStr.substring(0, 8);
                timePart = realTimeStr.substring(8, 10) + "-" + realTimeStr.substring(10, 12);
            }else {
                datePart = selectUtcTimeStr.substring(0, 8);
                timePart = selectUtcTimeStr.substring(8, 10) + "-" + selectUtcTimeStr.substring(10, 12);
            }
            console.log("timePart:", timePart,
                '\ndatePart:', datePart);

            console.log('当前已点击新的菜单：', tokenValue,
                '\n时间间隔为：', menuItem_INTERVAL,
                '\n真实值滑块数量：', menuItem_SPANS_ACTUAL_VALUE_NUMBER,
                '\n滑块总数：', menuItem_SPANS_NUMBER,
                '\n播放滑块id:', spanValue,
                '\n由此计算的请求时间为：', realTimeStr);

            const preUrl = "http://10.250.105.96:8080";
            if(tokenValue == "RADAR") {
                // 构造雷达图像路径
                if(spanValue < menuItem_SPANS_ACTUAL_VALUE_NUMBER) {
                    const imageUrl = `${preUrl}/realimage/${datePart}/12/real/${realTimeStr}.png`;
                    changeRadarLayer(imageUrl);
                } else {
                    const imageUrl = `${preUrl}/forcastimage/${datePart}/12/forcast/${timePart}/${realTimeStr}.png`;
                    changeRadarLayer(imageUrl);
                }    
            } else if(tokenValue == "SATELLITE") {
                // 构造卫星图像路径
                if(spanValue < menuItem_SPANS_ACTUAL_VALUE_NUMBER) {
                    const imageUrl = `${preUrl}/realimage/${datePart}/11/real/${realTimeStr}.png`;
                    changeRadarLayer(imageUrl);
                } else {
                    const imageUrl = `${preUrl}/forcastimage/${datePart}/11/forcast/${timePart}/${realTimeStr}.png`;
                    changeRadarLayer(imageUrl);
                }    
            }

            // **返回时间信息**
            resolve(realTimeStr);
        } catch (error) {
            reject(error);
        }
    });
}

// ----------------- 图例绘制相关逻辑 -----------------

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


// ----------------- 单体追踪相关逻辑 -----------------

// 存储单体轮廓图层
let entityLayers = [];
let entityData = null;

// 获取单体轮廓数据
function getEntityData() {
    if(currentToken == "RADAR" ) {
        // 构造请求参数
        const requestData = {
            time: utcRealTime,
            algorithm: "forcast",
            interval: "6"
        };

        fetch("http://10.250.105.96:8080/api/convective/tracking", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                entityData = result.data;
                console.log("获取数据成功:", entityData);
            } else {
                console.error("请求错误:", result.message);
            }
        })
        .catch(error => {
            console.error("请求异常:", error);
        });
    }
}

// 绘制单体轮廓
function drawEntityOutline(current_spans_index) {
    if (currentToken == "RADAR" && entityData && entityData.entities) {
        // 清除之前的图层
        clearEntityLayers();
        // 遍历所有单体，绘制符合条件的轮廓
        entityData.entities.forEach(entity => {
            entity.spanData.forEach(span => {
                if (parseInt(span.index) === parseInt(current_spans_index) + 1 && span.outline && span.outline.length > 0) {
                    // 绘制轮廓
                    drawOutline(span.outline, entity.id);
                    // 绘制箭头
                    drawArrowWithImage(span.lat, span.lon, entity.direction, entity.speed, entity.id);
                }
            });
        });
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

    entityLayers.push(polygon);
}

// 根据角度计算方向文字
function getDirectionFromDegree(degree) {
    const directions = [
        '正北', '东北', '正东', '东南',
        '正南', '西南', '正西', '西北'
    ];
    const octants = Math.floor((degree + 22.5) / 45) % 8; // 将方位角划分为8个象限
    return directions[octants];
}

// 绘制箭头
function drawArrowWithImage(lat, lon, direction, speed, entityId) {
    // 加载箭头图片作为图标
    const arrowIcon = L.icon({
        iconUrl: './static/img/icon/arrow-up.svg', // 引用 SVG 图片路径
        iconSize: [30, 30], // 图片大小
        iconAnchor: [15, 15], // 图标中心点
        popupAnchor: [0, -10] // 弹窗位置
    });

    // 计算旋转角度（方向以北为 0°，顺时针旋转）
    const rotationAngle = direction;
    const formattedSpeed = parseFloat(speed.toFixed(2)); // 速度保留 2 位小数
    const directionText = getDirectionFromDegree(rotationAngle); // 获取方向文字

    // 创建一个 marker 并旋转
    const arrowMarker = L.marker([lat, lon], {
        icon: arrowIcon,
        rotationAngle: rotationAngle, // 旋转角度
        rotationOrigin: 'center center' // 旋转中心
    }).addTo(map);

    // 绑定弹窗信息
    arrowMarker.bindPopup(`编号: ${entityId}<br>方向: ${directionText}<br>速度: ${formattedSpeed}km/h`);

    // 添加到图层数组
    entityLayers.push(arrowMarker);
}


// ----------------- 单点查询相关逻辑 -----------------

// 用于存储当前查询标记
let queryMarker = null;

/**
 * 启用单点查询模式：
 * 监听地图点击事件，点击时添加红色标记并调用查询函数
 */
function enableMapQuery() {
    console.log("进入单点查询模式");
    map.on('click', handleMapQueryClick);
}

/**
 * 退出单点查询模式：
 * 移除地图点击事件监听，清除已添加的查询标记
 */
function disableMapQuery() {
    console.log("退出单点查询模式");
    map.off('click', handleMapQueryClick);
    clearQueryMarker();
}

/**
 * 地图点击事件处理函数
 * @param {Object} e - Leaflet点击事件对象，包含 e.latlng
 */
function handleMapQueryClick(e) {
    const { lat, lng } = e.latlng;

    // 移除之前的查询标记
    clearQueryMarker();

    // 添加一个红色标记
    queryMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-query-marker',
            html: '<div class="query-dot"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        })
    }).addTo(map);

    console.log(`单点查询点击坐标：纬度 ${lat}, 经度 ${lng}`);

    // 调用查询函数，并绑定查询结果到 popup
    queryPointInfo(lat, lng, queryMarker);
}

/**
 * 清除当前查询标记
 */
function clearQueryMarker() {
    if (queryMarker) {
        map.removeLayer(queryMarker);
        queryMarker = null;
    }
}

/**
 * 查询指定坐标的信息，并将结果显示在 marker 的 popup 上
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @param {Object} marker - 已添加到地图上的 marker 对象
 */
function queryPointInfo(lat, lng, marker) {
    console.log(`开始查询点信息：纬度=${lat}, 经度=${lng}`);

    // 模拟查询数据，这里可以换成实际的 AJAX 请求
    let queryResult = null;

    if(currentToken == "RADAR" ) {
        // 构造请求参数
        const requestData = {
            time: utcRealTime,
            algorithm: "forcast",
            interval: "6",
            lat: lat,
            lon: lng
        };

        fetch("http://10.250.105.96:8080/api/convective/point", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.code === 200) {
                pointData = result.data;
                if (!pointData) {
                    queryResult = `查询坐标：${lat.toFixed(4)}, ${lng.toFixed(4)}<br>此位置在未来3小时内不会受到强对流影响`;
                    marker.bindPopup(queryResult).openPopup();
                    console.log("查询结果为空");
                    return;
                }
                queryResult = `查询坐标：${lat.toFixed(4)}, ${lng.toFixed(4)}<br>单体编号：${pointData.id}<br>预警时间：${pointData.time}`;
                // 绑定 popup 到 marker，并打开
                marker.bindPopup(queryResult).openPopup();
                console.log("获取数据成功:", pointData);
            } else {
                console.error("请求错误:", result.message);
            }
        })
        .catch(error => {
            console.error("请求异常:", error);
        });
    }else {
        queryResult = `查询坐标：${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        // 绑定 popup 到 marker，并打开
        marker.bindPopup(queryResult).openPopup();
    }
}


// 根据选择的时间更新地图数据的函数
function updateMapDataByTime(dateTimeStr) {
    selectTimeStr = convertTimetoStr(dateTimeStr);
    console.log("更新realTimeStr为：" + selectTimeStr);
}


// ----------------- tool函数 -----------------

// date转换为str
function formatDateToUTCString(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const h = pad(date.getUTCHours());
    const min = pad(date.getUTCMinutes());
    return `${y}${m}${d}${h}${min}`;
}

function formatToUTCDateTimeString(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const h = pad(date.getUTCHours());
    const min = pad(date.getUTCMinutes());
    return `${y}-${m}-${d} ${h}:${min}`;
}

// 时间格式转换
function convertTimetoStr(dateTimeStr) {
    const dateTime = new Date(dateTimeStr);
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0');
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
}