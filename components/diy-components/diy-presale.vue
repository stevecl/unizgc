<template>
	<view class="diy-presale" v-if="list.length" :class="[value.template, value.style]" :style="warpCss">
		<template v-if="value.template == 'row1-of1'">
			<view class="item" v-for="(item, index) in list" :key="index" @click="toDetail(item)" :class="[value.ornament.type]" :style="goodsItemCss">
				<view class="img-wrap" :style="{ borderRadius: value.imgAroundRadius * 2 + 'rpx' }">
					<image
						:style="{ borderRadius: value.imgAroundRadius * 2 + 'rpx' }"
						:src="$util.img(item.goods_image, { size: 'mid' })"
						mode="widthFix"
						@error="imageError(index)"
					></image>
				</view>
				<view class="content" v-if="value.goodsNameStyle.control || value.priceStyle.mainControl || value.btnStyle.control">
					<view
						v-if="value.goodsNameStyle.control"
						class="goods-name"
						:style="{ color: value.theme == 'diy' ? value.goodsNameStyle.color : '', fontWeight: value.goodsNameStyle.fontWeight ? 'bold' : '' }"
						:class="[{ 'using-hidden': value.nameLineMode == 'single' }, { 'multi-hidden': value.nameLineMode == 'multiple' }]"
					>
						{{ item.goods_name }}
					</view>
					<view class="discount-price" v-if="value.priceStyle.mainControl">
						<text class="unit price-style small" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">¥</text>
						<text class="price price-style large" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">
							{{ showPrice(item).split('.')[0] }}
						</text>
						<text class="unit price-style small" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">
							{{ '.' + showPrice(item).split('.')[1] }}
						</text>
					</view>
					<button
						v-if="value.btnStyle.control"
						:style="{
							background: value.btnStyle.theme == 'diy' ? 'linear-gradient(to right,' + value.btnStyle.bgColorStart + ',' + value.btnStyle.bgColorEnd + ')' : '',
							color: value.btnStyle.theme == 'diy' ? value.btnStyle.textColor : '',
							borderRadius: value.btnStyle.aroundRadius * 2 + 'rpx'
						}"
					>
						{{ value.btnStyle.text }}
					</button>
				</view>
			</view>
		</template>
		<template v-if="value.template == 'horizontal-slide'">
			<scroll-view v-if="value.slideMode == 'scroll'" class="scroll" :scroll-x="true" :show-scrollbar="false">
				<view class="item" v-for="(item, index) in list" :key="index" @click="toDetail(item)" :class="[value.ornament.type]" :style="goodsItemCss">
					<view class="img-wrap" :style="{ borderRadius: value.imgAroundRadius * 2 + 'rpx' }">
						<image
							:style="{ borderRadius: value.imgAroundRadius * 2 + 'rpx' }"
							:src="$util.img(item.goods_image, { size: 'mid' })"
							mode="widthFix"
							@error="imageError(index)"
						></image>
					</view>
					<view :class="['content', { 'multi-content': value.nameLineMode == 'multiple' }]" v-if="value.goodsNameStyle.control || value.priceStyle.mainControl">
						<view
							v-if="value.goodsNameStyle.control"
							class="goods-name"
							:style="{ color: value.theme == 'diy' ? value.goodsNameStyle.color : '', fontWeight: value.goodsNameStyle.fontWeight ? 'bold' : '' }"
							:class="[{ 'using-hidden': value.nameLineMode == 'single' }, { 'multi-hidden': value.nameLineMode == 'multiple' }]"
						>
							{{ item.goods_name }}
						</view>
						<view class="discount-price" v-if="value.priceStyle.mainControl">
							<text class="unit price-style small" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">¥</text>
							<text class="price price-style large" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">
								{{ showPrice(item).split('.')[0] }}
							</text>
							<text class="unit price-style small" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">
								{{ '.' + showPrice(item).split('.')[1] }}
							</text>
						</view>
					</view>
				</view>
			</scroll-view>

			<swiper v-if="value.slideMode == 'slide'" :autoplay="false" class="swiper" :style="{ height: swiperHeight }">
				<swiper-item v-for="(pageItem, pageIndex) in page" :key="pageIndex" :class="['swiper-item', [list[pageIndex].length / 3] >= 1 && 'flex-between']">
					<view class="item" v-for="(item, dataIndex) in list[pageIndex]" :key="dataIndex" @click="toDetail(item)" :class="[value.ornament.type]" :style="goodsItemCss">
						<view class="img-wrap" :style="{ borderRadius: value.imgAroundRadius * 2 + 'rpx' }">
							<image
								:style="{ borderRadius: value.imgAroundRadius * 2 + 'rpx' }"
								:src="$util.img(item.goods_image, { size: 'mid' })"
								mode="widthFix"
								@error="imageError(dataIndex)"
							></image>
						</view>
						<view :class="['content', { 'multi-content': value.nameLineMode == 'multiple' }]" v-if="value.goodsNameStyle.control || value.priceStyle.mainControl">
							<view
								v-if="value.goodsNameStyle.control"
								class="goods-name"
								:style="{ color: value.theme == 'diy' ? value.goodsNameStyle.color : '', fontWeight: value.goodsNameStyle.fontWeight ? 'bold' : '' }"
								:class="[{ 'using-hidden': value.nameLineMode == 'single' }, { 'multi-hidden': value.nameLineMode == 'multiple' }]"
							>
								{{ item.goods_name }}
							</view>
							<view class="discount-price" v-if="value.priceStyle.mainControl">
								<text class="unit price-style small" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">¥</text>
								<text class="price price-style large" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">
									{{ showPrice(item).split('.')[0] }}
								</text>
								<text class="unit price-style small" :style="{ color: value.theme == 'diy' ? value.priceStyle.mainColor + '!important' : '' }">
									{{ '.' + showPrice(item).split('.')[1] }}
								</text>
							</view>
						</view>
					</view>
				</swiper-item>
			</swiper>
		</template>
	</view>
