<template>
	<view class="many-goods-list">
		<scroll-view scroll-x="true" class="many-goods-list-head" :scroll-into-view="'a' + cateIndex"
			:style="manyWrapCss">
			<view v-for="(item, index) in value.list" class="scroll-item" :class="{ active: index == cateIndex }"
				:id="'a' + index" :key="index" @click="changeCateIndex(item, index)">
				<view class="split-line" v-if="index > 0"></view>
				<view class="cate">
					<view class="name" :style="{ color : value.headStyle.titleColor }">{{ item.title }}</view>
					<view class="desc" :class="{ 'color-base-bg': index == cateIndex && item.desc }">{{ item.desc }}
					</view>
				</view>

			</view>
		</scroll-view>
		<view class="many-goods-list-fill" :style="{'height': manyInfo.height}" v-if="fixedTop"></view>
		<diy-goods-list class="many-goods-list-body" v-if="goodsValue" :value="goodsValue"
			ref="diyGoodsList"></diy-goods-list>
	</view>
</template>

<script>
	export default {
		name: 'diy-many-goods-list',
		props: {
			value: {
				type: Object,
				default: () => {
					return {};
				}
			},
			scrollTop: {
				type: [Number, String]
			},
			global: {
				type: Object,
				default: () => {
					return {};
				}
			}
		},
		data() {
			return {
				cateIndex: 0, // 当前选中的分类id
				goodsValue: null, // 商品列表数据
				manyInfo: {
					bodyHeight: 0,
					bodyTop: 0,
					height: 0,
					top: 0
				}
			};
		},
		created() {
			this.changeCateIndex(this.value.list[0], 0, true);
		},
		watch: {
			// 组件刷新监听
			componentRefresh: function(nval) {
				this.changeCateIndex(this.value.list[0], 0, true);
			},
			scrollTop: function(nval) {
				const query = uni.createSelectorQuery().in(this);
				query
					.select('.many-goods-list')
					.boundingClientRect(data => {
						if (data) {
							this.manyInfo.top = data.top;
						}
					})
					.exec();

				query
					.select('.many-goods-list .many-goods-list-body')
					.boundingClientRect(data => {
						if (data) {
							this.manyInfo.bodyHeight = (data.height || 0);
							this.manyInfo.bodyTop = (data.top || 0);
						}
					})
					.exec();
			}
		},
		computed: {
			fixedTop() {
				let diyPositionObj = JSON.parse(JSON.stringify(this.$store.state.diyGroupPositionObj));
				let positionHeight = 0;
				let height = 0;

				delete diyPositionObj.diyManyGoodsList;

				if (diyPositionObj) {
					let arr = Object.values(diyPositionObj);
					arr.forEach((item, index) => {
						positionHeight += item.originalVal; //定位的高度【搜索框+导航分类+自定义头部】
					});
				}

				if (this.manyInfo.top < positionHeight && (this.manyInfo.bodyTop + this.manyInfo.bodyHeight >
						positionHeight + Number.parseFloat(this.manyInfo.height))) {
					height = positionHeight;
				}
				return height;
			},
			manyWrapCss() {
				let html = '';
				html += `position: ${this.fixedTop ? 'fixed' : 'initial'};`
				html += `top: ${this.fixedTop}px;`
				if (!this.global.topNavBg)
					html += `background-color: #fff;`
				else
					html += `background-color: ${this.fixedTop ? this.global.topNavColor : 'transparent'};`
				return html;
			}
		},
		mounted() {
			const query = uni.createSelectorQuery().in(this);
			query
				.select('.many-goods-list .many-goods-list-head')
				.boundingClientRect(data => {
					if (data) {
						this.manyInfo.height = (data.height || 0) + 'px';
						// 向vuex中的diyIndexPositionObj增加多商品组件定位位置
						let diyManyGoodsList = {
							originalVal: data.height || 0 //自身高度 px
						}
						this.$store.commit('setDiyGroupPositionObj', {
							diyManyGoodsList: diyManyGoodsList
						});
					}
				})
				.exec();
		},
		methods: {
			changeCateIndex(item, index, isFirst) {
				this.cateIndex = index;
				this.goodsValue = {
					sources: item.sources,
					categoryId: item.categoryId,
					categoryName: item.categoryName,
					goodsId: item.goodsId,
					componentBgColor: this.value.componentBgColor,
					componentAngle: this.value.componentAngle,
					topAroundRadius: this.value.topAroundRadius,
					bottomAroundRadius: this.value.bottomAroundRadius,
					elementBgColor: this.value.elementBgColor,
					elementAngle: this.value.elementAngle,
					topElementAroundRadius: this.value.topElementAroundRadius,
					bottomElementAroundRadius: this.value.bottomElementAroundRadius,
					count: this.value.count,
					nameLineMode: this.value.nameLineMode,
					template: this.value.template,
					style: this.value.style,
					ornament: this.value.ornament,
					sortWay: this.value.sortWay,
					saleStyle: this.value.saleStyle,
					tag: this.value.tag,
					btnStyle: this.value.btnStyle,
					goodsNameStyle: this.value.goodsNameStyle,
					theme: this.value.theme,
					priceStyle: this.value.priceStyle,
					slideMode: this.value.slideMode,
					imgAroundRadius: this.value.imgAroundRadius,
					margin: this.value.margin,
					goodsMarginType: this.value.goodsMarginType,
					goodsMarginNum: this.value.goodsMarginNum
				};

				// 如果是第一次加载，不需要执行下面代码
				if (isFirst) return;
				this.$refs.diyGoodsList.goodsValue = this.goodsValue;
				this.$refs.diyGoodsList.getGoodsList();
			}
		}
	};
</script>

<style lang="scss" scoped>
	.many-goods-list-head {
		left: 0;
		right: 0;
		z-index: 5;
		background-color: #fff;
	}

	scroll-view {
		width: 100%;
		white-space: nowrap;
		box-sizing: border-box;
		padding: 20rpx 0;

		.scroll-item {
			display: inline-block;
			text-align: center;
			vertical-align: top;
			width: calc(25% - 40rpx);
			position: relative;
			padding: 0 20rpx;

			&:first-child {
				width: calc(25% - 20rpx);
				padding-left: 0;
			}

			.split-line {
				display: inline-block;
				width: 1rpx;
				height: 30rpx;
				background-color: #e5e5e5;
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
			}

			&.active {
				.name {
					font-weight: bold;
				}

				.desc {
					color: #ffffff;
					border-radius: 20rpx;
				}
			}

			.name {
				font-size: 32rpx;
				color: $color-title;
				line-height: 1;
			}

			.cate {
				display: inline-block;
			}

			.desc {
				font-size: $font-size-tag;
				color: $color-tip;
				height: 36rpx;
				line-height: 36rpx;
				margin-top: 10rpx;
				min-width: 120rpx;
				max-width: 220rpx;
				overflow: hidden;
				text-overflow: ellipsis;
				padding: 0 10rpx;
			}
		}
	}
</style>