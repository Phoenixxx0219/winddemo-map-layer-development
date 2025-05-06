let CardrItems = document.querySelectorAll('.card-r'); // 选取页面上所有 class 为 .card-r 的元素，返回一个 NodeList
for (var i = 0; i < CardrItems.length; i++) {           // 遍历每一个卡片元素
    CardrItems[i].addEventListener('click', function () { // 为当前卡片绑定点击事件
        if (!this.classList.contains('card-r--active')) { // 如果当前卡片未激活，则执行以下逻辑
            // 根据 data-background 属性值修改页面背景色（例如 data-background="ff0000" -> "#ff0000"）
            document.body.style.backgroundColor = `#${this.getAttribute('data-background')}`;

            // 如果已有其他激活卡片，则先取消其激活状态并添加动画类
            if (document.querySelector('.card-r--active')) {
                let card_r_active = document.querySelector('.card-r--active'); // 找到已有激活的卡片
                card_r_active.classList.remove('card-r--active');            // 移除激活状态
                card_r_active.classList.add('card-r--animate');              // 添加动画类（用于离场动画）
            }

            this.classList.add('card-r--active');   // 标记当前卡片为激活状态
            this.classList.add('card-r--animate');  // 添加动画类（用于入场或强调动画）
            console.log('变更');                    // 在控制台输出调试信息，表示已切换
        }
    });
}
