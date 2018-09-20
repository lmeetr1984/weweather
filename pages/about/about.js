let utils = require('../../utils/utils')
Page({
  // 页面的初始数据
  data: {
    github: 'https://github.com/myvin',
    email: '851399101@qq.com',
    qq: '851399101',
    swiperHeight: 'auto',
    bannerImgList: [
      'https://raw.githubusercontent.com/myvin/miniprogram/master/quietweather/images/logo.png',  'https://raw.githubusercontent.com/myvin/miniprogram/master/quietweather/images/miniqrcode.jpg',
    ],
  },
  onLoad () {
    // 生命周期回调—监听页面加载
    this.initSwiper()
  },
  previewImages (e) {
    // 触发tap的时间用的
    let index = e.currentTarget.dataset.index || 0
    let urls = this.data.bannerImgList

    // 在新页面中全屏预览图片。预览的过程中用户可以进行保存图片、发送给朋友等操作。
    wx.previewImage({
      current: urls[index],
      urls,
      success: function (res) { },
      fail: function (res) {
        console.error('previewImage fail: ', res)
      }
    })
  },
  initSwiper () {
    let that = this
    // 获取小程序的instance
    let systeminfo = getApp().globalData.systeminfo
    if (utils.isEmptyObject(systeminfo)) {
      wx.getSystemInfo({
        success: function (res) {
          that.setSwiperHeight(res)
        },
      })
    } else {
      that.setSwiperHeight(systeminfo)
    }
  },
  setSwiperHeight (res) {
    // 用于将数据从逻辑层发送到视图层（异步），同时改变对应的 this.data 的值（同步）
    this.setData({
      swiperHeight: `${(res.windowWidth || res.screenWidth) / 375 * 200}px`
    })
  },
  copy(e) {
    let dataset = (e.target || {}).dataset || {}
    let title = dataset.title || ''
    let content = dataset.content || ''

    // 设置系统剪贴板的内容
    wx.setClipboardData({
      data: content,
      success () {
        // 显示消息提示框
        wx.showToast({
          title: `已复制${title}`,
          duration: 2000,
        })
      },
    })
  },
})