</template>

<script>
export default {
	name: 'diy-presale',
	props: {
		value: {
			type: Object
		}
	},
	data() {
		return {
			list: [],
			page: 1
		};
	},
	created() {
		this.getData();
	},
	watch: {
		// 组件刷新监听
		componentRefresh: function(nval) {
			this.getData();
		}
	},
	computed: {
		warpCss() {
			var obj = '';
			obj += 'background-color:' + this.value.componentBgColor + ';';
			if (this.value.componentAngle == 'round') {
				obj += 'border-top-left-radius:' + this.value.topAroundRadius * 2 + 'rpx;';
				obj += 'border-top-right-radius:' + this.value.topAroundRadius * 2 + 'rpx;';
				obj += 'border-bottom-left-radius:' + this.value.bottomAroundRadius * 2 + 'rpx;';
				obj += 'border-bottom-right-radius:' + this.value.bottomAroundRadius * 2 + 'rpx;';
			}
			return obj;
		},
		// 商品项样式
		goodsItemCss() {
			var obj = '';
			obj += 'background-color:' + this.value.elementBgColor + ';';
			if (this.value.elementAngle == 'round') {
				obj += 'border-top-left-radius:' + this.value.topElementAroundRadius * 2 + 'rpx;';
				obj += 'border-top-right-radius:' + this.value.topElementAroundRadius * 2 + 'rpx;';
				obj += 'border-bottom-left-radius:' + this.value.bottomElementAroundRadius * 2 + 'rpx;';
				obj += 'border-bottom-right-radius:' + this.value.bottomElementAroundRadius * 2 + 'rpx;';
			}
			if (this.value.ornament.type == 'shadow') {
				obj += 'box-shadow:' + '0 0 10rpx ' + this.value.ornament.color + ';';
			}
			if (this.value.ornament.type == 'stroke') {
				obj += 'border:' + '2rpx solid ' + this.value.ornament.color + ';';
			}
			const screenWidth = uni.getSystemInfoSync().windowWidth;
			if (this.value.template == 'horizontal-slide') {
				var width = '';
				if (this.value.slideMode == 'scroll' && this.value.goodsMarginType == 'diy') width = this.rpxUpPx(this.value.goodsMarginNum * 2);
				else width = [screenWidth - this.rpxUpPx(20) * 2 - this.rpxUpPx(200) * 3 - this.rpxUpPx(this.value.margin.both * 2) * 2] / 6;
				obj += 'margin-right:' + width + 'px;';
				obj += 'margin-left:' + width + 'px;';
			}
			return obj;
		},
		swiperHeight() {
			if (this.value.nameLineMode == 'multiple') {
				return this.value.ornament.type == 'shadow' ? '390rpx' : '382rpx';
			}
			return this.value.ornament.type == 'shadow' ? '364rpx' : '348rpx';
		}
	},
	methods: {
		rpxUpPx(res) {
			const screenWidth = uni.getSystemInfoSync().windowWidth;
			var data = (screenWidth * parseInt(res)) / 750;
			return Math.floor(data);
		},
		getData() {
			var data = {
				num: this.value.count
			};
			if (this.value.sources == 'diy') {
				data.num = 0;
				data.goods_id_arr = this.value.goodsId.toString();
			}
			this.$api.sendRequest({
				url: '/presale/api/goods/lists',
				data: data,
				success: res => {
					if (res.code == 0 && res.data) {
						this.list = res.data;

						// 切屏滚动，每页显示固定数量
						if (this.value.template == 'horizontal-slide' && this.value.slideMode == 'slide') {
							let size = 3;
							let temp = [];
							this.page = Math.ceil(this.list.length / size);
							for (var i = 0; i < this.page; i++) {
								temp[i] = [];
								for (var j = i * size; j < this.list.length; j++) {
									if (temp[i].length == size) break;
									temp[i].push(this.list[j]);
								}
							}
							this.list = temp;
						}
					}
				}
			});
		},
		toDetail(e) {
			this.$util.redirectTo('/pages_promotion/presale/detail', {
				id: e.presale_id
			});
		},
		imageError(index) {
			this.list[index].goods_image = this.$util.getDefaultImage().goods;
			this.$forceUpdate();
		},
		showPrice(data) {
			let price = data.price;
			if (data.member_price && parseFloat(data.member_price) < parseFloat(price)) price = data.member_price;
			return price;
		}
	}
};
</script>

