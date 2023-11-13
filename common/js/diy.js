import WxMap from 'common/js/map-wx-jssdk.js';
import Config from '@/common/js/config.js';

let systemInfo = uni.getSystemInfoSync();
export default {
	data() {
		return {
			diyData: {
				global: {
					title: '',
					popWindow: {
						imageUrl: '',
						count: -1,
						link: {},
						imgWidth: '',
						imgHeight: ''
					}
				}
			},
			memberId: 0,

			id: 0,
			name: '',

			topIndexValue: null,
			statusBarHeight: systemInfo.statusBarHeight,
			collectTop: 44,
			showTip: false,
			mpCollect: false,
			mpShareData: null, //小程序分享数据
			scrollTop: 0, // 滚动位置
			paddingTop: (44 + systemInfo.statusBarHeight) + 'px',
			marginTop: -(44 + systemInfo.statusBarHeight) + 'px',
			followOfficialAccount: null, // 关注公众号组件

			latitude: null, // 纬度
			longitude: null, // 经度
			currentPosition: '', // 当前位置
			nearestStore: null, // 离自己最近的门店

			storeTimeOut: null, // 没有获取到定位，则获取默认门店
			locationModule: '', // 模式，locationPicker H5选择地图

			diyRoute: '', // 页面路由
			openBottomNav: false

		};
	},
	onLoad(option) {
		uni.hideTabBar();

		if (option.source_member) uni.setStorageSync('source_member', option.source_member);

		// 小程序扫码进入
		if (option.scene) {
			var sceneParams = decodeURIComponent(option.scene);
			sceneParams = sceneParams.split('&');
			if (sceneParams.length) {
				sceneParams.forEach(item => {
					if (item.indexOf('m') != -1) uni.setStorageSync('source_member', item.split('-')[1]);
				});
			}
		}

		// #ifdef H5
		// H5地图选择位置回调数据
		if (option.module && option.module == 'locationPicker') {
			option.name = ''; // 清空地址
			this.locationModule = option.module;
			this.latitude = option.latng.split(',')[0];
			this.longitude = option.latng.split(',')[1];
		}
		// #endif

		this.id = option.id || 0;
		this.name = option.name || '';

		uni.removeStorageSync('manual_store_info'); // 清除手动切换门店缓存
		uni.removeStorageSync('manual_change_store'); // 清楚手动切换门店标识

		// H5才会执行
		if (this.locationModule == 'locationPicker') {

			// H5地图选址后的回调
			this.getNearestStore();
			this.getCurrentLocation();

		} else if (this.mapConfig.wap_is_open == 1) {

			// 每次都要定位，获取当前位置
			this.$util.getLocation({
				fail: (res) => {
					// 拒绝定位，进入默认总店
					this.enterDefaultStore();
				}
			});

			// 如果3秒没有获取到定位，则获取默认门店，H5使用
			// #ifdef H5
			this.storeTimeOut = setTimeout(() => {
				this.enterDefaultStore();
			}, 1000 * 3);
			// #endif

		} else {
			// 关闭定位
			this.enterDefaultStore();
		}
	},
	onShow() {
		this.init();
	},
	onHide() {
		if (this.storeTimeOut) {
			clearTimeout(this.storeTimeOut);
		}

		// 跳转页面要关闭门店弹出框
		this.closeChooseStorePopup();

		// 清除限时秒杀定时器
		this.$store.commit('setDiySeckillInterval', null);
	},
	computed: {
		bgColor() {
			let str = '';
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.pageBgColor;
			}
			return str;
		},
		bgImg() {
			let str = '';
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.topNavBg ? 'url(' + this.$util.img(this.diyData.global.bgUrl) + ')' : this
					.diyData.global.pageBgColor;
			}
			return str;
		},
		bgUrl() {
			let str = '';
			if (this.diyData && this.diyData.global) {
				str = this.diyData.global.topNavBg ? 'transparent' : this.diyData.global.bgUrl;
			}
			return str;
		},
		backgroundUrl() {
			var str = this.diyData.global.bgUrl && this.diyData.global.bgUrl != 'transparent' ? 'url(' + this.$util.img(
				this.diyData.global.bgUrl) + ') ' : '';
			return str;
		},
		textNavColor() {
			if (this.diyData && this.diyData.global && this.diyData.global.textNavColor) {
				return this.diyData.global.textNavColor;
			} else {
				return '#ffffff';
			}
		},
		//计算首页弹框的显示宽高
		popWindowStyle() {
			// 做大展示宽高
			let max_width = 290;
			let max_height = 410;
			// 参照宽高
			let refer_width = 290;
			let refer_height = 290;

			let scale = this.diyData.global.popWindow.imgHeight / this.diyData.global.popWindow.imgWidth;
			let width, height;
			if (scale < refer_height / refer_width) {
				width = max_width;
				height = width * scale;
			} else {
				height = max_height;
				width = height / scale;
			}

			let obj = '';
			if (this.diyData.global.popWindow && this.diyData.global.popWindow.count != -1 && this.diyData.global
				.popWindow.imageUrl) {
				obj += 'height:' + (height * 2) + 'rpx;';
				obj += 'width:' + (width * 2) + 'rpx;';
			}
			return obj;
		},
		componentsState() {
			let componentNames = [],
				count = 0,
				correctCount = 0;
			if (this.diyData.value) {
				componentNames = this.diyData.value.map((item) => {
					return item.componentName;
				})
			}
			let componentsState = this.$store.state.componentsLoad;

			componentNames.forEach((item, index) => {
				if (typeof componentsState[item] === "boolean") count++;
				if (componentsState[item]) correctCount++;
			});

			if (!this.diyData.value || !this.$refs.loadingCover) return false;
			if (!count) {
				setTimeout(() => {
					this.$refs.loadingCover.hide();
					this.getHeight();
					if (this.diyData && this.diyData.global) {
						this.openBottomNav = this.diyData.global.openBottomNav;
					}
				}, 150);
				return false;
			}
			if (count == correctCount) {
				this.$refs.loadingCover.hide();
				this.getHeight();
				if (this.diyData && this.diyData.global) {
					this.openBottomNav = this.diyData.global.openBottomNav;
				}
			}
		}
	},
	watch: {
		location: function(nVal) {
			if (nVal) {
				this.latitude = nVal.latitude;
				this.longitude = nVal.longitude;
				this.getNearestStore();
				this.getCurrentLocation();
			}
		},
		componentsState: function(nVal) {}
	},
	methods: {
		async init() {
			if (uni.getStorageSync('token')) {
				this.$util.getMemberId().then(resolve => {
					this.memberId = resolve;
				});
				this.$store.dispatch('getCartNumber');
			}

			await this.getDiyInfo();

			this.$store.commit('setDiySeckillInterval', 1);

			//记录分享关系
			if (uni.getStorageSync('token') && uni.getStorageSync('source_member')) {
				this.$util.onSourceMember(uni.getStorageSync('source_member'));
			}

			//小程序分享
			// #ifdef MP-WEIXIN
			this.$util.getMpShare().then(res => {
				this.mpShareData = res;
			});
			// #endif

			let manualChangeStore = uni.getStorageSync('manual_change_store'); // 手动切换门店
			if (manualChangeStore) {
				uni.removeStorageSync('manual_change_store');

				// 滚动至顶部
				uni.pageScrollTo({
					duration: 200,
					scrollTop: 0
				});
			}
		},
		callback() {
			if (this.$refs.indexPage) {
				this.$refs.indexPage.initPageIndex();
			}
		},
		//计算高度
		getHeight() {
			// #ifdef H5
			if (this.diyData && this.diyData.global && this.diyData.global.navBarSwitch) {
				// H5端，导航栏样式1 2 3不显示，要减去高度
				if ([1, 2, 3].indexOf(parseInt(this.diyData.global.navStyle)) != -1) {
					this.paddingTop = 0;
					this.marginTop = 0;
				}
			}
			// #endif

			// #ifdef MP || APP-PLUS
			let time = setInterval(() => {
				this.$nextTick(() => {
					const query = uni.createSelectorQuery().in(this);
					query.select('.page-header').boundingClientRect(data => {
						if (data && data.height) {
							// 从状态栏高度开始算
							this.paddingTop = data.height + 'px';
							this.marginTop = -data.height + 'px';
							clearInterval(time);
						}
					}).exec();
				});
			}, 50);
			// #endif
		},
		async getDiyInfo() {
			let res = await this.$api.sendRequest({
				url: '/api/diyview/info',
				data: {
					id: this.id,
					name: this.name
				},
				async: false
			});
			if (res.code != 0 || !res.data) {
				if (this.$refs.loadingCover) this.$refs.loadingCover.hide();

				if (res.code == -3) {
					this.$util.showToast({
						title: res.message
					});
					this.diyData = {};
					return;
				}

				this.$util.showToast({
					title: '未配置自定义页面数据'
				});
				this.diyData = {};
				return;
			}

			let diyDataValue = res.data;
			if (diyDataValue.value) {
				this.diyData = JSON.parse(diyDataValue.value);
				this.$langConfig.title(this.diyData.global.title);
				this.mpCollect = this.diyData.global.mpCollect;
				this.setPublicShare();
				if (this.diyData.global.popWindow && this.diyData.global.popWindow.imageUrl) {
					// 弹框形式，首次弹出 1，每次弹出 0
					setTimeout(() => {
						if (this.diyData.global.popWindow.count == 1) {
							var popwindow_count = uni.getStorageSync(this.id + this.name +
								'_popwindow_count');
							if ((this.$refs.uniPopupWindow && popwindow_count == '') || (
									this.$refs.uniPopupWindow && popwindow_count == 1)) {
								this.$refs.uniPopupWindow.open();
								uni.setStorageSync(this.id + this.name + '_popwindow_count', 1);
							}
						} else if (this.diyData.global.popWindow.count == 0) {
							this.$refs.uniPopupWindow.open();
							uni.setStorageSync(this.id + this.name + '_popwindow_count', 0);
						}
					}, 500);
				}

				// 修改diy数据结构排序
				let searchIndex = -1;
				let topCategoryIndex = -1;
				this.diyData.value.forEach((item, index) => {
					if (item.componentName == 'Search') {
						if (item.positionWay == 'fixed') {
							searchIndex = index;
						}
					}
					if (item.componentName == 'TopCategory') {
						topCategoryIndex = index;
					}
				})
				if (searchIndex != -1 && topCategoryIndex != -1) {
					let searchData = this.diyData.value.slice(searchIndex, searchIndex + 1);
					let topCategoryData = this.diyData.value.slice(topCategoryIndex, topCategoryIndex + 1);
					this.diyData.value.splice(searchIndex, 1);
					if (searchIndex > topCategoryIndex) {
						this.diyData.value.splice(topCategoryIndex, 1);
						this.diyData.value.splice(0, 0, ...topCategoryData);
						this.diyData.value.splice(1, 0, ...searchData);
					} else
						this.diyData.value.splice(0, 0, ...searchData);
				} else if (searchIndex != -1 && topCategoryIndex == -1) {
					let searchData = this.diyData.value.slice(searchIndex, searchIndex + 1);
					this.diyData.value.splice(searchIndex, 1);
					this.diyData.value.splice(0, 0, ...searchData);
				}

				for (var i = 0; i < this.diyData.value.length; i++) {
					// 分类导航组件
					if (this.diyData.value[i].componentName == 'TopCategory') {
						this.topIndexValue = this.diyData.value[i];
						this.topIndexValue.moduleIndex = i; //设置定位索引，根据此来确定定位顺序
						this.diyData.value.splice(i, 1);
						continue;
					}

					// 关注公众号组件
					if (this.diyData.value[i].componentName == 'FollowOfficialAccount') {
						this.followOfficialAccount = this.diyData.value[i];
						// #ifdef H5
						this.diyData.value.splice(i, 1);
						// #endif
						continue;
					}

				}

				// #ifdef MP
				//小程序收藏
				if (!uni.getStorageSync('isCollect') && this.diyData.global.mpCollect) {
					this.$refs.collectPopupWindow.open();
					this.showTip = true;
				}
				// #endif
			}
		},
		closePopupWindow() {
			this.$refs.uniPopupWindow.close();
			uni.setStorageSync(this.id + this.name + '_popwindow_count', -1);
		},
		closeCollectPopupWindow() {
			this.$refs.collectPopupWindow.close();
			uni.setStorageSync('isCollect', true);
		},
		uniPopupWindowFn() {
			this.$util.diyRedirectTo(this.diyData.global.popWindow.link);
			this.closePopupWindow();
		},
		openChooseStorePopup() {
			if (this.globalStoreConfig && this.globalStoreConfig.confirm_popup_control == 1) {

				let defaultStoreInfo = uni.getStorageSync('default_store_info');
				let storeInfo = uni.getStorageSync('store_info');

				// 首次进入门店，没有门店信息 || 当前位置的门店和缓存门店不一致要弹框，则弹框
				if (!storeInfo || storeInfo && this.nearestStore && storeInfo.store_id != this.nearestStore
					.store_id) {
					if (this.$refs.chooseStorePopup) this.$refs.chooseStorePopup.open();
				}
			}

			let manualStoreInfo = uni.getStorageSync('manual_store_info'); // 手动选择门店
			if (manualStoreInfo) {
				this.nearestStore = manualStoreInfo;
			}
			this.changeStore(this.nearestStore); // 切换门店数据
		},
		closeChooseStorePopup() {
			if (this.$refs.chooseStorePopup) this.$refs.chooseStorePopup.close();
		},
		// 确认进入门店
		enterStore() {
			this.closeChooseStorePopup();
		},
		// 选择其他门店
		chooseOtherStore() {
			this.$util.redirectTo('/pages_tool/store/list');
			this.closeChooseStorePopup();
		},
		// 打开地图重新选择位置
		reposition() {
			// #ifdef MP
			uni.chooseLocation({
				success: res => {
					this.latitude = res.latitude;
					this.longitude = res.longitude;
					this.currentPosition = res.name;
					this.getNearestStore();
					this.getCurrentLocation();
				},
				fail(res) {
					uni.getSetting({
						success: function(res) {
							var statu = res.authSetting;
							if (!statu['scope.userLocation']) {
								uni.showModal({
									title: '是否授权当前位置',
									content: '需要获取您的地理位置，请确认授权，否则地图功能将无法使用',
									success(tip) {
										if (tip.confirm) {
											uni.openSetting({
												success: function(data) {
													if (data.authSetting[
															'scope.userLocation'
														] === true) {
														this.$util.showToast({
															title: '授权成功'
														});
														//授权成功之后，再调用chooseLocation选择地方
														setTimeout(function() {
															uni.chooseLocation({
																success: data => {
																	this.latitude =
																		res
																		.latitude;
																	this.longitude =
																		res
																		.longitude;
																	this.currentPosition =
																		res
																		.name;
																	this
																		.getNearestStore();
																	this
																		.getLocation();
																}
															});
														}, 1000);
													}
												}
											});
										} else {
											this.$util.showToast({
												title: '授权失败'
											});
										}
									}
								});
							}
						}
					});
				}
			});
			// #endif

			// #ifdef H5
			let backurl = Config.h5Domain; // 地图选择位置后的回调页面路径
			window.location.href = 'https://apis.map.qq.com/tools/locpicker?search=1&type=0&backurl=' +
				encodeURIComponent(backurl) + '&key=' + Config.mpKey + '&referer=myapp';
			// #endif
		},
		// 获取离自己最近的一个门店
		getNearestStore() {
			let data = {};
			if (this.latitude && this.longitude) {
				data.latitude = this.latitude;
				data.longitude = this.longitude;
			}
			this.$api.sendRequest({
				url: '/api/store/nearestStore',
				data: data,
				success: res => {
					if (res.code == 0 && res.data) {
						this.nearestStore = res.data;
						this.nearestStore.show_address = this.nearestStore.full_address.replace(/,/g, ' ') +
							' ' + this.nearestStore.address;
						this.openChooseStorePopup();
					}
				}
			});
		},
		// 根据经纬度获取位置
		getCurrentLocation() {
			var _this = this;
			let data = {};
			if (this.latitude && this.longitude) {
				data.latitude = this.latitude;
				data.longitude = this.longitude;
			}

			this.$api.sendRequest({
				url: '/api/store/getLocation',
				data: data,
				success: res => {
					if (res.code == 0 && res.data) {
						this.currentPosition = res.data.formatted_addresses
							.recommend; // 结合知名地点形成的描述性地址，更具人性化特点
					} else {
						this.currentPosition = '未获取到定位';
						// this.$util.showToast({
						// 	title: res.message
						// });
					}
				}
			});
		},
		// 定位失败，进入默认门店
		enterDefaultStore() {
			if (uni.getStorageSync('default_store_info')) {
				if (!this.nearestStore) {
					this.nearestStore = uni.getStorageSync('default_store_info');
					this.nearestStore.show_address = this.nearestStore.full_address.replace(
							/,/g, ' ') +
						' ' + this.nearestStore.address;
				}
				if (this.currentPosition == '') this.currentPosition = '未获取到定位';
				this.openChooseStorePopup();
			}
		},
		// 设置公众号分享
		setPublicShare() {
			let shareUrl = this.$config.h5Domain + this.diyRoute;
			if (this.id) shareUrl += '?id=' + this.id;
			else if (this.name) shareUrl += '?name=' + this.name;
			this.$util.setPublicShare({
				title: this.diyData.global.title,
				desc: '',
				link: shareUrl,
				imgUrl: this.$store.state.siteInfo ? this.$util.img(this.$store.state.siteInfo.logo_square) : ''
			});
		}
	},
	onPageScroll(e) {
		this.scrollTop = e.scrollTop;
		if (this.$refs.topNav) {
			if (e.scrollTop >= 20) {
				this.$refs.topNav.navTopBg();
			} else {
				this.$refs.topNav.unSetnavTopBg();
			}
		}
	},
	// 下拉刷新
	onPullDownRefresh() {
		this.$store.commit('setComponentRefresh');
		setTimeout(() => {
			uni.stopPullDownRefresh();
		}, 50);
	},
	// 分享给好友
	onShareAppMessage() {
		return this.mpShareData.appMessage;
	},
	// 分享到朋友圈
	onShareTimeline() {
		return this.mpShareData.timeLine;
	}
}