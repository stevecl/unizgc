<template>
	<page-meta :page-style="themeColor"></page-meta>
	<view>
		<mescroll-uni @getData="getData" ref="mescroll">
			<block slot="list">
				<view class="article-wrap" v-if="list.length">
					<ns-adv keyword="NS_ARTICLE" class-name="adv-wrap"></ns-adv>
					<view class="item" v-for="(item, index) in list" :key="index" @click="toDetail(item)">
						<view class="article-img">
							<image class="cover-img" :src="$util.img(item.cover_img)" mode="widthFix"
								@error="imgError(index)"></image>
						</view>
						<view class="info-wrap">
							<text class="title">{{ item.article_title }}</text>
							<view class="read-wrap">
								<block v-if="item.category_name">
									<text class="category-icon"></text>
									<text>{{ item.category_name }}</text>
								</block>
								<text class="date">{{ $util.timeStampTurnTime(item.create_time, 'date') }}</text>
							</view>
						</view>
					</view>
				</view>
				<view v-else class="empty-wrap"><ns-empty text="暂无文章" :isIndex="false"></ns-empty></view>
				<loading-cover ref="loadingCover"></loading-cover>
			</block>
		</mescroll-uni>
		<!-- 悬浮按钮 -->
		<hover-nav></hover-nav>
	</view>
</template>

<script>
	import nsAdv from '@/components/ns-adv/ns-adv.vue';
	export default {
		data() {
			return {
				list: []
			};
		},
		components: {
			nsAdv
		},
		onShow() {
			this.setPublicShare();
		},
		methods: {
			getData(mescroll) {
				this.$api.sendRequest({
					url: '/api/article/page',
					data: {
						page_size: mescroll.size,
						page: mescroll.num
					},
					success: res => {
						let newArr = [];
						let msg = res.message;
						if (res.code == 0 && res.data) {
							newArr = res.data.list;
						} else {
							this.$util.showToast({
								title: msg
							});
						}
						mescroll.endSuccess(newArr.length);
						//设置列表数据
						if (mescroll.num == 1) this.list = []; //如果是第一页需手动制空列表
						this.list = this.list.concat(newArr); //追加新数据
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					},
					fail: res => {
						mescroll.endErr();
						if (this.$refs.loadingCover) this.$refs.loadingCover.hide();
					}
				});
			},
			toDetail(item) {
				this.$util.redirectTo('/pages_tool/article/detail', {
					article_id: item.article_id
				});
			},
			imgError(index) {
				if (this.list[index]) this.list[index].cover_img = this.$util.getDefaultImage().article;
			},
			// 设置公众号分享
			setPublicShare() {
				let shareUrl = this.$config.h5Domain + '/pages_tool/article/list';
				this.$util.setPublicShare({
					title: '文章列表',
					desc: '',
					link: shareUrl,
					imgUrl: this.$store.state.siteInfo ? this.$util.img(this.$store.state.siteInfo.logo_square) :
						''
				});
			}
		},
		onShareAppMessage(res) {
			var title = '文章列表';
			var path = '/pages_tool/article/list';
			return {
				title: title,
				path: path,
				success: res => {},
				fail: res => {}
			};
		},
		//分享到朋友圈
		onShareTimeline() {
			var title = '文章列表';
			var query = '/pages_tool/article/list';
			return {
				title: title,
				query: query,
				imageUrl: ''
			};
		}
	};
</script>

<style lang="scss" scoped>
	/deep/ .fixed {
		position: relative;
		top: 0;
	}

	.empty-wrap {
		padding-top: 200rpx;
	}

	.article-wrap {
		background: #f8f8f8;

		.adv-wrap {
			margin: 24rpx 24rpx 0 24rpx;
			width: auto;
		}

		.item {
			display: flex;
			padding: 20rpx;
			background-color: #fff;
			margin: 24rpx;
			border-radius: 16rpx;

			.article-img {
				margin-right: 20rpx;
				width: 160rpx;
				height: 160rpx;
				overflow: hidden;
				display: flex;
				align-items: center;
				justify-content: center;

				image {
					width: 100%;
				}
			}

			.info-wrap {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;

				.title {
					font-weight: bold;
					margin-bottom: 10rpx;
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					font-size: 30rpx;
					line-height: 1.5;
				}

				.abstract {
					overflow: hidden;
					text-overflow: ellipsis;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					font-size: $font-size-tag;
				}

				.read-wrap {
					display: flex;
					color: #999ca7;
					justify-content: flex-start;
					align-items: center;
					margin-top: 10rpx;
					line-height: 1;

					text {
						font-size: $font-size-tag;
					}

					.iconfont {
						font-size: 36rpx;
						vertical-align: bottom;
						margin-right: 10rpx;
					}

					.category-icon {
						width: 8rpx;
						height: 8rpx;
						border-radius: 50%;
						background: $base-color;
						margin-right: 10rpx;
					}

					.date {
						margin-left: 20rpx;
					}
				}
			}
		}
	}
</style>