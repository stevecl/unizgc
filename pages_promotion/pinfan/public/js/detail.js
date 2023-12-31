export default {
	data() {
		return {
			posterApi: '/pinfan/api/goods/poster',
			goodsRoute: '/pages_promotion/pinfan/detail',
			groupId: 0,
			pinfan_id: 0,
			pintuanList: [],
			currentPintuan: {
				headimg: '',
				timeMachine: {}
			},
			openPopup: false,
			timestamp: '',
			newList: [],
			pinfanPopShow: false,
			groupDetail: null,
			kill: 0,
		}
	},
	onLoad(data) {
		// #ifdef MP-ALIPAY
		let options = my.getLaunchOptionsSync();
		options.query && Object.assign(data, options.query)
		// #endif

		this.pinfan_id = data.pinfan_id || 0;
		if (data.id) {
			this.pinfan_id = data.id;
		}
		this.groupId = data.group_id || 0;

		// 小程序扫码进入
		if (data.scene) {
			var sceneParams = decodeURIComponent(data.scene);
			sceneParams = sceneParams.split('&');
			if (sceneParams.length) {
				sceneParams.forEach(item => {
					if (item.indexOf('id') != -1) this.pinfan_id = item.split('-')[1];
					if (item.indexOf('group_id') != -1) this.group_id = item.split('-')[1];
				});
			}
		}
	},
	async onShow() {
		await this.getGoodsSkuDetail();
		this.getPintuanGroupList();
		if (this.groupId > 0) this.getGroupDetail();
	},
	methods: {
		// 获取拼团商品详情
		async getGoodsSkuDetail() {
			let res = await this.$api.sendRequest({
				url: '/pinfan/api/goods/detail',
				async: false,
				data: {
					pintuan_id: this.pinfan_id
				}
			});
			let data = res.data;
			if (data.goods_sku_detail != null) {
				this.goodsSkuDetail = data.goods_sku_detail;
				this.skuId = this.goodsSkuDetail.sku_id;
				this.goodsSkuDetail.group_id = this.groupId;

				//拼团倒计时
				if ((this.goodsSkuDetail.end_time - res.timestamp) > 0) {
					this.goodsSkuDetail.timeMachine = this.$util.countDown(this.goodsSkuDetail.end_time - res
						.timestamp);
				} else {
					this.$util.showToast({
						title: "活动已结束",
					});
					setTimeout(() => {
						this.$util.redirectTo('/pages/goods/detail', {
							goods_id: this.goodsSkuDetail.goods_id
						}, 'redirectTo');
					}, 1000);
				}

				// 分享参数、链接
				this.shareQuery = 'pinfan_id=' + this.pinfan_id + '&group_id=' + this.groupId;
				this.shareUrl = this.goodsRoute + '?' + this.shareQuery;

				// 在线客服聊天参数
				this.chatRoomParams = {
					sku_id: this.goodsSkuDetail.sku_id,
					type: 'pintuan',
					type_id: this.goodsSkuDetail.pinfan_id
				};

				// 海报参数
				this.posterParams = {
					id: this.goodsSkuDetail.id
				};

				// 处理商品数据
				this.handleGoodsSkuData();

				this.goodsSkuDetail.show_price = (this.goodsSkuDetail.group_id == 0 ? this.goodsSkuDetail
					.promotion_price : this.goodsSkuDetail.pintuan_price);
				this.goodsSkuDetail.save_price = (this.goodsSkuDetail.price - this.goodsSkuDetail.show_price) > 0 ?
					(this.goodsSkuDetail
						.price - this.goodsSkuDetail.show_price).toFixed(2) : 0;

				if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
			} else {
				this.$util.redirectTo('/pages_tool/goods/not_exist', {}, 'redirectTo');
			}
		},
		// 发起拼团
		pintuan(isPromotion = true, group_id = 0) {
			if (!uni.getStorageSync('token')) {
				if (!this.source_member) {
					this.$refs.login.open(this.shareUrl);
				} else {
					this.$refs.login.open(this.shareUrl + '&source_member=' + this.source_member);
				}
				return;
			}

			if (isPromotion) {
				this.resetPrice();
				this.goodsSkuDetail.group_id = 0;
			} else if (group_id) {
				this.goodsSkuDetail.group_id = group_id;
			} else {
				this.goodsSkuDetail.group_id = this.groupId;
			}
			this.$refs.goodsSku.show("pinfan", () => {
				this.resetPrice();
				this.getCartCount();
			});
		},
		// 立即购买
		buyNow() {
			if (!uni.getStorageSync('token')) {
				if (!this.source_member) {
					this.$refs.login.open(this.shareUrl);
				} else {
					this.$refs.login.open(this.shareUrl + '&source_member=' + this.source_member);
				}
				return;
			}
			this.$refs.goodsSku.show("buy_now", () => {
				this.getCartCount();
			});
		},
		// 获取拼团组列表
		getPintuanGroupList() {
			this.$api.sendRequest({
				url: "/pinfan/api/pinfangroup/lists",
				data: {
					goods_id: this.goodsSkuDetail.goods_id
				},
				success: res => {
					let data = res.data;
					this.timestamp = res.timestamp
					if (data != null && data.length) {
						this.pintuanList = data;
						for (let i = 0; i < this.pintuanList.length; i++) {
							if (this.pintuanList[i]['end_time'] > res.timestamp) {
								this.pintuanList[i].timeMachine = this.$util.countDown(this.pintuanList[i][
									'end_time'
								] - res.timestamp);
								this.pintuanList[i].currentTime = res.timestamp;
							} else {
								this.pintuanList[i].timeMachine = null;
							}
						}
						this.newList = this.pintuanList.filter(item => {
							return item.end_time > res.timestamp;
						});
						this.$forceUpdate();
					}
				}
			});
		},
		// 初始化渲染数据
		getGroupDetail() {
			this.$api.sendRequest({
				url: '/pinfan/api/pinfangroup/info',
				data: {
					group_id: this.groupId
				},
				success: res => {
					this.kill = res.data.pintuan_num - res.data.pintuan_count;
					if (res.code == 0) {
						if (res.data.end_time > res.timestamp) {
							res.data.timeMachine = this.$util.countDown(res.data.end_time - res.timestamp);
						} else {
							res.data.timeMachine = null;
						}
						this.groupDetail = res.data;
						this.pinfanPopShow = true;
						if (this.groupDetail && this.groupDetail.status != 2) {
							this.groupId = 0;
							this.goodsSkuDetail.group_id = 0;
							this.resetPrice();
						}
					}
					this.$forceUpdate();
				}
			});
		},
		//打开拼团弹出框
		openPinTuan(groupId, pintuan_num, time, headimg, head_id) {
			if (this.memberId == head_id) {
				this.$util.showToast({
					title: "您不能参与自己的团"
				});
				return;
			}
			this.openPopup = true;
			this.currentPintuan = {
				groupId: groupId,
				pintuan_num: pintuan_num,
				timeMachine: this.$util.countDown(time),
				headimg: headimg
			};
			this.$refs.pintuanPopup.open(() => {
				this.goodsSkuDetail.group_id = 0;
				this.openPopup = false;
			});
		},
		closePinTuanPopup() {
			this.$refs.pintuanPopup.close();
		},
		//参与拼团
		joinPintuan() {
			this.closePinTuanPopup();
			this.goodsSkuDetail.group_id = this.currentPintuan.groupId;
			this.goodsSkuDetail.show_price = this.goodsSkuDetail.pintuan_price;
			this.goodsSkuDetail.save_price = (this.goodsSkuDetail.price - this.goodsSkuDetail.show_price) > 0 ? (this
				.goodsSkuDetail
				.price - this.goodsSkuDetail.show_price).toFixed(2) : 0;
			this.$forceUpdate();
			this.pintuan(false, this.currentPintuan.groupId);
		},
		pintuanImageError(index) {
			this.pintuanList[index].headimg = this.$util.getDefaultImage().head;
			this.$forceUpdate();
		},
		// 重置价格
		resetPrice() {
			// this.goodsSkuDetail.group_id = 0;
			// this.goodsSkuDetail.show_price = this.goodsSkuDetail.promotion_price;
			this.goodsSkuDetail.show_price = (this.goodsSkuDetail.group_id == 0 ? this.goodsSkuDetail
				.promotion_price : this.goodsSkuDetail.pintuan_price);

			this.goodsSkuDetail.save_price = (this.goodsSkuDetail.price - this.goodsSkuDetail.show_price) > 0 ? (this
				.goodsSkuDetail
				.price - this.goodsSkuDetail.show_price).toFixed(2) : 0;
			this.$forceUpdate();
		},
		cutStrByte(str, len) {
			if (!str || !len) {
				//校验参数
				return '';
			}
			let code = '1', // 默认返回code值，已截断
				strLen = str.length, // 原字符串长度
				cutStr;
			if (strLen <= len / 2) {
				//如果字符串长度小于截取长度的一半,则返回全部字符串
				cutStr = str;
				code = '0';
			} else {
				let strByteCount = 0; //遍历字符串
				for (let i = 0; i < strLen; i++) {
					strByteCount += this.getByteLen(str.charAt(i)); //中文字符字节加2  否则加1
					if (strByteCount > len) {
						//i从0开始 截断时大于len 只截断到第i个
						cutStr = str.substring(0, i);
						break;
					} else if (strByteCount == len) {
						cutStr = str.substring(0, i + 1);
						break;
					}
				}
			}
			if (!cutStr) {
				//cutstr为空，没有截断字符串
				cutStr = str;
				code = '0';
			}
			return cutStr;
		},
		getByteLen(val) {
			//获取字节长度，全角字符两个单位长度，半角字符1个单位长度
			let len = 0;
			if (!val) {
				return len;
			}
			for (let i = 0; i < val.length; i++) {
				if (!val[i]) {
					continue;
				}
				// 全角
				if (val[i].match(/[^\x00-\xff]/gi) != null) {
					len += 2;
				} else {
					len += 1;
				}
			}
			return len;
		},
	}
}