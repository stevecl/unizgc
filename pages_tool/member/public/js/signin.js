import Calendar from '@/pages_tool/components/uni-calendar/util.js';
export default {
	data() {
		return {
			rule: [{}],
			hasSign: 0, //今天是否签到
			signDaysSeries: 0, //连续签到次数
			timestamp: "", //当前的时间戳
			time: "", //当前日期
			MonthData: [], //本月日期信息
			signList: [],
			back: '', //返回页
			redirect: '', //返回方式
			successTip: {},
			startDate: null,
			endDate: null,
			isActive: "", //判断点击
			signState: 1,
			headimg: '',
			point: 0,
			growth: 0,
			signPoint: 0,
			signGrowth: 0,
			rewardRuleDay: [],
			cycle: 0,
			reward: {}
		};
	},
	methods: {
		// 获取签到累积积分
		getSignPointData() {
			this.$api.sendRequest({
				url: '/api/memberaccount/sum',
				data: {
					account_type: 'point',
					from_type: 'signin'
				},
				success: res => {
					if (res.code == 0) {
						this.signPoint = res.data;
					}
				}
			});
		},
		// 获取签到累积成长值
		getSignGrowthData() {
			this.$api.sendRequest({
				url: '/api/memberaccount/sum',
				data: {
					account_type: 'growth',
					from_type: 'signin'
				},
				success: res => {
					if (res.code == 0) {
						this.signGrowth = res.data;
					}
				}
			});
		},
		// 签到是否开启
		getSignState() {
			this.$api.sendRequest({
				url: '/api/membersignin/getSignStatus',
				success: res => {
					if (res.code == 0) {
						this.signState = res.data.is_use;
					}
				}
			});
		},
		navigateBack() {
			if (this.back != '') {
				this.$util.redirectTo(this.back, {}, this.redirect);
			} else {
				this.$util.redirectTo('/pages/member/index');
			}
		},
		//获取rule
		getRule() {
			this.rewardRuleDay = [];
			this.$api.sendRequest({
				url: '/api/membersignin/award',
				success: res => {
					if (res.code == 0) {

						this.cycle = res.data.cycle || 0;
						this.rule = res.data.reward || [];
						let default_point = 0;
						if (this.rule.length > 0) {
							this.rule.forEach((item, index) => {
								if (item.day == 1) {
									default_point = item.point;
								}else{
									this.rewardRuleDay.push(parseInt(item.day));
									this.reward[item.day] = item.point;
								}
							});
						}
						//展示7天
						var showSignDays = [];
						var start_day = 1;
						var end_day = 7;
						var total_day = res.data.cycle;
						if (this.signDaysSeries > 5) {
							start_day = this.signDaysSeries - 5;
						}
						if (total_day >= (this.signDaysSeries + 1)) {
							end_day = this.signDaysSeries + 1;
						}
						if (this.signDaysSeries <= 5) {
							end_day = 8 - start_day;
						}

						if ((end_day - start_day) < 7 && total_day >= start_day + 6) {
							end_day = start_day + 6;
						}
						if (total_day == this.signDaysSeries) {
							start_day = this.signDaysSeries - 6;
							end_day = this.signDaysSeries;
						}

						for (let i = 1; i <= res.data.cycle; i++) {
							if (i >= start_day && i <= end_day) {
								showSignDays.push({
									day: i,
									is_last: 0,
									point: default_point
								})
							}
						}

						if (showSignDays && showSignDays.length) {
							showSignDays[showSignDays.length - 1]['is_last'] = 1;
						}

						for (let i in showSignDays) {
							let item = showSignDays[i];
							if (this.$util.inArray(item.day, this.rewardRuleDay) != -1) {
								showSignDays[i]['point'] = parseInt(this.reward[item.day]) + parseInt(default_point);
							}
						}

						this.showSignDays = showSignDays;
					}
				}
			});
		},
		//获取连续签到次数
		getSignInfo() {
			this.$api.sendRequest({
				url: '/api/member/info',
				success: res => {
					if (res.code == 0) {
						this.timestamp = res.timestamp;
						this.time = this.$util.timeStampTurnTime(this.timestamp).slice(0, 10)
						this.headimg = res.data.headimg;
						this.signDaysSeries = res.data.sign_days_series;
						this.getRule();
						this.$refs.loadingCover.hide();
					}
				}
			});
		},
		//判断当前是否签到
		getIsSign() {
			this.$api.sendRequest({
				url: '/api/membersignin/issign',
				success: res => {
					if (res.code == 0) {
						this.hasSign = res.data;
						this.getSignInfo();
						this.getSignPointData();
						this.getSignGrowthData();
					}
				}
			});
		},
		//签到
		sign() {
			if (this.signState == 0) {
				this.$util.showToast({
					title: '签到未开启'
				})
			}

			if (!this.hasSign && this.signState == 1) {
				this.$api.sendRequest({
					url: '/api/membersignin/signin',
					success: res => {
						if (res.code == 0) {
							this.successTip = res.data;
							this.$refs.uniPopup.open()
							this.getSignInfo();
							this.getSignPointData();
							this.getSignGrowthData();
							this.hasSign = 1;
							this.signDaysSeries = this.signDaysSeries + 1;
						} else {
							this.$util.showToast({
								title: res.message
							})
						}
					}
				});
			}
		},
		close() {
			this.$refs.uniPopup.close()
		}
	},
	computed: {
		pointTomorrow: function() {
			var signDaysSeries = this.signDaysSeries + 1;
			var point = this.rule[0].point ? parseInt(this.rule[0].point) : 0;
			for (let i = 1; i < this.rule.length; i++) {
				let reward = this.rule[i];
				if (reward.day == signDaysSeries && reward.point) point += parseInt(reward.point);
			}
			return point;
		},
		showDay: function() {
			return parseInt(this.signDaysSeries / 7) * 7 + 1;
		}
	}
};
