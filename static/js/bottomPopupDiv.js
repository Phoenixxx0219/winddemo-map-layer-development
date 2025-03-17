// 创建一个变量来跟踪当前的模式
let mode = 'single'; // 初始模式为单点模式


var markers = [];
var blinkmarkers = [];
var polyline, polyline_pro;
// 监听地图的点击事件
map.on('click', function (e) {
    if (mode === 'single') {
        //单点模式
        // 创建一个blinkmarker，初始透明度为 1（完全可见）
        blinkmarkers.forEach(function (marker) {
            map.removeLayer(marker);
        });
        blinkmarker = L.blinkMarker(e.latlng, {
            radius: 2, // 圆的半径
            fillOpacity: 0.5,
            stroke: false, // 不绘制边框
            weight: 0 // 由于我们不需要边框，这个选项实际上是无关紧要的
        }).addTo(map);
        blinkmarkers.push(blinkmarker);
    } else if (mode === 'multi') {
        // 多点模式
        // 创建一个数组来存储circleMarker
        var circleMarker = L.circleMarker(e.latlng, {
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.6,
            radius: 10,
            weight: 1,
            opacity: 1,
            interactive: true,
            labelStyle: {
                text: markers.length + 1,
                rotation: 0,
                strokeStyle: "#fff",
                fillStyle: "#fff",
                opacity: 1,
                offsetY: 1,
            }
        });

        // 将circleMarker添加到数组中
        markers.push(circleMarker);
        // 将circleMarker添加到地图
        circleMarker.addTo(map);
        // 如果你想在控制台中看到添加的标记，可以打印数组
        console.log(markers);
    }

});

// 添加一个按钮或某种交互方式来切换模式
function toggleMode(amode) {
    mode = amode;
    console.log('Mode switched to:', mode);
    blinkmarker.removeFrom(map);
    removeMarkers();
}

document.getElementById('singleMode').addEventListener("click", function () {
    toggleMode('single');
});
document.getElementById('multiMode').addEventListener("click", function () {
    toggleMode('multi');
});

// 如果你需要在某个时候移除所有标记，可以这样做：
// map.removeLayer(markers); // 这是错误的，因为markers是一个数组
// 正确的做法是遍历数组并逐个移除
function removeMarkers() {
    markers.forEach(function (marker) {
        map.removeLayer(marker);
    });
    map.removeLayer(polyline);
    map.removeLayer(polyline_pro);
    // 清空数组
    markers = [];
}

// 例如，你可以添加一个按钮来移除所有标记
document.getElementById('removeMarkersButton').addEventListener('click', removeMarkers);

// 添加一个按钮，用于将markers连接成折线
document.getElementById('connectMarkersButton').addEventListener('click', function () {
    if (markers.length > 1) {
        // 提取所有markers的坐标
        var latLngs = markers.map(function (marker) {
            return marker.getLatLng();
        });

        // 第一步，画出直接相连的折线，创建折线并添加到地图
        polyline = L.polyline(latLngs, {
            color: 'white',
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(map);

        // 第二步，模拟添加途径点，绕开某些位置的折线
        var numWaypointsToAdd = 3; // 要增加的途径点数量
        var existingLatLngs = markers.map(function (marker) {
            return marker.getLatLng();
        });
        var newWaypoints = [];

        // 随机生成新的途径点
        for (var i = 0; i < existingLatLngs.length - 1; i++) {
            var existingPoint_start = existingLatLngs[i];
            var existingPoint_end = existingLatLngs[i + 1];

            // 在现有点附近随机偏移一定距离生成新点
            var offsetLat = (Math.random() + 0.5) * 0.2; // 纬度偏移量，单位：度
            var offsetLng = (Math.random() + 0.5) * 0.2; // 经度偏移量，单位：度
            var newPoint = [(existingPoint_start.lat + existingPoint_end.lat) / 2 + offsetLat, (existingPoint_start.lng + existingPoint_end.lng) / 2 + offsetLng];

            // 确保新点不会过于偏离原始路径（可选）
            // 这里只是简单地限制了偏移量，你可以根据需要实现更复杂的逻辑
            newWaypoints.push(existingLatLngs[i])
            newWaypoints.push(newPoint);

            var circleMarker = L.circleMarker(newPoint, {
                color: 'purple',
                fillColor: 'purple',
                fillOpacity: 0.6,
                radius: 10,
                weight: 1,
                opacity: 1,
                interactive: true,
                labelStyle: {
                    text: '+',
                    rotation: 0,
                    strokeStyle: "#fff",
                    fillStyle: "#fff",
                    opacity: 1,
                    offsetY: 1,
                }
            });

            // 将circleMarker添加到数组中
            markers.push(circleMarker);

            // 将circleMarker添加到地图
            circleMarker.addTo(map);
        }
        newWaypoints.push(existingLatLngs[existingLatLngs.length - 1]);
        // 更新点的数组（注意：这里只是演示，实际应用中可能需要更复杂的逻辑来处理重复点或排序）
        var updatedLatLngs = newWaypoints;


        // 重新绘制折线
        polyline_pro = L.polyline(updatedLatLngs, {
            color: 'red',
            weight: 5,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(map);

        // 如果你想在控制台中看到折线的坐标，可以打印数组
        console.log('最新航线', updatedLatLngs);


    } else {
        alert('需要至少两个点才能形成折线！');
    }
});
