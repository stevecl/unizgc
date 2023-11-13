import htmlParser from '@/common/js/html-parser';
export default {
	options: {
		styleIsolation: 'shared'
	},
	data() {
		return {
			outTradeNo: '',
			isIphoneX: false,
			orderCreateData: {
				is_balance: 0,
				is_point: 1,
				is_invoice: 0, // 是否需要发票 0 无发票  1 有发票
				invoice_type: 0, // 发票类型  1 纸质 2 电子
				invoice_title_type: 1, // 抬头类型  1 个人 2 企业
				is_tax_invoice: 0, // 是否需要增值税专用发票  0 不需要 1 需要
				coupon: {
					coupon_id: 0
				},
				delivery: {},
				member_goods_card: {} // 会员次卡
			},
			paymentData: null,
			calculateData: null,
			tempData: null,
			storeId: 0,
			deliveryTime: '', // 提货时间
			memberAddress: null, // 会员收货地址
			localMemberAddress: null, // 会员本地配送收货地址
			isRepeat: false,
			promotionInfo: null,
			transactionAgreement: {}, // 购买须知
			tempFormData: null,
			menuButtonBounding: {}, // 小程序胶囊属性
			storeConfig: null,
			localConfig: null,
			selectGoodsCard: {
				skuId: 0,
				itemId: 0,
				cardList: {}
			} // 当前选择的次卡
		}
	},
	inject: ['promotion'],
	created() {
		// #ifdef MP
		this.menuButtonBounding = uni.getMenuButtonBoundingClientRect();
		// #endif
		this.isIphoneX = this.$util.uniappIsIPhoneX()
		if (uni.getStorageSync('token')) {
			Object.assign(this.orderCreateData, uni.getStorageSync(this.createDataKey))
			if (this.location) {
				this.orderCreateData.latitude = this.location.latitude;
				this.orderCreateData.longitude = this.location.longitude;
			}
			this.payment();
		} else {
			setTimeout(() => {
				this.$refs.loadingCover.hide();
				this.$refs.login.open(this.$util.getCurrentRoute().path)
			})
		}
		this.getTransactionAgreement();
	},
	computed: {
		storeToken() {
			return this.$store.state.token;
		},
		goodsData() {
			if (this.paymentData) {
				this.paymentData.shop_goods_list.goods_list.forEach(item => {
					if (item.sku_spec_format) item.sku_spec_format = JSON.parse(item.sku_spec_format);
				})
				return this.paymentData.shop_goods_list;
			}
		},
		calculateGoodsData() {
			if (this.calculateData) {
				this.calculateData.shop_goods_list.goods_list.forEach(item => {
					if (item.sku_spec_format) item.sku_spec_format = JSON.parse(item.sku_spec_format);
				})
				return this.calculateData.shop_goods_list;
			}
		},
		// 余额可抵扣金额
		balanceDeduct() {
			if (this.calculateData) {
				if (this.calculateData.member_account && this.calculateData.member_account.balance_total <= parseFloat(
						this.calculateData.order_money)
					.toFixed(2)) {
					return parseFloat(this.calculateData.member_account.balance_total).toFixed(2);
				} else {
					return parseFloat(this.calculateData.order_money).toFixed(2);
				}
			}
		},
		// 门店列表
		storeList() {
			let storeList = null;
			if (this.orderCreateData.delivery) {
				if (this.orderCreateData.delivery.delivery_type == 'local' && this.localConfig) {
					storeList = this.localConfig.store_list;
					storeList = storeList.reduce((res, item) => {
						return {
							...res,
							[item.store_id]: item
						}
					}, {})
				}
				if (this.orderCreateData.delivery.delivery_type == 'store' && this.storeConfig) {
					storeList = this.storeConfig.store_list;
					storeList = storeList.reduce((res, item) => {
						return {
							...res,
							[item.store_id]: item
						}
					}, {})
				}
			}
			return storeList;
		},
		// 门店信息
		storeInfo: {
			get() {
				if (this.storeList && this.orderCreateData.delivery && this.orderCreateData.delivery
					.delivery_type != 'express' && this.storeId) {
					return this.storeList[this.orderCreateData.delivery.store_id];
				}
			},
			set(value) {
				this.storeList[this.orderCreateData.delivery.store_id].store_image = value;
			}
		},
		// 会员卡购买周期
		cardChargeType() {
			if (this.paymentData && this.paymentData.recommend_member_card) {
				let charge_rule_arr = [];
				let charge_rule = this.paymentData.recommend_member_card.charge_rule;
				Object.keys(charge_rule).forEach((key, index) => {
					switch (key) {
						case 'week':
							charge_rule_arr.push({
								'key': key,
								'value': charge_rule[key],
								'title': '周卡',
								unit: '周'
							});
							break;
						case 'month':
							charge_rule_arr.push({
								'key': key,
								'value': charge_rule[key],
								'title': '月卡',
								unit: '月'
							});
							break;
						case 'quarter':
							charge_rule_arr.push({
								'key': key,
								'value': charge_rule[key],
								'title': '季卡',
								unit: '季'
							});
							break;
						case 'year':
							charge_rule_arr.push({
								'key': key,
								'value': charge_rule[key],
								'title': '年卡',
								unit: '年'
							});
							break;
					}
				})
				return charge_rule_arr;
			}
		}
	},
	watch: {
		storeToken: function(nVal, oVal) {
			this.payment();
		},
		deliveryTime: function(nVal) {
			if (!nVal) this.$refs.timePopup.refresh();
		},
		location: function(nVal) {
			if (nVal) {
				this.orderCreateData.latitude = nVal.latitude;
				this.orderCreateData.longitude = nVal.longitude;
				this.payment();
			}
		},
		calculateGoodsData(nVal) {
			if (nVal && nVal.local_config && nVal.local_config.info.time_is_open && !this.deliveryTime) this.localtime(
				'no');
		}
	},
	methods: {
		/**
		 * 父级页面onShow调用
		 */
		pageShow() {
			if (uni.getStorageSync('addressBack')) {
				uni.removeStorageSync('addressBack');
				this.payment();
			}
		},
		/**
		 * 获取订单结算数据
		 */
		payment() {
			this.$api.sendRequest({
				url: this.api.payment,
				data: this.orderCreateData,
				success: res => {
					if (res.code == 0 && res.data) {
						let data = res.data;

						// #ifdef MP-WEIXIN
						var scene = uni.getStorageSync('is_test') ? 1175 : wx.getLaunchOptionsSync().scene;
						if ([1175, 1176, 1177, 1191, 1195].indexOf(scene) != -1 && data.shop_goods_list
							.express_type) {
							data.shop_goods_list.express_type = data.shop_goods_list.express_type.filter(
								item => item.name == 'express');
						}
						// #endif

						if (data.shop_goods_list) {
							// 配送方式
							if (data.shop_goods_list.express_type && data.shop_goods_list.express_type
								.length) {
								let deliveryStorage = uni.getStorageSync('delivery');
								let delivery = data.shop_goods_list.express_type[0];
								data.shop_goods_list.express_type.forEach(item => {
									if (deliveryStorage && item.name == deliveryStorage
										.delivery_type) {
										delivery = item;
									}
									if (item.name == 'local') this.localConfig = item;
									if (item.name == 'store') this.storeConfig = item;
								})
								this.selectDeliveryType(delivery, false);
							}

							// 优惠券
							if (data.shop_goods_list.coupon_list && data.shop_goods_list.coupon_list[0])
								this.orderCreateData.coupon = {
									coupon_id: data.shop_goods_list.coupon_list[0].coupon_id
								};
						}
						// 地址、手机号
						if (data.is_virtual) {
							this.orderCreateData.member_address = '';
						}

						// 处理表单数据
						data = this.handleGoodsFormData(data);

						// 该方法在父级组件中
						this.promotionInfo = this.promotion(data);

						this.paymentData = data;
						this.calculate();
					} else {
						this.$util.showToast({
							title: res.message
						});

						setTimeout(() => {
							this.$util.redirectTo('/pages/index/index');
						}, 1000)
					}
				}
			})
		},
		/**
		 * 处理商品表单数据
		 * @param {Object} data
		 */
		handleGoodsFormData(data) {
			let goodsFormData = uni.getStorageSync('goodFormData');
			data.shop_goods_list.goods_list.forEach(item => {
				if (item.goods_form) {
					let formData = {};
					if (item.form_data) {
						item.form_data.map(formIem => {
							formData[formIem.id] = formIem;
						})
					} else if (goodsFormData && goodsFormData.goods_id == item.goods_id) {
						goodsFormData.form_data.map(formIem => {
							formData[formIem.id] = formIem;
						})
					}
					if (Object.keys(formData).length) {
						item.goods_form.json_data.forEach(formIem => {
							if (formData[formIem.id]) {
								formIem.val = formData[formIem.id].val;
							}
						})
					}
				}
			})
			return data;
		},
		/**
		 * 订单创建
		 */
		calculate() {
			this.$api.sendRequest({
				url: this.api.calculate,
				data: this.handleCreateData(),
				success: res => {
					if (this.$refs.loadingCover && this.$refs.loadingCover.isShow) this.$refs.loadingCover
						.hide();
					if (res.code == 0 && res.data) {

						// 处理表单数据
						let data = this.handleGoodsFormData(res.data);
						this.calculateData = data;
						if (res.data.delivery) {
							if (res.data.delivery.delivery_type == 'express') this.memberAddress = res.data
								.member_address;
							if (res.data.delivery.delivery_type == 'local') this.localMemberAddress = res
								.data.member_address;
						}
						// 次卡
						res.data.shop_goods_list.goods_list.forEach(item => {
							if (item.member_card_list) {
								if (this.orderCreateData.member_goods_card[item.sku_id]) {
									let itemId = this.orderCreateData.member_goods_card[item
										.sku_id];
									if (!item.member_card_list[itemId]) delete this.orderCreateData
										.member_goods_card[item.sku_id];
								}
							} else if (this.orderCreateData.member_goods_card[item.sku_id]) {
								delete this.orderCreateData.member_goods_card[item.sku_id];
							}
						})
						if (!res.data.shop_goods_list.coupon_id) this.orderCreateData.coupon.coupon_id = 0;
						else this.orderCreateData.coupon.coupon_id = res.data.shop_goods_list.coupon_id;

						this.$forceUpdate();
					} else {
						this.$util.showToast({
							title: res.message
						});
					}
				}
			})
		},
		/**
		 * 订单创建
		 */
		create() {
			if (!this.verify() || this.isRepeat) return;
			this.isRepeat = true;
			uni.showLoading({
				title: ''
			})
			this.$api.sendRequest({
				url: this.api.create,
				data: this.handleCreateData(),
				success: res => {
					uni.hideLoading();
					if (res.code == 0) {
						this.outTradeNo = res.data;
						uni.removeStorageSync('deliveryTime');
						uni.removeStorageSync('goodFormData');
						uni.setStorageSync('paySource', '');
						if (this.calculateData.pay_money == 0) {
							// #ifdef MP
							if (this.paymentData.is_virtual || this.orderCreateData.delivery
								.delivery_type == 'store') {
								this.$util.subscribeMessage(
									'ORDER_VERIFY_OUT_TIME,VERIFY_CODE_EXPIRE,VERIFY');
							}
							// #endif
							this.$util.redirectTo('/pages_tool/pay/result', {
								code: res.data
							}, 'redirectTo');
						} else {
							this.openChoosePayment();
						}
					} else {
						this.$util.showToast({
							title: res.message
						});
						this.isRepeat = false;
					}
					// 更新购物车数量
					this.$store.dispatch('getCartNumber');
				}
			})
		},
		/**
		 * 处理订单计算、创建传参
		 */
		handleCreateData() {
			let data = this.$util.deepClone(this.orderCreateData);
			// 订单表单
			if (this.$refs.form) {
				data.form_data = {
					form_id: this.paymentData.system_form.id,
					form_data: this.$util.deepClone(this.$refs.form.formData)
				};
			}
			// 商品表单
			if (this.$refs.goodsForm) {
				if (!data.form_data) data.form_data = {};
				data.form_data.goods_form = {};
				this.$refs.goodsForm.forEach(item => {
					data.form_data.goods_form[item._props.customAttr.sku_id] = {
						form_id: item._props.customAttr.form_id,
						form_data: this.$util.deepClone(item.formData)
					}
				})
			}
			Object.keys(data).forEach((key) => {
				let item = data[key];
				if (typeof item == 'object') data[key] = JSON.stringify(item);
			})

			if (data.member_address && this.orderCreateData.delivery && this.orderCreateData.delivery.delivery_type !=
				'store') delete data.member_address;

			return data;
		},
		/**
		 * 打开支付弹窗
		 */
		openChoosePayment() {
			// #ifdef MP
			if (this.paymentData.is_virtual) {
				this.$util.subscribeMessage('ORDER_URGE_PAYMENT,ORDER_PAY');
			} else {
				switch (this.orderCreateData.delivery.delivery_type) {
					case 'express': //物流配送
						this.$util.subscribeMessage('ORDER_URGE_PAYMENT,ORDER_PAY,ORDER_DELIVERY');
						break;
					case 'store': //门店自提
						this.$util.subscribeMessage('ORDER_URGE_PAYMENT,ORDER_PAY');
						break;
					case 'local': //同城配送
						this.$util.subscribeMessage('ORDER_URGE_PAYMENT,ORDER_PAY,ORDER_DELIVERY');
						break;
				}
			}

			// #endif
			this.$refs.choosePaymentPopup.getPayInfo(this.outTradeNo);
		},
		verify() {
			if (this.paymentData.is_virtual == 0) {
				if (!this.orderCreateData.delivery || !this.orderCreateData.delivery.delivery_type) {
					this.$util.showToast({
						title: '商家未设置配送方式'
					});
					return false;
				}
				if (
					(this.orderCreateData.delivery.delivery_type == 'express' && !this.memberAddress) ||
					(this.orderCreateData.delivery.delivery_type == 'local' && !this.localMemberAddress)
				) {
					this.$util.showToast({
						title: '请先选择您的收货地址'
					});
					return false;
				}

				if (this.orderCreateData.delivery.delivery_type == 'store') {
					if (!this.orderCreateData.delivery.store_id) {
						this.$util.showToast({
							title: '没有可提货的门店,请选择其他配送方式'
						});
						return false;
					}
					if (!this.orderCreateData.member_address.mobile) {
						this.$util.showToast({
							title: '请输入预留手机'
						});
						return false;
					}
					if (!this.$util.verifyMobile(this.orderCreateData.member_address.mobile)) {
						this.$util.showToast({
							title: '请输入正确的手机号'
						});
						return false;
					}
					if (!this.deliveryTime) {
						this.$util.showToast({
							title: '请选择提货时间'
						});
						return false;
					}
				}

				if (this.orderCreateData.delivery.delivery_type == 'local') {
					if (!this.orderCreateData.delivery.store_id) {
						this.$util.showToast({
							title: '没有可配送的门店,请选择其他配送方式'
						});
						return false;
					}
					if (this.calculateGoodsData.local_config && this.calculateGoodsData.local_config.info
						.time_is_open == 1 && !this.deliveryTime) {
						this.$util.showToast({
							title: '请选择送达时间'
						});
						return false;
					}
				}
			}

			if (this.$refs.goodsForm) {
				let formVerify = true;
				for (let i = 0; i < this.$refs.goodsForm.length; i++) {
					let item = this.$refs.goodsForm[i];
					formVerify = item.verify();
					if (!formVerify) {
						break;
					}
				}
				if (!formVerify) return false;
			}
			if (this.paymentData.system_form) {
				let formVerify = this.$refs.form.verify();
				if (!formVerify) return false;
			}
			return true;
		},
		/**
		 * 选择收货地址
		 */
		selectAddress() {
			var params = {
				back: this.$util.getCurrentRoute().path,
				local: 0,
				type: 1
			}
			// 外卖配送需要定位地址
			if (this.orderCreateData.delivery.delivery_type == 'local') {
				params.local = 1;
				params.type = 2;
			}
			this.$util.redirectTo('/pages_tool/member/address', params);
		},
		/**
		 * 选择配送方式
		 * @param {Object} data
		 */
		selectDeliveryType(data, calculate = true) {
			if (this.orderCreateData.delivery && this.orderCreateData.delivery.delivery_type == data.name) return;

			this.orderCreateData.buyer_ask_delivery_time = '';
			this.deliveryTime = '';

			let delivery = {
				delivery_type: data.name,
				delivery_type_name: data.title
			}
			// 如果是门店配送
			if (data.name == 'store' || data.name == 'local') {
				if (data.store_list[0]) {
					delivery.store_id = data.store_list[0].store_id;
				}
				this.storeId = delivery.store_id ? delivery.store_id : 0;
				if (!this.orderCreateData.member_address && this.paymentData) {
					this.orderCreateData.member_address = {
						name: this.paymentData.member_account.nickname,
						mobile: this.paymentData.member_account.mobile
					};
				}
			}
			this.$set(this.orderCreateData, 'delivery', delivery);
			uni.setStorageSync('delivery', delivery);

			// 配送方式不为门店配送时
			if (this.orderCreateData.delivery.delivery_type != 'express' && !this.location) this.$util.getLocation();
			if (calculate) this.calculate();

			if (data.name == 'store') this.storetime('no');
			if (data.name == 'local') this.localtime('no');
		},
		/**
		 * 图片错误
		 * @param {Object} index
		 */
		imageError(index) {
			this.paymentData.shop_goods_list.goods_list[index].sku_image = this.$util.getDefaultImage().goods;
			this.calculateData.shop_goods_list.goods_list[index].sku_image = this.$util.getDefaultImage().goods;;
			this.$forceUpdate();
		},
		/**
		 * 选择门店
		 * @param {Object} data
		 */
		selectPickupPoint(data) {
			if (data.store_id != this.storeId) {
				this.storeId = data.store_id;
				this.orderCreateData.delivery.store_id = data.store_id;
				this.calculate();
				this.resetDeliveryTime();
				// 存储所选门店
				let delivery = uni.getStorageSync('delivery');
				delivery.store_id = data.store_id;
				uni.setStorageSync('delivery', delivery)
			}
			this.$refs.deliveryPopup.close();
		},
		/**
		 * 重置提货时间
		 */
		resetDeliveryTime() {
			this.orderCreateData.buyer_ask_delivery_time = '';
			this.deliveryTime = '';
			uni.removeStorageSync('deliveryTime');
		},
		/**
		 * 门店
		 */
		storetime(type = '') {
			if (this.storeInfo) {
				let data = this.$util.deepClone(this.storeInfo);
				data.delivery_time = typeof data.delivery_time == 'string' && data.delivery_time ? JSON.parse(data
					.delivery_time) : data.delivery_time;
				if (!data.delivery_time.length) {
					data.delivery_time = [{
						start_time: data.start_time,
						end_time: data.end_time
					}]
				}
				let obj = {
					delivery: this.orderCreateData.delivery,
					dataTime: data
				}
				this.$refs.timePopup.open(obj, type);
				this.$forceUpdate();
			}
		},
		/**
		 * 选择自提时间
		 * @param {Object} data
		 */
		selectPickupTime(data) {
			this.deliveryTime = data.data.month + '(' + data.data.time + ')';

			let nowDate = new Date();
			let Year = nowDate.getFullYear();
			let timeData = data.data.month.split('月');
			let month = timeData[0];
			let date = timeData[1].split('日')[0];
			this.orderCreateData.buyer_ask_delivery_time = Year + '-' + month + '-' + date + ' ' + data.data.time

			//将时间缓存，避免切换地址时重置
			uni.setStorageSync('deliveryTime', {
				'deliveryTime': this.deliveryTime,
				'buyer_ask_delivery_time': this.orderCreateData.buyer_ask_delivery_time,
				'delivery_type': this.orderCreateData.delivery.delivery_type
			});

		},
		storeImgError() {
			this.storeInfo.store_image = this.$util.getDefaultImage().store;
		},
		openPopup(ref) {
			if (ref == 'deliveryPopup' && (!this.storeList || Object.keys(this.storeList).length <= 1)) return;
			this.tempData = this.$util.deepClone(this.orderCreateData);
			this.$refs[ref].open();
		},
		closePopup(ref) {
			this.orderCreateData = this.$util.deepClone(this.tempData);
			this.$refs[ref].close();
			this.tempData = null;
		},
		/**
		 * 切换发票开关
		 */
		changeIsInvoice() {
			if (this.orderCreateData.is_invoice == 0) {
				this.orderCreateData.is_invoice = 1;
				if (!this.orderCreateData.invoice_type) this.orderCreateData.invoice_type = this.goodsData.invoice
					.invoice_type.split(',')[0];
			} else {
				this.orderCreateData.is_invoice = 0;
			}
		},
		/**
		 * 切换发票类型
		 * @param {Object} invoice_type
		 */
		changeInvoiceType(invoice_type) {
			this.orderCreateData.invoice_type = invoice_type;
		},
		/**
		 * 切换发票个人还是企业
		 * @param {Object} invoice_title_type
		 */
		changeInvoiceTitleType(invoice_title_type) {
			this.orderCreateData.invoice_title_type = invoice_title_type;
		},
		/**
		 * 切换增值税专用发票开关
		 */
		changeIsTaxInvoice() {
			if (this.orderCreateData.is_tax_invoice == 0) this.orderCreateData.is_tax_invoice = 1;
			else this.orderCreateData.is_tax_invoice = 0;
			this.$forceUpdate();
		},
		/**
		 * 选择发票内容
		 * @param {Object} invoice_content
		 */
		changeInvoiceContent(invoice_content) {
			this.orderCreateData.invoice_content = invoice_content;
			this.$forceUpdate();
		},
		/**
		 * 验证发票内容
		 */
		invoiceVerify() {
			if (!this.orderCreateData.invoice_title) {
				this.$util.showToast({
					title: '请填写发票抬头'
				});
				return false;
			}
			if (!this.orderCreateData.taxpayer_number && this.orderCreateData.invoice_title_type == 2) {
				this.$util.showToast({
					title: '请填写纳税人识别号'
				});
				return false;
			}
			if (this.orderCreateData.invoice_type == 1 && !this.orderCreateData.invoice_full_address && this
				.orderPaymentData.is_virtual == 1) {
				this.$util.showToast({
					title: '请填写发票邮寄地址'
				});
				return false;
			}
			if (this.orderCreateData.invoice_type == 2 && !this.orderCreateData.invoice_email) {
				this.$util.showToast({
					title: '请填写邮箱'
				});
				return false;
			}
			if (this.orderCreateData.invoice_type == 2) {
				var reg = /^([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/;
				if (!reg.test(this.orderCreateData.invoice_email)) {
					this.$util.showToast({
						title: '请填写正确的邮箱'
					});
					return false;
				}
			}
			if (!this.orderCreateData.invoice_content) {
				this.$util.showToast({
					title: '请选择发票内容'
				});
				return false;
			}
			return true;
		},
		/**
		 * 保存发票设置
		 */
		saveInvoice() {
			if (this.orderCreateData.is_invoice == 1 && !this.invoiceVerify()) return;
			this.calculate();
			this.$refs.invoicePopup.close();
		},
		/**
		 * 保存留言
		 */
		saveBuyerMessage() {
			this.$refs.buyerMessagePopup.close();
		},
		/**
		 * 选择会员卡
		 */
		selectMemberCard() {
			this.orderCreateData.is_open_card = this.orderCreateData.is_open_card ? 0 : 1;
			if (!this.orderCreateData.member_card_unit) this.orderCreateData.member_card_unit = this.cardChargeType[0]
				.key;
			this.calculate();
		},
		/**
		 * 选择会员卡充值类型
		 * @param {Object} key
		 */
		selectMembercardUnit(key) {
			this.orderCreateData.member_card_unit = key;
			this.calculate();
		},
		/**
		 * 使用积分抵扣
		 */
		usePoint() {
			this.orderCreateData.is_point = this.orderCreateData.is_point ? 0 : 1;
			this.calculate();
		},
		/**
		 * 支付弹窗关闭
		 */
		payClose() {
			this.$util.redirectTo('/pages/order/detail', {
				order_id: this.$refs.choosePaymentPopup.payInfo.order_id
			}, 'redirectTo');
		},
		/**
		 * 选择优惠券
		 * @param {Object} data
		 */
		selectCoupon(data) {
			if (this.orderCreateData.coupon.coupon_id == data.coupon_id) this.orderCreateData.coupon = {
				coupon_id: 0
			};
			else this.orderCreateData.coupon = {
				coupon_id: data.coupon_id
			};
		},
		/**
		 * 使用优惠券
		 */
		useCpopon() {
			this.$refs.couponPopup.close();
			this.calculate();
		},
		/**
		 * 同城配送送达时间
		 */
		localtime(type = '') {
			if (this.calculateGoodsData && this.calculateGoodsData.local_config) {
				let data = this.$util.deepClone(this.calculateGoodsData.local_config.info);
				if (Object.keys(data).length) {
					if (data.delivery_time) {
						data.end_time = data.delivery_time[(data.delivery_time.length - 1)].end_time;
					}

					let obj = {
						delivery: this.orderCreateData.delivery,
						dataTime: data
					}

					this.$refs.timePopup.open(obj, type);
				}

			}
		},
		/**
		 * 剩余起送价
		 */
		surplusStartMoney() {
			let money = 0;
			if (this.calculateData && this.calculateData.delivery && this.calculateData.delivery.delivery_type ==
				'local') {
				let startDeliveryMoney = this.calculateGoodsData.delivery.start_money ?? 0;
				money = parseFloat(startDeliveryMoney) - parseFloat(this.calculateData.goods_money);
				money = money < 0 ? 0 : money;
			}
			return money;
		},
		/**
		 * 交易协议
		 */
		getTransactionAgreement() {
			this.$api.sendRequest({
				url: '/api/order/transactionagreement',
				success: res => {
					if (res.data) {
						this.transactionAgreement = res.data;
						if (this.transactionAgreement.content) this.transactionAgreement.content =
							htmlParser(this.transactionAgreement.content);
					}
				}
			})
		},
		editForm(index) {
			this.tempFormData = {
				index: index,
				json_data: this.$util.deepClone(this.goodsData.goods_list[index].goods_form.json_data)
			};
			this.$refs.editFormPopup.open();
		},
		saveForm() {
			if (this.$refs.tempForm.verify()) {
				this.$set(this.paymentData.shop_goods_list.goods_list[this.tempFormData.index].goods_form, 'json_data',
					this.$refs.tempForm.formData);
				this.$refs.editFormPopup.close();
			}
		},
		/**
		 * 切换次卡
		 * @param {Object} index
		 */
		selectMemberGoodsCard(index) {
			let sku_id = this.goodsData.goods_list[index].sku_id;
			this.selectGoodsCard = {
				skuId: sku_id,
				itemId: this.orderCreateData.member_goods_card[sku_id] ? this.orderCreateData.member_goods_card[
					sku_id] : 0,
				cardList: this.$util.deepClone(this.calculateGoodsData.goods_list[index].member_card_list),
				click: (item_id) => {
					this.selectGoodsCard.itemId = this.selectGoodsCard.itemId == item_id ? 0 : item_id;
				}
			}
			this.$refs.memberGoodsCardPopup.open();
		},
		/**
		 * 选择次卡
		 */
		saveMemberGoodsCard() {
			this.orderCreateData.member_goods_card[this.selectGoodsCard.skuId] = this.selectGoodsCard.itemId || 0;
			this.$refs.memberGoodsCardPopup.close();
			this.calculate();
		},
		back() {
			uni.navigateBack({
				delta: 1
			});
		}
	},
	filters: {
		// 金额格式化输出
		moneyFormat(money) {
			return parseFloat(money).toFixed(2);
		}
	}
}