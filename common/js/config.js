// let domian = "https://www.baidu.com" 
let domian = "https://h.vipboao.com"
var config = {
	// api请求地址
	baseUrl: domian,
	// 图片域名
	imgDomain: domian,
	// H5端域名
	h5Domain: domian+'/h5',
	// 腾讯地图key
	mpKey: 'HRRBZ-QUX6X-WNV4A-ZM5G6-HRYAO-6ABAH',
	//客服地址
	webSocket: domian+'/wss',
	//本地端主动给服务器ping的时间, 0 则不开启 , 单位秒
	pingInterval: 1500,
	// 版本号
	version: '5.2.4'
};

export default config;