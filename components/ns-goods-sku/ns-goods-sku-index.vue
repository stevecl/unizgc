<template>
	<view class="goods-sku">
		<ns-login ref="login"></ns-login>
		<!-- sku选择 -->
		<ns-goods-sku v-if="goodsDetail.goods_id" ref="goodsSku" :goods-id="goodsDetail.goods_id"
			:goods-detail="goodsDetail" :max-buy="goodsDetail.max_buy" :min-buy="goodsDetail.min_buy"
			@refresh="refreshGoodsSkuDetail"></ns-goods-sku>
	</view>
</template>

<script>
	import nsGoodsSku from '@/components/ns-goods-sku/ns-goods-sku.vue';
	// 商品SKU
	export default {
		name: 'ns-goods-sku-index',
		components: {
			nsGoodsSku
		},
		data() {
			return {
				cart: {},
				timeout: {},
				isRepeat: false,
				goodsDetail: {}
			};
		},
		computed: {
			cartList() {
				return this.$store.state.cartList;
			}
		},
		watch: {
			cartList: function(nval) {
				let cart = {},
					cartList = Object.keys(this.$store.state.cartList);
				if (cartList.length) {
					cartList.forEach(key => {
						let item = this.$store.state.cartList[key];
						if (cart && cart['goods_' + item.goods_id]) {
							cart['goods_' + item.goods_id]['sku_' + item.sku_id] = item;
							cart['goods_' + item.goods_id].num += item.num;
						} else {
							cart['goods_' + item.goods_id] = {
								num: item.num
							};
							cart['goods_' + item.goods_id]['sku_' + item.sku_id] = item;
						}
					});
				}

				this.cart = cart;
				this.$emit("cartListChange", cart);
			},
		},
		created() {},
		methods: {
			/**
			 * 添加购物车
			 * @param {Object} config 购物车事件（detail-详情，cart-加入购物车）
			 * @param {Object} data 商品项
			 */
			addCart(config, data, event) {
				if (!uni.getStorageSync('token')) {
					this.$refs.login.open('/pages/index/index')
					return;
				}
				if (config == "detail" || data.is_virtual) {
					this.$util.redirectTo('/pages/goods/detail', {
						goods_id: data.goods_id
					});
					return false;
				}
				// 多规格
				if (data.goods_spec_format) {
					this.multiSpecificationGoods(data);
				} else {
					this.singleSpecificationGoods(data, event);
				}
			},
			/**
			 * 单规格
			 * @param {Object} data 商品项
			 */
			singleSpecificationGoods(data, event) {
				let cart =
					this.cart['goods_' + data.goods_id] && this.cart['goods_' + data.goods_id]['sku_' + data.sku_id] ?
					this.cart['goods_' + data.goods_id]['sku_' + data.sku_id] :
					null,
					cartNum = cart ? cart.num : 0,
					api = cart && cart.cart_id ? '/api/cart/edit' : '/api/cart/add',
					minBuy = data.min_buy > 0 ? data.min_buy : 0,
					num = cartNum >= minBuy ? cartNum : minBuy,
					_num = num + 1;

				if (_num > parseInt(data.stock)) {
					this.$util.showToast({
						title: '商品库存不足'
					});
					return;
				}
				if (data.is_limit && data.max_buy && _num > parseInt(data.max_buy)) {
					this.$util.showToast({
						title: '该商品每人限购'
					});
					return;
				}

				if (cart) {
					this.cart['goods_' + data.goods_id]['sku_' + data.sku_id].num = _num;
				} else {
					if (!this.cart['goods_' + data.goods_id]) this.$set(this.cart, 'goods_' + data.goods_id, {
						num: _num
					});
					if (!this.cart['goods_' + data.goods_id]['sku_' + data.sku_id]) this.$set(this.cart['goods_' + data
						.goods_id], 'sku_' + data.sku_id, {
						cart_id: cart ? cart.cart_id : 0,
						goods_id: data.goods_id,
						sku_id: data.sku_id,
						num: _num
					});
					this.$set(this.cart['goods_' + data.goods_id]['sku_' + data.sku_id], 'num', _num);
				}

				if (this.isRepeat) return;
				this.isRepeat = true;

				this.$emit('addCart', event.currentTarget.id);

				this.$api.sendRequest({
					url: api,
					data: {
						cart_id: cart ? cart.cart_id : 0,
						sku_id: data.sku_id,
						num: _num
					},
					success: res => {
						this.isRepeat = false;
						if (res.code == 0) {
							this.$util.showToast({
								title: "商品添加购物车成功"
							});
							this.$store.commit('setCartChange');
							if ((!cart || !cart.cart_id) && this.cart['goods_' + data.goods_id]) this.$set(this
								.cart['goods_' + data.goods_id]['sku_' + data.sku_id], 'cart_id', res.data);
							this.$store.dispatch('getCartNumber');
						} else {
							this.$util.showToast({
								title: res.message
							});
						}
					}
				});
			},
			/**
			 * 多规格
			 * @param {Object} data 商品项
			 */
			multiSpecificationGoods(data) {
				this.$api.sendRequest({
					url: '/api/goodssku/getInfoForCategory',
					data: {
						sku_id: data.sku_id
					},
					success: res => {
						if (res.code >= 0) {
							let item = res.data;
							item.unit = item.unit || '件';

							if (item.sku_images) item.sku_images = item.sku_images.split(',');
							else item.sku_images = [];

							// 多规格时合并主图
							if (item.goods_spec_format && item.goods_image) {
								item.goods_image = item.goods_image.split(',');
								item.sku_images = item.goods_image.concat(item.sku_images);
							}

							// 当前商品SKU规格
							if (item.sku_spec_format) item.sku_spec_format = JSON.parse(item.sku_spec_format);

							// 商品SKU格式
							if (item.goods_spec_format) item.goods_spec_format = JSON.parse(item
								.goods_spec_format);

							// 限时折扣
							if (item.promotion_type == 1) {
								item.discountTimeMachine = this.$util.countDown(item.end_time - res.timestamp);
							}

							if (item.promotion_type == 1 && item.discountTimeMachine) {
								if (item.member_price > 0 && Number(item.member_price) <= Number(item
										.discount_price)) {
									item.show_price = item.member_price;
								} else {
									item.show_price = item.discount_price;
								}
							} else if (item.member_price > 0) {
								item.show_price = item.member_price;
							} else {
								item.show_price = item.price;
							}
							this.goodsDetail = item;

							this.$nextTick(() => {
								if (this.$refs.goodsSku) {
									this.$refs.goodsSku.show("join_cart", () => {
										this.$store.dispatch('getCartNumber');
										// 加入购物车动效
										setTimeout(() => {
											this.$store.commit('setCartChange');
										}, 100);

									});
								}
							});
						}
					}
				});
			},
			refreshGoodsSkuDetail(data) {
				this.goodsDetail = Object.assign({}, this.goodsDetail, data);
			}
		}
	};
</script>
<style scoped>
	/deep/ .uni-popup__wrapper.uni-custom .uni-popup__wrapper-box {
		max-height: unset !important;
	}
</style>