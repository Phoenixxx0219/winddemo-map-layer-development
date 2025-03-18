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


// 雷达图层
function RadarLayer(imageUrl) {
    return L.imageOverlay(imageUrl, RADAR_CONFIG.bounds, {
        opacity: RADAR_CONFIG.opacity
    });
}

let currentRadarLayer = null;

// 移除图层
function removeRadarLayer() {
    if (currentRadarLayer) {
        map.removeLayer(currentRadarLayer);
        currentRadarLayer = null;
    }
}

// 增加图层
function addRadarLayer(imageUrl) {
    currentRadarLayer = RadarLayer(imageUrl);
    currentRadarLayer.addTo(map, {pane: 'dataPane'});
}

imageUrl = "./data/radar/202406040000.png"
addRadarLayer(imageUrl)


// 01. 风场强度标量示例
// (绘制标量图,你可以理解为热力图)加载强度图
function ScalarLayer(type, data) {

    let config = {
        displayValues: false,
        displayOptions: {
            velocityType: "",
            displayPosition: "",
            displayEmptyString: ""
        },
        radius: 0.4,
        maxOpacity: 0.75,
        minOpacity: 0,
        scaleRadius: true,
        useLocalExtrema: false,
        blur: 0.2,
        latField: 'a',
        lngField: 'o',
        valueField: 'v'
    };

    // 设置色标范围
    switch (type) {
        case 'RADAR':
            config.minValue = 0.01;
            config.maxValue = 30;
            config.customKey = true;
            config.colorScale=[
                [0, [255, 255, 255, 0]], // 透明
                [2.5, [0, 0, 239]],
                [7.5, [1, 160, 246]],
                [12.5, [7, 235, 236]],
                [17.5, [109, 250, 61]],
                [22.5, [0, 216, 6]],
                [27.5, [1, 144, 0]],
                [32.5, [255, 255, 0]],
                [37.5, [231, 191, 0]],
                [42.5, [255, 144, 0]],
                [47.5, [255, 0, 0]],
                [52.5, [214, 0, 1]],
                [57.5, [192, 0, 0]],
                [62.5, [255, 0, 239]],
                [67.5, [150, 1, 180]],
                [72.5, [173, 144, 240]]
              ];
            break;

        case 'SATELLITE':
            config.minValue = 0.01;
            config.maxValue = 255;
            config.customKey = false;
            break;

        case 'RAIN':
            config.minValue = 1.5;
            config.maxValue = 10;
            config.customKey = true;
            config.colorScale=[
                [0, [255, 255, 255, 0]], // 透明
                [0.1, [247, 247, 247, 255]],
                [1, [39, 252, 253, 255]],
                [2, [53, 191, 190, 255]],
                [5, [34, 129, 0, 255]],
                [10, [68, 255, 0, 255]],
                [15, [171, 255, 38,255]],
                [20, [254, 247, 132 ,255]],
                [25, [254, 255, 4, 255]],
                [30, [248, 156, 18, 255]],
                [40, [245, 60, 21, 255]],
                [50, [244, 0, 21, 255]],
                [70, [190, 0, 17, 255]],
                [100, [245, 0, 255, 255]],
                [250, [189, 30, 133, 255]]
              ];
            break;

        case 'WIND':
            config.minValue = 0.01;
            config.maxValue = 8;
            config.customKey = false;
            break;

        case 'TEMP':
            config.minValue = 260.15;
            config.maxValue = 308.15;
            config.customKey = false;
            break;

        case 'PRESSURE':
            config.minValue = 99000;
            config.maxValue = 103000;
            config.customKey = false;
            break;

        default:
            config.minValue = -30.0;
            config.maxValue = 40;
            config.customKey = false;
            break;
    }

    //绘制标量图并叠层
    var scalarLayer = new L.scalarLayer(config);
    scalarLayer.setData(data);
    return scalarLayer;

}

/*$.getJSON(data).done(function (data) {
    var layer2 = ScalarLayer(data);
    layer2.addTo(map, {pane: 'ScalarPane'})
})*/