<style lang="scss">
/deep/.uni-scroll-view ::-webkit-scrollbar {
	/* 隐藏滚动条，但依旧具备可以滚动的功能 */
	display: none;
	width: 0;
	height: 0;
	color: transparent;
	background: transparent;
}

/deep/::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
	color: transparent;
	background: transparent;
}

scroll-view ::-webkit-scrollbar {
	width: 0;
	height: 0;
	background-color: transparent;
	touch-action: none;
}

.diy-presale {
	&.row1-of1 {
		.item {
			display: flex;
			margin-bottom: 20rpx;
			padding: 16rpx;
			&.shadow {
				margin: 8rpx 8rpx 20rpx 8rpx;
			}
			&:last-child {
				margin-bottom: 0;
			}
			.img-wrap {
				width: 200rpx;
				height: 200rpx;
				> image {
					width: 200rpx;
				}
			}
			.content {
				flex: 1;
				margin-left: 20rpx;
				position: relative;
				padding: 6rpx 0;
				.goods-name {
					line-height: 1.5;
				}
				.discount-price {
					white-space: nowrap;
					font-weight: bold;
					position: absolute;
					bottom: 10rpx;
					left: 0;
					.unit {
						font-size: $font-size-tag;
						margin-right: 4rpx;
						color: $base-color;
					}
					.price {
						font-size: $font-size-toolbar;
						color: $base-color;
					}
				}
				button {
					position: absolute;
					bottom: 10rpx;
					right: 20rpx;
					margin: 0;
					padding: 0 20rpx;
					background-color: $base-color;
					color: #fff;
					min-width: 112rpx;
					height: 52rpx;
					line-height: 52rpx;
					font-size: $font-size-tag;
				}
			}
		}
	}

	&.horizontal-slide {
		.scroll {
			width: calc(100% - 40rpx);
			padding: 20rpx;
			line-height: 1;
			white-space: nowrap;
			.item.shadow {
				margin-bottom: 8rpx;
			}
		}
		.flex-between {
			justify-content: space-between;
		}
		.item {
			display: inline-block;
			width: 200rpx;
			overflow: hidden;
			box-sizing: border-box;
			&:nth-child(3n + 3) {
				width: 198rpx;
			}
			&.shadow {
				margin-top: 8rpx;
			}
			.img-wrap {
				width: 200rpx;
				height: 200rpx;
				margin: 0 auto;
				> image {
					width: 200rpx;
				}
			}
			.content {
				padding: 10rpx;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				&.multi-content {
					height: 134rpx;
					box-sizing: border-box;
				}
				.goods-name {
					line-height: 1.3;
					&.multi-hidden {
						white-space: break-spaces;
					}
				}
				.discount-price {
					white-space: nowrap;
					margin-top: auto;
					font-weight: bold;
					line-height: 1;
					.unit {
						font-size: $font-size-tag;
						margin-right: 4rpx;
						color: $base-color;
					}
					.price {
						font-size: $font-size-toolbar;
						color: $base-color;
					}
				}
			}
		}
		.swiper {
			padding: 20rpx;
			width: 100%;
			white-space: nowrap;
			box-sizing: border-box;
			.swiper-item {
				display: flex;
				align-items: center;
			}
			.item {
				width: 200rpx;
			}
		}
	}
}
</style>
