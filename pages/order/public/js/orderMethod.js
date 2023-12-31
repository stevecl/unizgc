export default {
	methods: {
		/**
		 * 订单支付
		 * @param {Object} out_trade_no
		 */
		orderPay(orderData) {
			if (orderData.adjust_money == 0) {
				this.pay();
			} else {
				uni.showModal({
					title: '提示',
					content: '商家已将支付金额调整为' + orderData.pay_money + '元，是否继续支付？',
					success: res => {
						if (res.confirm) {
							this.pay();
						}
					}
				})
			}
		},
		pay() {
			this.$api.sendRequest({
				url: '/api/order/pay',
				data: {
					order_ids: this.orderData.order_id
				},
				success: res => {
					if (res.code >= 0) {
						this.$refs.choosePaymentPopup.getPayInfo(res.data);
					} else {
						this.$util.showToast({
							title: res.message
						});
					}
				}
			})
		},
		/**
		 * 关闭订单
		 * @param {Object} order_id
		 */
		orderClose(order_id, callback) {
			uni.showModal({
				title: '提示',
				content: '您确定要关闭该订单吗？',
				success: res => {
					if (res.confirm) {
						this.$api.sendRequest({
							url: '/api/order/close',
							data: {
								order_id
							},
							success: res => {
								if (res.code >= 0) {
									typeof callback == 'function' && callback();
								} else {
									this.$util.showToast({
										title: '当前订单可能存在拼团，维权等操作，' + res.message +
											'不可以关闭哦!',
										duration: 2000
									})
								}
							}
						})
					}
				}
			})
		},
		/**
		 * 订单收货
		 * @param {Object} orderData
		 */
		orderDelivery(orderData, callback) {
			// 如果不在微信小程序中
			// #ifndef MP-WEIXIN
			uni.showModal({
				title: '提示',
				content: '您确定已经收到货物了吗？',
				success: res => {
					if (res.confirm) {
						this.$api.sendRequest({
							url: '/api/order/takedelivery',
							data: {
								order_id: orderData.order_id
							},
							success: res => {
								this.$util.showToast({
									title: res.message
								})
								typeof callback == 'function' && callback();
							}
						})
					}
				}
			})
			// #endif

			// #ifdef MP-WEIXIN
			// 检测微信小程序是否已开通发货信息管理服务
			if (wx.openBusinessView && orderData.is_trade_managed) {
				wx.openBusinessView({
					businessType: 'weappOrderConfirm',
					extraData: {
						merchant_id: orderData.pay_config.mch_id,
						merchant_trade_no: orderData.out_trade_no
					},
					success: res => {
						console.log('success', res);
						if (res.extraData.status == 'success') {
							this.$api.sendRequest({
								url: '/api/order/takedelivery',
								data: {
									order_id: orderData.order_id
								},
								success: res => {
									this.$util.showToast({
										title: res.message
									})
									typeof callback == 'function' && callback();
								}
							})
						}
					},
					fail: function(res) {
						console.log('fail', res);
					}
				})
			} else {
				uni.showModal({
					title: '提示',
					content: '您确定已经收到货物了吗？',
					success: res => {
						if (res.confirm) {
							this.$api.sendRequest({
								url: '/api/order/takedelivery',
								data: {
									order_id: orderData.order_id
								},
								success: res => {
									this.$util.showToast({
										title: res.message
									})
									typeof callback == 'function' && callback();
								}
							})
						}
					}
				})
			}
			// #endif
		},
		/**
		 * 订单虚拟商品收货
		 * @param {Object} orderData
		 */
		orderVirtualDelivery(orderData, callback) {
			// 如果不在微信小程序中
			// #ifndef MP-WEIXIN
			uni.showModal({
				title: '提示',
				content: '您确定要进行收货吗？',
				success: res => {
					if (res.confirm) {
						this.$api.sendRequest({
							url: '/api/order/membervirtualtakedelivery',
							data: {
								order_id: orderData.order_id
							},
							success: res => {
								this.$util.showToast({
									title: res.message
								})
								typeof callback == 'function' && callback();
							}
						})
					}
				},
			})
			// #endif

			// #ifdef MP-WEIXIN
			// 检测微信小程序是否已开通发货信息管理服务
			if (wx.openBusinessView && orderData.is_trade_managed) {
				wx.openBusinessView({
					businessType: 'weappOrderConfirm',
					extraData: {
						merchant_id: orderData.pay_config.mch_id,
						merchant_trade_no: orderData.out_trade_no
					},
					success: res => {
						if (res.extraData.status == 'success') {
							this.$api.sendRequest({
								url: '/api/order/membervirtualtakedelivery',
								data: {
									order_id: orderData.order_id
								},
								success: res => {
									this.$util.showToast({
										title: res.message
									})
									typeof callback == 'function' && callback();
								}
							})
						}
					},
					fail: function(res) {}
				})
			} else {
				uni.showModal({
					title: '提示',
					content: '您确定要进行收货吗？',
					success: res => {
						if (res.confirm) {
							this.$api.sendRequest({
								url: '/api/order/membervirtualtakedelivery',
								data: {
									order_id: orderData.order_id
								},
								success: res => {
									this.$util.showToast({
										title: res.message
									})
									typeof callback == 'function' && callback();
								}
							})
						}
					},
				})
			}
			// #endif
		},
	}
}