// 02. 风场粒子示例
// 生成一个粒子图层图层并返回
function WindLayer(data) {
    var velocityLayer = L.velocityLayer({
        // displayValues: true,
        // displayOptions: {
        //     velocityType: 'GBR Wind',
        //     displayPosition: 'bottomleft',
        //     displayEmptyString: 'No wind data'
        // },
        data: data,
        scanMode: '1',
        minVelocity: 0, //Velocity：速率
        maxVelocity: 10,
        // velocityScale: 0.005,
        particleMultiplier: 0.0005,  //粒子的数量
        lineWidth: 3,               //粒子的粗细
        // frameRate: 15,                      //定义每秒执行的次数
        colorScale: ["rgb(255,255,255)","rgb(255,255,255)","rgb(255,255,255)","rgb(255,255,255)"]
    });
    return velocityLayer;
}

// 将风场加载到地图上
/*$.getJSON(data).done(function (data) {
    var layer = windLayer(data);
    layer.addTo(map, {pane: 'velocityPane'});
})*/

let currentScalarLayer = null;
let currentWindLayer = null;
let lastToken = "";     //保存上一次Token值

// 移除标量图层
function removeScalarLayer() {
    if (currentScalarLayer) {
        map.removeLayer(currentScalarLayer);
        currentScalarLayer = null;
    }
}

// 移除风场图层
function removeWindLayer() {
    if (currentWindLayer) {
        map.removeLayer(currentWindLayer);
        currentWindLayer = null;
    }
}

// 增加标量图层
function addScalarLayer(type, data) {
    currentScalarLayer = ScalarLayer(type, data);
    currentScalarLayer.addTo(map, {pane: 'scalarPane'});
}

// 增加风场图层
function addWindLayer(data) {
    currentWindLayer = WindLayer(data);
    currentWindLayer.addTo(map, {pane: 'velocityPane'});
}

