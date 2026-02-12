/**
 * VideoImageSync 类：实现视频进度与图片的精准联动切换
 * 功能：播放/拖动视频时，自动切换对应时间点的指定图片组
 */
class VideoImageSync {
    /**
     * 构造函数：初始化配置和DOM元素
     * @param {Object} options 配置项
     * @param {string} options.videoId 视频元素ID
     * @param {Array<string>} options.imageIds 图片容器ID列表
     * @param {Array<Object>} options.switchConfigs 切换配置 [{time: 数字, images: ['图片路径1', ...]}]
     * @param {number} [options.animationDuration=500] 图片切换动画时长(ms)
     */
    constructor(options) {
        // 必传参数校验
        this._validateOptions(options);

        // 合并默认配置
        this.config = {
            videoId: options.videoId,
            imageIds: options.imageIds,
            switchConfigs: [...options.switchConfigs].sort((a, b) => a.time - b.time), // 按时间升序排序
            animationDuration: options.animationDuration || 500
        };

        // 核心状态管理
        this.video = null;          // 视频DOM元素
        this.imgElements = [];      // 图片DOM元素列表
        this.currentConfigIndex = 0;// 当前激活的配置索引

        // 初始化流程
        this._initDOM();
        this._bindEvents();
        this._updateImages();       // 初始化显示默认图片
    }

    /**
     * 私有方法：校验配置项合法性
     * @param {Object} options 传入的配置项
     */
    _validateOptions(options) {
        if (!options) {
            throw new Error('初始化失败：未传入任何配置项！');
        }
        if (!options.videoId || typeof options.videoId !== 'string') {
            throw new Error('初始化失败：videoId必须是有效的字符串！');
        }
        if (!options.imageIds || !Array.isArray(options.imageIds) || options.imageIds.length === 0) {
            throw new Error('初始化失败：imageIds必须是非空的数组！');
        }
        if (!options.switchConfigs || !Array.isArray(options.switchConfigs) || options.switchConfigs.length === 0) {
            throw new Error('初始化失败：switchConfigs必须是非空的数组！');
        }
        // 校验switchConfigs格式
        options.switchConfigs.forEach((item, index) => {
            if (typeof item.time !== 'number' || item.time < 0) {
                throw new Error(`初始化失败：switchConfigs[${index}].time必须是大于等于0的数字！`);
            }
            if (!item.images || !Array.isArray(item.images) || item.images.length !== options.imageIds.length) {
                throw new Error(`初始化失败：switchConfigs[${index}].images必须是与imageIds长度一致的数组！`);
            }
        });
    }

    /**
     * 私有方法：初始化DOM元素
     */
    _initDOM() {
        // 获取视频元素
        this.video = document.getElementById(this.config.videoId);
        if (!this.video) {
            throw new Error(`初始化失败：未找到ID为"${this.config.videoId}"的视频元素！`);
        }

        // 获取图片元素
        this.imgElements = this.config.imageIds.map((id, index) => {
            const container = document.getElementById(id);
            if (!container) {
                throw new Error(`初始化失败：未找到ID为"${id}"的图片容器（索引：${index}）！`);
            }
            const img = container.querySelector('img');
            if (!img) {
                throw new Error(`初始化失败：ID为"${id}"的容器中未找到img元素（索引：${index}）！`);
            }
            return img;
        });
    }

    /**
     * 私有方法：绑定视频事件
     */
    _bindEvents() {
        // 视频进度变化（播放时实时触发）
        this.video.addEventListener('timeupdate', () => this._updateImages());
        // 进度条拖动完成（手动调整进度后触发）
        this.video.addEventListener('seeked', () => this._updateImages());
        // 防止事件重复绑定
        this._bindEvents = () => {};
    }

    /**
     * 私有方法：根据当前视频时间匹配对应的图片配置
     * @returns {Object} {config: 匹配的配置项, index: 配置项索引}
     */
    _getMatchedConfig() {
        const currentTime = this.video.currentTime;
        // 从后往前找第一个时间≤当前播放时间的配置（精准匹配）
        for (let i = this.config.switchConfigs.length - 1; i >= 0; i--) {
            if (currentTime >= this.config.switchConfigs[i].time) {
                return { config: this.config.switchConfigs[i], index: i };
            }
        }
        // 默认返回第一个配置
        return { config: this.config.switchConfigs[0], index: 0 };
    }

    /**
     * 私有方法：切换图片组（带淡入淡出动画）
     * @param {Array<string>} targetImages 目标图片路径列表
     */
    _switchImages(targetImages) {
        // 淡出当前图片
        this.imgElements.forEach(img => img.classList.add('fade-out'));

        // 动画完成后更新图片并淡入
        setTimeout(() => {
            this.imgElements.forEach((img, i) => {
                img.src = targetImages[i];
                img.classList.remove('fade-out');
            });
        }, this.config.animationDuration);
    }

    /**
     * 私有方法：更新图片（核心逻辑）
     */
    _updateImages() {
        const { config, index } = this._getMatchedConfig();
        // 仅当配置索引变化时才切换图片（避免重复操作）
        if (index !== this.currentConfigIndex) {
            this._switchImages(config.images);
            this.currentConfigIndex = index;
        }
    }

    /**
     * 公有方法：手动更新切换配置（支持运行时修改）
     * @param {Array<Object>} newConfigs 新的切换配置
     */
    updateConfigs(newConfigs) {
        // 复用参数校验逻辑
        this._validateOptions({
            videoId: this.config.videoId,
            imageIds: this.config.imageIds,
            switchConfigs: newConfigs
        });
        // 更新配置并重新排序
        this.config.switchConfigs = [...newConfigs].sort((a, b) => a.time - b.time);
        this.currentConfigIndex = 0;
        this._updateImages();
        console.log('切换配置已更新！');
    }

    /**
     * 公有方法：获取当前视频绑定的配置信息
     * @returns {Object} 当前配置
     */
    getCurrentConfig() {
        return { ...this.config };
    }
}

// 暴露到全局作用域，方便页面调用
window.VideoImageSync = VideoImageSync;