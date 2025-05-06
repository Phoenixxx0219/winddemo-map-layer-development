// 全局颜色配置
const colors = {
    transparentLight: 'rgba(255, 255, 255, 0.36)',
    transparentDark: 'rgba(0, 0, 0, 0.36)',
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
// 定义全局配置变量，包含地图中心、缩放级别以及天地图的 URL 模板
const TILE_MAP = {
    tiandituKey: "e81a9d4054ebc4b8f0fa40057cf0e3b9",
    mapCenter: [22.045, 113.816],
    zoom: 9,
    minZoom: 5,
    maxZoom: 14,
    // 天地图矢量底图 URL 模板（vec_w）
    tileUrlBase: "https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=",
    // 天地图标注层 URL 模板（cva_w）
    tileUrlLabel: "https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk="
};

// 雷达图像
const RADAR_CONFIG = {
    bounds: [
        [19.0419, 108.505], // 左下角 (down, left)
        [26.0419, 117.505]  // 右上角 (up, right)
    ],
    opacity: 0.6
};

// 卫星图像
const SATELLITE_CONFIG = {
    bounds: [
        [5.04528284072876, 136.96437072753906], // 左下角 (down, left)
        [53.0, 72.0]  // 右上角 (up, right)
    ],
    opacity: 1
};

// 图例
const LEGEND = {
    RADAR: [
        {
            "color": "rgb(153, 85, 201)",
            "text": "70"
        },
        {
            "color": "rgb(255, 0, 255)",
            "text": "65"
        },
        {
            "color": "rgb(101, 0, 0)",
            "text": "60"
        },
        {
            "color": "rgb(166, 0, 0)",
            "text": "55"
        },
        {
            "color": "rgb(255, 0, 0)",
            "text": "50"
        },
        {
            "color": "rgb(255, 144, 2)",
            "text": "45"
        },
        {
            "color": "rgb(231, 192, 0)",
            "text": "40"
        },
        {
            "color": "rgb(255, 255, 0)",
            "text": "35"
        },
        {
            "color": "rgb(0, 144, 0)",
            "text": "30"
        },
        {
            "color": "rgb(0, 200, 0)",
            "text": "25"
        },
        {
            "color": "rgb(0, 239, 0)",
            "text": "20"
        },
        {
            "color": "rgb(1, 0, 246)",
            "text": "15"
        },
        {
            "color": "rgb(1, 160, 246)",
            "text": "10"
        },
        {
            "color": "rgb(0, 236, 236)",
            "text": "5"
        },
        {
            "color": "rgba(0, 0, 0, 0)",
            "text": "0"
        }
    ],
    SATELLITE: [
        {
            "color": "rgb(176, 23, 31)",
            "text": "230"
        },
        {
            "color": "rgb(227, 23, 13)",
            "text": "225"
        },
        {
            "color": "rgb(255, 0, 0)",
            "text": "220"
        },
        {
            "color": "rgb(255, 153, 18)",
            "text": "215"
        },
        {
            "color": "rgb(227, 207, 87)",
            "text": "210"
        },
        {
            "color": "rgb(255, 255, 0)",
            "text": "205"
        },
        {
            "color": "rgb(56, 94, 15)",
            "text": "200"
        },
        {
            "color": "rgb(0, 255, 0)",
            "text": "195"
        },
        {
            "color": "rgb(30, 144, 255)",
            "text": "190"
        },
        {
            "color": "rgba(0, 0, 0, 0)",
            "text": "min"
        }
    ]
};

const LEGEND_UNIT = {
    RADAR: "dBZ",
    SATELLITE: "灰度值"
}

// 工具栏状态
const TOOLBAR_STATUS = {
    "TRACK": "track",
    "QUERY": "query",
    "CLEAN": "clean"
}

// 播放速度，1000代表每1000ms切换一张图片
const TIME_INTERVAL = 1000;

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
const RADAR_PRED_BASE_PATH = './static/data/radar/'
const RADAR_REAL_BASE_PATH = './static/data/radar/radar_color_png/'
const RAIN_PRED_BASE_PATH = './static/data/rain/rain/multi_rain_color_png/'
const RAIN_REAL_BASE_PATH = '.static/data/rain/rain/multi_rain_color_png/real_color_png/'
const RAIN_BASE_PATH = './static/data/rain/rain/multi_rain_color_png/'

// 菜单信息
// 注意每个MODELS数组长度在1-4之间，如果大于4则系统只读取前四个，少于1个系统会报错
const MENUS = [
    {
        "NAME": "气象雷达", // NAME用于前端展示
        "TOKEN": "RADAR", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/雷达.jpg",
        "ICON_URL": "./static/img/icon/雷达.svg",
        "INTERVAL": 6, // 雷达6分钟一次
        "SPANS_NUMBER": 10 + 30 , // 往前推1小时，往后推2小时
        "SPANS_ACTUAL_VALUE_NUMBER": 10
    },
    {
        "NAME": "卫星云图", // NAME用于前端展示
        "TOKEN": "SATELLITE", // TOKEN用于数据请求
        "IMAGE_URL": "./static/img/meteorology/clouds.jpg",
        "ICON_URL": "./static/img/icon/卫星.svg",
        "INTERVAL": 15, // 卫星6分钟一次
        "SPANS_NUMBER": 4 + 12, // 往前推2小时，往后推3小时，这样可以直接避免大概1小时延迟
        "SPANS_ACTUAL_VALUE_NUMBER": 4
    }
]
