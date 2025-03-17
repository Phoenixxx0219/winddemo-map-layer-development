// 全局颜色配置
const colors = {
    transparentLight: 'rgba(255, 255, 255, 0.36)',
    transparentDark: 'rgba(0, 0, 0, 0.36)',
    // // 绿色配色
    // default: 'rgba(0, 102, 51, 0.8)',
    // // 深蓝色配色
    // default: 'rgba(60, 111, 182, 0.8)',
    // // 淡蓝色配色
    // default: 'rgba(44, 79, 207, 1)',
    // 毛玻璃配色
    default: 'rgba(30, 86, 163, 1)',
    accent: 'rgba(224, 62, 54, 1)',
    accentTransparentDark: 'rgba(224, 62, 54, 0.72)',
    accentTransparentLight: 'rgba(224, 62, 54, 0.36)',
    success: 'rgba(0, 102, 51, 0.8)',
    info: 'rgba(0, 102, 51, 0.8)', // same as default for example
    warning: 'rgba(224, 62, 54, 0.8)',
    critical: 'rgba(255, 105, 105, 0.8)'
};
const root = document.documentElement;
Object.keys(colors).forEach(key => {
    root.style.setProperty(`--${key}-rgba`, colors[key]);
});

// 瓦片服务
// zoom大于11时采用高德瓦片,TILE_Standard 标准瓦片；TILE_Satellite 卫星；仅限广东；zoom小于等于11时采用wind瓦片，全球瓦片
const TILE_Standard = 'http://43.139.63.132/guangdong_gaode/Standard/{z}/{x}/{y}/tile.webp';
const TILE_Satellite = 'http://43.139.63.132/guangdong_gaode/Satellite/{z}/{x}/{y}/tile.webp';
const TILE_wind = 'http://43.139.63.132/wind/{z}/{x}/{y}.png';

// 播放速度，1000代表每1000ms切换一张图片
const TIME_INTERVAL = 2000;

// 算法信息
const RADAR_ALGORITHM_DIR_DICT = {
    "convgru": "pred_png_colored",
    "cotrec": "cotrec",
    "newgru": "NewHitGRU",
    "opticalflow": "opticalflow",
    "vividgru": "vividgru",
    "tsgan": "tsgan",
}
const RAIN_ALGORITHM_DIR_DICT = {
    "hitcnn": "CNN30min_MF01V2",
    "cotrec": "cotrec",
    "opticalflow": "opticalflow",
    "实况": "real_color_png",
}
const QPE_TIME_DIR_DICT = {
    "未来1小时": "qpe_01h",
    "未来2小时": "qpe_02h",
    "未来30分钟": "qpe_30m",
}
const QPF_TIME_DIR_DICT = {
    "未来1小时": "qpf_01h",
    "未来2小时": "qpf_02h",
    "未来30分钟": "qpf_30m",
}
const RAIN_TIME_DIR_DICT = {
    "未来30分钟": "r30m",
    "未来1小时": "r01h",
    "未来2小时": "r02h",
}
const SPAN_SUBMENU_DICT = {
    "未来30分钟": 30,
    "未来1小时": 60,
    "未来2小时": 120,
}

// 地址信息
const RADAR_PRED_BASE_PATH = './data/radar/'
const RADAR_REAL_BASE_PATH = './data/radar/radar_color_png/'
const RAIN_PRED_BASE_PATH = './data/rain/rain/multi_rain_color_png/'
const RAIN_REAL_BASE_PATH = './data/rain/rain/multi_rain_color_png/real_color_png/'
const RAIN_BASE_PATH = './data/rain/rain/multi_rain_color_png/'

// 菜单信息
// 注意每个MODELS数组长度在1-4之间，如果大于4则系统只读取前四个，少于1个系统会报错
const MENUS = [
    {
        "NAME": "气象雷达", // NAME用于前端展示
        "TOKEN": "RADAR", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/雷达.jpg",
        "ICON_URL": "./static/img/icon/雷达.svg",
        "INTERVAL": 6, // 雷达6分钟一次
        "SPANS_NUMBER": 10 + 20 , // 往前推1小时，往后推2小时
        "SPANS_ACTUAL_VALUE_NUMBER": 10
    },
    {
        "NAME": "卫星云图", // NAME用于前端展示
        "TOKEN": "SATELLITE", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/降雨.jpg",
        "ICON_URL": "./static/img/icon/降雨.svg",
        "INTERVAL": 6, // 卫星6分钟一次
        "SPANS_NUMBER": 8 + 12, // 往前推2小时，往后推3小时，这样可以直接避免大概1小时延迟
        "SPANS_ACTUAL_VALUE_NUMBER": 8
    },
    {
        "NAME": "降雨",
        "TOKEN": "RAIN", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/降雨.jpg",
        "ICON_URL": "./static/img/icon/降雨.svg",
        "INTERVAL": 60, // GFS一个小时一次
        "SPANS_NUMBER": 6 + 24,  // 往前推6小时，往前推24小时
        "SPANS_ACTUAL_VALUE_NUMBER": 6
    },
    {
        "NAME": "风",
        "TOKEN": "WIND", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/雷暴大风.jpg",
        "ICON_URL": "./static/img/icon/雷暴大风.svg",
        "INTERVAL": 60, // GFS一个小时一次
        "SPANS_NUMBER": 6 + 24,  // 往前推6小时，往前推24小时
        "SPANS_ACTUAL_VALUE_NUMBER": 6
    },
    {
        "NAME": "温度",
        "TOKEN": "TEMP", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/强对流.jpg",
        "ICON_URL": "./static/img/icon/强对流.svg",
        "INTERVAL": 60, // GFS一个小时一次
        "SPANS_NUMBER": 6 + 24,  // 往前推6小时，往前推24小时
        "SPANS_ACTUAL_VALUE_NUMBER": 6
    },
    {
        "NAME": "气压",
        "TOKEN": "PRESSURE", // TOKEN用于数据请求
        // todo:需要更换为气压的图片
        "IMAGE_URL": "./static/img/meteorology/冰雹.jpg",
        "ICON_URL": "./static/img/icon/冰雹.svg",
        "INTERVAL": 60, // GFS一个小时一次
        "SPANS_NUMBER": 6 + 24,  // 往前推6小时，往前推24小时
        "SPANS_ACTUAL_VALUE_NUMBER": 6
    },
    {
        "NAME": "湿度",
        "TOKEN": "HUMIDITY", // TOKEN用于数据请求
        // todo:需要更换为湿度的图片
        "IMAGE_URL": "./static/img/meteorology/冰雹.jpg",
        "ICON_URL": "./static/img/icon/冰雹.svg",
        "INTERVAL": 60, // GFS一个小时一次
        "SPANS_NUMBER": 6 + 24,  // 往前推6小时，往前推24小时
        "SPANS_ACTUAL_VALUE_NUMBER": 6
    }
]







