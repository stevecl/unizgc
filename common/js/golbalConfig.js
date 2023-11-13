export default {
	data() {
		return {
			// 页面样式，动态设置主色调
			themeColor: '' //''--base-color:#fa5d14;--base-help-color:#ff7e00;'
		}
	},
	onLoad() {},
	onShow() {
		// 刷新多语言
		this.$langConfig.refresh();
		let time = setInterval(() => {
			let theme = uni.getStorageSync('theme_style');
			if (theme.main_color) {
				this.themeColorSet()
				clearInterval(time);
			}
		}, 50);
	},
	computed: {
		themeStyle() {
			return uni.getStorageSync('theme_style');
		},
		//插件是否存在
		addonIsExist() {
			return uni.getStorageSync('addon_is_exist');
		},
		tabBarList() {
			// return uni.getStorageSync('bottomNav');
			return this.$store.state.tabBarList;
		},
		siteInfo() {
			return uni.getStorageSync('siteInfo');
			// return this.$store.state.siteInfo;
		},
		storeToken() {
			return this.$store.state.token;
		},
		bottomNavHidden() {
			return this.$store.state.bottomNavHidden;
			// return uni.getStorageSync('bottomNavHidden');
		},
		globalStoreConfig() {
			return this.$store.state.globalStoreConfig;
		},
		globalStoreInfo() {
			return this.$store.state.globalStoreInfo;
		},
		// 定位信息
		location() {
			return this.$store.state.location;
		},
		// 默认总店（定位失败后使用）
		defaultStoreInfo() {
			return uni.getStorageSync('default_store_info');
		},
		// 组件刷新计数
		componentRefresh() {
			return this.$store.state.componentRefresh;
		},
		// 客服配置
		servicerConfig() {
			return uni.getStorageSync('servicer_config');
		},
		diySeckillInterval() {
			return this.$store.state.diySeckillInterval;
		},
		tabBarHeight() {
			return this.$store.state.tabBarHeight;
		},
		mapConfig() {
			return uni.getStorageSync('map_config');
		}
	},
	methods: {
		themeColorSet() {
			let theme = uni.getStorageSync('theme_style');
			this.themeColor =
				`--base-color:${theme.main_color};--base-help-color:${theme.aux_color};`;
			if (this.tabBarHeight != '0px') this.themeColor += `--tab-bar-height:${this.tabBarHeight};`
			Object.keys(theme).forEach(key => {
				let data = theme[key];
				if (typeof(data) == "object") {
					Object.keys(data).forEach(k => {
						this.themeColor += '--' + k.replace(/_/g, "-") + ':' + data[k] + ';';
					});
				} else if (typeof(key) == "string" && key) {
					this.themeColor += '--' + key.replace(/_/g, "-") + ':' + data + ';';
				}
			});
			for (let i = 9; i >= 5; i--) {
				let color = this.$util.colourBlend(theme.main_color, '#ffffff', (i / 10));
				this.themeColor += `--base-color-light-${i}:${color};`;
			}
		},
		// 颜色变浅（>0）、变深函数（<0）
		lightenDarkenColor(color, amount) {

			var usePound = false;

			if (color[0] == "#") {
				color = color.slice(1);
				usePound = true;
			}

			var num = parseInt(color, 16);

			var r = (num >> 16) + amount;

			if (r > 255) r = 255;
			else if (r < 0) r = 0;

			var b = ((num >> 8) & 0x00FF) + amount;

			if (b > 255) b = 255;
			else if (b < 0) b = 0;

			var g = (num & 0x0000FF) + amount;

			if (g > 255) g = 255;
			else if (g < 0) g = 0;

			return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);

		},
		/**
		 * 切换门店
		 * @param {Object} info 门店信息
		 * @param {Object} isJump 是否跳转到首页
		 */
		changeStore(info, isJump) {
			if (info) {
				this.$store.commit('setGlobalStoreInfo', info);
			}
			this.$store.dispatch('getCartNumber'); //重新获取购物车数据
			let route = this.$util.getCurrRoute();
			if (isJump && route != 'pages/index/index') {
				uni.setStorageSync('manual_change_store', true); // 手动切换门店
				this.$util.redirectTo('/pages/index/index');
			}

		}
	},
	filters: {
		/**
		 * 金额格式化输出
		 * @param {Object} money
		 */
		moneyFormat(money) {
			if (isNaN(parseFloat(money))) return money;
			return parseFloat(money).toFixed(2);
		}
	}
}