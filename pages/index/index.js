// pm2.5 浓度对应的指数等级
// 0-50 优
// 50-100 良
// 100-150 轻度污染：对敏感人群不健康
// 150-200 中度污染：不健康
// 200-300 重度污染：非常不健康
// 300-500 严重污染：有毒物
// 500以上 爆表：有毒物
let bmap = require('../../lib/bmap-wx.js')
let utils = require('../../utils/utils')
let globalData = getApp().globalData
let SYSTEMINFO = globalData.systeminfo

Page({
  data: {
    cityDatas: {},
    icons: ['/img/clothing.png', '/img/carwashing.png', '/img/pill.png', '/img/running.png', '/img/sun.png'],
    // 用来清空 input
    searchText: '',
    // 是否已经弹出
    hasPopped: false,
    animationMain: {},
    animationOne: {},
    animationTwo: {},
    animationThree: {},
    // 是否切换了城市
    cityChanged: false,
    // 需要查询的城市
    searchCity: '',
    setting: {},
    bcgImg: '',
    bcgColor: '#40a7e7',
    // 粗暴直接：移除后再创建，达到初始化组件的作用
    showHeartbeat: true,
    // heartbeat 时禁止搜索，防止动画执行
    enableSearch: true,
    pos: {},

    // 打开设置的按钮
    openSettingButtonShow: false,
  },

  calcPM(value) {
    if (value > 0 && value <= 50) {
      return {
        val: value,
        desc: '优',
        detail: '',
      }
    } else if (value > 50 && value <= 100) {
      return {
        val: value,
        desc: '良',
        detail: '',
      }
    } else if (value > 100 && value <= 150) {
      return {
        val: value,
        desc: '轻度污染',
        detail: '对敏感人群不健康',
      }
    } else if (value > 150 && value <= 200) {
      return {
        val: value,
        desc: '中度污染',
        detail: '不健康',
      }
    } else if (value > 200 && value <= 300) {
      return {
        val: value,
        desc: '重度污染',
        detail: '非常不健康',
      }
    } else if (value > 300 && value <= 500) {
      return {
        val: value,
        desc: '严重污染',
        detail: '有毒物',
      }
    } else if (value > 500) {
      return {
        val: value,
        desc: '爆表',
        detail: '能出来的都是条汉子',
      }
    }
  },

  // 请求百度天气的话，成功的时候的callback
  success(data) {
    this.setData({
      openSettingButtonShow: false,
    })

    // 停止下拉
    wx.stopPullDownRefresh()


    let now = new Date()
    // 存下来源数据
    data.updateTime = now.getTime()
    data.updateTimeFormat = utils.formatDate(now, "MM-dd hh:mm")
    let results = data.originalData.results[0] || {}

    // 计算pm2.5
    data.pm = this.calcPM(results['pm25'])

    // 当天实时温度
    data.temperature = `${results.weather_data[0].date.match(/\d+/g)[2]}`
    wx.setStorage({
      key: 'cityDatas',
      data: data,
    })

    // 更新UI数据
    this.setData({
      cityDatas: data,
    })
  },

  // main页面提交查询
  commitSearch(res) {
    let val = ((res.detail || {}).value || '').replace(/\s+/g, '')
    this.search(val)
  },

  dance() {
    this.setData({
      enableSearch: false,
    })
    let that = this
    let heartbeat = this.selectComponent('#heartbeat')
    heartbeat.dance(() => {
      that.setData({
        showHeartbeat: false,
        enableSearch: true,
      })
      that.setData({
        showHeartbeat: true,
      })
    })
  },

  // 查询 (done)
  search(val) {
    if (val === '520' || val === '521') {
      this.setData({
        searchText: '',
      })
      this.dance()
      return
    }

    // 将页面滚动到目标位置
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300,
    })
    if (val) {

      // 获取geocode， 如果成功的话，那么调用init
      // 来调用百度类来获取天气信息
      let that = this
      this.geocoder(val, (loc) => {
        that.init({
          location: `${loc.lng},${loc.lat}`
        })
      })
    }
  },

  // 地理位置编码 (done)
  geocoder(address, success) {
    let that = this

    // request请求, 获取地理位置编码
    wx.request({
      url: getApp().setGeocoderUrl(address),
      success(res) {
        // 数据
        let data = res.data || {}

        // 如果数据存在
        if (!data.status) {
          let location = (data.result || {}).location || {}
          // location = {lng, lat}

          // 调用success函数回调
          success && success(location)
        } else {
          // 显示消息提示框
          wx.showToast({
            title: data.msg || '网络不给力，请稍后再试',
            icon: 'none',
          })
        }
      },

      // request失败
      fail(res) {
        // 提示信息
        wx.showToast({
          title: res.errMsg || '网络不给力，请稍后再试',
          icon: 'none',
        })
      },

      // 真个request都完成了
      complete() {
        // 舒心UI
        that.setData({
          searchText: '',
        })
      },
    })
  },

  // 处理错误信息 (done)
  fail(res) {
    let that = this

    // 停止下拉刷新
    wx.stopPullDownRefresh()
    let errMsg = res.errMsg || ''

    // 拒绝授权地理位置权限
    if (errMsg.indexOf('deny') !== -1 || errMsg.indexOf('denied') !== -1) {
      wx.showToast({
        title: '需要开启地理位置权限',
        icon: 'none',
        duration: 2500,
        success(res) {
          if (that.canUseOpenSettingApi()) {

            // 注意timer的写法
            let timer = setTimeout(() => {
              clearTimeout(timer)

              // 调起客户端小程序设置界面，返回用户设置的操作结果
              wx.openSetting({})
            }, 2500)
          } else {
            // 新版的话，需要自己用button来处理
            that.setData({
              openSettingButtonShow: true,
            })
          }
        },
      })
    } else {
      wx.showToast({
        title: '网络不给力，请稍后再试',
        icon: 'none',
      })
    }
  },

  // (done)
  // wx.openSetting 要废弃，button open-type openSetting 2.0.7 后支持
  // 使用 wx.canIUse('openSetting') 都会返回 true，这里判断版本号区分
  canUseOpenSettingApi() {
    let systeminfo = getApp().globalData.systeminfo
    let SDKVersion = systeminfo.SDKVersion
    let version = utils.cmpVersion(SDKVersion, '2.0.7')
    if (version < 0) {
      return true
    } else {
      return false
    }
  },

  // 初始化 （done）
  // 重新从百度加载数据
  init(params) {
    let that = this

    // 重新创建 baidu 类
    let BMap = new bmap.BMapWX({
      ak: globalData.ak,
    })

    // 获取数据
    BMap.weather({
      location: params.location,
      fail: that.fail,
      success: that.success,
    })
  },
  // drawWeather () {
  //   let context = wx.createCanvasContext('line')
  //   context.setStrokeStyle("#ffffff")
  //   context.setLineWidth(1)
  //   context.moveTo(0, 0)
  //   context.lineTo(350, 150)
  //   context.stroke()
  //   context.draw()
  // },

  // 下拉事件
  // 重新从百度获取数据
  onPullDownRefresh(res) {
    this.init({})
  },

  // 从缓存中读取菜单悬浮球的位置(done)
  setMenuPosition() {
    let that = this

    // 从缓存中读取菜单悬浮球的位置
    wx.getStorage({
      key: 'pos',
      success: function (res) {
        that.setData({
          pos: res.data,
        })
      },
      fail: function (res) {
        that.setData({
          pos: {},
        })
      },
    })
  },

  getCityDatas() {
    // 从缓存中读取citi的数据，读取成功，同步UI
    let that = this
    let cityDatas = wx.getStorage({
      key: 'cityDatas',
      success: function (res) {
        that.setData({
          cityDatas: res.data,
        })
      },
    })
  },

  // 每次显示的时候触发
  onShow() {
    // 从缓存中读取数据
    this.getCityDatas()

    // 获取悬浮球菜单的位置
    this.setMenuPosition()
    let that = this
    let bcgColor = utils.themeSetting() // 获取背景颜色

    // 同步数据
    this.setData({
      bcgColor,
    })

    // 设置背景图片
    this.setBcg()


    this.initSetting((setting) => {
      // 初始化了setting，系统基本已经OK了，需要检查更新
      that.checkUpdate(setting)
    })

    // 如果城市发生了变化
    if (!this.data.cityChanged) {
      // 重新初始化
      this.init({})
    } else {
      this.search(this.data.searchCity)
      this.setData({
        cityChanged: false,
        searchCity: '',
      })
    }
  },

  // 页面隐藏/切入后台时触发
  onHide() {
    // 保存 菜单轨迹球 位置信息
    wx.setStorage({
      key: 'pos',
      data: this.data.pos,
    })
  },

  // 检查更新
  checkUpdate(setting) {
    // 兼容低版本

    // 获取全局唯一的版本更新管理器，用于管理小程序更新。
    if (!setting.forceUpdate || !wx.getUpdateManager) {
      return
    }

    let updateManager = wx.getUpdateManager()

    // 监听向微信后台请求检查更新结果事件。
    // 微信在小程序冷启动时自动检查更新，不需由开发者主动触发。
    updateManager.onCheckForUpdate((res) => {
      console.error(res)
    })

    // 监听小程序有版本更新事件。
    // 客户端主动触发下载（无需开发者触发），下载成功后回调
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已下载完成，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
  },

  // 设置背景图片
  setBcg() {
    let that = this

    // 从获取该小程序下已保存的本地缓存文件列表
    wx.getSavedFileList({
      success: function (res) {
        let fileList = res.fileList
        if (!utils.isEmptyObject(fileList)) {
          that.setData({
            // 第一个文件
            bcgImg: fileList[0].filePath,
          })
        } else {
          that.setData({
            bcgImg: '',
          })
        }
      },
    })
  },

  // 初始化setting
  initSetting(successFunc) {
    let that = this

    // 从本地缓存中异步获取指定 key 的内容
    wx.getStorage({
      key: 'setting',
      success: function (res) {
        let setting = res.data || {}

        // 同步UI数据
        that.setData({
          setting,
        })

        // 
        successFunc && successFunc(setting)
      },
      fail: function () {
        that.setData({
          setting: {},
        })
      },
    })
  },

  // 监听转发
  onShareAppMessage(res) {
    // 自定义转发内容。
    return {
      title: 'Quiet Weather--安静天气',
      path: `/pages/index/index`,
      // imageUrl: '',
      success() { },
      fail(e) {
        let errMsg = e.errMsg || ''
        // 对不是用户取消转发导致的失败进行提示
        let msg = '分享失败，可重新分享'
        if (errMsg.indexOf('cancel') !== -1) {
          msg = '取消分享'
        }
        wx.showToast({
          title: msg,
          icon: 'none',
        })
      }
    }
  },

  menuMainMove(e) {
    // 如果已经弹出来了，需要先收回去，否则会受 top、left 会影响
    if (this.data.hasPopped) {
      this.takeback()
      this.setData({
        hasPopped: false,
      })
    }
    let windowWidth = SYSTEMINFO.windowWidth
    let windowHeight = SYSTEMINFO.windowHeight
    let touches = e.touches[0]
    let clientX = touches.clientX
    let clientY = touches.clientY
    // 边界判断
    if (clientX > windowWidth - 40) {
      clientX = windowWidth - 40
    }
    if (clientX <= 90) {
      clientX = 90
    }
    if (clientY > windowHeight - 40 - 60) {
      clientY = windowHeight - 40 - 60
    }
    if (clientY <= 60) {
      clientY = 60
    }
    let pos = {
      left: clientX,
      top: clientY,
    }

    // 保存数据, update UI
    this.setData({
      pos,
    })
  },

  // 主菜单
  menuMain() {
    // 如果没有打开，则打开
    if (!this.data.hasPopped) {
      this.popp()
      this.setData({
        hasPopped: true,
      })
    } else {
      // 关闭
      this.takeback()
      this.setData({
        hasPopped: false,
      })
    }
  },

  // 点击menu1 触发
  menuOne() {
    // 处理主菜单
    this.menuMain()

    // 跳转
    wx.navigateTo({
      url: '/pages/citychoose/citychoose',
    })
  },

  // 点击menu2 触发
  menuTwo() {
    // 处理主菜单
    this.menuMain()
    wx.navigateTo({
      url: '/pages/setting/setting',
    })
  },

  // 点击menu1、2 触发
  menuThree() {
    // 处理主菜单
    this.menuMain()
    wx.navigateTo({
      url: '/pages/about/about',
    })
  },

  // 弹出菜单
  popp() {
    // 动画, 淡入淡出
    let animationMain = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    let animationOne = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    let animationTwo = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    let animationThree = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })

    // 主动画的z轴旋转180度
    animationMain.rotateZ(180).step()
    // 表示在X轴偏移tx，在Y轴偏移ty
    // z轴旋转360度
    // 完全不透明

    // 调用动画操作方法后要调用 step() 来表示一组动画完成
    animationOne.translate(-50, -60).rotateZ(360).opacity(1).step()
    animationTwo.translate(-90, 0).rotateZ(360).opacity(1).step()
    animationThree.translate(-50, 60).rotateZ(360).opacity(1).step()

    /// 通过动画实例的export方法导出动画数据传递给组件的animation属性。
    this.setData({
      animationMain: animationMain.export(),
      animationOne: animationOne.export(),
      animationTwo: animationTwo.export(),
      animationThree: animationThree.export(),
    })
  },

  takeback() {
    let animationMain = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    let animationOne = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    let animationTwo = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    let animationThree = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease-out'
    })
    animationMain.rotateZ(0).step();
    animationOne.translate(0, 0).rotateZ(0).opacity(0).step()
    animationTwo.translate(0, 0).rotateZ(0).opacity(0).step()
    animationThree.translate(0, 0).rotateZ(0).opacity(0).step()
    this.setData({
      animationMain: animationMain.export(),
      animationOne: animationOne.export(),
      animationTwo: animationTwo.export(),
      animationThree: animationThree.export(),
    })
  },
})