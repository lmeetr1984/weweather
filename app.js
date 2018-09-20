App({
  // 小程序启动之后 触发
  onLaunch () {
    let that = this


    // 打开debug
    wx.setEnableDebug({
      enableDebug: true
    });

    wx.getSystemInfo({
      success: function (res) {
        // 保存手机信息
        that.globalData.systeminfo = res
      },
    })
  },
  globalData: {
    // 是否保持常亮，离开小程序失效
    keepscreenon:false,
    systeminfo: {}, // 手机系统信息
    ak: 'fWPhPlePKD3w9IHRftGZgqv4FW0nZejG', // 百度地图的appkey
  },

  // 获取geo url
  setGeocoderUrl (address) {
    return `https://api.map.baidu.com/geocoder/v2/?address=${address}&output=json&ak=${this.globalData.ak}`
  },
})