// UTC时间转换为北京时间
function convertUTCToBeijingTime(utcTimeString) {
    const utcDate = new Date(utcTimeString);
    const beijingTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    const year = beijingTime.getFullYear();
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const day = String(beijingTime.getDate()).padStart(2, '0');
    const hours = String(beijingTime.getHours()).padStart(2, '0');
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 更新色标
function updateLegend(type) {
    let baseMapLayerLegend = null;
    let unit = null;

    // 这里的色标与ScalarLayer有一点点不同，为了标注值和颜色更好的对应稍微修改了值的大小
    switch (type) {
        case 'RADAR':
            baseMapLayerLegend = [
                [5, [0, 0, 239]],
                [10, [1, 160, 246]],
                [15, [7, 235, 236]],
                [20, [109, 250, 61]],
                [25, [0, 216, 6]],
                [30, [1, 144, 0]],
                [35, [255, 255, 0]],
                [40, [231, 191, 0]],
                [45, [255, 144, 0]],
                [50, [255, 0, 0]],
                [55, [214, 0, 1]],
                [60, [192, 0, 0]],
                [65, [255, 0, 239]],
                [70, [150, 1, 180]],
                [75, [173, 144, 240]]
            ];
            unit = 'dBZ';
            break;

        case 'SATELLITE':
            baseMapLayerLegend = [
                [0, [90, 86, 143]],
                [25.5, [72, 104, 181]],
                [51, [69, 151, 168]],
                [76.5, [81, 180, 98]],
                [102, [106, 192, 82]],
                [127.5, [177, 209, 67]],
                [153, [215, 206, 60]],
                [178.5, [214, 172, 64]],
                [204, [213, 137, 72]],
                [229.5, [205, 94, 93]],
                [255, [144, 28, 79]]
            ];
            unit = '';
            break;

        case 'RAIN':
            baseMapLayerLegend = [
                [1, [39, 252, 253]],
                [2, [53, 191, 190]],
                [5, [34, 129, 0]],
                [10, [68, 255, 0]],
                [15, [171, 255, 38]],
                [20, [254, 247, 132]],
                [25, [254, 255, 4]],
                [30, [248, 156, 18]],
                [40, [245, 60, 21]],
                [50, [244, 0, 21]],
                [70, [190, 0, 17]],
                [100, [245, 0, 255]],
                [250, [189, 30, 133]]
            ];
            unit = 'kg/㎡';
            break;

        case 'WIND':
            baseMapLayerLegend = [
                [0, [90, 86, 143]],
                [0.8, [72, 104, 181]],
                [1.6, [69, 151, 168]],
                [2.4, [81, 180, 98]],
                [3.2, [106, 192, 82]],
                [4.0, [177, 209, 67]],
                [4.8, [215, 206, 60]],
                [5.6, [214, 172, 64]],
                [6.4, [213, 137, 72]],
                [7.2, [205, 94, 93]],
                [8.0, [144, 28, 79]]
            ];
            unit = 'm/s';
            break;

        case 'TEMP':
            baseMapLayerLegend = [
                [260.15, [90, 86, 143]],
                [264.95, [72, 104, 181]],
                [269.75, [69, 151, 168]],
                [274.55, [81, 180, 98]],
                [279.35, [106, 192, 82]],
                [284.15, [177, 209, 67]],
                [288.95, [215, 206, 60]],
                [293.75, [214, 172, 64]],
                [298.55, [213, 137, 72]],
                [303.35, [205, 94, 93]],
                [308.15, [144, 28, 79]]
            ];
            unit = 'K';
            break;

        case 'PRESSURE':
            baseMapLayerLegend = [
                [99000, [90, 86, 143]],
                [99400, [72, 104, 181]],
                [99800, [69, 151, 168]],
                [100200, [81, 180, 98]],
                [100600, [106, 192, 82]],
                [101000, [177, 209, 67]],
                [101400, [215, 206, 60]],
                [101800, [214, 172, 64]],
                [102200, [213, 137, 72]],
                [102600, [205, 94, 93]],
                [103000, [144, 28, 79]]
            ];
            unit = 'Pa';
            break;

        default:
            baseMapLayerLegend = [
                [2.5, [0, 0, 239]],
                [7.5, [1, 160, 246]],
                [12.5, [7, 235, 236]],
                [17.5, [109, 250, 61]],
                [22.5, [0, 216, 6]],
                [27.5, [1, 144, 0]],
                [32.5, [255, 255, 0]],
                [37.5, [231, 191, 0]],
                [42.5, [255, 144, 0]],
                [47.5, [255, 0, 0]],
                [52.5, [214, 0, 1]],
                [57.5, [192, 0, 0]],
                [62.5, [255, 0, 239]],
                [67.5, [150, 1, 180]],
                [72.5, [173, 144, 240]]
            ];
            unit = 'dBZ';
            break;
    }
    
    // 获取 legend-bg 容器
    const legendBg = document.getElementById('legend-bg');
    legendBg.innerHTML = ''; // 清空之前的内容
    
    // 提取颜色和对应值
    const colors = baseMapLayerLegend.map(item => `rgb(${item[1].join(',')})`);
    const values = baseMapLayerLegend.map(item => item[0]);
    
    // 创建渐变字符串
    const gradientString = `linear-gradient(to right, ${colors.join(', ')})`;
    
    // 设置背景颜色
    legendBg.style.background = gradientString;
    
    // 创建标签并添加
    const numLabels = Math.ceil(values.length / 5); // 每5个位置标注一次
    for (let i = 0; i < values.length; i++) {
        if (i % numLabels === 0) {
            const label = document.createElement('div');
            label.classList.add('value-label');
            label.textContent = `${values[i]}${unit}`;  // 添加对应的值
            label.style.flex = '1';                     // 平均分配空间
            legendBg.appendChild(label);
        }
    }
}

// 图层切换触发函数
function changeMaps() {
    // 查询具有 class 'card--active' 的元素
    const activeCard = document.querySelector('.card-l--active');

    // 查询对应MENUS的基础信息(时间间隔、滑块总数量、代表真实值的滑块数量)
    const activeCardIndexStr = activeCard.getAttribute('data-index')
    const menuItem_INTERVAL = MENUS[parseInt(activeCardIndexStr)]['INTERVAL']
    const menuItem_SPANS_NUMBER = MENUS[parseInt(activeCardIndexStr)]['SPANS_NUMBER']
    const menuItem_SPANS_ACTUAL_VALUE_NUMBER = MENUS[parseInt(activeCardIndexStr)]['SPANS_ACTUAL_VALUE_NUMBER']

    // 查询具有 class 'span__item--active' 的元素
    const activeSpan = document.querySelector('.span__item--active');

    // 获取该元素的 token 属性值
    const tokenValue = activeCard.getAttribute('token');
    const spanValue = activeSpan.getAttribute('data-index');

    // 计算时间参数
    const timeOffset = current_spans_index - (menuItem_SPANS_ACTUAL_VALUE_NUMBER - 1)
    console.log("timeOffset:",timeOffset)
    console.log("current_spans_index:",current_spans_index)

    const currentTime = new Date();
    let requestTime;
    if(tokenValue == 'RADAR') {
        // 雷达请求时间：当前时间-18min后，避免延迟 
        const newTime = new Date(currentTime.getTime() - 18 * 60 * 1000);
        requestTime = new Date(newTime.getTime() + timeOffset * menuItem_INTERVAL * 60 * 1000);
    }else {
        // 其余请求时间为当前时间即可
        requestTime = new Date(currentTime.getTime() + timeOffset * menuItem_INTERVAL * 60 * 1000);
    }
    const formattedRequestTime = requestTime.toISOString().slice(0, 16).replace('T', ' ');

    console.log('当前已点击新的菜单：', tokenValue,
        '\n时间间隔为：', menuItem_INTERVAL,
        '\n真实值滑块数量：', menuItem_SPANS_ACTUAL_VALUE_NUMBER,
        '\n滑块总数：', menuItem_SPANS_NUMBER,
        '\n播放滑块id:', spanValue,
        '\n由此计算的请求时间为：', formattedRequestTime);

    // 构造后端请求的 URL 和请求参数
    let url = 'http://49.233.204.126:8899/api/gfs/gfsData';
    let requestData = {
        startTime: formattedRequestTime,
        endTime: formattedRequestTime,
        interval: menuItem_INTERVAL,
        type: 0 // 默认值
    };

    const typeMap = {
        'RADAR': 10,
        'SATELLITE': 8,
        'RAIN': 3,
        'WIND': 2,
        'TEMP': 1,
        'PRESSURE': 0
    };

    if (typeMap.hasOwnProperty(tokenValue)) {
        requestData.type = typeMap[tokenValue];
    }

    // 发送 HTTP 请求获取数据
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (response) {
                if (response.code === 200 && response.data && response.data.length > 0) {
                    const responseTime = response.data[0].time;
                    const updateTime = response.data[0].updateTime;
                    const data = response.data[0].dataJson;

                    // 若与上一次token值相同，则只需要更新data；反之，色标和data都需要更新
                    if(tokenValue == lastToken) {
                        if (currentScalarLayer) {
                            currentScalarLayer.setData(data);
                        } else {
                            addScalarLayer(tokenValue, data);
                        }
                    } else {
                        updateLegend(tokenValue);   // 更新色标
                        removeScalarLayer();
                        addScalarLayer(tokenValue, data);
                    }
                    // 若为WIND，则需要添加风场粒子，只需要更新data；反之，移除风场粒子图层
                    if (tokenValue === 'WIND') {
                        if (currentWindLayer) {
                            currentWindLayer.setData(data);
                        } else {
                            addWindLayer(data);
                        }
                    } else {
                        removeWindLayer();
                    }

                    console.log('图层加载成功:', tokenValue);
                    lastToken = tokenValue;     //更新token值
                    const returnTime = convertUTCToBeijingTime(responseTime);   // 将UTC时间转换为北京时间并返回
                    resolve(returnTime);
                } else {
                    lastToken = tokenValue;
                    console.error('数据请求失败或数据为空:', response.message);
                    reject('数据为空');
                }
            },
            error: function (err) {
                lastToken = tokenValue;
                console.error('请求失败:', err);
                reject(err);
            }
        });
    });
}

// Marker 单点 相关