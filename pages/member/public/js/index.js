export default {
	data() {
		return {
			memberInfo: null,
			diyRoute: '/pages/member/index'
		};
	},
	computed: {
		bottomNavHidden() {
			return this.$store.state.bottomNavHidden;
		}
	},
	watch: {
		storeToken: function(nVal, oVal) {
			if (nVal) {
				this.getMemberInfo();
				if (uni.getStorageSync('source_member')) this.$util.onSourceMember(uni.getStorageSync(
					'source_member'));
			}
		}
	},
	onLoad(data) {
		uni.hideTabBar();
		this.name = 'DIY_VIEW_MEMBER_INDEX';
		this.getMemberInfo();
		if (data.code) {
			this.$api.sendRequest({
				url: '/wechat/api/wechat/authcodetoopenid',
				data: {
					code: data.code
				},
				success: res => {
					if (res.code >= 0) {
						if (res.data.userinfo.nickName) this.modifyNickname(res.data.userinfo.nickName);
						if (res.data.userinfo.avatarUrl) this.modifyHeadimg(res.data.userinfo
							.avatarUrl);
					}
				}
			});
		}
	},
	onShow() {
		// 刷新会员数据
		if (this.$refs.diyGroup) {
			if (this.$refs.diyGroup.$refs.diyMemberIndex) this.$refs.diyGroup.$refs.diyMemberIndex[0].init();
			if (this.$refs.diyGroup.$refs.diyMemberMyOrder) this.$refs.diyGroup.$refs.diyMemberMyOrder[0].getOrderNum();
		}
	},
	methods: {
		/**
		 * 查询会员信息
		 */
		getMemberInfo() {
			this.$api.sendRequest({
				url: '/api/member/info',
				data: {},
				success: res => {
					if (res.code == 0) {
						if (!this.memberInfo) this.memberInfo = res.data;
						else Object.assign(this.memberInfo, res.data);
						if (this.addonIsExist.birthdaygift) this.getBirthdayGiftTo();
						if (this.addonIsExist.scenefestival) this.getHolidayGiftTo();
					}
				}
			});
		},
		/**
		 * 节日有礼
		 */
		getHolidayGiftTo() {
			this.$api.sendRequest({
				url: '/scenefestival/api/config/config',
				success: res => {
					if (res.code >= 0) {
						if (res.data[0]) {
							if (res.data[0].flag == true && this.$refs.nsNewGift) {
								this.$refs.nsNewGift.open();
							}
						}
					}
				},
			});
		},
		/**
		 * 生日有礼
		 */
		getBirthdayGiftTo() {
			this.$api.sendRequest({
				url: '/birthdaygift/api/Config/config',
				success: res => {
					if (res.code >= 0) {
						if (res.data) {
							if (this.$refs.birthdayGift && res.data.flag == true) {
								this.$refs.birthdayGift.open();
							}
						}
					}
				},
			});
		},
		/**
		 * 修改昵称
		 * @param {Object} nickName
		 */
		modifyNickname(nickName) {
			this.$api.sendRequest({
				url: '/api/member/modifynickname',
				data: {
					nickname: nickName
				},
				success: res => {
					if (res.code == 0) this.memberInfo.nickname = nickName;
				}
			});
		},
		/**
		 * 修改头像
		 */
		modifyHeadimg(headimg) {
			this.$api.sendRequest({
				url: '/api/member/modifyheadimg',
				data: {
					headimg: headimg
				},
				success: res => {
					if (res.code == 0) this.memberInfo.headimg = headimg;
				}
			});
		},
	},
};
